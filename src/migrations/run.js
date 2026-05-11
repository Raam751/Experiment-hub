const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const isProduction = process.env.NODE_ENV === 'production' ||
    (process.env.DATABASE_URL && process.env.DATABASE_URL.includes('render.com'));

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: isProduction ? { rejectUnauthorized: false } : false,
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

async function runMigrations() {
    const migrationsDir = __dirname;

    const files = fs.readdirSync(migrationsDir)
        .filter(f => f.endsWith('.sql'))
        .sort();

    console.log(`Found ${files.length} migration files.\n`);

    const client = await pool.connect();

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
