import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import Events from '../src/app/(app)/events/page';
import EventAddForm from '../src/components/events/eventAddForm';
import EventList from '../src/components/events/eventList';
import EventCard from '../src/components/events/eventCard';
import EventDatePicker from '../src/components/events/eventDatePicker';
import '@testing-library/jest-dom';

const mockGet = vi.fn().mockImplementation((param) => {
    if (param === 'page') return '1';
    if (param === 'size') return '10';
    return null;
});

vi.mock('next/navigation', () => ({
    useRouter: () => ({
        push: vi.fn(),
        refresh: vi.fn(),
    }),
    useSearchParams: () => ({
        get: mockGet,
        getAll: vi.fn(),
        has: vi.fn(),
        forEach: vi.fn(),
        entries: vi.fn(),
        keys: vi.fn(),
        values: vi.fn(),
        toString: vi.fn(),
    }),
}));

vi.mock('next-auth/react', () => ({
    useSession: () => ({
        data: { user: { id: '1', householdId: '1' } },
        status: 'authenticated',
        update: vi.fn(),
    }),
}));

vi.mock('@/lib/socket', () => ({
    useSocket: () => ({
        isConnected: true,
        eventsRefresh: false,
        emitUpdate: vi.fn(),
        joinHousehold: vi.fn(),
        leaveHousehold: vi.fn(),
    }),
}));

const mockEvents = [
    {
        id: 1,
        name: 'Test Event',
        description: 'This is a test event',
        date: new Date('2023-10-01'),
        location: 'Test Location',
        attendees: [{ userId: 1, eventId: 1, user: { id: 1, username: 'testuser' } }],
        createdById: 1,
        cycle: 0,
        householdId: 1,
    },
    {
        id: 2,
        name: 'Another Event',
        description: 'Another test event',
        date: new Date('2023-10-02'),
        location: 'Another Location',
        attendees: [],
        createdById: 1,
        cycle: 0,
        householdId: 1,
    },
];

const mockHouseholdMembers = [
    {
        id: 1,
        username: 'testuser',
        householdId: 1,
    },
    {
        id: 2,
        username: 'anotheruser',
        householdId: 1,
    },
];

const createMockFetch = (options = {}) => {
    const defaultResponses = {
        userResponse: { householdId: 1 },
        eventsResponse: { events: mockEvents, count: mockEvents.length },
        householdMembersResponse: mockHouseholdMembers,
        createEventResponse: { message: 'Default message' },
        deleteEventResponse: { message: 'Default message' },
    };

    const responses = { ...defaultResponses, ...options };

    return vi.fn().mockImplementation((input: RequestInfo | URL) => {
        const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;

        if (url.includes('/api/user/get')) {
            return Promise.resolve(new Response(JSON.stringify(responses.userResponse)));
        } else if (url.includes('/api/events/get')) {
            if ('error' in responses.eventsResponse) {
                return Promise.resolve(
                    new Response(JSON.stringify({ message: responses.eventsResponse.error }), { status: 500 }),
                );
            }
            return Promise.resolve(new Response(JSON.stringify(responses.eventsResponse)));
        } else if (url.includes('/api/household/users/get')) {
            return Promise.resolve(new Response(JSON.stringify(responses.householdMembersResponse)));
        } else if (url.includes('/api/event/create')) {
            return Promise.resolve(new Response(JSON.stringify(responses.createEventResponse)));
        } else if (url.includes('/api/event/delete')) {
            return Promise.resolve(new Response(JSON.stringify(responses.deleteEventResponse)));
        }
        return Promise.resolve(new Response(JSON.stringify({}), { status: 400 }));
    });
};

