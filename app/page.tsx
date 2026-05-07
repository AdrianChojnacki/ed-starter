import { FlightBoard } from '@/components/fids/FlightBoard';
import { readFlights } from '@/lib/flights';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const flights = await readFlights();
  return <FlightBoard initialFlights={flights} />;
}
