require('dotenv').config();
const { ethers } = require('ethers');
const { infuraProjectID, walletPrivateKey, contractAddress } = require('../config');
const contractArtifact = require('../abis/ContractABI.json'); // Load artifact
const contractABI = contractArtifact.abi; // Extract the ABI array

// Debug logs
console.log("ABI:", contractABI); // Verify it's an array

const provider = new ethers.JsonRpcProvider(`https://sepolia.infura.io/v3/${infuraProjectID}`);
const wallet = new ethers.Wallet(walletPrivateKey, provider);
const contract = new ethers.Contract(contractAddress, contractABI, wallet); // Use the ABI array

// Register a product on the blockchain
async function registerProduct(product) {
  try {
    // Convert dates to numbers explicitly
    const manufacturingDate = Number(product.manufacturing_date);
    const expiryDate = Number(product.expiry_date);

    console.log("Final Timestamps:", {
      manufacturingDate,
      expiryDate,
      typeManufacturing: typeof manufacturingDate,
      typeExpiry: typeof expiryDate
    });

    // Ensure the qr_code is properly passed to the blockchain
    const tx = await contract.registerProduct(
      product.qr_code,  // qr_code should be passed as part of the payload
      product.product_name,
      product.batch_number,
      manufacturingDate, // Should be number
      expiryDate,        // Should be number
      product.ingredients
    );

    await tx.wait();
    console.log("Product registered on blockchain:", tx);
    return product.qr_code;  // Return the qr_code (not qr_image)
  } catch (err) {
    console.error('Blockchain error:', err);
    throw new Error('Blockchain registration failed: ' + err.message);
  }
}



// Verify a product's authenticity using QR code
async function verifyProduct(qr_code) {
  try {
    const productExists = await contract.verifyProduct(qr_code);
    return productExists;
  } catch (err) {
    console.error('Error verifying product on blockchain:', err);
    return false;
  }
}

// Report fraudulent activity on the blockchain
async function reportFraud(productId, fraudReason, scanCount, locationDetails) {
  try {
    // Send the report to the blockchain contract
    const tx = await contract.reportFraud(
      productId,
      fraudReason,
      scanCount,
      locationDetails
    );
    await tx.wait(); // Wait for the transaction to be mined
    console.log(`Fraud report successfully sent to blockchain for product ${productId}`);
  } catch (err) {
    console.error('Error reporting fraud on blockchain:', err);
    throw new Error('Blockchain fraud report failed');
  }
}
module.exports = {
  registerProduct,
  verifyProduct,
  reportFraud,
};
