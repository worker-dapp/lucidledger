/**
 * Database Reset Script
 * Clears all data from the database for testing purposes.
 *
 * Usage: npm run db:reset
 *
 * Tables are DISCOVERED from the database rather than hardcoded. The previous version
 * carried a hand-maintained list that silently went stale: it was missing recruiters,
 * recruiter_fee_payments, audit_log and the QR/NFC oracle tables, so "reset all data"
 * left rows behind and anything relying on a clean slate (notably QA passes) was working
 * from a false premise. It also still listed `jobs`, which no longer exists.
 *
 * A single TRUNCATE over every table lets Postgres resolve the foreign-key ordering
 * itself, so no dependency order has to be maintained here either.
 */

const { sequelize } = require('../config/database');

// Tables that must survive a data reset (schema/bookkeeping, not user data). Empty today
// — migrations are idempotent and re-run on startup rather than being tracked in a table.
const PRESERVE = new Set([]);

async function resetDatabase() {
  try {
    const [rows] = await sequelize.query(
      `SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename`
    );
    const tables = rows.map((r) => r.tablename).filter((t) => !PRESERVE.has(t));

    if (tables.length === 0) {
      console.log('⚠️  No tables found — nothing to clear. Has the server run migrations yet?');
      await sequelize.close();
      process.exit(0);
    }

    console.log(`🗑️  Clearing ${tables.length} tables...`);

    // One statement: CASCADE resolves FK dependencies, RESTART IDENTITY resets sequences.
    const quoted = tables.map((t) => `"${t}"`).join(', ');
    await sequelize.query(`TRUNCATE TABLE ${quoted} RESTART IDENTITY CASCADE`);

    for (const t of tables) console.log(`   ✓ Cleared ${t}`);

    console.log('');
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
    await sequelize.close();
    process.exit(1);
  }
}

resetDatabase();
