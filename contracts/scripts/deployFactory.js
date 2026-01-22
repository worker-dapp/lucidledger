/**
 * Deployment script for WorkContractFactory
 *
 * Usage:
 *   cd contracts
 *   npm install
 *   npx hardhat run scripts/deployFactory.js --network baseSepolia
 *
 * Make sure to set PRIVATE_KEY and ADMIN_ADDRESS in your .env file
 */

const hre = require("hardhat");

// USDC addresses by network
const USDC_ADDRESSES = {
  baseSepolia: "0x036CbD53842c5426634e7929541eC2318f3dCF7e", // Circle USDC on Base Sepolia
  baseMainnet: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", // USDC on Base Mainnet
};

async function main() {
  const network = hre.network.name;
  console.log(`Deploying to network: ${network}`);

  const usdcAddress = USDC_ADDRESSES[network];
  if (!usdcAddress) {
    throw new Error(`No USDC address configured for network: ${network}`);
  }

  console.log(`Using USDC address: ${usdcAddress}`);

  const adminAddress = process.env.ADMIN_ADDRESS;
  if (!adminAddress) {
    throw new Error("ADMIN_ADDRESS is required for mediator assignment");
  }

  console.log(`Using admin address: ${adminAddress}`);

  // Get deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log(`Deploying with account: ${deployer.address}`);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log(`Account balance: ${hre.ethers.formatEther(balance)} ETH`);

  // Deploy Factory
  console.log("\nDeploying WorkContractFactory...");
  const Factory = await hre.ethers.getContractFactory("WorkContractFactory");
  const factory = await Factory.deploy(usdcAddress, adminAddress);

  await factory.waitForDeployment();
  const factoryAddress = await factory.getAddress();

  console.log(`\n${"=".repeat(60)}`);
  console.log(`WorkContractFactory deployed to: ${factoryAddress}`);
  console.log(`${"=".repeat(60)}`);

  console.log("\nNext steps:");
  console.log(`1. Add to client/.env: VITE_FACTORY_ADDRESS=${factoryAddress}`);
  console.log(`2. Verify contract: npx hardhat verify --network ${network} ${factoryAddress} ${usdcAddress} ${adminAddress}`);

  // Also deploy updated ManualWorkContract for reference (optional)
  console.log("\nDeploying reference ManualWorkContract...");
  const ManualWorkContract = await hre.ethers.getContractFactory("ManualWorkContract");

  // This is just to get the bytecode for the ABI file - we don't actually need to deploy it
  // The Factory will deploy individual contracts
  console.log("ManualWorkContract bytecode ready for Factory use.");

  return {
    factoryAddress,
    usdcAddress,
    network
  };
}

main()
  .then((result) => {
    console.log("\nDeployment complete!");
    console.log(JSON.stringify(result, null, 2));
    process.exit(0);
  })
  .catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
  });
