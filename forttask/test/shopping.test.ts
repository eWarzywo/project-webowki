import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST, DELETE } from '../src/app/api/shoppingList/route';
import { PUT as PUT_Bought } from '../src/app/api/shoppingList/bought/route';
import { GET as GET_Count } from '../src/app/api/shoppingList/totalNumber/route';
import { GET as GET_Details } from '../src/app/api/shoppingList/details/route';
import { PUT as PUT_Unbought } from '../src/app/api/shoppingList/unbought/route';
import prisma from '../libs/__mocks__/prisma';
import { getServerSession } from 'next-auth/next';

vi.mock('../libs/prisma');
vi.mock('next-auth/next', () => ({
    getServerSession: vi.fn(),
}));

type MockSession = {
    user?: {
        id?: string;
        householdId?: string;
    };
    expires?: string;
};

type MockRequestOptions = {
    searchParams?: Record<string, string>;
    body?: Record<string, unknown>;
};

describe('Shopping List GET API', () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    const createMockRequest = (options: MockRequestOptions): Request => {
        const { searchParams = {}, body = {} } = options;

        const url = new URL('http://localhost:3000/api/shoppingList');
        Object.entries(searchParams).forEach(([key, value]) => {
            url.searchParams.append(key, value);
        });

        return {
            url: url.toString(),
            json: () => Promise.resolve(body),
        } as unknown as Request;
    };

    it('should return 401 if user is not logged in', async () => {
        vi.mocked(getServerSession).mockResolvedValueOnce(null);

        const req = createMockRequest({});

        const response = await GET(req);

        expect(response.status).toBe(401);
        const data = await response.json();
        expect(data).toEqual({ message: 'You must be logged in to view the shopping list' });
    });

    it('should return 404 if user is not found', async () => {
        const mockSession: MockSession = {
            user: { id: '1' },
        };
        vi.mocked(getServerSession).mockResolvedValueOnce(mockSession);

        vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null);

        const req = createMockRequest({});

        const response = await GET(req);

        expect(response.status).toBe(404);
        const data = await response.json();
        expect(data).toEqual({ message: 'User not found' });
    });

    it('should return 403 if user is not a member of a household', async () => {
        const mockSession: MockSession = {
            user: { id: '1' },
        };
        vi.mocked(getServerSession).mockResolvedValueOnce(mockSession);

        vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
            id: 1,
            createdAt: new Date('2023-10-01'),
            username: 'testuser',
            email: 'test@test.test',
            passwordHash: 'hashedpassword',
            profilePictureId: null,
            householdId: null,
        });

        const req = createMockRequest({});

        const response = await GET(req);

        expect(response.status).toBe(403);
        const data = await response.json();
        expect(data).toEqual({ message: 'You must be a member of a household to view the shopping list' });
    });

    it('should return 400 if skip parameter is invalid', async () => {
        const mockSession: MockSession = {
            user: { id: '1' },
        };
        vi.mocked(getServerSession).mockResolvedValueOnce(mockSession);

        vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
            id: 1,
            createdAt: new Date('2023-10-01'),
            username: 'testuser',
            email: 'test@test.test',
            passwordHash: 'hashedpassword',
            profilePictureId: null,
            householdId: 1,
        });

        const req = createMockRequest({
            searchParams: { skip: '-1', limit: '10' },
        });

        const response = await GET(req);

        expect(response.status).toBe(400);
        const data = await response.json();
        expect(data).toEqual({ message: 'Invalid skip parameter' });
    });

    it('should return 400 if limit parameter is invalid', async () => {
        const mockSession: MockSession = {
            user: { id: '1' },
        };
        vi.mocked(getServerSession).mockResolvedValueOnce(mockSession);

        vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
            id: 1,
            createdAt: new Date('2023-10-01'),
            username: 'testuser',
            email: 'test@test.test',
            passwordHash: 'hashedpassword',
            profilePictureId: null,
            householdId: 1,
        });

        const req = createMockRequest({
            searchParams: { skip: '0', limit: '0' },
        });

        const response = await GET(req);

        expect(response.status).toBe(400);
        const data = await response.json();
        expect(data).toEqual({ message: 'Invalid limit parameter' });
    });

    it('should return 200 and the shopping list', async () => {
        const mockSession: MockSession = {
            user: { id: '1' },
        };
        vi.mocked(getServerSession).mockResolvedValueOnce(mockSession);

        vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
            id: 1,
            createdAt: new Date('2023-10-01'),
            username: 'testuser',
            email: 'test@test.test',
            passwordHash: 'hashedpassword',
            profilePictureId: null,
            householdId: 1,
        });

        const mockShoppingItems = [
            {
                id: 1,
                name: 'Milk',
                quantity: 2,
                createdAt: new Date('2023-10-01'),
                createdById: 1,
                householdId: 1,
                updatedAt: new Date('2023-10-01'),
                cost: 3.5,
                boughtById: null,
            },
            {
                id: 2,
                name: 'Bread',
                quantity: 1,
                createdAt: new Date('2023-10-02'),
                createdById: 1,
                householdId: 1,
                updatedAt: new Date('2023-10-02'),
                cost: 1.5,
                boughtById: null,
            },
        ];

        vi.mocked(prisma.shoppingItem.findMany).mockResolvedValueOnce(mockShoppingItems);

        const serializedShoppingItems = JSON.parse(JSON.stringify(mockShoppingItems));

        const req = createMockRequest({
            searchParams: { skip: '0', limit: '10' },
        });

        const response = await GET(req);

        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data).toEqual(serializedShoppingItems);
    });

    it('should return 500 if there is an internal server error', async () => {
        const mockSession: MockSession = {
            user: { id: '1' },
        };
        vi.mocked(getServerSession).mockResolvedValueOnce(mockSession);

        vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
            id: 1,
            createdAt: new Date('2023-10-01'),
            username: 'testuser',
            email: 'test@test.test',
            passwordHash: 'hashedpassword',
            profilePictureId: null,
            householdId: 1,
        });

        vi.mocked(prisma.shoppingItem.findMany).mockRejectedValueOnce(new Error('Internal server error'));

        const req = createMockRequest({
            searchParams: { skip: '0', limit: '10' },
        });

        const response = await GET(req);

        expect(response.status).toBe(500);
        const data = await response.json();
        expect(data).toEqual({ message: 'Internal server error' });
    });
});

