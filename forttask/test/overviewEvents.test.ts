import { expect, test, vi, describe, beforeEach } from 'vitest';
import { GET } from '../src/app/api/overview/events/route';
import prisma from '../libs/__mocks__/prisma';
import { getServerSession } from 'next-auth';
import { NextRequest } from 'next/server';

vi.mock('../libs/prisma');
vi.mock('next-auth', () => ({
    getServerSession: vi.fn(),
}));
vi.mock('../src/app/auth', () => ({
    authOptions: {},
}));

describe('Overview Events API Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    function createMockRequest(query = {}): NextRequest {
        const url = new URL('http://localhost:3000/api/overview/events');
        Object.entries(query).forEach(([key, value]) => {
            url.searchParams.append(key, String(value));
        });
        return new NextRequest(url);
    }

    test('GET overview/events should return 401 when user is not authenticated', async () => {
        const req = createMockRequest();
        vi.mocked(getServerSession).mockResolvedValue(null);

        const response = await GET(req);
        const data = await response.json();

        expect(response.status).toBe(401);
        expect(data).toHaveProperty('error', 'Unauthorized');
    });

    test('GET overview/events should return 404 when user has no household', async () => {
        const req = createMockRequest();
        vi.mocked(getServerSession).mockResolvedValue({
            user: { id: '1' },
        });

        vi.mocked(prisma.user.findUnique).mockResolvedValue({
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
        expect(data).toHaveProperty('error', 'User not in a household');
    });

    test('GET overview/events should return upcoming events for the next week', async () => {
        const today = new Date();
        const req = createMockRequest({ date: today.toISOString() });

        vi.mocked(getServerSession).mockResolvedValue({
            user: { id: '1' },
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

        const tomorrow = new Date(today.getTime() + 86400000);
        const dayAfterTomorrow = new Date(today.getTime() + 172800000);

        const mockEvents = [
            {
                id: 1,
                name: 'Test Event',
                description: 'Test Description',
                date: tomorrow,
                location: 'Test Location',
                createdBy: {
                    username: 'testuser',
                },
                householdId: 1,
                createdById: 1,
                createdAt: today,
                updatedAt: today,
                cycle: 0,
                repeatCount: 0,
                parentEventId: null,
            },
            {
                id: 2,
                name: 'Test Event',
                description: 'Test Description',
                date: dayAfterTomorrow,
                location: 'Test Location',
                createdBy: {
                    username: 'testuser',
                },
                householdId: 1,
                createdById: 2,
                createdAt: today,
                updatedAt: today,
                cycle: 0,
                repeatCount: 0,
                parentEventId: null,
            },
        ];

        vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);
        vi.mocked(prisma.event.findMany).mockResolvedValue(mockEvents);

        const response = await GET(req);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data).toHaveProperty('events');

        expect(data.events).toHaveLength(2);
        expect(data.events[0]).toMatchObject({
            id: 1,
            name: 'Test Event',
            description: 'Test Description',
            location: 'Test Location',
            createdBy: {
                username: 'testuser',
            },
        });
        expect(data.events[1]).toMatchObject({
            id: 2,
            name: 'Test Event',
            description: 'Test Description',
            location: 'Test Location',
            createdBy: {
                username: 'testuser',
            },
        });

        expect(typeof data.events[0].date).toBe('string');
        expect(typeof data.events[1].date).toBe('string');

        expect(prisma.event.findMany).toHaveBeenCalledWith({
            where: {
                householdId: 1,
                date: {
                    gte: expect.any(Date),
                    lte: expect.any(Date),
                },
            },
            select: {
                id: true,
                name: true,
                description: true,
                date: true,
                location: true,
                createdBy: {
                    select: {
                        username: true,
                    },
                },
            },
            orderBy: {
                date: 'asc',
            },
            take: 5,
        });
    });

    test('GET overview/events should use current date when no date is provided', async () => {
        const req = createMockRequest();

        vi.mocked(getServerSession).mockResolvedValue({
            user: { id: '1' },
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

        vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);
        vi.mocked(prisma.event.findMany).mockResolvedValue([]);

        await GET(req);

        expect(prisma.event.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                where: expect.objectContaining({
                    date: {
                        gte: expect.any(Date),
                        lte: expect.any(Date),
                    },
                }),
            }),
        );
    });

    test('GET overview/events should handle server errors gracefully', async () => {
        const req = createMockRequest();

        vi.mocked(getServerSession).mockResolvedValue({
            user: { id: '1' },
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

        vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);
        vi.mocked(prisma.event.findMany).mockRejectedValue(new Error('Database error'));

        const response = await GET(req);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data).toHaveProperty('error', 'Failed to fetch events');
    });
});
