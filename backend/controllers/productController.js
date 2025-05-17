
const QRCode = require('qrcode');
const Product = require('../models/productModel');
const blockchainService = require('../services/blockchainService');
const User = require('../models/userModel');
const JsBarcode = require('jsbarcode');
const { createCanvas } = require('canvas');

exports.registerProduct = async (req, res) => {
  const { product_name, manufacturing_date, expiry_date, ingredients, amount, image_url } = req.body;

  try {
    if (!req.user.business_name) {
      return res.status(403).json({ message: 'Only manufacturers can register products' });
    }

    const batchNumber = `${product_name.replace(/\s+/g, '-')}-${Date.now()}`;
    const products = [];

    for (let i = 0; i < amount; i++) {
      const productId = `PRD-${Date.now()}-${i + 1}`;
      const canvas = createCanvas();
      JsBarcode(canvas, productId, { format: "CODE128", displayValue: true });
      const barcodeImage = canvas.toDataURL();
      
      const qrString = productId;
      const qrImage = await QRCode.toDataURL(qrString);

      const newProduct = new Product({
        product_name,
        batch_number: batchNumber,
        manufacturing_date: Math.floor(new Date(manufacturing_date).getTime() / 1000),
        expiry_date: Math.floor(new Date(expiry_date).getTime() / 1000),
        ingredients,
        image_url,
        qr_code: qrString,
        qr_code_image: qrImage,
        barcode: productId,
        barcode_image: barcodeImage,
        manufacturer: req.user._id,
        scanHistory: [],
        isCounterfeit: false,
        counterfeitReports: [],
      });

      await newProduct.save();
      products.push(newProduct);
    }

    for (const product of products) {
      await blockchainService.registerProduct(product); 
    }

    res.status(201).json({
      message: `${amount} products registered successfully`,
      products: products.map(p => ({
        _id: p._id,
        product_name: p.product_name,
        batch_number: p.batch_number,
        manufacturing_date: p.manufacturing_date,
        expiry_date: p.expiry_date,
        ingredients: p.ingredients,
        image_url: p.image_url,
        qr_code: p.qr_code,
        qr_code_image: p.qr_code_image,
        barcode: p.barcode,
        barcode_image: p.barcode_image,
        manufacturer: p.manufacturer,
        scanHistory: p.scanHistory,
        isCounterfeit: p.isCounterfeit,
        counterfeitReports: p.counterfeitReports,
      })),
    });

  } catch (err) {
    console.error("Product registration failed:", err);
    res.status(500).json({
      message: "Product registration failed",
      error: err.message,
    });
  }
};

exports.getManufacturerProducts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const manufacturerId = req.user._id;

    const batchCounts = await Product.aggregate([
      { $match: { manufacturer: manufacturerId } },
      { $group: { _id: "$batch_number" } },
      { $count: "totalBatches" }
    ]);
    
    const totalBatches = batchCounts.length > 0 ? batchCounts[0].totalBatches : 0;

    const batches = await Product.aggregate([
      { $match: { manufacturer: manufacturerId } },
      { 
        $group: {
          _id: "$batch_number",
          product_name: { $first: "$product_name" },
          manufacturing_date: { $first: "$manufacturing_date" },
          expiry_date: { $first: "$expiry_date" },
          ingredients: { $first: "$ingredients" },
          image_url: { $first: "$image_url" },
          barcode: { $first: "$barcode" }, 
          barcode_image: { $first: "$barcode_image" }, 
          qr_code_image: { $first: "$qr_code_image" }, 
          isCounterfeit: { $max: { $cond: [{ $eq: ["$isCounterfeit", true] }, 1, 0] } }, 
          count: { $sum: 1 } 
        }
      },
      {
        $addFields: {
          isCounterfeit: { $eq: ["$isCounterfeit", 1] } 
        }
      },
      { $sort: { _id: 1 } }, 
      { $skip: skip },
      { $limit: limit },
      {
        $project: {
          batch_number: "$_id",
          _id: 0, 
          product_name: 1,
          manufacturing_date: 1,
          expiry_date: 1,
          ingredients: 1,
          image_url: 1,
          barcode: 1,
          barcode_image: 1,
          qr_code_image: 1,
          isCounterfeit: 1,
          count: 1
        }
      }
    ]);

    res.status(200).json({ 
      batches,
      page,
      pages: Math.ceil(totalBatches / limit),
      totalBatches
    });
  } catch (err) {
    console.error("Error in getManufacturerProducts:", err);
    res.status(500).json({ 
      message: "Failed to fetch manufacturer products",
      error: err.message 
    });
  }
};

