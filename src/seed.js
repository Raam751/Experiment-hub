require('dotenv').config();
const bcrypt = require('bcrypt');
const { pool } = require('./configs/db');
const logger = require('./configs/logger');

async function seed() {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Create admin user (password: Admin123)
        const passwordHash = await bcrypt.hash('Admin123', 10);
        const userResult = await client.query(
            `INSERT INTO users (email, password_hash, role)
             VALUES ('admin@experiment.io', $1, 'admin')
             ON CONFLICT (email) DO UPDATE SET password_hash = $1, role = 'admin'
             RETURNING id`,
            [passwordHash]
        );
        const adminId = userResult.rows[0].id;
        logger.info(`Admin user created/updated (id: ${adminId}, email: admin@experiment.io, password: Admin123)`);

        // 2. Create a running experiment with variants and events
        const exp1 = await client.query(
            `INSERT INTO experiments (name, description, status, created_by)
             VALUES ('Checkout Button Color', 'Testing whether green or blue CTA converts better', 'running', $1)
             ON CONFLICT (name) DO UPDATE SET status = 'running', description = EXCLUDED.description
             RETURNING id`,
            [adminId]
        );
        const exp1Id = exp1.rows[0].id;

        const v1 = await client.query(
            `INSERT INTO variants (experiment_id, name, weight, is_control)
             VALUES ($1, 'Blue Button (Control)', 50, true)
             ON CONFLICT (experiment_id, name) DO UPDATE SET weight = 50
             RETURNING id`,
            [exp1Id]
        );
        const v2 = await client.query(
            `INSERT INTO variants (experiment_id, name, weight, is_control)
             VALUES ($1, 'Green Button', 50, false)
             ON CONFLICT (experiment_id, name) DO UPDATE SET weight = 50
             RETURNING id`,
            [exp1Id]
        );
        const v1Id = v1.rows[0].id;
        const v2Id = v2.rows[0].id;

        // Generate sample events
        const events = [];
        for (let i = 0; i < 200; i++) {
            const variantId = i < 100 ? v1Id : v2Id;
            events.push(`(${exp1Id}, ${variantId}, 'user_${i}', 'exposure')`);

            // Blue converts at 8%, green at 15%
            const rate = variantId === v1Id ? 0.08 : 0.15;
            if (Math.random() < rate) {
                events.push(`(${exp1Id}, ${variantId}, 'user_${i}', 'conversion')`);
            }
        }

        if (events.length > 0) {
            await client.query(
                `INSERT INTO events (experiment_id, variant_id, user_id, type) VALUES ${events.join(', ')}`
            );
        }

        // Pre-compute metrics for the running experiment
        await client.query(`
            INSERT INTO metrics (experiment_id, variant_id, exposures, conversions, conversion_rate, last_computed_at)
            SELECT
                e.experiment_id, e.variant_id,
                COUNT(e.id) FILTER (WHERE e.type = 'exposure'),
                COUNT(e.id) FILTER (WHERE e.type = 'conversion'),
                CASE WHEN COUNT(e.id) FILTER (WHERE e.type = 'exposure') = 0 THEN 0.0
                     ELSE CAST(COUNT(e.id) FILTER (WHERE e.type = 'conversion') AS DECIMAL)
                          / COUNT(e.id) FILTER (WHERE e.type = 'exposure')
                END,
                NOW()
            FROM events e WHERE e.experiment_id = $1
            GROUP BY e.experiment_id, e.variant_id
            ON CONFLICT (experiment_id, variant_id) DO UPDATE SET
                exposures = EXCLUDED.exposures,
                conversions = EXCLUDED.conversions,
                conversion_rate = EXCLUDED.conversion_rate,
                last_computed_at = EXCLUDED.last_computed_at
        `, [exp1Id]);

        // 3. Create a draft experiment
        await client.query(
            `INSERT INTO experiments (name, description, status, created_by)
             VALUES ('Homepage Hero Image', 'Testing lifestyle vs product hero image', 'draft', $1)
             ON CONFLICT (name) DO NOTHING`,
            [adminId]
        );

        await client.query('COMMIT');
        logger.info('Seed data inserted successfully');
        logger.info('Login with: admin@experiment.io / Admin123');
    } catch (err) {
        await client.query('ROLLBACK');
        logger.error({ err }, 'Seed failed');
        throw err;
    } finally {
        client.release();
        await pool.end();
    }
}

seed().catch(() => process.exit(1));
