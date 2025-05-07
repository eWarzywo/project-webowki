import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '../src/app/api/household/join/route';
import { getServerSession } from 'next-auth/next';

vi.mock('next-auth/next', () => ({
    getServerSession: vi.fn(),
}));

vi.mock('../libs/prisma', () => {
    return {
        default: {
            user: {
                findUnique: vi.fn(),
                update: vi.fn(),
            },
            household: {
                findUnique: vi.fn(),
            },
        },
    };
});

import prisma from '../libs/prisma';

describe('Household Join API', () => {
    beforeEach(() => {
        vi.resetAllMocks();

        vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
        vi.mocked(prisma.household.findUnique).mockResolvedValue(null);
        vi.mocked(prisma.user.update).mockResolvedValue({} as any);
    });

    const createMockRequest = (body: any) => {
        return {
            json: () => Promise.resolve(body),
        } as unknown as Request;
    };

    it('should return 401 if user is not authenticated', async () => {
        vi.mocked(getServerSession).mockResolvedValue(null);

        const req = createMockRequest({ joinCode: 'ABC123' });
        const response = await POST(req);
        const responseBody = await response.json();

        expect(response.status).toBe(401);
        expect(responseBody).toEqual({ message: 'You must be logged in to join a household' });
    });

    it('should return 400 if join code is missing', async () => {
        vi.mocked(getServerSession).mockResolvedValue({
            user: { id: '1' },
        } as any);

        const req = createMockRequest({ joinCode: '' });
        const response = await POST(req);
        const responseBody = await response.json();

        expect(response.status).toBe(400);
        expect(responseBody.message).toContain('Join code is required');
    });

    it('should return 404 if user not found', async () => {
        vi.mocked(getServerSession).mockResolvedValue({
            user: { id: '1' },
        } as any);

        vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

        const req = createMockRequest({ joinCode: 'ABC123' });
        const response = await POST(req);
        const responseBody = await response.json();

        expect(response.status).toBe(404);
        expect(responseBody).toEqual({ message: 'User not found' });
    });

    it('should return 409 if user already belongs to a household', async () => {
        vi.mocked(getServerSession).mockResolvedValue({
            user: { id: '1' },
        } as any);

        vi.mocked(prisma.user.findUnique).mockResolvedValue({
            id: 1,
            username: 'testuser',
            email: 'test@example.com',
            householdId: 42,
            household: {
                id: 42,
                name: 'Existing Household',
            },
        } as any);

        const req = createMockRequest({ joinCode: 'ABC123' });
        const response = await POST(req);
        const responseBody = await response.json();

        expect(response.status).toBe(409);
        expect(responseBody.message).toContain('already a member of a household');
    });

    it('should return 409 if user owns another household', async () => {
        vi.mocked(getServerSession).mockResolvedValue({
            user: { id: '1' },
        } as any);

        vi.mocked(prisma.user.findUnique).mockResolvedValue({
            id: 1,
            username: 'testuser',
            email: 'test@example.com',
            householdId: null,
            household: null,
        } as any);

        vi.mocked(prisma.household.findUnique).mockResolvedValue({
            id: 99,
            name: 'Owned Household',
            ownerId: 1,
        } as any);

        const req = createMockRequest({ joinCode: 'ABC123' });
        const response = await POST(req);
        const responseBody = await response.json();

        expect(response.status).toBe(409);
        expect(responseBody.message).toContain('As a household owner');
    });

    it('should return 404 if household with join code not found', async () => {
        vi.mocked(getServerSession).mockResolvedValue({
            user: { id: '1' },
        } as any);

        vi.mocked(prisma.user.findUnique).mockResolvedValue({
            id: 1,
            username: 'testuser',
            email: 'test@example.com',
            householdId: null,
            household: null,
        } as any);

        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        // tajpskript diff
        vi.mocked(prisma.household.findUnique).mockImplementation((params) => {
            if (params.where.ownerId) {
                return Promise.resolve(null);
            }
            if (params.where.joinCode) {
                return Promise.resolve(null);
            }
            return Promise.resolve(null);
        });

        const req = createMockRequest({ joinCode: 'INVALID' });
        const response = await POST(req);
        const responseBody = await response.json();

        expect(response.status).toBe(404);
        expect(responseBody.message).toContain('Invalid join code');
    });

    it('should successfully join a household', async () => {
        vi.mocked(getServerSession).mockResolvedValue({
            user: { id: '1' },
        } as any);

        const mockUser = {
            id: 1,
            username: 'testuser',
            email: 'test@example.com',
            householdId: null,
            household: null,
        };

        vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);

        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        // tajpskript diff
        vi.mocked(prisma.household.findUnique).mockImplementation((params) => {
            if (params.where.ownerId) {
                return Promise.resolve(null);
            }
            if (params.where.joinCode) {
                return Promise.resolve({
                    id: 42,
                    name: 'Test Household',
                    joinCode: 'ABC123',
                    createdAt: new Date(),
                    ownerId: 99,
                    owner: {
                        id: 99,
                        username: 'owner',
                        email: 'owner@example.com',
                    },
                    users: [
                        {
                            id: 99,
                            username: 'owner',
                            email: 'owner@example.com',
                        },
                    ],
                } as any);
            }
            return Promise.resolve(null);
        });

        vi.mocked(prisma.user.update).mockResolvedValue({
            ...mockUser,
            householdId: 42,
        } as any);

        const req = createMockRequest({ joinCode: 'ABC123' });
        const response = await POST(req);
        const responseBody = await response.json();

        expect(response.status).toBe(200);
        expect(responseBody.message).toBe('Successfully joined household');
        expect(responseBody.household).toHaveProperty('id', 42);
        expect(responseBody.household).toHaveProperty('name', 'Test Household');
        expect(responseBody.household.users).toHaveLength(2);

        expect(prisma.user.update).toHaveBeenCalledWith({
            where: { id: 1 },
            data: { householdId: 42 },
        });
    });

    it('should handle errors and return 500', async () => {
        vi.mocked(getServerSession).mockResolvedValue({
            user: { id: '1' },
        } as any);

        vi.mocked(prisma.user.findUnique).mockRejectedValue(new Error('Database error'));

        const req = createMockRequest({ joinCode: 'ABC123' });
        const response = await POST(req);
        const responseBody = await response.json();

        expect(response.status).toBe(500);
        expect(responseBody).toEqual({ message: 'Failed to join household' });
    });
});
