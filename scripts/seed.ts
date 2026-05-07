import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import type { Flight } from '../types';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function seed() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS flights (
        id TEXT PRIMARY KEY,
        flight_number TEXT NOT NULL,
        airline TEXT NOT NULL,
        destination TEXT NOT NULL,
        departure_time TEXT NOT NULL,
        terminal TEXT NOT NULL,
        gate TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'On Time',
        delay_minutes INTEGER DEFAULT 0
      );
    `);

    const raw = fs.readFileSync(
      path.join(process.cwd(), 'data', 'flights.seed.json'),
      'utf-8'
    );
    const flights = JSON.parse(raw) as Flight[];

    await client.query('DELETE FROM flights');

    for (const f of flights) {
      await client.query(
        `INSERT INTO flights (id, flight_number, airline, destination, departure_time, terminal, gate, status, delay_minutes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [f.id, f.flightNumber, f.airline, f.destination, f.departureTime, f.terminal, f.gate, f.status, f.delayMinutes ?? 0]
      );
    }

    console.log(`Seeded ${flights.length} flights.`);
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch(console.error);