import { NextResponse } from 'next/server';
import { resetToSeed } from '@/lib/flights';

export async function POST() {
  const flights = await resetToSeed();
  return NextResponse.json(flights);
}
