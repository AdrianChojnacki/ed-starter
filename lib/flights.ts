import pool from './db';
import type { Flight } from '@/types';

function computeFlightStatus(flight: Flight): Flight {
  if (flight.status === 'Cancelled') return flight;

  const now = new Date();
  const [h, m] = flight.departureTime.split(':').map(Number);
  const depMinutes = h * 60 + m + (flight.delayMinutes ?? 0);
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  let status: Flight['status'];
  if (nowMinutes > depMinutes + 10) {
    status = 'Departed';
  } else if (nowMinutes >= depMinutes - 25) {
    status = 'Boarding';
  } else if (flight.delayMinutes) {
    status = 'Delayed';
  } else {
    status = 'On Time';
  }

  return { ...flight, status };
}

function rowToFlight(row: any): Flight {
  return {
    id: row.id,
    flightNumber: row.flight_number,
    airline: row.airline,
    destination: row.destination,
    departureTime: row.departure_time,
    terminal: row.terminal,
    gate: row.gate,
    status: row.status,
    delayMinutes: row.delay_minutes,
  };
}

export async function readFlights(): Promise<Flight[]> {
  console.log('[DB] Reading flights from PostgreSQL...');
  const { rows } = await pool.query('SELECT * FROM flights ORDER BY departure_time');
  console.log(`[DB] Fetched ${rows.length} flights from PostgreSQL`);
  return rows.map(rowToFlight).map(computeFlightStatus);
}

export async function writeFlights(flights: Flight[]): Promise<void> {
  console.log(`[DB] Writing ${flights.length} flights to PostgreSQL...`);
  const client = await pool.connect();
  try {
    await client.query('DELETE FROM flights');
    for (const f of flights) {
      await client.query(
        `INSERT INTO flights (id, flight_number, airline, destination, departure_time, terminal, gate, status, delay_minutes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [f.id, f.flightNumber, f.airline, f.destination, f.departureTime, f.terminal, f.gate, f.status, f.delayMinutes ?? 0]
      );
    }
  } finally {
    client.release();
  }
}

export async function resetToSeed(): Promise<Flight[]> {
  const fs = await import('fs');
  const path = await import('path');
  const raw = fs.readFileSync(
    path.join(process.cwd(), 'data', 'flights.seed.json'),
    'utf-8'
  );
  const seed = JSON.parse(raw) as Flight[];
  await writeFlights(seed);
  return seed.map(computeFlightStatus);
}