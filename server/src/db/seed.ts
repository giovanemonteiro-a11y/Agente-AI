import dotenv from 'dotenv';
dotenv.config({ path: require('path').resolve(__dirname, '../../../.env') });

import { pool } from '../config/database';
import fs from 'fs';
import path from 'path';

const SEEDS_DIR = path.join(__dirname, 'seeds');

async function seed() {
  const client = await pool.connect();
  try {
    const files = fs.readdirSync(SEEDS_DIR)
      .filter((f) => f.endsWith('.sql'))
      .sort();

    for (const file of files) {
      const sql = fs.readFileSync(path.join(SEEDS_DIR, file), 'utf-8');
      console.log(`  → Seeding ${file}...`);

      try {
        await client.query(sql);
        console.log(`  ✓ ${file} applied`);
      } catch (err) {
        console.error(`  ✗ ${file} FAILED:`, (err as Error).message);
        throw err;
      }
    }

    console.log('\nSeeding complete.');
  } finally {
    client.release();
    await pool.end();
  }
}

console.log('Running seeds...\n');
seed().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