exports.getProductsByBatchNumber = async (req, res) => {
  try {
    const { batchNumber } = req.params;
    const manufacturerId = req.user._id;

    if (!batchNumber) {
        return res.status(400).json({ message: "Batch number is required." });
    }

    const productsInBatch = await Product.find({ 
      manufacturer: manufacturerId, 
      batch_number: batchNumber 
    }).sort({ _id: 1 }); 

    if (!productsInBatch || productsInBatch.length === 0) {
      return res.status(404).json({ message: "No products found for this batch number." });
    }
    res.status(200).json(productsInBatch); 
  } catch (err) {
    console.error("Error in getProductsByBatchNumber:", err);
    res.status(500).json({ 
      message: "Failed to fetch products for the batch",
      error: err.message 
    });
  }
};

// Helper function for counterfeit detection and reporting
// Returns true if it saved the product (due to counterfeit status change), false otherwise.
async function updateCounterfeitStatus(product) {
  const validScans = product.scanHistory.filter(s => s && s.userId && s.location && s.date instanceof Date);

  const uniqueUserIds = [...new Set(validScans.map(s => s.userId.toString()))];
  const uniqueLocations = [...new Set(validScans.map(s => s.location.toLowerCase()))]; 

  if (uniqueUserIds.length >= 10 && uniqueLocations.length >= 10) {
    const newReportData = {
      detectedAt: (product.isCounterfeit && product.counterfeitReports.length > 0)
                  ? product.counterfeitReports[0].detectedAt 
                  : new Date(),
      scanCount: validScans.length, 
      uniqueLocationCount: uniqueLocations.length,
      locations: uniqueLocations, 
      uniqueUserCount: uniqueUserIds.length,
      userIds: uniqueUserIds, 
      lastChecked: new Date() 
    };

    if (!product.isCounterfeit) {
      product.isCounterfeit = true;
      product.counterfeitReports = [newReportData]; 
      await product.save(); 

      const fraudReason = `Potential counterfeit: Scanned by ${uniqueUserIds.length} different users in ${uniqueLocations.length} different locations.`;
      await blockchainService.reportFraud(
        product.qr_code, 
        fraudReason,
        validScans.length, 
        uniqueLocations.join(', ') 
      );

      await User.findByIdAndUpdate(
        product.manufacturer,
        { $push: { reports: {
            product: product._id,
            productName: product.product_name,
            batchNumber: product.batch_number,
            detectedAt: newReportData.detectedAt,
            scanCount: newReportData.scanCount,
            uniqueUserCount: newReportData.uniqueUserCount,
            uniqueLocationCount: newReportData.uniqueLocationCount,
            reason: "Automated detection: 10+ unique users in 10+ unique locations."
          }
        }},
        { new: true } 
      );
    } else { // Already counterfeit, update the report
      product.counterfeitReports = [newReportData]; 
      await product.save();
    }
    return true; // Indicates counterfeit status active/updated and product was saved
  }
  // If condition is not met, product remains as is (or wasn't changed by this function)
  return false; // Indicates conditions not met, product was NOT saved by this function
}


