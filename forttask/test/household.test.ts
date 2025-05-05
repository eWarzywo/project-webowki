import { expect, test, vi } from 'vitest';
import { POST, GET, PUT, DELETE } from '../src/app/api/household/route';
import prisma from '../libs/__mocks__/prisma';

vi.mock('../libs/prisma');

test('POST Household with correct data should return new Household and status 201', async () => {
    const mockHousehold = {
        name: 'Test Household',
        joinCode: 'ABC123',
        ownerId: 1,
    };

    const req = new Request('http://localhost/api/household', {
        method: 'POST',
        body: JSON.stringify(mockHousehold),
        headers: {
            'Content-Type': 'application/json',
        },
    });

    const mockResponse = { ...mockHousehold, id: 1 };
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    // tajpskript diff
    prisma.household.create.mockResolvedValue(mockResponse);

    const response = await POST(req as Request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data).toStrictEqual(mockResponse);
});

test('POST Household with missing fields should return 400', async () => {
    const req = new Request('http://localhost/api/household', {
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

test('POST Household with invalid data should return 400', async () => {
    const mockInvalidHousehold = {
        name: 'Test Household',
        joinCode: 'ABC123',
        ownerId: 'invalid_ownerId', // Not number
    };

    const req = new Request('http://localhost/api/household', {
        method: 'POST',
        body: JSON.stringify(mockInvalidHousehold),
        headers: {
            'Content-Type': 'application/json',
        },
    });

    const response = await POST(req as Request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toStrictEqual({ error: 'Invalid request' });
});

test('GET Household with valid householdId should return Household', async () => {
    const mockHousehold = {
        id: 1,
        name: 'Test Household',
        joinCode: 'ABC123',
        ownerId: 1,
    };

    const req = new Request('http://localhost/api/household?householdId=1', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    });

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    // tajpskript diff
    prisma.household.findUnique.mockResolvedValue(mockHousehold);

    const response = await GET(req as Request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toStrictEqual(mockHousehold);
});

test('GET Household with missing householdId should return 400', async () => {
    const req = new Request('http://localhost/api/household', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    });

    const response = await GET(req as Request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toStrictEqual({ error: 'Missing householdId parameter' });
});

test('GET Household with invalid householdId should return 400', async () => {
    const req = new Request('http://localhost/api/household?householdId=invalid', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    });

    const response = await GET(req as Request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toStrictEqual({ error: 'Invalid householdId parameter' });
});

test('GET Household rejected by database should return 400', async () => {
    const req = new Request('http://localhost/api/household?householdId=1', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    });

    prisma.household.findUnique.mockRejectedValue(new Error('Database error'));

    const response = await GET(req as Request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toStrictEqual({ error: 'Invalid request' });
});

test('PUT Household with correct data should return updated Household and status 200', async () => {
    const mockHousehold = {
        id: 1,
        name: 'Updated Household',
        joinCode: 'XYZ789',
    };

    const req = new Request('http://localhost/api/household', {
        method: 'PUT',
        body: JSON.stringify(mockHousehold),
        headers: {
            'Content-Type': 'application/json',
        },
    });

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    // tajpskript diff
    prisma.household.update.mockResolvedValue(mockHousehold);

    const response = await PUT(req as Request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toStrictEqual(mockHousehold);
});

test('PUT Household with missing fields should return 400', async () => {
    const req = new Request('http://localhost/api/household', {
        method: 'PUT',
        body: JSON.stringify({}),
        headers: {
            'Content-Type': 'application/json',
        },
    });

    const response = await PUT(req as Request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toStrictEqual({ error: 'Missing id parameter' });
});

test('PUT Household with invalid data should return 400', async () => {
    const mockInvalidHousehold = {
        id: 'invalid_id', // Not number
        name: 'Updated Household',
        joinCode: 'XYZ789',
    };

    const req = new Request('http://localhost/api/household', {
        method: 'PUT',
        body: JSON.stringify(mockInvalidHousehold),
        headers: {
            'Content-Type': 'application/json',
        },
    });

    const response = await PUT(req as Request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toStrictEqual({ error: 'Invalid id parameter' });
});

test('DELETE Household with correct data should return 204', async () => {
    const req = new Request('http://localhost/api/household?householdId=1', {
        method: 'DELETE',
    });

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    // tajpskript diff
    prisma.household.delete.mockResolvedValue({});

    const response = await DELETE(req as Request);

    expect(response.status).toBe(204);
});

test('DELETE Household with missing householdId should return 400', async () => {
    const req = new Request('http://localhost/api/household', {
        method: 'DELETE',
    });

    const response = await DELETE(req as Request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toStrictEqual({ error: 'Missing householdId parameter' });
});

test('DELETE Household with invalid householdId should return 400', async () => {
    const req = new Request('http://localhost/api/household?householdId=invalid', {
        method: 'DELETE',
    });

    const response = await DELETE(req as Request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toStrictEqual({ error: 'Invalid householdId parameter' });
});
