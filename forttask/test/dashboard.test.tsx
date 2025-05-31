import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import Dashboard from '../src/app/(app)/page';
import '@testing-library/jest-dom';
import type { Mock } from 'vitest';

interface MockSocketReturn {
    isConnected: boolean;
    eventsRefresh: boolean;
    shoppingRefresh: boolean;
    billsRefresh: boolean;
    choresRefresh: boolean;
    joinHousehold: (id: string) => void;
    leaveHousehold: (id: string) => void;
}

interface CardProps {
    title: string;
    subtitle: string;
    dataType: string;
    selectedDate?: Date;
    refresh?: boolean;
}

interface CalendarProps {
    onChange: (date: Date) => void;
    initialDate?: Date;
}

const mockJoinHousehold: Mock = vi.fn();
const mockLeaveHousehold: Mock = vi.fn();

vi.mock('@/lib/socket', () => ({
    useSocket: (): MockSocketReturn => ({
        isConnected: true,
        eventsRefresh: false,
        shoppingRefresh: false,
        billsRefresh: false,
        choresRefresh: false,
        joinHousehold: mockJoinHousehold,
        leaveHousehold: mockLeaveHousehold,
    }),
}));

vi.mock('@/components/generalUI/card', () => ({
    Card: ({ title, subtitle, dataType }: CardProps) => (
        <div data-testid={`card-${dataType}`}>
            <h2>{title}</h2>
            <p>{subtitle}</p>
        </div>
    ),
    DataType: {
        events: 'events',
        chores: 'chores',
        shopping: 'shopping',
        bills: 'bills',
    },
}));

vi.mock('@/components/generalUI/calendar', () => ({
    default: ({ onChange }: CalendarProps) => (
        <div data-testid="calendar">
            Calendar Component
            <button onClick={() => onChange(new Date('2025-06-15'))}>Change Date</button>
        </div>
    ),
}));

global.fetch = vi.fn();

describe('Dashboard Page Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (global.fetch as Mock).mockResolvedValue({
            ok: true,
            json: async () => ({ householdId: 1 }),
        } as Response);
    });

    it('should render dashboard with all cards and calendar', async () => {
        render(<Dashboard />);

        await waitFor(() => {
            expect(screen.getByText('Dashboard')).toBeInTheDocument();
        });

        expect(screen.getByText('Upcoming events')).toBeInTheDocument();
        expect(screen.getByText("See what's happening in your household")).toBeInTheDocument();
        expect(screen.getByText('Chores')).toBeInTheDocument();
        expect(screen.getByText('Tasks that need to be done')).toBeInTheDocument();
        expect(screen.getByText('Upcoming bills')).toBeInTheDocument();
        expect(screen.getByText('Track household expenses and payments')).toBeInTheDocument();
        expect(screen.getByText('Shopping list')).toBeInTheDocument();
        expect(screen.getByText('Items that need to be purchased')).toBeInTheDocument();
        expect(screen.getByTestId('calendar')).toBeInTheDocument();
        expect(screen.getByText('Calendar Component')).toBeInTheDocument();
    });

    it('should fetch household ID on mount', async () => {
        render(<Dashboard />);

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith('/api/user/get');
        });
    });

    it('should join household socket room when connected', async () => {
        render(<Dashboard />);

        await waitFor(() => {
            expect(mockJoinHousehold).toHaveBeenCalledWith('1');
        });
    });

    it('should leave household socket room on unmount', async () => {
        const { unmount } = render(<Dashboard />);

        await waitFor(() => {
            expect(mockJoinHousehold).toHaveBeenCalledWith('1');
        });

        unmount();

        expect(mockLeaveHousehold).toHaveBeenCalledWith('1');
    });

    it('should handle date change in calendar', async () => {
        render(<Dashboard />);

        await waitFor(() => {
            expect(screen.getByTestId('calendar')).toBeInTheDocument();
        });

        const changeDateButton = screen.getByText('Change Date');
        fireEvent.click(changeDateButton);

        await waitFor(() => {
            expect(screen.getByTestId('card-events')).toBeInTheDocument();
            expect(screen.getByTestId('card-chores')).toBeInTheDocument();
            expect(screen.getByTestId('card-bills')).toBeInTheDocument();
            expect(screen.getByTestId('card-shopping')).toBeInTheDocument();
        });
    });

    it('should handle error when fetching household ID fails', async () => {
        console.error = vi.fn();

        (global.fetch as Mock).mockRejectedValueOnce(new Error('Failed to fetch household ID'));

        render(<Dashboard />);

        await waitFor(() => {
            expect(console.error).toHaveBeenCalledWith('Error fetching household ID:', expect.any(Error));
        });
    });

    it('should handle non-OK response when fetching household ID', async () => {
        console.error = vi.fn();

        (global.fetch as Mock).mockResolvedValueOnce({
            ok: false,
            status: 404,
        } as Response);

        render(<Dashboard />);

        await waitFor(() => {
            expect(console.error).toHaveBeenCalledWith(
                expect.stringContaining('Failed to fetch household ID, Status: 404'),
            );
        });
    });
});