exports.verifyProduct = async (req, res) => {
  const { qr_code, location = 'Unknown' } = req.body; 
  const userId = req.user?._id; 

  if (!userId) {
    return res.status(401).json({ message: 'Authorization required. User ID not found.' });
  }

  try {
    const product = await Product.findOne({ qr_code });
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (!req.user.business_name) { // Consumer scan
      const scanEntry = {
        userId: userId,
        date: new Date(),
        location: location 
      };
      product.scanHistory.push(scanEntry); // Modify in-memory
      
      // updateCounterfeitStatus returns true if it saved the product
      const savedByUpdateCounterfeit = await updateCounterfeitStatus(product); 
      
      if (!savedByUpdateCounterfeit) {
        // If updateCounterfeitStatus didn't save (e.g., criteria not met),
        // we still need to save to persist the new scanHistory entry.
        await product.save();
      }
      // If savedByUpdateCounterfeit is true, product was already saved.
    } else { // Manufacturer verification (does not add to scan history for counterfeit detection)
      console.log(`Manufacturer ${req.user.business_name} verified product ${product.product_name}`);
    }

    const formatDate = ts => (ts ? new Date(ts * 1000).toLocaleDateString() : 'N/A');
    
    const formattedScanHistory = product.scanHistory
      .map(scan => {
        let dateToFormat;
        let scanLocation = 'Unknown';
        let scanUserIdStr = 'Unknown';

        if (scan && typeof scan === 'object' && scan.date instanceof Date) {
          dateToFormat = scan.date;
          scanLocation = scan.location || 'Unknown';
          if (scan.userId) {
            scanUserIdStr = scan.userId.toString();
          }
        } else if (scan instanceof Date) { // Handle potential old format
          dateToFormat = scan;
        } else {
          console.warn('Unrecognized scan entry format in product.scanHistory:', scan);
          return null; 
        }

        if (dateToFormat) {
          return `${dateToFormat.toLocaleDateString()} at ${dateToFormat.toLocaleTimeString()} in ${scanLocation} (User: ${scanUserIdStr})`;
        }
        return null; 
      })
      .filter(entry => entry !== null); 

    res.json({
      message: product.isCounterfeit
        ? 'Warning: This product has been flagged as potentially counterfeit.'
        : 'Product verification successful.',
      product: {
        _id: product._id,
        product_name: product.product_name,
        batch_number: product.batch_number,
        manufacturing_date: formatDate(product.manufacturing_date),
        expiry_date: formatDate(product.expiry_date),
        ingredients: product.ingredients,
        image_url: product.image_url,
        scanHistory: formattedScanHistory, 
        isCounterfeit: product.isCounterfeit,
        counterfeitReport: product.counterfeitReports.length > 0 ? product.counterfeitReports[0] : null 
      }
    });

  } catch (err) {
    console.error("Error in verifyProduct:", err);
    res.status(500).json({ message: 'Product verification failed', error: err.message });
  }
};


exports.getManufacturerReports = async (req, res) => {
  try {
    const manufacturerId = req.user._id;
    const counterfeitProducts = await Product.find({
      manufacturer: manufacturerId,
      isCounterfeit: true
    }).select('product_name batch_number counterfeitReports scanHistory'); 

    const reports = counterfeitProducts.map(p => {
      const reportDetail = p.counterfeitReports.length > 0 ? p.counterfeitReports[0] : null;
      return {
        productId: p._id,
        product_name: p.product_name,
        batch_number: p.batch_number,
        report: reportDetail ? {
            detectedAt: reportDetail.detectedAt,
            scanCount: reportDetail.scanCount,
            uniqueLocationCount: reportDetail.uniqueLocationCount,
            locations: reportDetail.locations.slice(0, 5), 
            uniqueUserCount: reportDetail.uniqueUserCount,
            lastChecked: reportDetail.lastChecked,
        } : null
      };
    });

    res.json({ reports });
  } catch (err) {
    console.error("Error fetching manufacturer reports:", err);
    res.status(500).json({ message: 'Server error while fetching reports', error: err.message });
  }
};

exports.getProductDetails = async (req, res) => {
  const productId = req.params.productId;
  try {
    const product = await Product.findById(productId).populate('manufacturer', 'business_name email');
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const formattedScanHistory = product.scanHistory.map(scan => {
        let dateIso = null, location = 'Unknown', userIdStr = 'Unknown';
        if (scan && typeof scan === 'object' && scan.date instanceof Date) {
            dateIso = scan.date.toISOString();
            location = scan.location || 'Unknown';
            userIdStr = scan.userId ? scan.userId.toString() : 'Unknown';
        } else if (scan instanceof Date) { // Handle potential old format
            dateIso = scan.toISOString();
        } else {
            return { error: 'Invalid scan entry' };
        }
        return {
            date: dateIso,
            location: location,
            userId: userIdStr
        };
    }).filter(entry => !entry.error);

    res.json({ 
        ...product.toObject(), 
        scanHistory: formattedScanHistory,
        counterfeitReport: product.counterfeitReports.length > 0 ? product.counterfeitReports[0] : null
    });

  } catch (err) {
    console.error(`Error fetching product details for ID ${productId}:`, err);
    res.status(500).json({ message: 'Server error fetching product details', error: err.message });
  }
};
 