describe('Shopping List POST API', () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    const createMockRequest = (options: MockRequestOptions): Request => {
        const { body = {} } = options;

        return {
            url: 'http://localhost:3000/api/shoppingList',
            json: () => Promise.resolve(body),
        } as unknown as Request;
    };

    it('should return 401 if user is not logged in', async () => {
        vi.mocked(getServerSession).mockResolvedValueOnce(null);

        const req = createMockRequest({});

        const response = await POST(req);

        expect(response.status).toBe(401);
        const data = await response.json();
        expect(data).toEqual({ message: 'You must be logged in to create a shopping item' });
    });

    it('should return 404 if user is not found', async () => {
        const mockSession: MockSession = {
            user: { id: '1' },
        };
        vi.mocked(getServerSession).mockResolvedValueOnce(mockSession);

        vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null);

        const req = createMockRequest({ body: { name: 'Milk', cost: 2 } });

        const response = await POST(req);

        expect(response.status).toBe(404);
        const data = await response.json();
        expect(data).toEqual({ message: 'User not found' });
    });

    it('should return 403 if user is not a member of a household', async () => {
        const mockSession: MockSession = {
            user: { id: '1' },
        };
        vi.mocked(getServerSession).mockResolvedValueOnce(mockSession);

        vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
            id: 1,
            createdAt: new Date('2023-10-01'),
            username: 'testuser',
            email: 'test@test.test',
            passwordHash: 'hashedpassword',
            profilePictureId: null,
            householdId: null,
        });

        const req = createMockRequest({ body: { name: 'Milk', cost: 2 } });

        const response = await POST(req);

        expect(response.status).toBe(403);
        const data = await response.json();
        expect(data).toEqual({ message: 'You must be a member of a household to add items' });
    });

    it('should return 500 if there is an internal server error', async () => {
        const mockSession: MockSession = {
            user: { id: '1' },
        };
        vi.mocked(getServerSession).mockResolvedValueOnce(mockSession);

        vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
            id: 1,
            createdAt: new Date('2023-10-01'),
            username: 'testuser',
            email: 'test@test.test',
            passwordHash: 'hashedpassword',
            profilePictureId: null,
            householdId: 1,
        });

        vi.mocked(prisma.shoppingItem.create).mockRejectedValueOnce(new Error('Internal server error'));

        const req = createMockRequest({
            body: { name: 'Milk', cost: 2 },
        });

        const response = await POST(req);

        expect(response.status).toBe(500);
        const data = await response.json();
        expect(data).toEqual({ message: 'Internal server error' });
    });

    it('should return 201 and the created shopping item', async () => {
        const mockSession: MockSession = {
            user: { id: '1' },
        };
        vi.mocked(getServerSession).mockResolvedValueOnce(mockSession);

        vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
            id: 1,
            createdAt: new Date('2023-10-01'),
            username: 'testuser',
            email: 'test@test.test',
            passwordHash: 'hashedpassword',
            profilePictureId: null,
            householdId: 1,
        });

        const mockShoppingItem = {
            id: 1,
            name: 'Milk',
            quantity: 2,
            createdAt: new Date('2023-10-01'),
            createdById: 1,
            householdId: 1,
            updatedAt: new Date('2023-10-01'),
            cost: 3.5,
            boughtById: null,
        };

        vi.mocked(prisma.shoppingItem.create).mockResolvedValueOnce(mockShoppingItem);

        const serializedShoppingItem = JSON.parse(JSON.stringify(mockShoppingItem));

        const req = createMockRequest({
            body: { name: 'Milk', cost: 2 },
        });

        const response = await POST(req);

        expect(response.status).toBe(201);
        const data = await response.json();
        expect(data).toEqual(serializedShoppingItem);
    });

    it('should return 400 if name is empty', async () => {
        const mockSession: MockSession = {
            user: { id: '1' },
        };
        vi.mocked(getServerSession).mockResolvedValueOnce(mockSession);

        vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
            id: 1,
            createdAt: new Date('2023-10-01'),
            username: 'testuser',
            email: 'test@test.test',
            passwordHash: 'hashedpassword',
            profilePictureId: null,
            householdId: 1,
        });

        const req = createMockRequest({
            body: { name: '', quantity: 2 },
        });

        const response = await POST(req);

        expect(response.status).toBe(400);
        const data = await response.json();
        expect(data).toEqual({ message: 'Name is required' });
    });

    it('should return 400 if cost is invalid', async () => {
        const mockSession: MockSession = {
            user: { id: '1' },
        };
        vi.mocked(getServerSession).mockResolvedValueOnce(mockSession);

        vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
            id: 1,
            createdAt: new Date('2023-10-01'),
            username: 'testuser',
            email: 'test@test.test',
            passwordHash: 'hashedpassword',
            profilePictureId: null,
            householdId: 1,
        });

        const req = createMockRequest({
            body: { name: 'Milk', cost: -1 },
        });

        const response = await POST(req);

        expect(response.status).toBe(400);
        const data = await response.json();
        expect(data).toEqual({ message: 'Cost must be a positive number' });
    });
});

