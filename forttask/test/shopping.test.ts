import { expect, test, vi } from 'vitest';
import { POST, GET, DELETE } from '../src/app/api/shopping/route';
import prisma from '../libs/__mocks__/prisma';

vi.mock('../libs/prisma');

test('POST Shopping with correct data should return new Shopping and status 201', async () => {
    const mockShopping = {
        name: 'Test Shopping',
        description: 'Test Description',
        quantity: 1,
        householdId: 1,
        createdById: 1,
    };

    const req = new Request('http://localhost/api/shopping', {
        method: 'POST',
        body: JSON.stringify(mockShopping),
        headers: {
            'Content-Type': 'application/json',
        },
    });

    const mockResponse = { ...mockShopping, id: 1 };
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    // tajpskript diff
    prisma.shoppingItem.create.mockResolvedValue(mockResponse);

    const response = await POST(req as Request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data).toStrictEqual(mockResponse);
});

test('POST Shopping with missing fields should return 400', async () => {
    const req = new Request('http://localhost/api/shopping', {
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

test('POST Shopping with invalid data should return 400', async () => {
    const mockInvalidShopping = {
        name: 'Test Shopping',
        description: 'Test Description',
        quantity: 'invalid_quantity', // Not number
        createdAt: '2023-09-01',
        householdId: 1,
        createdById: 1,
    };

    const req = new Request('http://localhost/api/shopping', {
        method: 'POST',
        body: JSON.stringify(mockInvalidShopping),
        headers: {
            'Content-Type': 'application/json',
        },
    });

    const response = await POST(req as Request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toStrictEqual({ error: 'Invalid request' });
});

test('GET Shopping with valid householdId should return list of Shopping', async () => {
    const mockShoppingList = [
        { id: 1, name: 'Test Shopping 1', householdId: 1 },
        { id: 2, name: 'Test Shopping 2', householdId: 1 },
    ];

    const req = new Request('http://localhost/api/shopping?householdId=1', {
        method: 'GET',
    });

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    // tajpskript diff
    prisma.shoppingItem.findMany.mockResolvedValue(mockShoppingList);

    const response = await GET(req as Request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toStrictEqual(mockShoppingList);
});

test('GET Shopping with missing householdId should return 400', async () => {
    const req = new Request('http://localhost/api/shopping', {
        method: 'GET',
    });

    const response = await GET(req as Request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toStrictEqual({ error: 'Missing householdId parameter' });
});

test('GET Shopping with invalid householdId should return 400', async () => {
    const req = new Request('http://localhost/api/shopping?householdId=invalid', {
        method: 'GET',
    });

    const response = await GET(req as Request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toStrictEqual({ error: 'Invalid householdId parameter' });
});

test('GET Shopping rejected by database should return 400', async () => {
    const req = new Request('http://localhost/api/shopping?householdId=1', {
        method: 'GET',
    });

    prisma.shoppingItem.findMany.mockRejectedValue(new Error('Database error'));

    const response = await GET(req as Request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toStrictEqual({ error: 'Invalid request' });
});

test('DELETE Shopping with valid id should return 204', async () => {
    const req = new Request('http://localhost/api/shopping?id=1', {
        method: 'DELETE',
    });

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    // tajpskript diff
    prisma.shoppingItem.delete.mockResolvedValue({});

    const response = await DELETE(req as Request);

    expect(response.status).toBe(204);
});

test('DELETE Shopping with missing id should return 400', async () => {
    const req = new Request('http://localhost/api/shopping', {
        method: 'DELETE',
    });

    const response = await DELETE(req as Request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toStrictEqual({ error: 'Missing id parameter' });
});

test('DELETE Shopping with invalid id should return 400', async () => {
    const req = new Request('http://localhost/api/shopping?id=invalid', {
        method: 'DELETE',
    });

    const response = await DELETE(req as Request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toStrictEqual({ error: 'Invalid id parameter' });
});