/**
 * FlightBoard integration tests
 *
 * Strategy: use the real Zustand store (reset before each test via setState)
 * rather than mocking it — this exercises the actual filter/sort logic and
 * gives realistic integration coverage. LiveClock is mocked to avoid
 * setInterval side-effects in the test environment.
 */
import React from 'react';
import { render, screen, within, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { FlightBoard } from '../FlightBoard';
import { useFlightsStore } from '@/store/flightsStore';
import type { Flight } from '@/types';

// ─── Mocks ───────────────────────────────────────────────────────────────────

jest.mock('../LiveClock', () => ({
  LiveClock: () => <span data-testid="live-clock">12:00:00</span>,
}));

// ─── Fixtures ────────────────────────────────────────────────────────────────

const FLIGHTS: Flight[] = [
  {
    id: '1',
    flightNumber: 'LO101',
    airline: 'LOT',
    destination: 'London',
    departureTime: '08:00',
    terminal: 'T1',
    gate: 'A1',
    status: 'On Time',
  },
  {
    id: '2',
    flightNumber: 'FR202',
    airline: 'Ryanair',
    destination: 'Paris',
    departureTime: '09:30',
    terminal: 'T2',
    gate: 'B2',
    status: 'Departed',
  },
  {
    id: '3',
    flightNumber: 'W6303',
    airline: 'Wizz Air',
    destination: 'Berlin',
    departureTime: '11:00',
    terminal: 'T1',
    gate: 'C3',
    status: 'Delayed',
    delayMinutes: 30,
  },
  {
    id: '4',
    flightNumber: 'LH404',
    airline: 'Lufthansa',
    destination: 'Frankfurt',
    departureTime: '14:45',
    terminal: 'T2',
    gate: 'D4',
    status: 'Cancelled',
  },
  {
    id: '5',
    flightNumber: 'KL505',
    airline: 'KLM',
    destination: 'Amsterdam',
    departureTime: '16:20',
    terminal: 'T1',
    gate: 'E5',
    status: 'Boarding',
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Reset the Zustand store to a clean initial state before every test. */
beforeEach(() => {
  useFlightsStore.setState({
    flights: [],
    filters: { terminal: 'All', airline: 'All', status: 'All', destination: '' },
    sort: { field: null, direction: 'asc' },
  });
});

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('FlightBoard', () => {
  // ── List rendering ─────────────────────────────────────────────────────────

  describe('list rendering', () => {
    it('renders the brand header', () => {
      render(<FlightBoard initialFlights={FLIGHTS} />);
      expect(screen.getByText('RunwayBriefing')).toBeInTheDocument();
      expect(screen.getByText('Flight Information Display')).toBeInTheDocument();
    });

    it('renders flight numbers for all flights', () => {
      render(<FlightBoard initialFlights={FLIGHTS} />);
      expect(screen.getByText('LO101')).toBeInTheDocument();
      expect(screen.getByText('FR202')).toBeInTheDocument();
      expect(screen.getByText('W6303')).toBeInTheDocument();
      expect(screen.getByText('LH404')).toBeInTheDocument();
      expect(screen.getByText('KL505')).toBeInTheDocument();
    });

    it('renders destination for each flight', () => {
      render(<FlightBoard initialFlights={FLIGHTS} />);
      expect(screen.getByText('London')).toBeInTheDocument();
      expect(screen.getByText('Paris')).toBeInTheDocument();
      expect(screen.getByText('Berlin')).toBeInTheDocument();
      expect(screen.getByText('Frankfurt')).toBeInTheDocument();
      expect(screen.getByText('Amsterdam')).toBeInTheDocument();
    });

    it('renders status badges for each flight', () => {
      render(<FlightBoard initialFlights={FLIGHTS} />);
      // Each status string appears in both the filter <select> option and the
      // rendered badge, so we use getAllByText and assert at least 2 matches.
      expect(screen.getAllByText('On Time').length).toBeGreaterThanOrEqual(2);
      expect(screen.getAllByText('Departed').length).toBeGreaterThanOrEqual(2);
      expect(screen.getAllByText('Delayed').length).toBeGreaterThanOrEqual(2);
      expect(screen.getAllByText('Cancelled').length).toBeGreaterThanOrEqual(2);
      expect(screen.getAllByText('Boarding').length).toBeGreaterThanOrEqual(2);
    });

    it('renders gate information for each flight', () => {
      render(<FlightBoard initialFlights={FLIGHTS} />);
      expect(screen.getByText('A1')).toBeInTheDocument();
      expect(screen.getByText('B2')).toBeInTheDocument();
      expect(screen.getByText('C3')).toBeInTheDocument();
      expect(screen.getByText('D4')).toBeInTheDocument();
      expect(screen.getByText('E5')).toBeInTheDocument();
    });

    it('renders departure times', () => {
      render(<FlightBoard initialFlights={FLIGHTS} />);
      expect(screen.getByText('08:00')).toBeInTheDocument();
      expect(screen.getByText('09:30')).toBeInTheDocument();
    });

    it('shows delay minutes for delayed flights', () => {
      render(<FlightBoard initialFlights={FLIGHTS} />);
      expect(screen.getByText('+30m')).toBeInTheDocument();
    });

    it('shows the correct flight count in the filter bar', () => {
      render(<FlightBoard initialFlights={FLIGHTS} />);
      expect(screen.getByText('5 flights')).toBeInTheDocument();
    });

    it('uses singular "flight" when exactly one flight is displayed', () => {
      render(<FlightBoard initialFlights={[FLIGHTS[0]!]} />);
      expect(screen.getByText('1 flight')).toBeInTheDocument();
    });

    it('renders column headers', () => {
      render(<FlightBoard initialFlights={FLIGHTS} />);
      expect(screen.getByText('Flight')).toBeInTheDocument();
      expect(screen.getByText('Airline')).toBeInTheDocument();
      expect(screen.getByText('Destination')).toBeInTheDocument();
      expect(screen.getByText('Gate')).toBeInTheDocument();
    });

    it('renders sort buttons for Time, Terminal, and Status', () => {
      render(<FlightBoard initialFlights={FLIGHTS} />);
      expect(screen.getByRole('button', { name: /time/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /term\./i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /status/i })).toBeInTheDocument();
    });

    it('renders the admin panel link pointing to /admin', () => {
      render(<FlightBoard initialFlights={FLIGHTS} />);
      const link = screen.getByRole('link', { name: /admin panel/i });
      expect(link).toHaveAttribute('href', '/admin');
    });
  });

  // ── Empty state ────────────────────────────────────────────────────────────

  describe('empty state', () => {
    it('shows an empty-state message when no flights are provided', () => {
      render(<FlightBoard initialFlights={[]} />);
      expect(
        screen.getByText('No flights match the current filters.')
      ).toBeInTheDocument();
    });

    it('shows 0 flights in the counter when no flights are provided', () => {
      render(<FlightBoard initialFlights={[]} />);
      expect(screen.getByText('0 flights')).toBeInTheDocument();
    });

    it('shows an empty-state message when active filters match nothing', async () => {
      const user = userEvent.setup();
      render(<FlightBoard initialFlights={FLIGHTS} />);

      await user.type(screen.getByPlaceholderText('Destination…'), 'Tokyo');

      expect(
        screen.getByText('No flights match the current filters.')
      ).toBeInTheDocument();
    });

    it('shows 0 flights count when filters produce no results', async () => {
      const user = userEvent.setup();
      render(<FlightBoard initialFlights={FLIGHTS} />);

      await user.type(screen.getByPlaceholderText('Destination…'), 'Tokyo');

      expect(screen.getByText('0 flights')).toBeInTheDocument();
    });
  });

  // ── Status filter ──────────────────────────────────────────────────────────

  describe('status filter', () => {
    it('shows only departed flights when "Departed" is selected', async () => {
      const user = userEvent.setup();
      render(<FlightBoard initialFlights={FLIGHTS} />);

      await user.selectOptions(screen.getByDisplayValue('All Statuses'), 'Departed');

      expect(screen.getByText('FR202')).toBeInTheDocument();
      expect(screen.queryByText('LO101')).not.toBeInTheDocument();
      expect(screen.queryByText('W6303')).not.toBeInTheDocument();
      expect(screen.queryByText('LH404')).not.toBeInTheDocument();
      expect(screen.queryByText('KL505')).not.toBeInTheDocument();
    });

    it('shows only delayed flights when "Delayed" is selected', async () => {
      const user = userEvent.setup();
      render(<FlightBoard initialFlights={FLIGHTS} />);

      await user.selectOptions(screen.getByDisplayValue('All Statuses'), 'Delayed');

      expect(screen.getByText('W6303')).toBeInTheDocument();
      expect(screen.queryByText('LO101')).not.toBeInTheDocument();
      expect(screen.queryByText('FR202')).not.toBeInTheDocument();
    });

    it('shows only cancelled flights when "Cancelled" is selected', async () => {
      const user = userEvent.setup();
      render(<FlightBoard initialFlights={FLIGHTS} />);

      await user.selectOptions(screen.getByDisplayValue('All Statuses'), 'Cancelled');

      expect(screen.getByText('LH404')).toBeInTheDocument();
      expect(screen.getByText('1 flight')).toBeInTheDocument();
    });

    it('shows only boarding flights when "Boarding" is selected', async () => {
      const user = userEvent.setup();
      render(<FlightBoard initialFlights={FLIGHTS} />);

      await user.selectOptions(screen.getByDisplayValue('All Statuses'), 'Boarding');

      expect(screen.getByText('KL505')).toBeInTheDocument();
      expect(screen.queryByText('LO101')).not.toBeInTheDocument();
    });

    it('shows only on-time flights when "On Time" is selected', async () => {
      const user = userEvent.setup();
      render(<FlightBoard initialFlights={FLIGHTS} />);

      await user.selectOptions(screen.getByDisplayValue('All Statuses'), 'On Time');

      expect(screen.getByText('LO101')).toBeInTheDocument();
      expect(screen.queryByText('FR202')).not.toBeInTheDocument();
    });

    it('restores all flights when filter is reset to "All Statuses"', async () => {
      const user = userEvent.setup();
      render(<FlightBoard initialFlights={FLIGHTS} />);

      const statusSelect = screen.getByDisplayValue('All Statuses');
      await user.selectOptions(statusSelect, 'Departed');
      await user.selectOptions(statusSelect, 'All');

      expect(screen.getByText('5 flights')).toBeInTheDocument();
    });
  });

  // ── Terminal filter ────────────────────────────────────────────────────────

  describe('terminal filter', () => {
    it('shows only T1 flights when Terminal 1 is selected', async () => {
      const user = userEvent.setup();
      render(<FlightBoard initialFlights={FLIGHTS} />);

      await user.selectOptions(screen.getByDisplayValue('All Terminals'), 'T1');

      // T1 flights: LO101, W6303, KL505
      expect(screen.getByText('LO101')).toBeInTheDocument();
      expect(screen.getByText('W6303')).toBeInTheDocument();
      expect(screen.getByText('KL505')).toBeInTheDocument();
      // T2 flights: FR202, LH404
      expect(screen.queryByText('FR202')).not.toBeInTheDocument();
      expect(screen.queryByText('LH404')).not.toBeInTheDocument();
    });

    it('shows only T2 flights when Terminal 2 is selected', async () => {
      const user = userEvent.setup();
      render(<FlightBoard initialFlights={FLIGHTS} />);

      await user.selectOptions(screen.getByDisplayValue('All Terminals'), 'T2');

      expect(screen.getByText('FR202')).toBeInTheDocument();
      expect(screen.getByText('LH404')).toBeInTheDocument();
      expect(screen.queryByText('LO101')).not.toBeInTheDocument();
      expect(screen.queryByText('W6303')).not.toBeInTheDocument();
      expect(screen.queryByText('KL505')).not.toBeInTheDocument();
    });

    it('shows the correct flight count after a terminal filter', async () => {
      const user = userEvent.setup();
      render(<FlightBoard initialFlights={FLIGHTS} />);

      await user.selectOptions(screen.getByDisplayValue('All Terminals'), 'T1');

      expect(screen.getByText('3 flights')).toBeInTheDocument();
    });

    it('restores all flights when terminal filter is reset to "All Terminals"', async () => {
      const user = userEvent.setup();
      render(<FlightBoard initialFlights={FLIGHTS} />);

      const termSelect = screen.getByDisplayValue('All Terminals');
      await user.selectOptions(termSelect, 'T1');
      await user.selectOptions(termSelect, 'All');

      expect(screen.getByText('5 flights')).toBeInTheDocument();
    });
  });

  // ── Destination filter ─────────────────────────────────────────────────────

  describe('destination filter', () => {
    it('filters flights by a partial destination match', async () => {
      const user = userEvent.setup();
      render(<FlightBoard initialFlights={FLIGHTS} />);

      await user.type(screen.getByPlaceholderText('Destination…'), 'Lon');

      expect(screen.getByText('LO101')).toBeInTheDocument(); // London
      expect(screen.queryByText('FR202')).not.toBeInTheDocument();
    });

    it('destination search is case-insensitive', async () => {
      const user = userEvent.setup();
      render(<FlightBoard initialFlights={FLIGHTS} />);

      await user.type(screen.getByPlaceholderText('Destination…'), 'PARIS');

      expect(screen.getByText('FR202')).toBeInTheDocument();
      expect(screen.queryByText('LO101')).not.toBeInTheDocument();
    });

    it('shows empty state when destination matches nothing', async () => {
      const user = userEvent.setup();
      render(<FlightBoard initialFlights={FLIGHTS} />);

      await user.type(screen.getByPlaceholderText('Destination…'), 'Reykjavik');

      expect(
        screen.getByText('No flights match the current filters.')
      ).toBeInTheDocument();
    });
  });

  // ── Airline filter ─────────────────────────────────────────────────────────

  describe('airline filter', () => {
    it('shows only flights for a selected airline', async () => {
      const user = userEvent.setup();
      render(<FlightBoard initialFlights={FLIGHTS} />);

      await user.selectOptions(screen.getByDisplayValue('All Airlines'), 'Ryanair');

      expect(screen.getByText('FR202')).toBeInTheDocument();
      expect(screen.queryByText('LO101')).not.toBeInTheDocument();
      expect(screen.getByText('1 flight')).toBeInTheDocument();
    });
  });

  // ── Combined filters ───────────────────────────────────────────────────────

  describe('combined filters', () => {
    it('combining terminal and status filters narrows results correctly', async () => {
      const user = userEvent.setup();
      render(<FlightBoard initialFlights={FLIGHTS} />);

      await user.selectOptions(screen.getByDisplayValue('All Terminals'), 'T1');
      await user.selectOptions(screen.getByDisplayValue('All Statuses'), 'Delayed');

      // Only W6303 is T1 + Delayed
      expect(screen.getByText('W6303')).toBeInTheDocument();
      expect(screen.queryByText('LO101')).not.toBeInTheDocument();
      expect(screen.queryByText('KL505')).not.toBeInTheDocument();
    });

    it('returns empty state when combined filters match nothing', async () => {
      const user = userEvent.setup();
      render(<FlightBoard initialFlights={FLIGHTS} />);

      await user.selectOptions(screen.getByDisplayValue('All Terminals'), 'T2');
      await user.selectOptions(screen.getByDisplayValue('All Statuses'), 'Boarding');

      expect(
        screen.getByText('No flights match the current filters.')
      ).toBeInTheDocument();
    });
  });

  // ── Sorting ────────────────────────────────────────────────────────────────

  describe('sorting', () => {
    it('sorts flights by departure time ascending on first click', async () => {
      const user = userEvent.setup();
      render(<FlightBoard initialFlights={FLIGHTS} />);

      await user.click(screen.getByRole('button', { name: /time/i }));

      // Grab all rendered flight numbers in DOM order
      const numbers = screen
        .getAllByText(/^(LO101|FR202|W6303|LH404|KL505)$/)
        .map((el) => el.textContent);

      expect(numbers).toEqual(['LO101', 'FR202', 'W6303', 'LH404', 'KL505']);
    });

    it('reverses departure time order on a second click (descending)', async () => {
      const user = userEvent.setup();
      render(<FlightBoard initialFlights={FLIGHTS} />);

      // Prime the store so the next click will toggle to descending;
      // wrap in act() so React flushes the resulting re-render first.
      await act(async () => {
        useFlightsStore.setState({ sort: { field: 'departureTime', direction: 'asc' } });
      });

      await user.click(screen.getByRole('button', { name: /time/i }));

      const numbers = screen
        .getAllByText(/^(LO101|FR202|W6303|LH404|KL505)$/)
        .map((el) => el.textContent);

      expect(numbers).toEqual(['KL505', 'LH404', 'W6303', 'FR202', 'LO101']);
    });

    it('sorts flights by status priority on status sort click', async () => {
      const user = userEvent.setup();
      render(<FlightBoard initialFlights={FLIGHTS} />);

      await user.click(screen.getByRole('button', { name: /status/i }));

      const numbers = screen
        .getAllByText(/^(LO101|FR202|W6303|LH404|KL505)$/)
        .map((el) => el.textContent);

      // Priority: Boarding(1) > On Time(2) > Delayed(3) > Departed(4) > Cancelled(5)
      expect(numbers).toEqual(['KL505', 'LO101', 'W6303', 'FR202', 'LH404']);
    });
  });
});
