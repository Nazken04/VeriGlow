/** @type import('hardhat/config').HardhatUserConfig */
require('dotenv').config();
require('@nomiclabs/hardhat-ethers');
require('@nomiclabs/hardhat-waffle');

module.exports = {
  solidity: "0.8.0",  // Match the Solidity version used in your contract
  networks: {
    sepolia: {
      url: `https://sepolia.infura.io/v3/${process.env.INFURA_PROJECT_ID}`,  // Use your Infura Project ID
      accounts: [process.env.WALLET_PRIVATE_KEY],  // Your Ethereum private key for deployment (without the extra `0x`)
    },
  },
};
