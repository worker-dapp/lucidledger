/**
 * Deployment script for WorkContractFactory + ManualOracle
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

  // Use existing ManualOracle singleton if MANUAL_ORACLE_ADDRESS is set,
  // otherwise deploy a new one (first-time setup only).
  let manualOracleAddress = process.env.MANUAL_ORACLE_ADDRESS || null;

  // 1. Deploy Factory
  console.log("\nDeploying WorkContractFactory...");
  const Factory = await hre.ethers.getContractFactory("WorkContractFactory");
  const factory = await Factory.deploy(usdcAddress, adminAddress);

  await factory.waitForDeployment();
  const factoryAddress = await factory.getAddress();
  console.log(`WorkContractFactory deployed to: ${factoryAddress}`);

  // 2. Deploy ManualOracle only if no existing address provided
  if (manualOracleAddress) {
    console.log(`\nReusing existing ManualOracle: ${manualOracleAddress}`);
  } else {
    console.log("\nNo MANUAL_ORACLE_ADDRESS set — deploying new ManualOracle...");
    const ManualOracle = await hre.ethers.getContractFactory("ManualOracle");
    const manualOracle = await ManualOracle.deploy();
    await manualOracle.waitForDeployment();
    manualOracleAddress = await manualOracle.getAddress();
    console.log(`ManualOracle deployed to: ${manualOracleAddress}`);
  }

  // 3. Register ManualOracle with Factory (only if deployer IS admin)
  if (deployer.address.toLowerCase() === adminAddress.toLowerCase()) {
    console.log("\nRegistering ManualOracle with Factory...");
    const registerTx = await factory.registerOracle(manualOracleAddress);
    await registerTx.wait();
    console.log(`ManualOracle registered as type "manual"`);

    const registeredAddr = await factory.oracleRegistry("manual");
    console.log(`Verified: oracleRegistry["manual"] = ${registeredAddr}`);
  } else {
    console.log("\nNOTE: Deployer is not the admin. Skipping registerOracle().");
    console.log("The admin must register the oracle via the admin UI (/admin/deploy-factory).");
  }

  console.log(`\n${"=".repeat(60)}`);
  console.log(`WorkContractFactory deployed to: ${factoryAddress}`);
  console.log(`ManualOracle:                    ${manualOracleAddress}`);
  console.log(`${"=".repeat(60)}`);

  console.log("\nNext steps:");
  console.log(`1. Update client/.env: VITE_FACTORY_ADDRESS=${factoryAddress}`);
  if (deployer.address.toLowerCase() !== adminAddress.toLowerCase()) {
    console.log(`2. Register oracle via admin UI: paste ${manualOracleAddress} at /admin/deploy-factory`);
    console.log(`3. Verify factory: npx hardhat verify --network ${network} ${factoryAddress} ${usdcAddress} ${adminAddress}`);
  } else {
    console.log(`2. Verify factory: npx hardhat verify --network ${network} ${factoryAddress} ${usdcAddress} ${adminAddress}`);
  }

  return {
    factoryAddress,
    manualOracleAddress,
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
