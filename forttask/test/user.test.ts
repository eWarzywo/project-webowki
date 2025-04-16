import { expect, test, vi } from 'vitest';
import { POST, GET, PUT, DELETE } from '../src/app/api/user/route';
import prisma from '../libs/__mocks__/prisma';

vi.mock('../libs/prisma');

test('POST User with correct data should return new User and status 201', async () => {
    const mockUser = {
        username: 'john',
        email: 'john@email.com',
        passwordHash: 'hashed_password',
        householdId: 1,
    }

    const req = new Request('http://localhost/api/user', {
        method: 'POST',
        body: JSON.stringify(mockUser),
        headers: {
            'Content-Type': 'application/json',
        },
    });

    const mockResponse = { ...mockUser, id: 1 };

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    // tajpskript diff
    prisma.user.create.mockResolvedValue(mockResponse);

    const response = await POST(req as Request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data).toStrictEqual(mockResponse);
});

test('POST User with missing fields should return 400', async () => {
    const req = new Request('http://localhost/api/user', {
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

test('POST User with invalid data should return 400', async () => {
    const mockInvalidUser = {
        username: 'invalid_name',
        email: 'invalid_email',
        passwordHash: 'hashed_password',
        householdId: 'invalid_id', // Not number
    }

    const req = new Request('http://localhost/api/user', {
        method: 'POST',
        body: JSON.stringify(mockInvalidUser),
        headers: {
            'Content-Type': 'application/json',
        },
    });

    const response = await POST(req as Request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toStrictEqual({ error: 'Invalid request' });
});

test('GET User with valid userId should return User', async () => {
    const mockUser = {
        id: 1,
        username: 'john',
        email: 'john@email.com',
        passwordHash: 'hashed_password',
        householdId: 1,
    }

    const req = new Request('http://localhost/api/user?userId=1', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    });

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    // tajpskript diff
    prisma.user.findUnique.mockResolvedValue(mockUser);

    const response = await GET(req as Request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toStrictEqual(mockUser);
});

test('GET User with missing userId should return 400', async () => {
    const req = new Request('http://localhost/api/user', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    });

    const response = await GET(req as Request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toStrictEqual({ error: 'Missing userId parameter' });
});

test('GET User with invalid userId should return 400', async () => {
    const req = new Request('http://localhost/api/user?userId=invalid', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    });

    const response = await GET(req as Request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toStrictEqual({ error: 'Invalid userId parameter' });
});

test('GET User rejected by database should return 400', async () => {
    const req = new Request('http://localhost/api/user?userId=1', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    });

    prisma.user.findUnique.mockRejectedValue(new Error('Database error'));

    const response = await GET(req as Request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toStrictEqual({ error: 'Invalid request' });
});

test('PUT User with correct data should return updated User and status 200', async () => {
    const mockUser = {
        id: 1,
        username: 'changed_name',
        email: 'changed@email.com',
        passwordHash: 'changed_password',
    }

    const req = new Request('http://localhost/api/user', {
        method: 'PUT',
        body: JSON.stringify(mockUser),
        headers: {
            'Content-Type': 'application/json',
        },
    });

    const mockResponse = { ...mockUser };

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    // tajpskript diff
    prisma.user.update.mockResolvedValue(mockResponse);

    const response = await PUT(req as Request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toStrictEqual(mockResponse);
});

test('PUT User with missing fields should return 400', async () => {
    const req = new Request('http://localhost/api/user', {
        method: 'PUT',
        body: JSON.stringify({}),
        headers: {
            'Content-Type': 'application/json',
        },
    });

    const response = await PUT(req as Request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toStrictEqual({ error: 'Missing userId parameter' });
});

test('PUT User with invalid data should return 400', async () => {
    const mockInvalidUser = {
        id: 1,
        username: 'invalid_name',
        email: 'invalid_email',
        passwordHash: 'hashed_password',
        householdId: 'invalid_id', // Not number
    }

    const req = new Request('http://localhost/api/user', {
        method: 'PUT',
        body: JSON.stringify(mockInvalidUser),
        headers: {
            'Content-Type': 'application/json',
        },
    });

    const response = await PUT(req as Request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toStrictEqual({ error: 'Invalid request' });
});

test('DELETE User with valid userId should return 200', async () => {
    const req = new Request('http://localhost/api/user?userId=1&householdId=1', {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
        },
    });

    const mockHousehold = {
        id: 1,
        name: 'Household 1',
        users: [],
    }

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    // tajpskript diff
    prisma.household.findUnique.mockResolvedValue(mockHousehold);

    prisma.user.deleteMany.mockResolvedValue({ count: 1 });

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    // tajpskript diff
    prisma.household.delete.mockResolvedValue({});

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    // tajpskript diff
    prisma.user.delete.mockResolvedValue({});

    const response = await DELETE(req as Request);

    expect(response.status).toBe(204);
});

test('DELETE User with missing userId or householdId should return 400', async () => {
    const req = new Request('http://localhost/api/user', {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
        },
    });

    const response = await DELETE(req as Request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toStrictEqual({ error: 'Missing userId or householdId parameter' });
});

test('DELETE User with invalid userId or householdId should return 400', async () => {
    const req = new Request('http://localhost/api/user?userId=invalid&householdId=invalid', {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
        },
    });

    const response = await DELETE(req as Request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toStrictEqual({ error: 'Invalid userId or householdId parameter' });
});