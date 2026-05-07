import { create } from 'zustand';
import type { Flight, FlightStatus, Terminal } from '@/types';

export type SortField = 'departureTime' | 'status' | 'terminal';
export type SortDirection = 'asc' | 'desc';

interface SortState {
  field: SortField | null;
  direction: SortDirection;
}

interface FiltersState {
  terminal: Terminal | 'All';
  airline: string;
  status: FlightStatus | 'All';
  destination: string;
}

interface FlightsStore {
  flights: Flight[];
  filters: FiltersState;
  sort: SortState;
  setFlights: (flights: Flight[]) => void;
  setFilter: <K extends keyof FiltersState>(key: K, value: FiltersState[K]) => void;
  setSort: (field: SortField) => void;
  updateFlight: (id: string, updates: Partial<Flight>) => void;
  addFlight: (flight: Flight) => void;
  removeFlight: (id: string) => void;
  resetFlights: (flights: Flight[]) => void;
}

export const useFlightsStore = create<FlightsStore>((set) => ({
  flights: [],
  filters: {
    terminal: 'All',
    airline: 'All',
    status: 'All',
    destination: '',
  },
  sort: {
    field: null,
    direction: 'asc',
  },

  setFlights: (flights) => set({ flights: Array.isArray(flights) ? flights : [] }),

  setFilter: (key, value) =>
    set((state) => ({
      filters: { ...state.filters, [key]: value },
    })),

  setSort: (field) =>
    set((state) => ({
      sort: {
        field,
        direction: state.sort.field === field && state.sort.direction === 'asc' ? 'desc' : 'asc',
      },
    })),

  updateFlight: (id, updates) =>
    set((state) => ({
      flights: state.flights.map((f) => (f.id === id ? { ...f, ...updates } : f)),
    })),

  addFlight: (flight) => set((state) => ({ flights: [...state.flights, flight] })),

  removeFlight: (id) =>
    set((state) => ({ flights: state.flights.filter((f) => f.id !== id) })),

  resetFlights: (flights) => set({ flights: Array.isArray(flights) ? flights : [] }),
}));

const STATUS_PRIORITY: Record<FlightStatus, number> = {
  Boarding: 1,
  'On Time': 2,
  Delayed: 3,
  Departed: 4,
  Cancelled: 5,
};

export function selectFilteredFlights(state: FlightsStore): Flight[] {
  const { flights, filters, sort } = state;

  const safeFlights = Array.isArray(flights) ? flights : [];
  const filtered = safeFlights.filter((f) => {
    if (filters.terminal !== 'All' && f.terminal !== filters.terminal) return false;
    if (filters.airline !== 'All' && f.airline !== filters.airline) return false;
    if (filters.status !== 'All' && f.status !== filters.status) return false;
    if (filters.destination !== '' && !f.destination.toLowerCase().includes(filters.destination.toLowerCase())) return false;
    return true;
  });

  if (!sort.field) return filtered;

  const dir = sort.direction === 'asc' ? 1 : -1;

  return [...filtered].sort((a, b) => {
    switch (sort.field) {
      case 'departureTime':
        return a.departureTime.localeCompare(b.departureTime) * dir;
      case 'terminal':
        return a.terminal.localeCompare(b.terminal) * dir;
      case 'status':
        return (STATUS_PRIORITY[a.status] - STATUS_PRIORITY[b.status]) * dir;
      default:
        return 0;
    }
  });
}
