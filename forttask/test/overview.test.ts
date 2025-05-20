import { expect, test, vi, describe, beforeEach } from 'vitest';
import { GET } from '../src/app/api/overview/route';
import prisma from '../libs/__mocks__/prisma';
import { getServerSession } from 'next-auth';
import { NextRequest } from 'next/server';
import { Decimal } from '@prisma/client/runtime/library';

vi.mock('../libs/prisma');
vi.mock('next-auth', () => ({
  getServerSession: vi.fn()
}));
vi.mock('../src/app/auth', () => ({
  authOptions: {}
}));

describe('Overview API Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('GET overview should return 401 when user is not authenticated', async () => {
    const req = new NextRequest('http://localhost/api/overview', {
      method: 'GET'
    });

    vi.mocked(getServerSession).mockResolvedValue(null);

    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data).toStrictEqual({ error: 'Unauthorized' });
  });

  test('GET overview should return 404 when user is not in a household', async () => {
    const req = new NextRequest('http://localhost/api/overview', {
      method: 'GET'
    });

    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: '1', name: 'Test User', email: 'test@example.com' },
      expires: ''
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

    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data).toStrictEqual({ error: 'User not in a household' });
  });

  test('GET overview should return 500 on database error', async () => {
    const req = new NextRequest('http://localhost/api/overview', {
      method: 'GET'
    });

    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: '1', name: 'Test User', email: 'test@example.com' },
      expires: ''
    });

    prisma.user.findUnique.mockRejectedValue(new Error('Database error'));

    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toStrictEqual({ error: 'Failed to fetch overview data' });
  });

  test('GET overview should return data with default date when no date parameter', async () => {
    const req = new NextRequest('http://localhost/api/overview', {
      method: 'GET'
    });

    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: '1', name: 'Test User', email: 'test@example.com' },
      expires: ''
    });

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

    prisma.user.findUnique.mockResolvedValue(mockUser);

    const testDate = new Date();
    const mockEvents = [
      { 
        id: 1, 
        name: 'Test Event', 
        description: 'Test Description', 
        date: testDate, 
        location: 'Test Location',
        createdBy: { username: 'testuser' },
        createdAt: testDate,
        householdId: 1,
        cycle: 0,
        updatedAt: testDate,
        createdById: 1,
        repeatCount: 0,
        parentEventId: null
      }
    ];

    const mockChores = [
      {
        id: 1,
        name: 'Test Chore',
        description: 'Test Description',
        dueDate: testDate,
        priority: 1,
        createdBy: { username: 'testuser' },
        createdAt: testDate,
        householdId: 1,
        cycle: 0,
        updatedAt: testDate,
        createdById: 1,
        repeatCount: 0,
        done: false,
        doneById: null,
        parentChoreId: null
      }
    ];

    const mockDecimal = new Decimal(100);

    const mockBills = [
      {
        id: 1,
        name: 'Test Bill',
        description: 'Test Description',
        amount: mockDecimal,
        dueDate: testDate,
        createdBy: { username: 'testuser' },
        createdAt: testDate,
        householdId: 1,
        cycle: 0,
        updatedAt: testDate,
        createdById: 1,
        paidById: null
      }
    ];

    const mockShoppingItems = [
      {
        id: 1,
        name: 'Test Item',
        cost: 50,
        createdAt: testDate,
        createdBy: { username: 'testuser' },
        householdId: 1,
        updatedAt: testDate,
        createdById: 1,
        boughtById: null
      }
    ];

    prisma.event.findMany.mockResolvedValue(mockEvents);
    prisma.chore.findMany.mockResolvedValue(mockChores);
    prisma.bill.findMany.mockResolvedValue(mockBills);
    prisma.shoppingItem.findMany.mockResolvedValue(mockShoppingItems);

    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('events');
    expect(data).toHaveProperty('chores');
    expect(data).toHaveProperty('bills');
    expect(data).toHaveProperty('shoppingItems');
    
    expect(data.events[0]).toHaveProperty('id', 1);
    expect(data.events[0]).toHaveProperty('name', 'Test Event');
    expect(data.events[0]).toHaveProperty('description', 'Test Description');
    expect(data.events[0]).toHaveProperty('location', 'Test Location');
    expect(data.events[0]).toHaveProperty('date');
    expect(data.events[0].createdBy).toHaveProperty('username', 'testuser');
    
    expect(data.chores[0]).toHaveProperty('id', 1);
    expect(data.chores[0]).toHaveProperty('name', 'Test Chore');
    expect(data.chores[0]).toHaveProperty('priority', 1);
    
    expect(data.bills[0]).toHaveProperty('amount', 100);
    
    expect(data.shoppingItems[0]).toHaveProperty('id', 1);
    expect(data.shoppingItems[0]).toHaveProperty('name', 'Test Item');
    expect(data.shoppingItems[0]).toHaveProperty('cost', 50);
  });

  test('GET overview should use provided date parameter', async () => {
    const testDate = '2025-06-01';
    const req = new NextRequest(`http://localhost/api/overview?date=${testDate}`, {
      method: 'GET'
    });

    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: '1', name: 'Test User', email: 'test@example.com' },
      expires: ''
    });

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

    prisma.user.findUnique.mockResolvedValue(mockUser);
    prisma.event.findMany.mockResolvedValue([]);
    prisma.chore.findMany.mockResolvedValue([]);
    prisma.bill.findMany.mockResolvedValue([]);
    prisma.shoppingItem.findMany.mockResolvedValue([]);

    await GET(req);

    expect(prisma.event.findMany).toHaveBeenCalled();
    expect(prisma.chore.findMany).toHaveBeenCalled();
    expect(prisma.bill.findMany).toHaveBeenCalled();
    expect(prisma.shoppingItem.findMany).toHaveBeenCalled();
    
    expect(prisma.event.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          householdId: 1
        })
      })
    );
  });

  test('GET overview should correctly parse bill amounts', async () => {
    const req = new NextRequest('http://localhost/api/overview', {
      method: 'GET'
    });

    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: '1', name: 'Test User', email: 'test@example.com' },
      expires: ''
    });

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

    prisma.user.findUnique.mockResolvedValue(mockUser);
    prisma.event.findMany.mockResolvedValue([]);
    prisma.chore.findMany.mockResolvedValue([]);
    
    const mockDecimal = new Decimal('123.45');
    const testDate = new Date();
    
    const mockBills = [
      {
        id: 1,
        name: 'Test Bill',
        description: 'Test Description',
        amount: mockDecimal,
        dueDate: new Date(),
        createdBy: { username: 'testuser' },
        createdAt: testDate,
        householdId: 1,
        cycle: 0,
        updatedAt: testDate,
        createdById: 1,
        paidById: null
      }
    ];

    prisma.bill.findMany.mockResolvedValue(mockBills);
    prisma.shoppingItem.findMany.mockResolvedValue([]);

    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.bills[0].amount).toBe(123.45);
  });
});