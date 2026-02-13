/**
 * Database Reset Script
 * Clears all data from the database for testing purposes
 * 
 * Usage: npm run db:reset
 */

const { sequelize } = require('../config/database');

async function resetDatabase() {
  try {
    console.log('🗑️  Clearing all data from database...');
    
    // Use raw query to truncate all tables
    // Order matters due to foreign key constraints - CASCADE handles this
    // Note: table names are singular (employee, employer) per Sequelize model config
    await sequelize.query(`
      TRUNCATE TABLE
        dispute_history,
        payment_transactions,
        oracle_verifications,
        deployed_contracts,
        job_applications,
        saved_jobs,
        job_postings,
        jobs,
        contract_templates,
        mediators,
        employee,
        employer
      RESTART IDENTITY CASCADE
    `);
    
    console.log('✅ Database cleared successfully!');
    console.log('');
    console.log('💡 Remember to also clear localStorage in your browser:');
    console.log('   Open DevTools → Console → Run:');
    console.log('   localStorage.clear()');
    console.log('');
    
    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error clearing database:', error.message);
    
    // If table doesn't exist, try a simpler approach
    if (error.message.includes('does not exist')) {
      console.log('');
      console.log('⚠️  Some tables may not exist. Trying alternative approach...');
      try {
        // Try truncating tables individually, ignoring errors
        // Note: table names are singular (employee, employer) per Sequelize model config
        const tables = [
          'dispute_history', 'payment_transactions', 'oracle_verifications',
          'deployed_contracts', 'job_applications', 'saved_jobs',
          'job_postings', 'jobs', 'contract_templates',
          'mediators', 'employee', 'employer'
        ];
        for (const table of tables) {
          try {
            await sequelize.query(`TRUNCATE TABLE ${table} RESTART IDENTITY CASCADE`);
            console.log(`   ✓ Cleared ${table}`);
          } catch (e) {
            console.log(`   ⚠ Skipped ${table} (may not exist)`);
          }
        }
        console.log('');
        console.log('✅ Database reset complete!');
        await sequelize.close();
        process.exit(0);
      } catch (altError) {
        console.error('❌ Alternative approach also failed:', altError.message);
      }
    }
    
    await sequelize.close();
    process.exit(1);
  }
}

resetDatabase();
