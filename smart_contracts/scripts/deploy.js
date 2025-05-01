async function main() {
    // Get the signer (the account that will deploy the contract)
    const [deployer] = await ethers.getSigners();
  
    console.log("Deploying contracts with the account:", deployer.address);
  
    // Get the contract factory for CosmeticsAuth
    const CosmeticsAuth = await ethers.getContractFactory("CosmeticsAuth");
  
    // Deploy the contract
    const contract = await CosmeticsAuth.deploy();
    console.log("Contract deployed to:", contract.address);
  }
  
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
  