describe('Shopping List DELETE API', () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    const createMockRequest = (options: MockRequestOptions): Request => {
        const { searchParams = {} } = options;

        const url = new URL('http://localhost:3000/api/shoppingList');
        Object.entries(searchParams).forEach(([key, value]) => {
            url.searchParams.append(key, value);
        });

        return {
            url: url.toString(),
            json: () => Promise.resolve({}),
        } as unknown as Request;
    };

    it('should return 401 if user is not logged in', async () => {
        vi.mocked(getServerSession).mockResolvedValueOnce(null);

        const req = createMockRequest({});

        const response = await DELETE(req);

        expect(response.status).toBe(401);
        const data = await response.json();
        expect(data).toEqual({ message: 'You must be logged in to delete an item' });
    });

    it('should return 400 if item ID is invalid', async () => {
        const mockSession: MockSession = {
            user: { id: '1' },
        };
        vi.mocked(getServerSession).mockResolvedValueOnce(mockSession);

        vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
            id: 1,
            createdAt: new Date('2023-10-01'),
            username: 'testuser',
            email: 'test@test.test',
            passwordHash: 'hashedpassword',
            profilePictureId: null,
            householdId: 1,
        });

        const req = createMockRequest({
            searchParams: { id: 'invalid' },
        });

        const response = await DELETE(req);

        expect(response.status).toBe(400);
        const data = await response.json();
        expect(data).toEqual({ message: 'Invalid item ID' });
    });

    it('should return 404 if item is not found', async () => {
        const mockSession: MockSession = {
            user: { id: '1' },
        };
        vi.mocked(getServerSession).mockResolvedValueOnce(mockSession);

        vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
            id: 1,
            createdAt: new Date('2023-10-01'),
            username: 'testuser',
            email: 'test@test.test',
            passwordHash: 'hashedpassword',
            profilePictureId: null,
            householdId: 1,
        });

        vi.mocked(prisma.shoppingItem.findUnique).mockResolvedValueOnce(null);

        const req = createMockRequest({
            searchParams: { id: '1' },
        });

        const response = await DELETE(req);

        expect(response.status).toBe(404);
        const data = await response.json();
        expect(data).toEqual({ message: 'Item not found' });
    });

    it('should return 403 if user is not authorized to delete the item', async () => {
        const mockSession: MockSession = {
            user: { id: '1' },
        };
        vi.mocked(getServerSession).mockResolvedValueOnce(mockSession);

        vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
            id: 1,
            createdAt: new Date('2023-10-01'),
            username: 'testuser',
            email: 'test@test.test',
            passwordHash: 'hashedpassword',
            profilePictureId: null,
            householdId: 1,
        });

        vi.mocked(prisma.shoppingItem.findUnique).mockResolvedValueOnce({
            id: 1,
            name: 'Milk',
            createdAt: new Date('2023-10-01'),
            createdById: 2,
            householdId: 1,
            updatedAt: new Date('2023-10-01'),
            cost: 3.5,
            boughtById: null,
        });

        const req = createMockRequest({
            searchParams: { id: '1' },
        });

        const response = await DELETE(req);

        expect(response.status).toBe(403);
        const data = await response.json();
        expect(data).toEqual({ message: 'You are not authorized to delete this item' });
    });

    it('should return 500 if there is an internal server error', async () => {
        const mockSession: MockSession = {
            user: { id: '1' },
        };
        vi.mocked(getServerSession).mockResolvedValueOnce(mockSession);

        vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
            id: 1,
            createdAt: new Date('2023-10-01'),
            username: 'testuser',
            email: 'test@test.test',
            passwordHash: 'hashedpassword',
            profilePictureId: null,
            householdId: 1,
        });

        vi.mocked(prisma.shoppingItem.findUnique).mockResolvedValueOnce({
            id: 1,
            name: 'Milk',
            createdAt: new Date('2023-10-01'),
            createdById: 1,
            householdId: 1,
            updatedAt: new Date('2023-10-01'),
            cost: 3.5,
            boughtById: null,
        });

        vi.mocked(prisma.shoppingItem.delete).mockRejectedValueOnce(new Error('Internal server error'));

        const req = createMockRequest({
            searchParams: { id: '1' },
        });

        const response = await DELETE(req);

        expect(response.status).toBe(500);
        const data = await response.json();
        expect(data).toEqual({ message: 'Internal server error' });
    });

    it('should return 200 if item is deleted successfully', async () => {
        const mockSession: MockSession = {
            user: { id: '1' },
        };
        vi.mocked(getServerSession).mockResolvedValueOnce(mockSession);

        vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
            id: 1,
            createdAt: new Date('2023-10-01'),
            username: 'testuser',
            email: 'test@test.test',
            passwordHash: 'hashedpassword',
            profilePictureId: null,
            householdId: 1,
        });

        vi.mocked(prisma.shoppingItem.findUnique).mockResolvedValueOnce({
            id: 1,
            name: 'Milk',
            createdAt: new Date('2023-10-01'),
            createdById: 1,
            householdId: 1,
            updatedAt: new Date('2023-10-01'),
            cost: 3.5,
            boughtById: null,
        });

        vi.mocked(prisma.shoppingItem.delete).mockResolvedValueOnce({
            id: 1,
            name: 'Milk',
            createdAt: new Date('2023-10-01'),
            createdById: 1,
            householdId: 1,
            updatedAt: new Date('2023-10-01'),
            cost: 3.5,
            boughtById: null,
        });

        const req = createMockRequest({
            searchParams: { id: '1' },
        });

        const response = await DELETE(req);

        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data).toEqual({ message: 'Item deleted successfully' });
    });
});

