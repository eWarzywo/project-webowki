import { expect, test, vi } from 'vitest';
import { GET } from '../src/app/api/overview/bills/route';
import prisma from '../libs/__mocks__/prisma';
import { getServerSession } from 'next-auth';
import { NextRequest } from 'next/server';
import { Decimal } from '@prisma/client/runtime/library';

vi.mock('../libs/prisma');
vi.mock('next-auth');
vi.mock('date-fns', () => ({
  startOfDay: vi.fn((date) => new Date(date.setHours(0, 0, 0, 0))),
  endOfDay: vi.fn((date) => new Date(date.setHours(23, 59, 59, 999))),
  addDays: vi.fn((date, days) => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }),
}));

function createMockRequest(dateParam?: string): NextRequest {
  const url = new URL(
    dateParam ? `http://localhost/api/overview/bills?date=${dateParam}` : 'http://localhost/api/overview/bills'
  );
  
  return {
    url: url.toString(),
    nextUrl: url,
    headers: new Headers(),
  } as unknown as NextRequest;
}

test('GET should return 401 when user is not authenticated', async () => {
  vi.mocked(getServerSession).mockResolvedValue(null);
  
  const req = createMockRequest();
  const response = await GET(req);
  const data = await response.json();
  
  expect(response.status).toBe(401);
  expect(data).toStrictEqual({ error: 'Unauthorized' });
});

test('GET should return 404 when user is not in a household', async () => {
  vi.mocked(getServerSession).mockResolvedValue({
    user: { id: '1', name: 'Test User', email: 'test@example.com' },
    expires: new Date().toISOString(),
  });
  
  prisma.user.findUnique.mockResolvedValue({
    id: 1,
    username: 'testuser',
    email: 'test@example.com',
    householdId: null,
    createdAt: new Date(),
    passwordHash: 'hash123',
    profilePictureId: null
  });
  
  const req = createMockRequest();
  const response = await GET(req);
  const data = await response.json();
  
  expect(response.status).toBe(404);
  expect(data).toStrictEqual({ error: 'User not in a household' });
});

test('GET should return bills with default date (current date to one week later)', async () => {
  const mockUser = {
    id: 1,
    username: 'testuser',
    email: 'test@example.com',
    householdId: 1,
    household: { id: 1, name: 'Test Household' },
    createdAt: new Date(),
    passwordHash: 'hash123',
    profilePictureId: null
  };
  
  const mockBills = [
    {
      id: 1,
      name: 'Electricity',
      description: 'Monthly electricity bill',
      amount: new Decimal(100.50),
      dueDate: new Date('2025-05-25'),
      createdAt: new Date('2025-05-01'),
      householdId: 1,
      cycle: 30,
      updatedAt: new Date('2025-05-01'),
      createdById: 1,
      paidById: null,
    },
    {
      id: 2,
      name: 'Internet',
      description: 'Monthly internet bill',
      amount: new Decimal(50.03),
      dueDate: new Date('2025-05-26'),
      createdAt: new Date('2025-05-02'),
      householdId: 1,
      cycle: 30,
      updatedAt: new Date('2025-05-02'),
      createdById: 1,
      paidById: null,
    }
  ];
  
  vi.mocked(getServerSession).mockResolvedValue({
    user: { id: '1', name: 'Test User', email: 'test@example.com', householdId: '1' },
    expires: new Date().toISOString(),
  });
  
  prisma.user.findUnique.mockResolvedValue(mockUser);
  prisma.bill.findMany.mockResolvedValue(mockBills);
  
  const req = createMockRequest();
  const response = await GET(req);
  const data = await response.json();
  
  expect(response.status).toBe(200);
  expect(data.bills).toHaveLength(2);
  expect(data.bills[0].name).toBe('Electricity');
  expect(data.bills[1].name).toBe('Internet');
  expect(prisma.bill.findMany).toHaveBeenCalledWith(expect.objectContaining({
    where: expect.objectContaining({
      householdId: 1,
      paidById: null,
    }),
    select: {
      id: true,
      name: true,
      description: true,
      amount: true,
      dueDate: true,
      createdBy: {
        select: {
          username: true,
        },
      },
    },
    orderBy: {
      dueDate: 'asc',
    },
    take: 5,
  }));
});

