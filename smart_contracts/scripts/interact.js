async function main() {
  const contractAddress = "0xE87Ba4E64dD1C8b6Ac8a57F3a59587a90317293b";  // Replace with actual contract address
  const CosmeticsAuth = await ethers.getContractFactory("CosmeticsAuth");

  // Attach to the deployed contract
  const contract = await CosmeticsAuth.attach(contractAddress);

  // Report fraud for the product
  const productId = "sampleQRCode123";  // Replace with actual product QR code
  const fraudReason = "Multiple scans from suspicious locations";  // Example fraud reason
  const scanCount = 12;  // Example scan count
  const locationDetails = "Multiple locations across different countries";  // Example location details
  
  console.log(`Reporting fraud for product with QR code: ${productId}...`);
  const txReport = await contract.reportFraud(productId, fraudReason, scanCount, locationDetails);
  console.log(`Fraud reported. Transaction: ${txReport.hash}`);

  // Wait for the transaction to be mined
  await txReport.wait();
  console.log('Fraud report transaction confirmed.');

  // Fetch the logs of the "FraudReported" event from the blockchain
  console.log(`Fetching logs for fraud reports related to product: ${productId}...`);
  const filter = contract.filters.FraudReported(productId); // Filter events for the specific productId
  const events = await contract.queryFilter(filter);

  // Log each event
  events.forEach((event, index) => {
      console.log(`Fraud Report ${index + 1}:`);
      console.log(`  Fraud Reason: ${event.args.fraudReason}`);
      console.log(`  Scan Count: ${event.args.scanCount}`);
      console.log(`  Location Details: ${event.args.locationDetails}`);
      console.log(`  Timestamp: ${new Date(event.args.timestamp * 1000).toLocaleString()}`);  // Convert timestamp to human-readable format
  });
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
      console.error(error);
      process.exit(1);
  });