describe('Shopping List Bought API', () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    const createMockRequest = (options: MockRequestOptions): Request => {
        const { body = {} } = options;

        return {
            url: 'http://localhost:3000/api/shoppingList/bought',
            json: () => Promise.resolve(body),
        } as unknown as Request;
    };

    it('should return 401 if user is not logged in', async () => {
        vi.mocked(getServerSession).mockResolvedValueOnce(null);

        const req = createMockRequest({});

        const response = await PUT_Bought(req);

        expect(response.status).toBe(401);
        const data = await response.json();
        expect(data).toEqual({ message: 'You must be logged in to mark items as bought' });
    });

    it('should return 404 if user is not found', async () => {
        const mockSession: MockSession = {
            user: { id: '1' },
        };
        vi.mocked(getServerSession).mockResolvedValueOnce(mockSession);

        vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null);

        const req = createMockRequest({ body: { id: 1 } });

        const response = await PUT_Bought(req);

        expect(response.status).toBe(404);
        const data = await response.json();
        expect(data).toEqual({ message: 'User not found' });
    });

    it('should return 403 if user is not a member of a household', async () => {
        const mockSession: MockSession = {
            user: { id: '1' },
        };
        vi.mocked(getServerSession).mockResolvedValueOnce(mockSession);

        vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
            id: 1,
            createdAt: new Date('2023-10-01'),
            username: 'testuser',
            email: 'test@test.test',
            passwordHash: 'hashedpassword',
            profilePictureId: null,
            householdId: null,
        });

        const req = createMockRequest({ body: { id: 1 } });

        const response = await PUT_Bought(req);

        expect(response.status).toBe(403);
        const data = await response.json();
        expect(data).toEqual({ message: 'You must be a member of a household to mark items as bought' });
    });

    it('should return 400 if item ID is invalid', async () => {
        const mockSession: MockSession = {
            user: { id: '1' },
        };
        vi.mocked(getServerSession).mockResolvedValueOnce(mockSession);

        vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
            id: 1,
            createdAt: new Date('2023-10-01'),
            username: 'testuser',
            email: 'test@test.test',
            passwordHash: 'hashedpassword',
            profilePictureId: null,
            householdId: 1,
        });

        const req = createMockRequest({
            body: { id: 'invalid' },
        });

        const response = await PUT_Bought(req);

        expect(response.status).toBe(400);
        const data = await response.json();
        expect(data).toEqual({ message: 'Invalid item ID' });
    });

    it('should return 404 if item is not found', async () => {
        const mockSession: MockSession = {
            user: { id: '1' },
        };
        vi.mocked(getServerSession).mockResolvedValueOnce(mockSession);

        vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
            id: 1,
            createdAt: new Date('2023-10-01'),
            username: 'testuser',
            email: 'test@test.test',
            passwordHash: 'hashedpassword',
            profilePictureId: null,
            householdId: 1,
        });

        vi.mocked(prisma.shoppingItem.findUnique).mockResolvedValueOnce(null);

        const req = createMockRequest({
            body: { id: 1 },
        });

        const response = await PUT_Bought(req);

        expect(response.status).toBe(404);
        const data = await response.json();
        expect(data).toEqual({ message: 'Item not found' });
    });

    it('should return 403 if user is not authorized to mark the item as bought', async () => {
        const mockSession: MockSession = {
            user: { id: '1' },
        };
        vi.mocked(getServerSession).mockResolvedValueOnce(mockSession);

        vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
            id: 1,
            createdAt: new Date('2023-10-01'),
            username: 'testuser',
            email: 'test@test.test',
            passwordHash: 'hashedpassword',
            profilePictureId: null,
            householdId: 2,
        });

        vi.mocked(prisma.shoppingItem.findUnique).mockResolvedValueOnce({
            id: 1,
            name: 'Milk',
            createdAt: new Date('2023-10-01'),
            createdById: 2,
            householdId: 1,
            updatedAt: new Date('2023-10-01'),
            cost: 3.5,
            boughtById: null,
        });

        const req = createMockRequest({
            body: { id: 1 },
        });

        const response = await PUT_Bought(req);

        expect(response.status).toBe(403);
        const data = await response.json();
        expect(data).toEqual({ message: 'You do not have permission to mark this item as bought' });
    });

    it('should return 500 if there is an internal server error', async () => {
        const mockSession: MockSession = {
            user: { id: '1' },
        };
        vi.mocked(getServerSession).mockResolvedValueOnce(mockSession);

        vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
            id: 1,
            createdAt: new Date('2023-10-01'),
            username: 'testuser',
            email: 'test@test.test',
            passwordHash: 'hashedpassword',
            profilePictureId: null,
            householdId: 1,
        });

        vi.mocked(prisma.shoppingItem.findUnique).mockResolvedValueOnce({
            id: 1,
            name: 'Milk',
            createdAt: new Date('2023-10-01'),
            createdById: 1,
            householdId: 1,
            updatedAt: new Date('2023-10-01'),
            cost: 3.5,
            boughtById: null,
        });

        vi.mocked(prisma.shoppingItem.update).mockRejectedValueOnce(new Error('Internal server error'));

        const req = createMockRequest({
            body: { id: 1 },
        });

        const response = await PUT_Bought(req);

        expect(response.status).toBe(500);
        const data = await response.json();
        expect(data).toEqual({ message: 'Internal server error' });
    });

    it('should return 200 and the updated item if marked as bought successfully', async () => {
        const mockSession: MockSession = {
            user: { id: '1' },
        };
        vi.mocked(getServerSession).mockResolvedValueOnce(mockSession);

        vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
            id: 1,
            createdAt: new Date('2023-10-01'),
            username: 'testuser',
            email: 'test@test.test',
            passwordHash: 'hashedpassword',
            profilePictureId: null,
            householdId: 1,
        });

        vi.mocked(prisma.shoppingItem.findUnique).mockResolvedValueOnce({
            id: 1,
            name: 'Milk',
            createdAt: new Date('2023-10-01'),
            createdById: 1,
            householdId: 1,
            updatedAt: new Date('2023-10-01'),
            cost: 3.5,
            boughtById: null,
        });

        const updatedItem = {
            id: 1,
            name: 'Milk',
            createdAt: new Date('2023-10-01'),
            createdById: 1,
            householdId: 1,
            updatedAt: new Date('2023-10-01'),
            cost: 3.5,
            boughtById: 1,
        };

        vi.mocked(prisma.shoppingItem.update).mockResolvedValueOnce(updatedItem);

        const serializedUpdatedItem = JSON.parse(JSON.stringify(updatedItem));

        const req = createMockRequest({
            body: { id: 1 },
        });

        const response = await PUT_Bought(req);

        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data).toEqual(serializedUpdatedItem);
    });
});