test('GET should return bills with specified date range', async () => {
  const mockUser = {
    id: 1,
    username: 'testuser',
    email: 'test@example.com',
    householdId: 1,
    household: { id: 1, name: 'Test Household' },
    createdAt: new Date(),
    passwordHash: 'hash123',
    profilePictureId: null
  };
  
  const mockBills = [
    {
      id: 3,
      name: 'Water',
      description: 'Monthly water bill',
      amount: new Decimal(75.00),
      dueDate: new Date('2025-06-10'),
      createdBy: { username: 'testuser' },
      createdAt: new Date('2025-06-01'),
      householdId: 1,
      cycle: 30,
      updatedAt: new Date('2025-06-01'),
      createdById: 1,
      paidById: null,
    }
  ];
  
  vi.mocked(getServerSession).mockResolvedValue({
    user: { id: '1', name: 'Test User', email: 'test@example.com', householdId: '1' },
    expires: new Date().toISOString(),
  });
  
  prisma.user.findUnique.mockResolvedValue(mockUser);
  prisma.bill.findMany.mockResolvedValue(mockBills);
  
  const req = createMockRequest('2025-06-05');
  const response = await GET(req);
  const data = await response.json();
  
  expect(response.status).toBe(200);
  expect(data.bills).toHaveLength(1);
  expect(data.bills[0].name).toBe('Water');
  expect(prisma.bill.findMany).toHaveBeenCalledWith(expect.objectContaining({
    where: expect.objectContaining({
      householdId: 1,
      paidById: null,
    }),
  }));
});

test('GET should handle decimal amount values correctly', async () => {
  const mockUser = {
    id: 1,
    username: 'testuser',
    email: 'test@example.com',
    householdId: 1,
    household: { id: 1, name: 'Test Household' },
    createdAt: new Date(),
    passwordHash: 'hash123',
    profilePictureId: null
  };
  
  const mockBills = [
    {
      id: 4,
      name: 'Phone bill',
      description: 'Monthly phone bill',
      amount: new Decimal(123.45),
      dueDate: new Date('2025-05-22'),
      createdBy: { username: 'testuser' },
      createdAt: new Date('2025-05-15'),
      householdId: 1,
      cycle: 30,
      updatedAt: new Date('2025-05-15'),
      createdById: 1,
      paidById: null,
    }
  ];
  
  vi.mocked(getServerSession).mockResolvedValue({
    user: { id: '1', name: 'Test User', email: 'test@example.com', householdId: '1' },
    expires: new Date().toISOString(),
  });
  
  prisma.user.findUnique.mockResolvedValue(mockUser);
  prisma.bill.findMany.mockResolvedValue(mockBills);
  
  const req = createMockRequest();
  const response = await GET(req);
  const data = await response.json();
  
  expect(response.status).toBe(200);
  expect(data.bills).toHaveLength(1);
  expect(data.bills[0].name).toBe('Phone bill');
  expect(data.bills[0].amount).toBe(123.45);
});

test('GET should handle database errors gracefully', async () => {
  vi.mocked(getServerSession).mockResolvedValue({
    user: { id: '1', name: 'Test User', email: 'test@example.com', householdId: '1' },
    expires: new Date().toISOString(),
  });
  
  // The key is to make prisma.user.findUnique succeed but prisma.bill.findMany fail
  prisma.user.findUnique.mockResolvedValue({
    id: 1,
    username: 'testuser',
    email: 'test@example.com',
    householdId: 1,
    createdAt: new Date(),
    passwordHash: 'hash123',
    profilePictureId: null
  });
  
  // This ensures we reach the database error part
  prisma.bill.findMany.mockRejectedValue(new Error('Database connection error'));
  
  const req = createMockRequest();
  const response = await GET(req);
  const data = await response.json();
  
  expect(response.status).toBe(500);
  expect(data).toStrictEqual({ error: 'Failed to fetch bills' });
});