describe('Events Page Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        global.fetch = createMockFetch();
    });

    it('should show loading state initially', async () => {
        render(<Events />);
        expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });

    it('should fetch and display events', async () => {
        render(<Events />);
        await waitFor(() => expect(screen.queryByText(/event list/i)).toBeInTheDocument());
        expect(screen.getByText(/test event/i)).toBeInTheDocument();
        expect(screen.getByText(/another event/i)).toBeInTheDocument();
    });

    it('should show no events message when there are no events', async () => {
        global.fetch = createMockFetch({
            eventsResponse: { events: [], count: 0 },
        });

        render(<Events />);
        await waitFor(() => expect(screen.queryByText(/no events/i)).toBeInTheDocument());
    });

    it('should show error message when fetch fails', async () => {
        global.fetch = createMockFetch({
            eventsResponse: { error: 'Failed to fetch events' },
        });

        render(<Events />);
        await waitFor(() => expect(screen.queryByText(/error/i)).toBeInTheDocument());
    });

    it('should show event add form', async () => {
        render(<EventAddForm onRefresh={vi.fn()} emitUpdate={vi.fn()} />);
        expect(screen.getByText(/add event/i)).toBeInTheDocument();
    });

    it('should show event list', async () => {
        render(<EventList events={mockEvents} totalItems={mockEvents.length} />);
        expect(screen.getByText(/event list/i)).toBeInTheDocument();
        expect(screen.getByText(/test event/i)).toBeInTheDocument();
    });

    it('should show event card', async () => {
        render(<EventCard event={mockEvents[0]} emitUpdate={vi.fn()} />);
        expect(screen.getByText(/test event/i)).toBeInTheDocument();
        expect(screen.getByText(/october 1, 2023/i)).toBeInTheDocument();
    });

    it('should show event date picker', async () => {
        render(<EventDatePicker onChange={vi.fn()} />);
        expect(screen.getByText(/pick a date/i)).toBeInTheDocument();
    });

    it('should handle date change in event date picker', async () => {
        const handleChange = vi.fn();
        render(<EventDatePicker onChange={handleChange} />);

        expect(screen.getByText(/pick a date/i)).toBeInTheDocument();

        const today = new Date();
        const todayDay = today.getDate().toString();

        const dayElements = screen.getAllByText(todayDay);

        fireEvent.click(dayElements[0]);

        expect(handleChange).toHaveBeenCalled();
    });

    it('should handle event add form submission', async () => {
        const emitUpdate = vi.fn();
        render(<EventAddForm onRefresh={vi.fn()} emitUpdate={emitUpdate} />);

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith('/api/household/users/get');
        });

        vi.clearAllMocks();

        const nameInput = screen.getByPlaceholderText(/name of the event/i);
        const descriptionInput = screen.getByPlaceholderText(/enter event description/i);
        const locationInput = screen.getByPlaceholderText(/enter event location/i);
        const participantsSelect = screen.getByLabelText(/participants/i);

        fireEvent.change(nameInput, { target: { value: 'New Event' } });
        fireEvent.change(descriptionInput, { target: { value: 'New Event Description' } });
        fireEvent.change(locationInput, { target: { value: 'New Location' } });
        fireEvent.change(participantsSelect, { target: { value: '1' } });

        const submitButton = screen.getByDisplayValue(/add/i);
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith(
                '/api/event/create',
                expect.objectContaining({
                    method: 'POST',
                    headers: expect.objectContaining({
                        'Content-Type': 'application/json',
                    }),
                    body: expect.any(String),
                }),
            );
            expect(emitUpdate).toHaveBeenCalled();
        });
    });

    it('should handle event card done click', async () => {
        const emitUpdate = vi.fn();
        render(<EventCard event={mockEvents[0]} emitUpdate={emitUpdate} />);

        const doneButton = screen.getByDisplayValue(/done/i);
        fireEvent.click(doneButton);

        const deleteButton = screen.getByRole('button', { name: /delete/i });
        fireEvent.click(deleteButton);

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith(
                '/api/event/delete',
                expect.objectContaining({
                    method: 'DELETE',
                    headers: expect.objectContaining({
                        'Content-Type': 'application/json',
                    }),
                    body: expect.any(String),
                }),
            );
            expect(emitUpdate).toHaveBeenCalled();
        });
    });

    it('should handle event card details click', async () => {
        render(<EventCard event={mockEvents[0]} emitUpdate={vi.fn()} />);

        expect(screen.queryByText(/this is a test event/i)).not.toBeInTheDocument();

        const div = screen.getByText(/october 1, 2023/i);
        fireEvent.click(div);

        await waitFor(() => {
            expect(screen.getByText(/this is a test event/i)).toBeInTheDocument();
        });
    });

    it('should handle event card cancel click', async () => {
        render(<EventCard event={mockEvents[0]} emitUpdate={vi.fn()} />);

        const doneButton = screen.getByDisplayValue(/done/i);
        fireEvent.click(doneButton);

        expect(screen.getByText(/are you sure you want to mark/i)).toBeInTheDocument();

        const cancelButton = screen.getByRole('button', { name: /cancel/i });
        fireEvent.click(cancelButton);

        await waitFor(() => {
            expect(screen.queryByText(/are you sure you want to mark/i)).not.toBeInTheDocument();
        });
    });
});
