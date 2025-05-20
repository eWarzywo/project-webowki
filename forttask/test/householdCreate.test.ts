import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '../src/app/api/household/create/route';
import prisma from '../libs/prisma';
import * as nextAuthNext from 'next-auth/next';
import { authOptions } from '../src/app/auth';

type User = {
    id: number;
    username: string;
    email: string;
    passwordHash: string;
    createdAt: Date;
    profilePictureId: number | null;
    householdId: number | null;
};

type Household = {
    id: number;
    name: string;
    joinCode: string;
    createdAt: Date;
    ownerId: number;
    owner?: User;
    users?: User[];
};

interface SessionWithUser {
    user: {
        id: string;
        householdId?: string | null;
    };
}

interface HouseholdRequestBody {
    householdName: string;
}

vi.mock('next-auth/next', () => ({
    getServerSession: vi.fn()
}));

vi.mock('../src/app/auth', () => ({
    authOptions: {}
}));

vi.mock('../libs/prisma', () => ({
    default: {
        household: {
            findUnique: vi.fn(),
            create: vi.fn(),
        },
        user: {
            update: vi.fn(),
        },
    },
}));

describe('Household Creation API', () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    const createMockRequest = (body: HouseholdRequestBody) => {
        return {
            json: () => Promise.resolve(body),
        } as unknown as Request;
    };

    it('should return 401 if user is not authenticated', async () => {
        vi.mocked(nextAuthNext.getServerSession).mockResolvedValue(null);

        const req = createMockRequest({ householdName: 'Test Household' });
        const response = await POST(req);
        const responseBody = await response.json();

        expect(response.status).toBe(401);
        expect(responseBody).toEqual({ message: 'You must be logged in to create a household' });
        
        expect(nextAuthNext.getServerSession).toHaveBeenCalledWith(authOptions);
    });

    it('should return 400 if household name is too short', async () => {
        vi.mocked(nextAuthNext.getServerSession).mockResolvedValue({
            user: { id: '1' },
        } as SessionWithUser);

        const req = createMockRequest({ householdName: 'Te' });
        const response = await POST(req);
        const responseBody = await response.json();

        expect(response.status).toBe(400);
        expect(responseBody.message).toContain('must be at least 3 characters');
        
        expect(nextAuthNext.getServerSession).toHaveBeenCalledWith(authOptions);
    });

    it('should return 409 if user already owns a household', async () => {
        vi.mocked(nextAuthNext.getServerSession).mockResolvedValue({
            user: { id: '1' },
        } as SessionWithUser);

        vi.mocked(prisma.household.findUnique).mockResolvedValue({
            id: 1,
            name: 'Existing Household',
            joinCode: 'ABC123',
            createdAt: new Date(),
            ownerId: 1,
        } as Household);

        const req = createMockRequest({ householdName: 'Test Household' });
        const response = await POST(req);
        const responseBody = await response.json();

        expect(response.status).toBe(409);
        expect(responseBody).toEqual({
            message: 'You already own a household. You can only own one household at a time.',
        });
        
        expect(nextAuthNext.getServerSession).toHaveBeenCalledWith(authOptions);
    });

    it('should create a household with a unique join code', async () => {
        vi.mocked(nextAuthNext.getServerSession).mockResolvedValue({
            user: { id: '1' },
        } as SessionWithUser);

        vi.mocked(prisma.household.findUnique).mockResolvedValueOnce(null);
        vi.mocked(prisma.household.findUnique).mockResolvedValueOnce(null);

        const mockNewHousehold: Household = {
            id: 1,
            name: 'Test Household',
            joinCode: 'ABC123',
            createdAt: new Date(),
            ownerId: 1,
            owner: {
                id: 1,
                username: 'testuser',
                email: 'test@example.com',
                passwordHash: 'hashed_password',
                createdAt: new Date(),
                profilePictureId: null,
                householdId: null,
            },
            users: [
                {
                    id: 1,
                    username: 'testuser',
                    email: 'test@example.com',
                    passwordHash: 'hashed_password',
                    createdAt: new Date(),
                    profilePictureId: null,
                    householdId: null,
                },
            ],
        };

        vi.mocked(prisma.household.create).mockResolvedValue(mockNewHousehold);
        vi.mocked(prisma.user.update).mockResolvedValue({
            id: 1,
            username: 'testuser',
            email: 'test@example.com',
            passwordHash: 'hashed_password',
            createdAt: new Date(),
            profilePictureId: null,
            householdId: 1,
        });

        const req = createMockRequest({ householdName: 'Test Household' });
        const response = await POST(req);
        const responseBody = await response.json();

        expect(response.status).toBe(201);
        expect(responseBody.message).toBe('Household created successfully');
        expect(responseBody.household).toHaveProperty('id', 1);
        expect(responseBody.household).toHaveProperty('name', 'Test Household');
        expect(responseBody.household).toHaveProperty('joinCode', 'ABC123');

        expect(prisma.user.update).toHaveBeenCalledWith({
            where: { id: 1 },
            data: { householdId: 1 },
        });
        
        expect(nextAuthNext.getServerSession).toHaveBeenCalledWith(authOptions);
    });

    it('should handle join code collisions and generate a new one', async () => {
        vi.mocked(nextAuthNext.getServerSession).mockResolvedValue({
            user: { id: '1' },
        } as SessionWithUser);

        vi.mocked(prisma.household.findUnique).mockResolvedValueOnce(null);
        vi.mocked(prisma.household.findUnique).mockResolvedValueOnce({
            id: 999,
            joinCode: 'COLLISION',
            createdAt: new Date(),
            ownerId: 999,
        } as Household);
        vi.mocked(prisma.household.findUnique).mockResolvedValueOnce(null);

        const mockNewHousehold: Household = {
            id: 1,
            name: 'Test Household',
            joinCode: 'UNIQUE1',
            createdAt: new Date(),
            ownerId: 1,
            owner: {
                id: 1,
                username: 'testuser',
                email: 'test@example.com',
                passwordHash: 'hashed_password',
                createdAt: new Date(),
                profilePictureId: null,
                householdId: null,
            },
            users: [
                {
                    id: 1,
                    username: 'testuser',
                    email: 'test@example.com',
                    passwordHash: 'hashed_password',
                    createdAt: new Date(),
                    profilePictureId: null,
                    householdId: null,
                },
            ],
        };

        vi.mocked(prisma.household.create).mockResolvedValue(mockNewHousehold);
        vi.mocked(prisma.user.update).mockResolvedValue({
            id: 1,
            username: 'testuser',
            email: 'test@example.com',
            passwordHash: 'hashed_password',
            createdAt: new Date(),
            profilePictureId: null,
            householdId: 1,
        });

        const req = createMockRequest({ householdName: 'Test Household' });
        const response = await POST(req);
        const responseBody = await response.json();

        expect(response.status).toBe(201);
        expect(responseBody.household.joinCode).toBe('UNIQUE1');

        expect(prisma.household.findUnique).toHaveBeenCalledTimes(3);
        
        expect(nextAuthNext.getServerSession).toHaveBeenCalledWith(authOptions);
    });

    it('should return 500 if an error occurs during creation', async () => {
        vi.mocked(nextAuthNext.getServerSession).mockResolvedValue({
            user: { id: '1' },
        } as SessionWithUser);

        vi.mocked(prisma.household.findUnique).mockResolvedValue(null);
        vi.mocked(prisma.household.create).mockRejectedValue(new Error('Database error'));

        const req = createMockRequest({ householdName: 'Test Household' });
        const response = await POST(req);
        const responseBody = await response.json();

        expect(response.status).toBe(500);
        expect(responseBody).toEqual({ message: 'Failed to create household' });
        
        // Verify authOptions was passed
        expect(nextAuthNext.getServerSession).toHaveBeenCalledWith(authOptions);
    });
});
