/**
 * Sync Database with On-Chain Contract State
 *
 * This script reads the actual state from the blockchain and updates
 * the database to match. Useful when blockchain transactions succeed
 * but database updates fail.
 *
 * Usage: node scripts/syncContractState.js [contractAddress]
 *
 * If no address provided, syncs all deployed contracts.
 */

require('dotenv').config();
const { ethers } = require('ethers');
const { DeployedContract, JobPosting } = require('../models');
const { Op } = require('sequelize');

// Terminal contract statuses
const TERMINAL_STATUSES = ['completed', 'refunded', 'terminated'];

/**
 * Update job status if all contracts for that job are complete
 */
async function updateJobStatusIfComplete(jobPostingId) {
  if (!jobPostingId) return;

  const allContracts = await DeployedContract.findAll({
    where: { job_posting_id: jobPostingId },
    attributes: ['id', 'status']
  });

  if (allContracts.length === 0) return;

  const allTerminal = allContracts.every(c => TERMINAL_STATUSES.includes(c.status));

  if (!allTerminal) {
    // Some still in progress - set job to in_progress if it was active
    await JobPosting.update(
      { status: 'in_progress' },
      { where: { id: jobPostingId, status: 'active' } }
    );
    return;
  }

  // All terminal - determine final status
  const allRefunded = allContracts.every(c => c.status === 'refunded' || c.status === 'terminated');
  const newStatus = allRefunded ? 'closed' : 'completed';

  const [updatedCount] = await JobPosting.update(
    { status: newStatus },
    { where: { id: jobPostingId, status: { [Op.notIn]: ['completed', 'closed'] } } }
  );

  if (updatedCount > 0) {
    console.log(`  📋 Job ${jobPostingId} status → '${newStatus}'`);
  }
}

// Contract state enum (matches Solidity)
const ContractState = {
  0: 'funded',      // Funded -> funded
  1: 'completed',   // Completed -> completed
  2: 'disputed',    // Disputed -> disputed
  3: 'refunded',    // Refunded -> refunded (or terminated)
};

// ManualWorkContract ABI - just the functions we need
const ManualWorkContractABI = [
  "function state() view returns (uint8)",
  "function getBalance() view returns (uint256)",
  "function disputeReason() view returns (string)",
  "function worker() view returns (address)",
  "function employer() view returns (address)",
  "function mediator() view returns (address)",
  "function paymentAmount() view returns (uint256)",
];

async function syncContract(contractAddress, provider) {
  console.log(`\nSyncing contract: ${contractAddress}`);

  // Get database record
  const dbRecord = await DeployedContract.findOne({
    where: { contract_address: contractAddress }
  });

  if (!dbRecord) {
    console.log(`  ⚠ Not found in database`);
    return { address: contractAddress, status: 'not_found' };
  }

  console.log(`  DB Status: ${dbRecord.status}`);

  // Get on-chain state
  const contract = new ethers.Contract(contractAddress, ManualWorkContractABI, provider);

  try {
    const [state, balance] = await Promise.all([
      contract.state(),
      contract.getBalance(),
    ]);

    const stateNum = Number(state);
    const balanceNum = Number(balance);
    const newStatus = ContractState[stateNum];

    console.log(`  On-chain State: ${stateNum} (${newStatus})`);
    console.log(`  On-chain Balance: ${balanceNum / 1e6} USDC`);

    // Check if update needed
    if (dbRecord.status === newStatus) {
      console.log(`  ✓ Already in sync`);
      return { address: contractAddress, status: 'in_sync', state: newStatus };
    }

    // Update database
    console.log(`  Updating: ${dbRecord.status} → ${newStatus}`);
    await dbRecord.update({ status: newStatus });
    console.log(`  ✓ Database updated`);

    // If now terminal, check if job status should update
    if (TERMINAL_STATUSES.includes(newStatus)) {
      await updateJobStatusIfComplete(dbRecord.job_posting_id);
    }

    return { address: contractAddress, status: 'updated', from: dbRecord.status, to: newStatus };

  } catch (error) {
    console.log(`  ✗ Error reading contract: ${error.message}`);
    return { address: contractAddress, status: 'error', error: error.message };
  }
}

async function main() {
  const specificAddress = process.argv[2];

  // Connect to Base Sepolia
  const rpcUrl = process.env.BASE_SEPOLIA_RPC || 'https://sepolia.base.org';
  const provider = new ethers.JsonRpcProvider(rpcUrl);

  console.log('Contract State Sync Tool');
  console.log('========================');
  console.log(`RPC: ${rpcUrl}`);

  const results = [];

  if (specificAddress) {
    // Sync specific contract
    const result = await syncContract(specificAddress, provider);
    results.push(result);
  } else {
    // Sync all deployed contracts
    const contracts = await DeployedContract.findAll({
      where: {
        contract_address: { [require('sequelize').Op.ne]: null }
      }
    });

    console.log(`\nFound ${contracts.length} deployed contracts`);

    for (const contract of contracts) {
      const result = await syncContract(contract.contract_address, provider);
      results.push(result);
    }
  }

  // Summary
  console.log('\n========================');
  console.log('Summary:');
  const updated = results.filter(r => r.status === 'updated');
  const inSync = results.filter(r => r.status === 'in_sync');
  const errors = results.filter(r => r.status === 'error');

  console.log(`  Updated: ${updated.length}`);
  console.log(`  Already in sync: ${inSync.length}`);
  console.log(`  Errors: ${errors.length}`);

  if (updated.length > 0) {
    console.log('\nUpdated contracts:');
    updated.forEach(u => console.log(`  ${u.address}: ${u.from} → ${u.to}`));
  }

  process.exit(0);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
