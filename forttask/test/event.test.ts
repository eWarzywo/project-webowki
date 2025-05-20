import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '../src/app/api/events/get/route';
import { POST } from '../src/app/api/event/create/route';
import { DELETE } from '../src/app/api/event/delete/route';
import prisma from '../libs/__mocks__/prisma';
import { getServerSession } from 'next-auth/next';

vi.mock('../libs/prisma');
vi.mock('next-auth/next', () => ({
    getServerSession: vi.fn(),
}));

type MockSession = {
    user?: {
        id?: string;
        householdId?: string;
    };
    expires?: string;
};

type MockRequestOptions = {
    searchParams?: Record<string, string>;
    body?: Record<string, unknown>;
};

describe('Event GET API', () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    const createMockRequest = (options: MockRequestOptions): Request => {
        const { searchParams = {}, body = {} } = options;

        const url = new URL('http://localhost:3000/api/events/get');
        Object.entries(searchParams).forEach(([key, value]) => {
            url.searchParams.append(key, value);
        });

        return {
            url: url.toString(),
            json: () => Promise.resolve(body)
        } as unknown as Request;
    };

    it('should return 401 if user is not authenticated', async () => {
        vi.mocked(getServerSession).mockResolvedValue(null);

        const req = createMockRequest({});
        const response = await GET(req);
        const responseBody = await response.json();

        expect(response.status).toBe(401);
        expect(responseBody).toEqual({ message: 'You must be logged in to view events' });
    });

    it('should return 401 if user is not part of a household', async () => {
        vi.mocked(getServerSession).mockResolvedValue({
            user: { id: '1' },
        } as MockSession);

        const req = createMockRequest({});
        const response = await GET(req);

        expect(response.status).toBe(401);
        const data = await response.json();
        expect(data).toEqual({ message: 'You must be a part of a household to view events' });
    })

    it('should return events for the authenticated user', async () => {
        vi.mocked(getServerSession).mockResolvedValue({
            user: { id: '1', householdId: '1' },
        } as MockSession);

        const req = createMockRequest({ searchParams: { date: '2023-10-01' } });
        const mockEvents = [
            {
                id: 1,
                name: 'Test Event',
                description: 'This is a test event',
                date: new Date('2023-10-01'),
                createdById: 1,
                attendees: [],
                location: 'Test Location',
                cycle: 1,
                createdAt: new Date('2023-10-01'),
                householdId: 1,
                updatedAt: new Date('2023-10-01'),
                repeatCount: 0,
                parentEventId: null,
            },
        ];

        const serializedEvents = JSON.parse(JSON.stringify(mockEvents));

        vi.mocked(prisma.event.findMany).mockResolvedValue(mockEvents);
        vi.mocked(prisma.event.count).mockResolvedValue(mockEvents.length);

        const response = await GET(req);

        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data.events).toEqual(serializedEvents);
        expect(data.count).toBe(mockEvents.length);
    });

    it('should return 400 if an error occurs', async () => {
        vi.mocked(getServerSession).mockResolvedValue({
            user: { id: '1', householdId: '1' },
        } as MockSession);

        const req = createMockRequest({});

        vi.mocked(prisma.event.findMany).mockRejectedValue(new Error('Database error'));

        const response = await GET(req);

        expect(response.status).toBe(500);
        const data = await response.json();
        expect(data.error).toBe('Internal Server Error');
    });
});

describe('Event POST API', () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    const createMockRequest = (options: MockRequestOptions): Request => {
        const { searchParams = {}, body = {} } = options;

        const url = new URL('http://localhost:3000/api/event/create');
        Object.entries(searchParams).forEach(([key, value]) => {
            url.searchParams.append(key, value);
        });

        return {
            url: url.toString(),
            json: () => Promise.resolve(body)
        } as unknown as Request;
    };

    it('should return 401 if user is not authenticated', async () => {
        vi.mocked(getServerSession).mockResolvedValue(null);

        const req = createMockRequest({});
        const response = await POST(req);

        expect(response.status).toBe(401);
        const data = await response.json();
        expect(data).toEqual({ message: 'You must be logged in to create events' });
    });

    it('should return 401 if user is not part of a household', async () => {
        vi.mocked(getServerSession).mockResolvedValue({
            user: { id: '1' },
        } as MockSession);

        const req = createMockRequest({});
        const response = await POST(req);

        expect(response.status).toBe(401);
        const data = await response.json();
        expect(data).toEqual({ message: 'You must be a part of a household to create events' });
    })

    it('should create an event for the authenticated user', async () => {
        vi.mocked(getServerSession).mockResolvedValue({
            user: {id: '1', householdId: '1'},
        } as MockSession);

        const requestBody = {
            name: 'Test Event',
            description: 'This is a test event',
            date: new Date('2023-10-01'),
            location: 'Test Location',
            cycle: 1,
            repeatCount: 0,
            attendees: [1],
        }

        const request = createMockRequest({ body: requestBody });

        const mockEvent = {
            id: 1,
            ...requestBody,
            createdById: 1,
            location: 'Test Location',
            createdAt: new Date('2023-10-01'),
            householdId: 1,
            updatedAt: new Date('2023-10-01'),
            parentEventId: null,
        };

        const mockAttendees = [
            {
                userId: 1,
                eventId: 1,
                user: {
                    id: 1,
                    username: 'testuser',
                },
            },
        ];

        const serializedEvent = JSON.parse(JSON.stringify(mockEvent));

        vi.mocked(prisma.event.create).mockResolvedValue(mockEvent);
        vi.mocked(prisma.eventAttendee.createMany).mockResolvedValue({
            count: mockAttendees.length,
        });

        const response = await POST(request);

        expect(response.status).toBe(201);
        const data = await response.json();
        expect(data).toEqual(serializedEvent);
    });

    it('should return 400 if an error occurs', async () => {
        vi.mocked(getServerSession).mockResolvedValue({
            user: { id: '1', householdId: '1' },
        } as MockSession);

        const req = createMockRequest({ searchParams: {}, body: { attendees: [] } });

        vi.mocked(prisma.event.create).mockRejectedValue(new Error('Database error'));

        const response = await POST(req);

        expect(response.status).toBe(500);
        const data = await response.json();
        expect(data.error).toBe('Internal Server Error');
    });
});