describe('Shopping List Unbought API', () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    const createMockRequest = (options: MockRequestOptions): Request => {
        const { body = {} } = options;

        return {
            url: 'http://localhost:3000/api/shoppingList/unbought',
            json: () => Promise.resolve(body),
        } as unknown as Request;
    };

    it('should return 401 if user is not logged in', async () => {
        vi.mocked(getServerSession).mockResolvedValueOnce(null);

        const req = createMockRequest({});

        const response = await PUT_Unbought(req);

        expect(response.status).toBe(401);
        const data = await response.json();
        expect(data).toEqual({ message: 'You must be logged in to mark items as unbought' });
    });

    it('should return 404 if user is not found', async () => {
        const mockSession: MockSession = {
            user: { id: '1' },
        };
        vi.mocked(getServerSession).mockResolvedValueOnce(mockSession);

        vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null);

        const req = createMockRequest({ body: { id: 1 } });

        const response = await PUT_Unbought(req);

        expect(response.status).toBe(404);
        const data = await response.json();
        expect(data).toEqual({ message: 'User not found' });
    });

    it('should return 403 if user is not a member of a household', async () => {
        const mockSession: MockSession = {
            user: { id: '1' },
        };
        vi.mocked(getServerSession).mockResolvedValueOnce(mockSession);

        vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
            id: 1,
            createdAt: new Date('2023-10-01'),
            username: 'testuser',
            email: 'test@test.test',
            passwordHash: 'hashedpassword',
            profilePictureId: null,
            householdId: null,
        });

        const req = createMockRequest({ body: { id: 1 } });

        const response = await PUT_Unbought(req);

        expect(response.status).toBe(403);
        const data = await response.json();
        expect(data).toEqual({ message: 'You must be a member of a household to mark items as unbought' });
    });

    it('should return 400 if item ID is invalid', async () => {
        const mockSession: MockSession = {
            user: { id: '1' },
        };
        vi.mocked(getServerSession).mockResolvedValueOnce(mockSession);

        vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
            id: 1,
            createdAt: new Date('2023-10-01'),
            username: 'testuser',
            email: 'test@test.test',
            passwordHash: 'hashedpassword',
            profilePictureId: null,
            householdId: 1,
        });

        const req = createMockRequest({
            body: { id: 'invalid' },
        });

        const response = await PUT_Unbought(req);

        expect(response.status).toBe(400);
        const data = await response.json();
        expect(data).toEqual({ message: 'Invalid item ID' });
    });

    it('should return 404 if item is not found', async () => {
        const mockSession: MockSession = {
            user: { id: '1' },
        };
        vi.mocked(getServerSession).mockResolvedValueOnce(mockSession);

        vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
            id: 1,
            createdAt: new Date('2023-10-01'),
            username: 'testuser',
            email: 'test@test.test',
            passwordHash: 'hashedpassword',
            profilePictureId: null,
            householdId: 1,
        });

        vi.mocked(prisma.shoppingItem.findUnique).mockResolvedValueOnce(null);

        const req = createMockRequest({
            body: { id: 1 },
        });

        const response = await PUT_Unbought(req);

        expect(response.status).toBe(404);
        const data = await response.json();
        expect(data).toEqual({ message: 'Item not found' });
    });

    it('should return 403 if user is not authorized to mark the item as unbought', async () => {
        const mockSession: MockSession = {
            user: { id: '1' },
        };
        vi.mocked(getServerSession).mockResolvedValueOnce(mockSession);

        vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
            id: 1,
            createdAt: new Date('2023-10-01'),
            username: 'testuser',
            email: 'test@test.test',
            passwordHash: 'hashedpassword',
            profilePictureId: null,
            householdId: 2,
        });

        vi.mocked(prisma.shoppingItem.findUnique).mockResolvedValueOnce({
            id: 1,
            name: 'Milk',
            createdAt: new Date('2023-10-01'),
            createdById: 2,
            householdId: 1,
            updatedAt: new Date('2023-10-01'),
            cost: 3.5,
            boughtById: 1,
        });

        const req = createMockRequest({
            body: { id: 1 },
        });

        const response = await PUT_Unbought(req);

        expect(response.status).toBe(403);
        const data = await response.json();
        expect(data).toEqual({ message: 'You do not have permission to mark this item as unbought' });
    });

    it('should return 500 if there is an internal server error', async () => {
        const mockSession: MockSession = {
            user: { id: '1' },
        };
        vi.mocked(getServerSession).mockResolvedValueOnce(mockSession);

        vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
            id: 1,
            createdAt: new Date('2023-10-01'),
            username: 'testuser',
            email: 'test@test.test',
            passwordHash: 'hashedpassword',
            profilePictureId: null,
            householdId: 1,
        });

        vi.mocked(prisma.shoppingItem.findUnique).mockResolvedValueOnce({
            id: 1,
            name: 'Milk',
            createdAt: new Date('2023-10-01'),
            createdById: 1,
            householdId: 1,
            updatedAt: new Date('2023-10-01'),
            cost: 3.5,
            boughtById: 1,
        });

        vi.mocked(prisma.shoppingItem.update).mockRejectedValueOnce(new Error('Internal server error'));

        const req = createMockRequest({
            body: { id: 1 },
        });

        const response = await PUT_Unbought(req);

        expect(response.status).toBe(500);
        const data = await response.json();
        expect(data).toEqual({ message: 'Internal server error' });
    });

    it('should return 200 if item is marked as unbought successfully', async () => {
        const mockSession: MockSession = {
            user: { id: '1' },
        };
        vi.mocked(getServerSession).mockResolvedValueOnce(mockSession);

        vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
            id: 1,
            createdAt: new Date('2023-10-01'),
            username: 'testuser',
            email: 'test@test.test',
            passwordHash: 'hashedpassword',
            profilePictureId: null,
            householdId: 1,
        });

        vi.mocked(prisma.shoppingItem.findUnique).mockResolvedValueOnce({
            id: 1,
            name: 'Milk',
            createdAt: new Date('2023-10-01'),
            createdById: 1,
            householdId: 1,
            updatedAt: new Date('2023-10-01'),
            cost: 3.5,
            boughtById: 1,
        });

        vi.mocked(prisma.shoppingItem.update).mockResolvedValueOnce({
            id: 1,
            name: 'Milk',
            createdAt: new Date('2023-10-01'),
            createdById: 1,
            householdId: 1,
            updatedAt: new Date('2023-10-01'),
            cost: 3.5,
            boughtById: null,
        });

        const req = createMockRequest({
            body: { id: 1 },
        });

        const response = await PUT_Unbought(req);

        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data).toEqual({ message: 'Item marked as unbought successfully' });
    });
});

