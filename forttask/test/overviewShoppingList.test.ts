import { expect, test, vi, describe, beforeEach } from 'vitest';
import { GET } from '../src/app/api/overview/shoppingList/route';
import prisma from '../libs/__mocks__/prisma';
import { getServerSession } from 'next-auth';
import { Session } from 'next-auth';
import { User, ShoppingItem } from '@prisma/client';

vi.mock('../libs/prisma');
vi.mock('next-auth');

describe('Overview Shopping List API', () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    test('GET should return 401 if user is not authenticated', async () => {
        vi.mocked(getServerSession).mockResolvedValueOnce(null);

        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(401);
        expect(data).toStrictEqual({ error: 'Unauthorized' });
    });

    test('GET should return 401 if session has no user ID', async () => {
        const mockSession: Partial<Session> = {
            user: {
                id: '',
                username: '',
                householdId: null,
                name: '',
                email: '',
            },
            expires: '2025-05-21T12:00:00.000Z',
        };

        vi.mocked(getServerSession).mockResolvedValueOnce(mockSession as Session);

        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(401);
        expect(data).toStrictEqual({ error: 'Unauthorized' });
    });

    test('GET should return 404 if user is not in a household', async () => {
        const mockSession: Partial<Session> = {
            user: {
                id: '1',
                username: 'testuser',
                householdId: null,
                name: 'Test User',
                email: 'test@example.com',
            },
            expires: '2025-05-21T12:00:00.000Z',
        };

        vi.mocked(getServerSession).mockResolvedValueOnce(mockSession as Session);

        const mockUser: Partial<User> = {
            id: 1,
            username: 'testuser',
            email: 'test@example.com',
            passwordHash: 'hashedpassword',
            createdAt: new Date(),
            householdId: null,
        };

        vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
            ...mockUser,
            household: null,
        } as User & { household: null });

        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(404);
        expect(data).toStrictEqual({ error: 'User not in a household' });
    });

    test('GET should return shopping items for user in a household', async () => {
        const mockHouseholdId = 1;
        const mockUserId = 1;

        const mockSession: Partial<Session> = {
            user: {
                id: mockUserId.toString(),
                username: 'testuser',
                householdId: mockHouseholdId.toString(),
                name: 'Test User',
                email: 'test@example.com',
            },
            expires: '2025-05-21T12:00:00.000Z',
        };

        vi.mocked(getServerSession).mockResolvedValueOnce(mockSession as Session);

        const mockUser: Partial<User> = {
            id: mockUserId,
            username: 'testuser',
            email: 'test@example.com',
            passwordHash: 'hashedpassword',
            createdAt: new Date(),
            householdId: mockHouseholdId,
        };

        vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
            ...mockUser,
            household: { id: mockHouseholdId, name: 'Test House' },
        } as User & { household: { id: number; name: string } });

        const mockShoppingItems = [
            {
                id: 1,
                name: 'Milk',
                cost: 2.99,
                createdAt: new Date('2025-05-20T10:00:00Z'),
                updatedAt: new Date('2025-05-20T10:00:00Z'),
                createdById: mockUserId,
                boughtById: null,
                householdId: mockHouseholdId,
                createdBy: { username: 'testuser' },
            },
            {
                id: 2,
                name: 'Bread',
                cost: 1.99,
                createdAt: new Date('2025-05-19T10:00:00Z'),
                updatedAt: new Date('2025-05-19T10:00:00Z'),
                createdById: mockUserId,
                boughtById: null,
                householdId: mockHouseholdId,
                createdBy: { username: 'testuser' },
            },
            {
                id: 3,
                name: 'Eggs',
                cost: 3.49,
                createdAt: new Date('2025-05-18T10:00:00Z'),
                updatedAt: new Date('2025-05-18T10:00:00Z'),
                createdById: 2,
                boughtById: null,
                householdId: mockHouseholdId,
                createdBy: { username: 'anotheruser' },
            },
        ];

        vi.mocked(prisma.shoppingItem.findMany).mockResolvedValueOnce(mockShoppingItems as unknown as ShoppingItem[]);

        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data).toHaveProperty('shoppingItems');
        expect(data.shoppingItems).toHaveLength(3);

        expect(data.shoppingItems[0].id).toBe(mockShoppingItems[0].id);
        expect(data.shoppingItems[0].name).toBe(mockShoppingItems[0].name);
        expect(data.shoppingItems[0].cost).toBe(mockShoppingItems[0].cost);
        expect(data.shoppingItems[0].createdBy.username).toBe(mockShoppingItems[0].createdBy.username);
        expect(data.shoppingItems[0].createdAt).toBeTruthy();

        expect(data.shoppingItems[1].id).toBe(mockShoppingItems[1].id);
        expect(data.shoppingItems[2].id).toBe(mockShoppingItems[2].id);

        expect(prisma.shoppingItem.findMany).toHaveBeenCalledWith({
            where: {
                householdId: mockHouseholdId,
                boughtById: null,
            },
            select: {
                id: true,
                name: true,
                cost: true,
                createdAt: true,
                createdBy: {
                    select: {
                        username: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'asc',
            },
            take: 5,
        });
    });

    test('GET should handle empty shopping items list', async () => {
        const mockHouseholdId = 1;
        const mockUserId = 1;

        const mockSession: Partial<Session> = {
            user: {
                id: mockUserId.toString(),
                username: 'testuser',
                householdId: mockHouseholdId.toString(),
                name: 'Test User',
                email: 'test@example.com',
            },
            expires: '2025-05-21T12:00:00.000Z',
        };

        vi.mocked(getServerSession).mockResolvedValueOnce(mockSession as Session);

        const mockUser: Partial<User> = {
            id: mockUserId,
            username: 'testuser',
            email: 'test@example.com',
            passwordHash: 'hashedpassword',
            createdAt: new Date(),
            householdId: mockHouseholdId,
        };

        vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
            ...mockUser,
            household: { id: mockHouseholdId, name: 'Test House' },
        } as User & { household: { id: number; name: string } });

        vi.mocked(prisma.shoppingItem.findMany).mockResolvedValueOnce([]);

        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data).toHaveProperty('shoppingItems');
        expect(data.shoppingItems).toHaveLength(0);
        expect(data.shoppingItems).toEqual([]);
    });

    test('GET should return 500 when database operation fails', async () => {
        const mockSession: Partial<Session> = {
            user: {
                id: '1',
                username: 'testuser',
                householdId: '1',
                name: 'Test User',
                email: 'test@example.com',
            },
            expires: '2025-05-21T12:00:00.000Z',
        };

        vi.mocked(getServerSession).mockResolvedValueOnce(mockSession as Session);

        const mockUser: Partial<User> = {
            id: 1,
            username: 'testuser',
            email: 'test@example.com',
            passwordHash: 'hashedpassword',
            createdAt: new Date(),
            householdId: 1,
        };

        vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
            ...mockUser,
            household: { id: 1, name: 'Test House' },
        } as User & { household: { id: number; name: string } });

        vi.mocked(prisma.shoppingItem.findMany).mockRejectedValueOnce(new Error('Database error'));

        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data).toStrictEqual({ error: 'Failed to fetch shopping items' });
        expect(consoleErrorSpy).toHaveBeenCalled();

        consoleErrorSpy.mockRestore();
    });
});