exports.scanProduct = async (req, res) => {
  const { product_code, location = 'Unknown' } = req.body; 
  const userId = req.user?._id;

  try {
    if (!userId) {
      return res.status(401).json({ message: 'Authorization required. User ID not found.' });
    }
    if (req.user.business_name) {
      return res.status(403).json({ message: 'Manufacturers should use specific verification tools, not general scan endpoint.' });
    }

    const product = await Product.findOne({ qr_code: product_code });
    if (!product) {
      return res.status(404).json({ message: 'Product not found for the scanned code.' });
    }

    const scanEntry = {
      userId: userId,
      date: new Date(),
      location: location
    };
    product.scanHistory.push(scanEntry); // Modify in-memory
    
    // updateCounterfeitStatus returns true if it saved the product
    const savedByUpdateCounterfeit = await updateCounterfeitStatus(product); 
    
    if (!savedByUpdateCounterfeit) {
      // If updateCounterfeitStatus didn't save (e.g., criteria not met),
      // we still need to save to persist the new scanHistory entry.
      await product.save();
    }
    // If savedByUpdateCounterfeit is true, product was already saved.
    
    const isBlockchainValid = await blockchainService.verifyProduct(product_code); 
    
    res.json({
      message: product.isCounterfeit 
                ? 'Warning: Product flagged as potentially counterfeit.' 
                : (isBlockchainValid ? 'Product scanned and verified successfully.' : 'Product scanned. Blockchain verification raised concerns.'),
      productId: product._id,
      product_name: product.product_name,
      isCounterfeit: product.isCounterfeit,
      isBlockchainValid: isBlockchainValid, 
      scan_count_total: product.scanHistory.length, 
      current_scan_details: scanEntry 
    });

  } catch (err) {
    console.error("Error in scanProduct endpoint:", err);
    res.status(500).json({ message: 'Server error during product scan', error: err.message });
  }
};

exports.reportCounterfeitProduct = async (req, res) => {
  const { product_id, reason, description } = req.body; 
  const reporterUserId = req.user?._id;

  if (!reporterUserId) {
    return res.status(401).json({ message: 'Authorization required to report.' });
  }

  try {
    const product = await Product.findById(product_id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found for reporting.' });
    }

    product.isCounterfeit = true; 
    const manualReportEntry = {
      detectedAt: new Date(), 
      reason: reason,
      description: description,
      reportedByUserId: reporterUserId,
      type: 'manual_report', 
      scanCount: product.scanHistory.length, 
      uniqueLocationCount: product.counterfeitReports[0]?.uniqueLocationCount || 0,
      locations: product.counterfeitReports[0]?.locations || [],
      uniqueUserCount: product.counterfeitReports[0]?.uniqueUserCount || 0,
      userIds: product.counterfeitReports[0]?.userIds || [],
      lastChecked: new Date()
    };
    
    product.counterfeitReports = [manualReportEntry];
    await product.save();

    await blockchainService.reportFraud(
        product.qr_code, 
        `Manual Report: ${reason} - ${description}`, 
        0, 
        `Reported by user ${reporterUserId}` 
    );
    
    await User.findByIdAndUpdate(
        product.manufacturer,
        { $push: { reports: { 
            product: product._id,
            productName: product.product_name,
            batchNumber: product.batch_number,
            reportedAt: new Date(),
            reason: `Manual Report: ${reason}`,
            description: description,
            reportedByUserId: reporterUserId,
          }
        }}
      );

    res.json({ message: 'Counterfeit product reported successfully. The manufacturer will be notified.' });
  } catch (err) {
    console.error("Error manually reporting counterfeit product:", err);
    res.status(500).json({ message: 'Server error during manual counterfeit reporting', error: err.message});
  }
};