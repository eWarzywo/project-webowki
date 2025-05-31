import { expect, test, vi, describe, beforeEach } from 'vitest';
import { GET } from '../src/app/api/overview/chores/route';
import prisma from '../libs/__mocks__/prisma';
import { getServerSession } from 'next-auth';
import { NextRequest } from 'next/server';
import { addDays } from 'date-fns';

vi.mock('../libs/prisma');
vi.mock('next-auth', () => ({
    getServerSession: vi.fn(),
}));
vi.mock('../src/app/auth', () => ({
    authOptions: {},
}));

describe('Overview Chores API Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    test('GET overview/chores should return 401 when user is not authenticated', async () => {
        const req = new NextRequest('http://localhost/api/overview/chores', {
            method: 'GET',
        });

        vi.mocked(getServerSession).mockResolvedValue(null);

        const response = await GET(req);
        const data = await response.json();

        expect(response.status).toBe(401);
        expect(data).toStrictEqual({ error: 'Unauthorized' });
    });

    test('GET overview/chores should return 404 when user is not in a household', async () => {
        const req = new NextRequest('http://localhost/api/overview/chores', {
            method: 'GET',
        });

        vi.mocked(getServerSession).mockResolvedValue({
            user: { id: '1', name: 'Test User', email: 'test@example.com' },
            expires: '',
        });

        prisma.user.findUnique.mockResolvedValue({
            id: 1,
            username: 'testuser',
            email: 'test@example.com',
            householdId: null,
            createdAt: new Date(),
            passwordHash: 'hash123',
            profilePictureId: null,
        });

        const response = await GET(req);
        const data = await response.json();

        expect(response.status).toBe(404);
        expect(data).toStrictEqual({ error: 'User not in a household' });
    });

    test('GET overview/chores should return 500 when database error occurs', async () => {
        const req = new NextRequest('http://localhost/api/overview/chores', {
            method: 'GET',
        });

        vi.mocked(getServerSession).mockResolvedValue({
            user: { id: '1', name: 'Test User', email: 'test@example.com' },
            expires: '',
        });

        prisma.user.findUnique.mockRejectedValue(new Error('Database error'));

        const response = await GET(req);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data).toStrictEqual({ error: 'Failed to fetch chores' });
    });

    test('GET overview/chores should return chores for default date when no date parameter', async () => {
        const req = new NextRequest('http://localhost/api/overview/chores', {
            method: 'GET',
        });

        vi.mocked(getServerSession).mockResolvedValue({
            user: { id: '1', name: 'Test User', email: 'test@example.com' },
            expires: '',
        });

        const mockUser = {
            id: 1,
            username: 'testuser',
            email: 'test@example.com',
            householdId: 1,
            household: { id: 1, name: 'Test Household' },
            createdAt: new Date(),
            passwordHash: 'hash123',
            profilePictureId: null,
        };

        const testDate = new Date();
        const mockChores = [
            {
                id: 1,
                name: 'Test Chore 1',
                description: 'Test Description 1',
                dueDate: testDate,
                priority: 5,
                createdAt: new Date(),
                updatedAt: new Date(),
                householdId: 1,
                createdById: 1,
                cycle: 0,
                repeatCount: 0,
                done: false,
                doneById: null,
                parentChoreId: null,
                createdBy: {
                    username: 'testuser',
                },
            },
            {
                id: 2,
                name: 'Test Chore 2',
                description: 'Test Description 2',
                dueDate: addDays(testDate, 2),
                priority: 3,
                createdAt: new Date(),
                updatedAt: new Date(),
                householdId: 1,
                createdById: 1,
                cycle: 0,
                repeatCount: 0,
                done: false,
                doneById: null,
                parentChoreId: null,
                createdBy: {
                    username: 'testuser',
                },
            },
        ];

        prisma.user.findUnique.mockResolvedValue(mockUser);
        prisma.chore.findMany.mockResolvedValue(mockChores);

        const response = await GET(req);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data).toHaveProperty('chores');
        expect(data.chores).toHaveLength(2);
        expect(data.chores[0]).toHaveProperty('id', 1);
        expect(data.chores[0]).toHaveProperty('name', 'Test Chore 1');
        expect(data.chores[0]).toHaveProperty('priority', 5);
        expect(data.chores[0].createdBy).toHaveProperty('username', 'testuser');
        expect(data.chores[1]).toHaveProperty('id', 2);

        expect(prisma.chore.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                where: expect.objectContaining({
                    householdId: 1,
                    doneById: null,
                    dueDate: expect.objectContaining({
                        gte: expect.any(Date),
                        lte: expect.any(Date),
                    }),
                }),
                select: expect.objectContaining({
                    id: true,
                    name: true,
                    description: true,
                    dueDate: true,
                    priority: true,
                    createdBy: expect.objectContaining({
                        select: expect.objectContaining({
                            username: true,
                        }),
                    }),
                }),
                orderBy: [{ dueDate: 'asc' }, { priority: 'desc' }],
                take: 5,
            }),
        );
    });

    test('GET overview/chores should use provided date parameter', async () => {
        const testDate = '2025-06-01';
        const req = new NextRequest(`http://localhost/api/overview/chores?date=${testDate}`, {
            method: 'GET',
        });

        vi.mocked(getServerSession).mockResolvedValue({
            user: { id: '1', name: 'Test User', email: 'test@example.com' },
            expires: '',
        });

        const mockUser = {
            id: 1,
            username: 'testuser',
            email: 'test@example.com',
            householdId: 1,
            household: { id: 1, name: 'Test Household' },
            createdAt: new Date(),
            passwordHash: 'hash123',
            profilePictureId: null,
        };

        const parsedDate = new Date(testDate);
        const mockChores = [
            {
                id: 3,
                name: 'Future Chore',
                description: 'Future Description',
                dueDate: parsedDate,
                priority: 4,
                createdAt: new Date(),
                updatedAt: new Date(),
                householdId: 1,
                createdById: 1,
                cycle: 0,
                repeatCount: 0,
                done: false,
                doneById: null,
                parentChoreId: null,
                createdBy: {
                    username: 'testuser',
                },
            },
        ];

        prisma.user.findUnique.mockResolvedValue(mockUser);
        prisma.chore.findMany.mockResolvedValue(mockChores);

        const response = await GET(req);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data).toHaveProperty('chores');
        expect(data.chores).toHaveLength(1);
        expect(data.chores[0]).toHaveProperty('id', 3);
        expect(data.chores[0]).toHaveProperty('name', 'Future Chore');

        expect(prisma.chore.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                where: expect.objectContaining({
                    dueDate: expect.objectContaining({
                        gte: expect.any(Date),
                        lte: expect.any(Date),
                    }),
                }),
            }),
        );
    });

    test('GET overview/chores should return empty array when no chores found', async () => {
        const req = new NextRequest('http://localhost/api/overview/chores', {
            method: 'GET',
        });

        vi.mocked(getServerSession).mockResolvedValue({
            user: { id: '1', name: 'Test User', email: 'test@example.com' },
            expires: '',
        });

        const mockUser = {
            id: 1,
            username: 'testuser',
            email: 'test@example.com',
            householdId: 1,
            household: { id: 1, name: 'Test Household' },
            createdAt: new Date(),
            passwordHash: 'hash123',
            profilePictureId: null,
        };

        prisma.user.findUnique.mockResolvedValue(mockUser);
        prisma.chore.findMany.mockResolvedValue([]);

        const response = await GET(req);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data).toHaveProperty('chores');
        expect(data.chores).toEqual([]);
    });

    test('GET overview/chores should return only undone chores', async () => {
        const req = new NextRequest('http://localhost/api/overview/chores', {
            method: 'GET',
        });

        vi.mocked(getServerSession).mockResolvedValue({
            user: { id: '1', name: 'Test User', email: 'test@example.com' },
            expires: '',
        });

        const mockUser = {
            id: 1,
            username: 'testuser',
            email: 'test@example.com',
            householdId: 1,
            household: { id: 1, name: 'Test Household' },
            createdAt: new Date(),
            passwordHash: 'hash123',
            profilePictureId: null,
        };

        const testDate = new Date();
        const mockChores = [
            {
                id: 1,
                name: 'Test Chore',
                description: 'Test Description',
                dueDate: testDate,
                priority: 5,
                createdAt: new Date(),
                updatedAt: new Date(),
                householdId: 1,
                createdById: 1,
                cycle: 0,
                repeatCount: 0,
                done: false,
                doneById: null,
                parentChoreId: null,
                createdBy: {
                    username: 'testuser',
                },
            },
        ];

        prisma.user.findUnique.mockResolvedValue(mockUser);
        prisma.chore.findMany.mockResolvedValue(mockChores);

        const response = await GET(req);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.chores).toHaveLength(1);

        expect(prisma.chore.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                where: expect.objectContaining({
                    doneById: null,
                }),
            }),
        );
    });
});
