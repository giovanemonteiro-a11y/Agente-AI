import dotenv from 'dotenv';
dotenv.config({ path: require('path').resolve(__dirname, '../../../.env') });

import { pool } from '../config/database';
import fs from 'fs';
import path from 'path';

const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

async function migrate() {
  const client = await pool.connect();
  try {
    // Create migrations tracking table
    await client.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        name VARCHAR(255) PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    // Get already-applied migrations
    const { rows: applied } = await client.query<{ name: string }>(
      'SELECT name FROM _migrations ORDER BY name'
    );
    const appliedSet = new Set(applied.map((r) => r.name));

    // Read migration files
    const files = fs.readdirSync(MIGRATIONS_DIR)
      .filter((f) => f.endsWith('.sql'))
      .sort();

    let count = 0;
    for (const file of files) {
      if (appliedSet.has(file)) {
        console.log(`  ✓ ${file} (already applied)`);
        continue;
      }

      const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf-8');
      console.log(`  → Applying ${file}...`);

      // ALTER TYPE ADD VALUE cannot run inside a transaction in PostgreSQL
      const hasAlterType = sql.includes('ALTER TYPE') && sql.includes('ADD VALUE');

      if (hasAlterType) {
        try {
          await client.query(sql);
          await client.query('INSERT INTO _migrations (name) VALUES ($1)', [file]);
          console.log(`  ✓ ${file} applied (no transaction — ALTER TYPE)`);
          count++;
        } catch (err) {
          console.error(`  ✗ ${file} FAILED:`, (err as Error).message);
          throw err;
        }
      } else {
        await client.query('BEGIN');
        try {
          await client.query(sql);
          await client.query('INSERT INTO _migrations (name) VALUES ($1)', [file]);
          await client.query('COMMIT');
          console.log(`  ✓ ${file} applied`);
          count++;
        } catch (err) {
          await client.query('ROLLBACK');
          console.error(`  ✗ ${file} FAILED:`, (err as Error).message);
          throw err;
        }
      }
    }

    console.log(`\nMigration complete. ${count} new migration(s) applied.`);
  } finally {
    client.release();
    await pool.end();
  }
}

console.log('Running migrations...\n');
migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
