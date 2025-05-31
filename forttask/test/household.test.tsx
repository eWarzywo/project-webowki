import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import HouseholdPage, { AddHousehold, JoinHousehold } from '../src/app/household/page';
import '@testing-library/jest-dom';

const mockPush = vi.fn();
const mockUpdate = vi.fn();

vi.mock('next/navigation', () => ({
    useRouter: () => ({
        push: mockPush,
        refresh: vi.fn(),
    }),
}));

vi.mock('next-auth/react', () => ({
    useSession: () => ({
        data: {
            user: {
                id: '1',
                name: 'Test User',
                email: 'test@example.com',
            },
        },
        status: 'authenticated',
        update: mockUpdate,
    }),
}));

vi.mock('../../components/generalUI/logoutButton', () => ({
    default: () => <button>Logout</button>,
}));

global.fetch = vi.fn();

describe('Household Page Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (global.fetch as jest.Mock).mockResolvedValue({
            ok: true,
            json: async () => ({ household: { id: '123' } }),
        });
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('should render household management page with both sections', () => {
        render(<HouseholdPage />);

        expect(screen.getByText('Household Management')).toBeInTheDocument();
        expect(screen.getByText('Create a new household or join an existing one')).toBeInTheDocument();

        expect(screen.getAllByText('Create Household')[0]).toBeInTheDocument();
        expect(
            screen.getByText('You will become an owner of new household with full administrative privileges.'),
        ).toBeInTheDocument();

        expect(screen.getAllByText('Join Household')[0]).toBeInTheDocument();
        expect(screen.getByText(/You are required to have a join code/)).toBeInTheDocument();

        expect(screen.getAllByText('Create Household')[1]).toBeInTheDocument();
        expect(screen.getAllByText('Join Household')[1]).toBeInTheDocument();

        expect(screen.getByText('Logout')).toBeInTheDocument();
    });
});

describe('AddHousehold Component Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (global.fetch as jest.Mock).mockResolvedValue({
            ok: true,
            json: async () => ({ household: { id: '123' } }),
        });
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('should render the create household form', () => {
        render(<AddHousehold />);
        expect(screen.getByPlaceholderText('Enter household name')).toBeInTheDocument();
        expect(screen.getByText('Create Household')).toBeInTheDocument();
    });

    it('should show validation error when submitting empty form', async () => {
        render(<AddHousehold />);

        const createButton = screen.getByText('Create Household');
        fireEvent.click(createButton);

        expect(screen.getByText('Please enter a household name')).toBeInTheDocument();
    });

    it('should show validation error when household name is too short', async () => {
        render(<AddHousehold />);

        const nameInput = screen.getByPlaceholderText('Enter household name');
        const createButton = screen.getByText('Create Household');

        fireEvent.change(nameInput, { target: { value: 'AB' } });
        fireEvent.click(createButton);

        expect(screen.getByText('Household name must be at least 3 characters long')).toBeInTheDocument();
    });

    it('should call API with household name and redirect on success', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ household: { id: '123' } }),
        });

        const mockSessionData = {
            user: {
                id: '1',
                name: 'Test User',
                email: 'test@example.com',
            },
        };

        mockUpdate.mockResolvedValue(undefined);

        vi.useFakeTimers();

        const { getByPlaceholderText, getByText } = render(<AddHousehold />);

        const nameInput = getByPlaceholderText('Enter household name');
        const createButton = getByText('Create Household');

        await act(async () => {
            fireEvent.change(nameInput, { target: { value: 'Test Household' } });
        });

        await act(async () => {
            fireEvent.click(createButton);

            await Promise.resolve();
            await Promise.resolve();
        });

        expect(global.fetch).toHaveBeenCalledWith(
            '/api/household/create',
            expect.objectContaining({
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ householdName: 'Test Household' }),
            }),
        );

        expect(mockUpdate).toHaveBeenCalledWith({
            ...mockSessionData,
            householdId: '123',
        });

        expect(screen.getByText('Household created successfully! Redirecting...')).toBeInTheDocument();

        await act(async () => {
            vi.advanceTimersByTime(1500);
            await Promise.resolve();
        });

        expect(mockPush).toHaveBeenCalledWith('/');
    });

    it('should show error message when create household request fails', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: false,
            json: async () => ({ message: 'Failed to create household' }),
        });

        vi.useFakeTimers();

        const { getByPlaceholderText, getByText } = render(<AddHousehold />);

        const nameInput = getByPlaceholderText('Enter household name');
        const createButton = getByText('Create Household');

        await act(async () => {
            fireEvent.change(nameInput, { target: { value: 'Test Household' } });
        });

        await act(async () => {
            fireEvent.click(createButton);

            await Promise.resolve();
            await Promise.resolve();
        });

        expect(screen.getByText('Failed to create household')).toBeInTheDocument();
    });
});

describe('JoinHousehold Component Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (global.fetch as jest.Mock).mockResolvedValue({
            ok: true,
            json: async () => ({ household: { id: '123' } }),
        });
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('should render the join household form', () => {
        render(<JoinHousehold />);
        expect(screen.getByPlaceholderText('Enter join code')).toBeInTheDocument();
        expect(screen.getByText('Join Household')).toBeInTheDocument();
    });

    it('should show validation error when submitting empty join code', async () => {
        render(<JoinHousehold />);

        const joinButton = screen.getByText('Join Household');
        fireEvent.click(joinButton);

        expect(screen.getByText('Please enter a join code')).toBeInTheDocument();
    });

    it('should call API with join code and redirect on success', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ household: { id: '123' } }),
        });

        const mockSessionData = {
            user: {
                id: '1',
                name: 'Test User',
                email: 'test@example.com',
            },
        };

        mockUpdate.mockResolvedValue(undefined);

        vi.useFakeTimers();

        const { getByPlaceholderText, getByText } = render(<JoinHousehold />);

        const codeInput = getByPlaceholderText('Enter join code');
        const joinButton = getByText('Join Household');

        await act(async () => {
            fireEvent.change(codeInput, { target: { value: 'ABC123' } });
        });

        await act(async () => {
            fireEvent.click(joinButton);

            await Promise.resolve();
            await Promise.resolve();
        });

        expect(global.fetch).toHaveBeenCalledWith(
            '/api/household/join',
            expect.objectContaining({
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ joinCode: 'ABC123' }),
            }),
        );

        expect(mockUpdate).toHaveBeenCalledWith({
            ...mockSessionData,
            householdId: '123',
        });

        expect(screen.getByText('Successfully joined household! Redirecting...')).toBeInTheDocument();

        await act(async () => {
            vi.advanceTimersByTime(1500);
            await Promise.resolve();
        });

        expect(mockPush).toHaveBeenCalledWith('/');
    });

    it('should convert join code to uppercase', async () => {
        render(<JoinHousehold />);

        const codeInput = screen.getByPlaceholderText('Enter join code');
        fireEvent.change(codeInput, { target: { value: 'abc123' } });

        expect(codeInput).toHaveValue('ABC123');
    });

    it('should show error message when join request fails', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: false,
            json: async () => ({ message: 'Invalid join code' }),
        });

        vi.useFakeTimers();

        const { getByPlaceholderText, getByText } = render(<JoinHousehold />);

        const codeInput = getByPlaceholderText('Enter join code');
        const joinButton = getByText('Join Household');

        await act(async () => {
            fireEvent.change(codeInput, { target: { value: 'INVALID' } });
        });

        await act(async () => {
            fireEvent.click(joinButton);

            await Promise.resolve();
            await Promise.resolve();
        });

        expect(screen.getByText('Invalid join code')).toBeInTheDocument();
    });
});
