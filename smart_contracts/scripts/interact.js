async function main() {
  const contractAddress = "0xE87Ba4E64dD1C8b6Ac8a57F3a59587a90317293b";  
  const CosmeticsAuth = await ethers.getContractFactory("CosmeticsAuth");

  const contract = await CosmeticsAuth.attach(contractAddress);

  const productId = "sampleQRCode123"; 
  const fraudReason = "Multiple scans from suspicious locations";  
  const scanCount = 12;  
  const locationDetails = "Multiple locations across different countries";  
  
  console.log(`Reporting fraud for product with QR code: ${productId}...`);
  const txReport = await contract.reportFraud(productId, fraudReason, scanCount, locationDetails);
  console.log(`Fraud reported. Transaction: ${txReport.hash}`);

  await txReport.wait();
  console.log('Fraud report transaction confirmed.');

  console.log(`Fetching logs for fraud reports related to product: ${productId}...`);
  const filter = contract.filters.FraudReported(productId); 
  const events = await contract.queryFilter(filter);

  events.forEach((event, index) => {
      console.log(`Fraud Report ${index + 1}:`);
      console.log(`  Fraud Reason: ${event.args.fraudReason}`);
      console.log(`  Scan Count: ${event.args.scanCount}`);
      console.log(`  Location Details: ${event.args.locationDetails}`);
      console.log(`  Timestamp: ${new Date(event.args.timestamp * 1000).toLocaleString()}`);  
  });
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
      console.error(error);
      process.exit(1);
  });