describe('Event DELETE API', () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    const createMockRequest = (options: MockRequestOptions): Request => {
        const { searchParams = {}, body = {} } = options;

        const url = new URL('http://localhost:3000/api/event/create');
        Object.entries(searchParams).forEach(([key, value]) => {
            url.searchParams.append(key, value);
        });

        return {
            url: url.toString(),
            json: () => Promise.resolve(body)
        } as unknown as Request;
    };

    it('should return 401 if user is not authenticated', async () => {
        vi.mocked(getServerSession).mockResolvedValue(null);

        const req = createMockRequest({});

        const response = await DELETE(req);

        expect(response.status).toBe(401);
        const data = await response.json();
        expect(data).toEqual({ message: 'You must be logged in to delete events' });
    });

    it('should return 401 if user is not part of a household', async () => {
        vi.mocked(getServerSession).mockResolvedValue({
            user: { id: '1' },
        } as MockSession);

        const req = createMockRequest({});

        const response = await DELETE(req);

        expect(response.status).toBe(401);
        const data = await response.json();
        expect(data).toEqual({ message: 'You must be a part of a household to delete events' });
    });

    it('should return 400 if eventId is missing', async () => {
        vi.mocked(getServerSession).mockResolvedValue({
            user: { id: '1', householdId: '1' },
        } as MockSession);

        const req = createMockRequest({});

        const response = await DELETE(req);

        expect(response.status).toBe(400);
        const data = await response.json();
        expect(data).toEqual({ error: 'Missing eventId parameter' });
    });

    it('should return 400 if eventId is invalid', async () => {
        vi.mocked(getServerSession).mockResolvedValue({
            user: { id: '1', householdId: '1' },
        } as MockSession);

        const req = createMockRequest({ body: { eventId: 'invalid' } });

        const response = await DELETE(req);

        expect(response.status).toBe(400);
        const data = await response.json();
        expect(data).toEqual({ error: 'Invalid eventId parameter' });
    });

    it('should return 404 if event is not found', async () => {
        vi.mocked(getServerSession).mockResolvedValue({
            user: { id: '1', householdId: '1' },
        } as MockSession);

        const req = createMockRequest({ body: { eventId: '1' } });

        vi.mocked(prisma.event.findUnique).mockResolvedValue(null);

        const response = await DELETE(req);

        expect(response.status).toBe(404);
        const data = await response.json();
        expect(data).toEqual({ error: 'Event not found' });
    });

    it('should return 403 if user is not authorized to delete the event', async () => {
        vi.mocked(getServerSession).mockResolvedValue({
            user: { id: '1', householdId: '1' },
        } as MockSession);

        const req = createMockRequest({ body: { eventId: '1' } });

        const mockEvent = {
            id: 1,
            name: 'Test Event',
            description: 'This is a test event',
            date: new Date('2023-10-01'),
            createdById: 2,
            attendees: [],
            location: 'Test Location',
            cycle: 1,
            createdAt: new Date('2023-10-01'),
            householdId: 2,
            updatedAt: new Date('2023-10-01'),
            repeatCount: 0,
            parentEventId: null,
        };

        vi.mocked(prisma.event.findUnique).mockResolvedValue(mockEvent);

        const response = await DELETE(req);

        expect(response.status).toBe(403);
        const data = await response.json();
        expect(data).toEqual({ error: 'Not authorized to delete this event' });
    });

    it('should delete an event for the authenticated user', async () => {
        vi.mocked(getServerSession).mockResolvedValue({
            user: { id: '1', householdId: '1' },
        } as MockSession);

        const req = createMockRequest({ body: { eventId: '1' } });

        const mockEvent = {
            id: 1,
            name: 'Test Event',
            description: 'This is a test event',
            date: new Date('2023-10-01'),
            createdById: 1,
            attendees: [],
            location: 'Test Location',
            cycle: 1,
            createdAt: new Date('2023-10-01'),
            householdId: 1,
            updatedAt: new Date('2023-10-01'),
            repeatCount: 0,
            parentEventId: null,
        };

        vi.mocked(prisma.event.findUnique).mockResolvedValue(mockEvent);
        vi.mocked(prisma.event.delete).mockResolvedValue(mockEvent);

        const response = await DELETE(req);

        expect(response.status).toBe(204);
    });

    it('should return 500 if an error occurs', async () => {
        vi.mocked(getServerSession).mockResolvedValue({
            user: { id: '1', householdId: '1' },
        } as MockSession);

        const req = createMockRequest({ body: { eventId: '1' } });

        vi.mocked(prisma.event.findUnique).mockRejectedValue(new Error('Database error'));

        const response = await DELETE(req);

        expect(response.status).toBe(500);
        const data = await response.json();
        expect(data.error).toBe('Internal Server Error');
    });
});