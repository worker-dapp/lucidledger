const fs = require('fs');
const path = require('path');
const { sequelize } = require('../config/database');

async function runMigration() {
  try {
    console.log('Reading migration file...');
    const migrationPath = path.join(__dirname, '../migrations/create-all-tables.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('Executing migration...');
    await sequelize.query(migrationSQL);
    
    console.log('✅ Migration completed successfully!');
    console.log('Tables created: employee, employer, jobs');
    console.log('Indexes created for better performance');
    console.log('Comments added for documentation');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

runMigration();
