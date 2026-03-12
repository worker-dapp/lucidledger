/**
 * Deployment script for QRCodeOracle
 *
 * Usage:
 *   cd contracts
 *   npx hardhat run scripts/deployQRCodeOracle.js --network baseSepolia
 *
 * Requires in contracts/.env:
 *   PRIVATE_KEY=<deployer private key, without 0x>
 *   BACKEND_ADDRESS=<server oracle wallet address>
 */

const hre = require("hardhat");

async function main() {
  const network = hre.network.name;
  console.log(`Deploying QRCodeOracle to network: ${network}`);

  const backendAddress = process.env.BACKEND_ADDRESS;
  if (!backendAddress) {
    throw new Error("BACKEND_ADDRESS is required (the server wallet that will call recordVerification())");
  }
  console.log(`Backend address: ${backendAddress}`);

  const [deployer] = await hre.ethers.getSigners();
  console.log(`Deploying with account: ${deployer.address}`);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log(`Account balance: ${hre.ethers.formatEther(balance)} ETH`);

  console.log("\nDeploying QRCodeOracle...");
  const QRCodeOracle = await hre.ethers.getContractFactory("QRCodeOracle");
  const oracle = await QRCodeOracle.deploy(backendAddress);
  await oracle.waitForDeployment();

  const oracleAddress = await oracle.getAddress();
  console.log(`QRCodeOracle deployed to: ${oracleAddress}`);

  const registeredBackend = await oracle.backend();
  console.log(`Verified backend address: ${registeredBackend}`);

  console.log(`\n${"=".repeat(60)}`);
  console.log(`QRCodeOracle deployed to: ${oracleAddress}`);
  console.log(`Backend:                  ${backendAddress}`);
  console.log(`${"=".repeat(60)}`);

  console.log("\nNext steps:");
  console.log(`1. Register via admin UI: paste ${oracleAddress} at /admin/deploy-factory`);
  console.log(`2. Add to server/.env: QR_ORACLE_ADDRESS=${oracleAddress}`);
  console.log(`3. Verify contract: npx hardhat verify --network ${network} ${oracleAddress} ${backendAddress}`);
}

main()
  .then(() => {
    console.log("\nDeployment complete!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
  });
