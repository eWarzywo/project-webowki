import { expect, test, vi } from 'vitest';
import { POST, GET, DELETE } from '../src/app/api/bill/route';
import prisma from '../libs/__mocks__/prisma';

vi.mock('../libs/prisma');

test('Correct POST Bill should return new Bill and status 201', async () => {
    const mockBill = {
            name: 'Test Bill',
            amount: 100,
            dueDate: '2023-10-01',
            description: 'Test Description',
            householdId: 1,
            createdById: 1,
    };

    const req = new Request('http://localhost/api/bill', {
        method: 'POST',
        body: JSON.stringify(mockBill),
        headers: {
            'Content-Type': 'application/json',
        },
    });

    const mockResponse = { ...mockBill, id: 1 };
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    // tajpskript diff
    prisma.bill.create.mockResolvedValue(mockResponse);

    const response = await POST(req as Request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data).toStrictEqual(mockResponse);
});

test('POST Bill with missing fields should return 400', async () => {
    const req = new Request('http://localhost/api/bill', {
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

test('POST Bill with invalid data should return 400', async () => {
    const mockInvalidBill = {
        name: 'Test Bill',
        amount: 'invalid_amount', // Not number
        dueDate: '2023-10-01',
        description: 'Test Description',
        householdId: 1,
        createdById: 1,
    };

    const req = new Request('http://localhost/api/bill', {
        method: 'POST',
        body: JSON.stringify(mockInvalidBill),
        headers: {
            'Content-Type': 'application/json',
        },
    });

    prisma.bill.create.mockRejectedValue(new Error('Invalid data'));

    const response = await POST(req as Request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toStrictEqual({ error: 'Invalid request' });
});

test('Correct GET Bill should return all bills for household and status 200', async () => {
    const mockBill = {
        name: 'Test Bill',
        amount: 100,
        dueDate: '2023-10-01',
        description: 'Test Description',
        householdId: 1,
        createdById: 1,
    };

    const req = new Request('http://localhost/api/bill?householdId=1', {
        method: 'GET',
    });

    const mockResponse = [mockBill];
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    // tajpskript diff
    prisma.bill.findMany.mockResolvedValue(mockResponse);

    const response = await GET(req as Request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toStrictEqual(mockResponse);
});

test('GET Bill with missing householdId should return 400', async () => {
    const req = new Request('http://localhost/api/bill', {
        method: 'GET',
    });

    const response = await GET(req as Request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toStrictEqual({ error: 'Missing householdId parameter' });
});

test('GET Bill with invalid householdId should return 400', async () => {
    const req = new Request('http://localhost/api/bill?householdId=invalid', {
        method: 'GET',
    });

    const response = await GET(req as Request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toStrictEqual({ error: 'Invalid request' });
});

test('Correct DELETE Bill should return 204', async () => {
    const req = new Request('http://localhost/api/bill?billId=1', {
        method: 'DELETE',
    });

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    // tajpskript diff
    prisma.bill.delete.mockResolvedValue({});

    const response = await DELETE(req as Request);

    expect(response.status).toBe(204);
});

test('DELETE Bill with missing billId should return 400', async () => {
    const req = new Request('http://localhost/api/bill', {
        method: 'DELETE',
    });

    const response = await DELETE(req as Request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toStrictEqual({ error: 'Missing billId parameter' });
});

test('DELETE Bill with invalid billId should return 400', async () => {
    const req = new Request('http://localhost/api/bill?billId=invalid', {
        method: 'DELETE',
    });

    const response = await DELETE(req as Request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toStrictEqual({ error: 'Invalid request' });
});