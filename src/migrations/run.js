/**
 * Simple migration runner.
 * Reads .sql files from this directory in alphabetical order and executes them.
 * 
 * Usage: npm run migrate
 * 
 * Design notes:
 * - Uses IF NOT EXISTS so migrations are safe to re-run (idempotent).
 * - Runs each file inside a transaction so a single broken migration
 *   won't leave the DB in a half-migrated state.
 * - Minimal by design — no rollback support. For a student project,
 *   you can just drop and recreate tables during development.
 */

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function runMigrations() {
    const migrationsDir = __dirname;

    // Read all .sql files, sorted alphabetically (001_, 002_, etc.)
    const files = fs.readdirSync(migrationsDir)
        .filter(f => f.endsWith('.sql'))
        .sort();

    console.log(`Found ${files.length} migration files.\n`);

    const client = await pool.connect();

    try {
        for (const file of files) {
            const filePath = path.join(migrationsDir, file);
            const sql = fs.readFileSync(filePath, 'utf-8').trim();

            if (!sql) {
                console.log(`⏭  Skipping empty file: ${file}`);
                continue;
            }

            console.log(`▶  Running: ${file}`);

            try {
                await client.query('BEGIN');
                await client.query(sql);
                await client.query('COMMIT');
                console.log(`✅ Success: ${file}\n`);
            } catch (err) {
                await client.query('ROLLBACK');
                console.error(`❌ Failed: ${file}`);
                console.error(`   Error: ${err.message}\n`);
                // Stop on first failure — don't run later migrations
                // that might depend on this one
                process.exit(1);
            }
        }

        console.log('All migrations completed successfully.');
    } finally {
        client.release();
        await pool.end();
    }
}

runMigrations();
