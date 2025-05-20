import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '../src/app/api/household/join/route';
import { getServerSession } from 'next-auth/next';

type User = {
    id: number;
    username: string;
    email: string;
    passwordHash: string;
    createdAt: Date;
    profilePictureId: number | null;
    householdId: number | null;
    household: Household | null;
};

type Household = {
    id: number;
    name: string;
    joinCode: string;
    createdAt: Date;
    ownerId: number;
    owner: User;
    users: User[];
};

type Session = {
    user: {
        id: string;
    };
};

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
        vi.mocked(prisma.user.update).mockResolvedValue({} as User);
    });

    const createMockRequest = (body: { joinCode: string }) => {
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
        } as Session);

        const req = createMockRequest({ joinCode: '' });
        const response = await POST(req);
        const responseBody = await response.json();

        expect(response.status).toBe(400);
        expect(responseBody.message).toContain('Join code is required');
    });

    it('should return 404 if user not found', async () => {
        vi.mocked(getServerSession).mockResolvedValue({
            user: { id: '1' },
        } as Session);

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
        } as Session);

        const mockUser: User = {
            id: 1,
            username: 'testuser',
            email: 'test@example.com',
            passwordHash: 'hashed_password',
            createdAt: new Date(),
            profilePictureId: null,
            householdId: 42,
            household: {
                id: 42,
                name: 'Existing Household',
                joinCode: 'XYZ789',
                createdAt: new Date(),
                ownerId: 99,
                owner: {
                    id: 99,
                    username: 'owner',
                    email: 'owner@example.com',
                    passwordHash: 'hashed_password',
                    createdAt: new Date(),
                    profilePictureId: null,
                    householdId: 42,
                    household: null
                },
                users: []
            },
        };

        vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);

        const req = createMockRequest({ joinCode: 'ABC123' });
        const response = await POST(req);
        const responseBody = await response.json();

        expect(response.status).toBe(409);
        expect(responseBody.message).toContain('already a member of a household');
    });

    it('should return 409 if user owns another household', async () => {
        vi.mocked(getServerSession).mockResolvedValue({
            user: { id: '1' },
        } as Session);

        const mockUser: User = {
            id: 1,
            username: 'testuser',
            email: 'test@example.com',
            passwordHash: 'hashed_password',
            createdAt: new Date(),
            profilePictureId: null,
            householdId: null,
            household: null,
        };

        vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);

        const mockHousehold: Household = {
            id: 99,
            name: 'Owned Household',
            joinCode: 'OWNER123',
            createdAt: new Date(),
            ownerId: 1,
            owner: mockUser,
            users: [mockUser],
        };

        vi.mocked(prisma.household.findUnique).mockResolvedValue(mockHousehold);

        const req = createMockRequest({ joinCode: 'ABC123' });
        const response = await POST(req);
        const responseBody = await response.json();

        expect(response.status).toBe(409);
        expect(responseBody.message).toContain('As a household owner');
    });

    it('should return 404 if household with join code not found', async () => {
        vi.mocked(getServerSession).mockResolvedValue({
            user: { id: '1' },
        } as Session);

        const mockUser: User = {
            id: 1,
            username: 'testuser',
            email: 'test@example.com',
            passwordHash: 'hashed_password',
            createdAt: new Date(),
            profilePictureId: null,
            householdId: null,
            household: null,
        };

        vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);

        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
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
        } as Session);

        const mockUser: User = {
            id: 1,
            username: 'testuser',
            email: 'test@example.com',
            passwordHash: 'hashed_password',
            createdAt: new Date(),
            profilePictureId: null,
            householdId: null,
            household: null,
        };

        vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);

        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        vi.mocked(prisma.household.findUnique).mockImplementation((params) => {
            if (params.where.ownerId) {
                return Promise.resolve(null);
            }
            if (params.where.joinCode) {
                const mockHousehold: Household = {
                    id: 42,
                    name: 'Test Household',
                    joinCode: 'ABC123',
                    createdAt: new Date(),
                    ownerId: 99,
                    owner: {
                        id: 99,
                        username: 'owner',
                        email: 'owner@example.com',
                        passwordHash: 'hashed_password',
                        createdAt: new Date(),
                        profilePictureId: null,
                        householdId: 42,
                        household: null,
                    } as User,
                    users: [
                        {
                            id: 99,
                            username: 'owner',
                            email: 'owner@example.com',
                            passwordHash: 'hashed_password',
                            createdAt: new Date(),
                            profilePictureId: null,
                            householdId: 42,
                            household: null,
                        } as User,
                    ],
                };
                return Promise.resolve(mockHousehold);
            }
            return Promise.resolve(null);
        });

        const updatedUser: User = {
            ...mockUser,
            householdId: 42,
            household: null,
        };
        
        vi.mocked(prisma.user.update).mockResolvedValue(updatedUser);

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
        } as Session);

        vi.mocked(prisma.user.findUnique).mockRejectedValue(new Error('Database error'));

        const req = createMockRequest({ joinCode: 'ABC123' });
        const response = await POST(req);
        const responseBody = await response.json();

        expect(response.status).toBe(500);
        expect(responseBody).toEqual({ message: 'Failed to join household' });
    });
});