describe('Shopping List TotalNumber API', () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    const createMockRequest = (options: MockRequestOptions): Request => {
        const { searchParams = {} } = options;

        const url = new URL('http://localhost:3000/api/shoppingList/totalNumber');
        Object.entries(searchParams).forEach(([key, value]) => {
            url.searchParams.append(key, value);
        });

        return {
            url: url.toString(),
            json: () => Promise.resolve({}),
        } as unknown as Request;
    };

    it('should return 401 if user is not logged in', async () => {
        vi.mocked(getServerSession).mockResolvedValueOnce(null);

        const req = createMockRequest({});

        const response = await GET_Count(req);

        expect(response.status).toBe(401);
        const data = await response.json();
        expect(data).toEqual({ message: 'You must be logged in to view shopping list count' });
    });

    it('should return 404 if user is not found', async () => {
        const mockSession: MockSession = {
            user: { id: '1' },
        };
        vi.mocked(getServerSession).mockResolvedValueOnce(mockSession);

        vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null);

        const req = createMockRequest({});

        const response = await GET_Count(req);

        expect(response.status).toBe(404);
        const data = await response.json();
        expect(data).toEqual({ message: 'User not found' });
    });

    it('should return 403 if user is not a member of a household', async () => {
        const mockSession: MockSession = {
            user: { id: '1' },
        };
        vi.mocked(getServerSession).mockResolvedValueOnce(mockSession);

        vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
            id: 1,
            createdAt: new Date('2023-10-01'),
            username: 'testuser',
            email: 'test@test.test',
            passwordHash: 'hashedpassword',
            profilePictureId: null,
            householdId: null,
        });

        const req = createMockRequest({});

        const response = await GET_Count(req);

        expect(response.status).toBe(403);
        const data = await response.json();
        expect(data).toEqual({ message: 'You must be a member of a household to view shopping list count' });
    });

    it('should return 500 if there is an internal server error', async () => {
        const mockSession: MockSession = {
            user: { id: '1' },
        };
        vi.mocked(getServerSession).mockResolvedValueOnce(mockSession);

        vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
            id: 1,
            createdAt: new Date('2023-10-01'),
            username: 'testuser',
            email: 'test@test.test',
            passwordHash: 'hashedpassword',
            profilePictureId: null,
            householdId: 1,
        });

        vi.mocked(prisma.shoppingItem.count).mockRejectedValueOnce(new Error('Internal server error'));

        const req = createMockRequest({});

        const response = await GET_Count(req);

        expect(response.status).toBe(500);
        const data = await response.json();
        expect(data).toEqual({ message: 'Internal server error' });
    });

    it('should return 200 and the count of shopping items', async () => {
        const mockSession: MockSession = {
            user: { id: '1' },
        };
        vi.mocked(getServerSession).mockResolvedValueOnce(mockSession);

        vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
            id: 1,
            createdAt: new Date('2023-10-01'),
            username: 'testuser',
            email: 'test@test.test',
            passwordHash: 'hashedpassword',
            profilePictureId: null,
            householdId: 1,
        });

        vi.mocked(prisma.shoppingItem.count).mockResolvedValueOnce(5);

        const req = createMockRequest({});

        const response = await GET_Count(req);

        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data).toEqual({ count: 5 });
    });
});

