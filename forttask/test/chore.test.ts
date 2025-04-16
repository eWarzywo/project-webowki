import { expect, test, vi } from 'vitest';
import { POST, GET, DELETE } from '../src/app/api/chore/route';
import prisma from '../libs/__mocks__/prisma';

vi.mock('../libs/prisma');

test('POST Chore with correct data should return new Chore and status 201', async () => {
    const mockChore = {
        name: 'Test Chore',
        description: 'Test Description',
        priority: 1,
        dueDate: '2023-10-01',
        householdId: 1,
        createdById: 1,
    };

    const req = new Request('http://localhost/api/chore', {
        method: 'POST',
        body: JSON.stringify(mockChore),
        headers: {
            'Content-Type': 'application/json',
        },
    });

    const mockResponse = { ...mockChore, id: 1 };
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    // tajpskript diff
    prisma.chore.create.mockResolvedValue(mockResponse);

    const response = await POST(req as Request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data).toStrictEqual(mockResponse);
});

test('POST Chore with missing fields should return 400', async () => {
    const req = new Request('http://localhost/api/chore', {
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

test('POST Chore with invalid data should return 400', async () => {
    const mockInvalidChore = {
        name: 'Test Chore',
        description: 'Test Description',
        priority: 'invalid_priority', // Not number
        dueDate: '2023-10-01',
        createdAt: '2023-09-01',
        householdId: 1,
        createdById: 1,
    };

    const req = new Request('http://localhost/api/chore', {
        method: 'POST',
        body: JSON.stringify(mockInvalidChore),
        headers: {
            'Content-Type': 'application/json',
        },
    });

    const response = await POST(req as Request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toStrictEqual({ error: 'Invalid request' });
});

test('GET Chore with correct householdId should return list of chores and status 200', async () => {
    const mockChores = [
        { id: 1, name: 'Chore 1', householdId: 1 },
        { id: 2, name: 'Chore 2', householdId: 1 },
    ];

    const req = new Request('http://localhost/api/chore?householdId=1', {
        method: 'GET',
    });

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    // tajpskript diff
    prisma.chore.findMany.mockResolvedValue(mockChores);

    const response = await GET(req as Request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toStrictEqual(mockChores);
});

test('GET Chore with missing householdId should return 400', async () => {
    const req = new Request('http://localhost/api/chore', {
        method: 'GET',
    });

    const response = await GET(req as Request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toStrictEqual({ error: 'Missing householdId parameter' });
});

test('GET Chore with invalid householdId should return 400', async () => {
    const req = new Request('http://localhost/api/chore?householdId=invalid', {
        method: 'GET',
    });

    const response = await GET(req as Request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toStrictEqual({ error: 'Invalid householdId parameter' });
});

test('GET Chore rejected by database should return 400', async () => {
    const req = new Request('http://localhost/api/chore?householdId=1', {
        method: 'GET',
    });

    prisma.chore.findMany.mockRejectedValue(new Error('Database error'));

    const response = await GET(req as Request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toStrictEqual({ error: 'Invalid request' });
});

test('DELETE Chore with correct choreId should return status 204', async () => {
    const req = new Request('http://localhost/api/chore?choreId=1', {
        method: 'DELETE',
    });

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    // tajpskript diff
    prisma.chore.delete.mockResolvedValue({});

    const response = await DELETE(req as Request);

    expect(response.status).toBe(204);
});

test('DELETE Chore with missing choreId should return 400', async () => {
    const req = new Request('http://localhost/api/chore', {
        method: 'DELETE',
    });

    const response = await DELETE(req as Request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toStrictEqual({ error: 'Missing choreId parameter' });
});

test('DELETE Chore with invalid choreId should return 400', async () => {
    const req = new Request('http://localhost/api/chore?choreId=invalid', {
        method: 'DELETE',
    });

    const response = await DELETE(req as Request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toStrictEqual({ error: 'Invalid choreId parameter' });
});
