import { expect, test, vi } from 'vitest';
import { POST, GET, DELETE } from '@/app/api/events/route';
import prisma from '../libs/__mocks__/prisma';

vi.mock('../libs/prisma');

test('POST Event with correct data should return new Event and status 201', async () => {
    const mockEvent = {
        name: 'Test Event',
        description: 'Test Description',
        date: '2023-10-01',
        attendees: [1, 2],
        householdId: 1,
        createdById: 1,
    };

    const req = new Request('http://localhost/api/event', {
        method: 'POST',
        body: JSON.stringify(mockEvent),
        headers: {
            'Content-Type': 'application/json',
        },
    });

    const mockResponse = { ...mockEvent, id: 1 };
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    // tajpskript diff
    prisma.event.create.mockResolvedValue(mockResponse);

    const response = await POST(req as Request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data).toStrictEqual(mockResponse);
});

test('POST Event with missing fields should return 400', async () => {
    const req = new Request('http://localhost/api/event', {
        method: 'POST',
        body: JSON.stringify({}),
        headers: {
            'Content-Type': 'application/json',
        },
    });

    const response = await POST(req as Request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toStrictEqual({ error: 'Invalid request' });
});

test('POST Event with invalid data should return 400', async () => {
    const mockInvalidEvent = {
        name: 'Test Event',
        description: 'Test Description',
        date: 'invalid_date', // Not a valid date
        attendees: [1, 2],
        householdId: 1,
        createdById: 1,
    };

    const req = new Request('http://localhost/api/event', {
        method: 'POST',
        body: JSON.stringify(mockInvalidEvent),
        headers: {
            'Content-Type': 'application/json',
        },
    });

    const response = await POST(req as Request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toStrictEqual({ error: 'Invalid request' });
});

test('GET Event with valid userId should return events', async () => {
    const mockEvents = [
        {
            id: 1,
            name: 'Test Event 1',
            description: 'Test Description 1',
            date: '2023-10-01',
            householdId: 1,
            createdById: 1,
        },
        {
            id: 2,
            name: 'Test Event 2',
            description: 'Test Description 2',
            date: '2023-10-02',
            householdId: 1,
            createdById: 1,
        },
    ];

    const req = new Request('http://localhost/api/event?userId=1', {
        method: 'GET',
    });

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    // tajpskript diff
    prisma.event.findMany.mockResolvedValue(mockEvents);

    const response = await GET(req as Request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toStrictEqual(mockEvents);
});

test('GET Event with missing userId should return 400', async () => {
    const req = new Request('http://localhost/api/event', {
        method: 'GET',
    });

    const response = await GET(req as Request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toStrictEqual({ error: 'Missing userId parameter' });
});

test('GET Event with invalid userId should return 400', async () => {
    const req = new Request('http://localhost/api/event?userId=invalid', {
        method: 'GET',
    });

    const response = await GET(req as Request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toStrictEqual({ error: 'Invalid userId parameter' });
});

test('GET Event rejected by database should return 400', async () => {
    const req = new Request('http://localhost/api/event?userId=1', {
        method: 'GET',
    });

    prisma.event.findMany.mockRejectedValue(new Error('Database error'));

    const response = await GET(req as Request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toStrictEqual({ error: 'Invalid request' });
});

test('DELETE Event with valid eventId should return 204', async () => {
    const req = new Request('http://localhost/api/event?eventId=1', {
        method: 'DELETE',
    });

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    // tajpskript diff
    prisma.event.delete.mockResolvedValue({});

    const response = await DELETE(req as Request);

    expect(response.status).toBe(204);
});

test('DELETE Event with missing eventId should return 400', async () => {
    const req = new Request('http://localhost/api/event', {
        method: 'DELETE',
    });

    const response = await DELETE(req as Request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toStrictEqual({ error: 'Missing eventId parameter' });
});

test('DELETE Event with invalid eventId should return 400', async () => {
    const req = new Request('http://localhost/api/event?eventId=invalid', {
        method: 'DELETE',
    });

    const response = await DELETE(req as Request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toStrictEqual({ error: 'Invalid eventId parameter' });
});
