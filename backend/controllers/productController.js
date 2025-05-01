const QRCode = require('qrcode'); 
const Product = require('../models/productModel');
const blockchainService = require('../services/blockchainService');
const moment = require('moment');
const User = require('../models/userModel');

// Register a new product
exports.registerProduct = async (req, res) => {
  const { product_name, batch_number, manufacturing_date, expiry_date, ingredients, image_url } = req.body;

  try {
    // Check if user is a manufacturer
    if (!req.user.business_name) {
      return res.status(403).json({ message: 'Only manufacturers can register products' });
    }

    // Convert manufacturing_date and expiry_date to Unix timestamps (Solidity only takes UNIX timestaps)
    const manufacturingTimestamp = Math.floor(new Date(manufacturing_date).getTime() / 1000);  
    const expiryTimestamp = Math.floor(new Date(expiry_date).getTime() / 1000);  

    // Generate QR code (unique identifier for this product)
    const qr_code = `${product_name}-${batch_number}-${Date.now()}`;

    // Generate the actual QR code as an image
    const qrImage = await QRCode.toDataURL(qr_code); 

    const newProduct = new Product({
      product_name,
      batch_number,
      manufacturing_date: Number(manufacturingTimestamp), 
      expiry_date: Number(expiryTimestamp),
      ingredients,
      image_url,
      qr_code, 
      qr_code_image: qrImage, 
      manufacturer: req.user._id, 
    });

    await newProduct.save(); 

    // Explicitly pass the `qr_code` to the blockchain service
    const blockchainPayload = {
      ...newProduct.toObject(),
      manufacturing_date: Number(manufacturingTimestamp),
      expiry_date: Number(expiryTimestamp),
      qr_code, // Pass the qr_code explicitly
    };

    // Register the product on the blockchain
    await blockchainService.registerProduct(blockchainPayload);

    res.status(201).json({
      message: 'Product registered successfully',
      qr_code,
      qr_code_image: qrImage, 
    });
  } catch (err) {
    console.error("Error during product registration:", err);  
    res.status(500).json({ message: `Server error during product registration: ${err.message}` });
  }
};

// Verify and track product scan
exports.verifyProduct = async (req, res) => {
  const { qr_code, location = 'Unknown' } = req.body;

  if (!req.user) return res.status(401).json({ message: 'Authorization required' });

  const product = await Product.findOne({ qr_code });
  if (!product) return res.status(404).json({ message: 'Product not found' });

  if (!req.user.business_name) {
    product.scanHistory.push(new Date());
    product.scanHistoryLocations.push(location);
    await product.save();
    await detectCounterfeit(product);
  }

  const formatDate = ts => new Date(ts * 1000).toLocaleDateString(); 
  const scanHistory = product.scanHistory.map((d, i) =>
    `${d.toLocaleDateString()} at ${d.toLocaleTimeString()} ${product.scanHistoryLocations[i]}`
  );

  res.json({
    message: product.isCounterfeit
      ? 'Warning: This product might not be original'
      : 'Product verification successful',
    product: {
      product_name:  product.product_name,
      batch_number:  product.batch_number,
      manufacturing_date: formatDate(product.manufacturing_date),
      expiry_date:        formatDate(product.expiry_date),
      ingredients:        product.ingredients,
      image_url:          product.image_url,
      scanHistory        
    }
  });
};


async function detectCounterfeit(product) {
  const threeDaysAgo = Date.now() - 3 * 24 * 60 * 60 * 1000;
  const recent = product.scanHistory
    .map((date, i) => ({ date, location: product.scanHistoryLocations[i] }))
    .filter(s => s.date.getTime() > threeDaysAgo);

  const uniqueLocations = [...new Set(recent.map(s => s.location))];
  
  // Per spec: more than 10 scans in at least 10 different locations
  if (recent.length > 10 && uniqueLocations.length >= 10) {
    product.isCounterfeit = true;
    product.counterfeitReports.push({
      detectedAt: new Date(),
      scanCount: recent.length,
      locations: uniqueLocations
    });
    await product.save();

    // Report the fraud on the blockchain
    // Call the blockchainService to report the fraud
    const fraudReason = 'Multiple scans from different locations';
    await blockchainService.reportFraud(
      product.qr_code, // the productId on the blockchain
      fraudReason,     // reason for the fraud
      recent.length,   // scan count
      uniqueLocations.join(', ') // location details
    );

    // Also push the report into the manufacturer’s user.reports
    await User.findByIdAndUpdate(
      product.manufacturer,
      { $push: { reports: {
          product: product._id,
          detectedAt: new Date(),
          scanCount: recent.length,
          locations: uniqueLocations
        }
      }}
    );

    return true;
  }

  return false;
}



exports.getManufacturerReports = async (req, res) => {
  try {
    const reports = await Product.find({
      manufacturer: req.user._id,
      isCounterfeit: true
    }).select('product_name batch_number counterfeitReports');

    res.json({ reports });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Get product details by product ID
exports.getProductDetails = async (req, res) => {
  const productId = req.params.productId;

  try {
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    res.json({ product });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Report a counterfeit product
exports.reportCounterfeitProduct = async (req, res) => {
  const { product_id, reason, description } = req.body;

  try {
    const product = await Product.findById(product_id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    // Report on the blockchain
    await blockchainService.reportFraud(product_id, reason, description);

    res.json({ message: 'Counterfeit product reported successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};



// Scan a product 
exports.scanProduct = async (req, res) => {
  const { product_code, location = 'Unknown' } = req.body;
  
  try {
    // Authentication and authorization check
    if (!req.user) return res.status(401).json({ message: 'Authorization required' });
    if (req.user.business_name) return res.status(403).json({ message: 'Manufacturers cannot scan products' });

    // Find product
    const product = await Product.findOne({ qr_code: product_code });
    if (!product) return res.status(404).json({ message: 'Product not found' });

    // Record scan
    product.scanHistory.push(new Date());
    product.scanHistoryLocations.push(location);
    await product.save();

    // Verify authenticity
    const isValid = await blockchainService.verifyProduct(product_code);
    
    res.json({
      message: isValid ? 'Product scanned successfully' : 'Potential counterfeit detected',
      scan_count: product.scanHistory.length,
      last_scan: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};