describe('Shopping List Details API', () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    const createMockRequest = (options: MockRequestOptions): Request => {
        const { searchParams = {} } = options;

        const url = new URL('http://localhost:3000/api/shoppingList/details');
        Object.entries(searchParams).forEach(([key, value]) => {
            url.searchParams.append(key, value);
        });

        return {
            url: url.toString(),
            json: () => Promise.resolve({}),
        } as unknown as Request;
    };

    it('should return 401 if user is not logged in', async () => {
        vi.mocked(getServerSession).mockResolvedValueOnce(null);

        const req = createMockRequest({});

        const response = await GET_Details(req);

        expect(response.status).toBe(401);
        const data = await response.json();
        expect(data).toEqual({ message: 'You must be logged in to view item details' });
    });

    it('should return 404 if user is not found', async () => {
        const mockSession: MockSession = {
            user: { id: '1' },
        };
        vi.mocked(getServerSession).mockResolvedValueOnce(mockSession);

        vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null);

        const req = createMockRequest({});

        const response = await GET_Details(req);

        expect(response.status).toBe(404);
        const data = await response.json();
        expect(data).toEqual({ message: 'User not found' });
    });

    it('should return 403 if user is not a member of a household', async () => {
        const mockSession: MockSession = {
            user: { id: '1' },
        };
        vi.mocked(getServerSession).mockResolvedValueOnce(mockSession);

        vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
            id: 1,
            createdAt: new Date('2023-10-01'),
            username: 'testuser',
            email: 'test@test.test',
            passwordHash: 'hashedpassword',
            profilePictureId: null,
            householdId: null,
        });

        const req = createMockRequest({});

        const response = await GET_Details(req);

        expect(response.status).toBe(403);
        const data = await response.json();
        expect(data).toEqual({ message: 'You must be a member of a household to view item details' });
    });

    it('should return 400 if item ID is invalid', async () => {
        const mockSession: MockSession = {
            user: { id: '1' },
        };
        vi.mocked(getServerSession).mockResolvedValueOnce(mockSession);

        vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
            id: 1,
            createdAt: new Date('2023-10-01'),
            username: 'testuser',
            email: 'test@test.test',
            passwordHash: 'hashedpassword',
            profilePictureId: null,
            householdId: 1,
        });

        const req = createMockRequest({
            searchParams: { id: 'invalid' },
        });

        const response = await GET_Details(req);

        expect(response.status).toBe(400);
        const data = await response.json();
        expect(data).toEqual({ message: 'Invalid item ID' });
    });

    it('should return 404 if item is not found', async () => {
        const mockSession: MockSession = {
            user: { id: '1' },
        };
        vi.mocked(getServerSession).mockResolvedValueOnce(mockSession);

        vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
            id: 1,
            createdAt: new Date('2023-10-01'),
            username: 'testuser',
            email: 'test@test.test',
            passwordHash: 'hashedpassword',
            profilePictureId: null,
            householdId: 1,
        });

        vi.mocked(prisma.shoppingItem.findUnique).mockResolvedValueOnce(null);

        const req = createMockRequest({
            searchParams: { id: '1' },
        });

        const response = await GET_Details(req);

        expect(response.status).toBe(404);
        const data = await response.json();
        expect(data).toEqual({ message: 'Item not found' });
    });

    it('should return 403 if user is not authorized to view the item', async () => {
        const mockSession: MockSession = {
            user: { id: '1' },
        };
        vi.mocked(getServerSession).mockResolvedValueOnce(mockSession);

        vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
            id: 1,
            createdAt: new Date('2023-10-01'),
            username: 'testuser',
            email: 'test@test.test',
            passwordHash: 'hashedpassword',
            profilePictureId: null,
            householdId: 2,
        });

        vi.mocked(prisma.shoppingItem.findUnique).mockResolvedValueOnce({
            id: 1,
            name: 'Milk',
            createdAt: new Date('2023-10-01'),
            createdById: 2,
            householdId: 1,
            updatedAt: new Date('2023-10-01'),
            cost: 3.5,
            boughtById: null,
        });

        const req = createMockRequest({
            searchParams: { id: '1' },
        });

        const response = await GET_Details(req);

        expect(response.status).toBe(403);
        const data = await response.json();
        expect(data).toEqual({ message: 'You do not have permission to view this item' });
    });

    it('should return 500 if there is an internal server error', async () => {
        const mockSession: MockSession = {
            user: { id: '1' },
        };
        vi.mocked(getServerSession).mockResolvedValueOnce(mockSession);

        vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
            id: 1,
            createdAt: new Date('2023-10-01'),
            username: 'testuser',
            email: 'test@test.test',
            passwordHash: 'hashedpassword',
            profilePictureId: null,
            householdId: 1,
        });

        vi.mocked(prisma.shoppingItem.findUnique).mockRejectedValueOnce(new Error('Internal server error'));

        const req = createMockRequest({
            searchParams: { id: '1' },
        });

        const response = await GET_Details(req);

        expect(response.status).toBe(500);
        const data = await response.json();
        expect(data).toEqual({ message: 'Internal server error' });
    });

    it('should return 200 and the item details', async () => {
        const mockSession: MockSession = {
            user: { id: '1' },
        };
        vi.mocked(getServerSession).mockResolvedValueOnce(mockSession);

        vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
            id: 1,
            createdAt: new Date('2023-10-01'),
            username: 'testuser',
            email: 'test@test.test',
            passwordHash: 'hashedpassword',
            profilePictureId: null,
            householdId: 1,
        });

        const mockItem = {
            id: 1,
            name: 'Milk',
            createdAt: new Date('2023-10-01'),
            createdById: 1,
            householdId: 1,
            updatedAt: new Date('2023-10-01'),
            cost: 3.5,
            boughtById: null,
            createdBy: {
                id: 1,
                username: 'testuser',
            },
            boughtBy: null,
        };

        vi.mocked(prisma.shoppingItem.findUnique).mockResolvedValueOnce(mockItem);

        const serializedItem = JSON.parse(JSON.stringify(mockItem));

        const req = createMockRequest({
            searchParams: { id: '1' },
        });

        const response = await GET_Details(req);

        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data).toEqual(serializedItem);
    });
});
