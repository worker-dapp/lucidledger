const fs = require('fs');
const path = require('path');
const { sequelize } = require('../config/database');

async function runMigration() {
  try {
    // Get migration file from command line argument, default to create-all-tables.sql
    const migrationFile = process.argv[2] || 'create-all-tables.sql';
    
    console.log(`Reading migration file: ${migrationFile}...`);
    const migrationPath = path.join(__dirname, '../migrations', migrationFile);
    
    if (!fs.existsSync(migrationPath)) {
      console.error(`❌ Migration file not found: ${migrationPath}`);
      process.exit(1);
    }
    
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('Executing migration...');
    await sequelize.query(migrationSQL);
    
    console.log('✅ Migration completed successfully!');
    console.log(`Migration file "${migrationFile}" executed`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

runMigration();
