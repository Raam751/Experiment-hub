const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const dbUrl = process.env.DATABASE_URL || '';
const isLocal = dbUrl.includes('localhost') || dbUrl.includes('127.0.0.1');
const needsSSL = !isLocal && dbUrl.length > 0;

const redacted = dbUrl.replace(/:([^@]+)@/, ':***@');
console.log(`[migrate] DB URL: ${redacted || '(empty)'}`);
console.log(`[migrate] SSL enabled: ${needsSSL}`);

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: needsSSL ? { rejectUnauthorized: false } : false,
    connectionTimeoutMillis: 15000,
});

async function ensureMigrationsTable(client) {
    await client.query(`
        CREATE TABLE IF NOT EXISTS schema_migrations (
            filename VARCHAR(255) PRIMARY KEY,
            applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    `);
}

async function getAppliedMigrations(client) {
    const result = await client.query('SELECT filename FROM schema_migrations ORDER BY filename');
    return new Set(result.rows.map(r => r.filename));
}

async function connectWithRetry(maxRetries = 5) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const client = await pool.connect();
            return client;
        } catch (err) {
            console.error(`Connection attempt ${attempt}/${maxRetries} failed: ${err.message}`);
            if (attempt === maxRetries) throw err;
            const delay = attempt * 3000;
            console.log(`Retrying in ${delay / 1000}s...`);
            await new Promise(r => setTimeout(r, delay));
        }
    }
}

async function runMigrations() {
    const migrationsDir = __dirname;

    const files = fs.readdirSync(migrationsDir)
        .filter(f => f.endsWith('.sql'))
        .sort();

    console.log(`Found ${files.length} migration files.\n`);

    let client;
    try {
        client = await connectWithRetry();
    } catch (err) {
        console.error(`\n[migrate] WARNING: Could not connect to database. Skipping migrations.`);
        console.error(`[migrate] The server will start, but tables may not exist yet.\n`);
        await pool.end().catch(() => {});
        return;
    }

    try {
        await ensureMigrationsTable(client);
        const applied = await getAppliedMigrations(client);

        let ranCount = 0;

        for (const file of files) {
            if (applied.has(file)) {
                console.log(`-- Skipping (already applied): ${file}`);
                continue;
            }

            const filePath = path.join(migrationsDir, file);
            const sql = fs.readFileSync(filePath, 'utf-8').trim();

            if (!sql) {
                console.log(`-- Skipping empty file: ${file}`);
                continue;
            }

            console.log(`>> Running: ${file}`);

            try {
                await client.query('BEGIN');
                await client.query(sql);
                await client.query(
                    'INSERT INTO schema_migrations (filename) VALUES ($1)',
                    [file]
                );
                await client.query('COMMIT');
                console.log(`   OK: ${file}\n`);
                ranCount++;
            } catch (err) {
                await client.query('ROLLBACK');
                console.error(`   FAILED: ${file}`);
                console.error(`   Error: ${err.message}\n`);
                process.exit(1);
            }
        }

        if (ranCount === 0) {
            console.log('\nAll migrations already applied. Nothing to do.');
        } else {
            console.log(`\nSuccessfully applied ${ranCount} new migration(s).`);
        }
    } finally {
        client.release();
        await pool.end();
    }
}

runMigrations();
