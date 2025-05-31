import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '../src/app/api/messages/token/route';
import { getServerSession } from 'next-auth/next';
import { StreamChat } from 'stream-chat';

vi.mock('next-auth/next', () => ({
    getServerSession: vi.fn(),
}));

vi.mock('../src/app/auth', () => ({
    authOptions: {},
}));

vi.mock('stream-chat', () => {
    const mockCreateToken = vi.fn().mockReturnValue('mock-token');
    const mockUpsertUser = vi.fn().mockResolvedValue({});
    const mockInstance = {
        createToken: mockCreateToken,
        upsertUser: mockUpsertUser,
    };

    return {
        StreamChat: {
            getInstance: vi.fn(() => mockInstance),
        },
    };
});

type MockSession = {
    user?: {
        id?: string;
        username?: string;
        householdId?: string;
    };
    expires?: string;
};

type MockRequestOptions = {
    searchParams?: Record<string, string>;
    body?: Record<string, unknown>;
};

describe('Messages Token API', () => {
    const mockStreamChatInstance = StreamChat.getInstance('test-api-key');

    beforeEach(() => {
        vi.clearAllMocks();
    });

    const createMockRequest = (options: MockRequestOptions = {}): Request => {
        const { searchParams = {} } = options;

        const url = new URL('http://localhost:3000/api/messages/token');
        Object.entries(searchParams).forEach(([key, value]) => {
            url.searchParams.append(key, value);
        });

        return {
            url: url.toString(),
            method: 'GET',
        } as unknown as Request;
    };

    it('should return 401 if user is not authenticated', async () => {
        (getServerSession as jest.Mock).mockResolvedValueOnce(null);
        const req = createMockRequest();

        const response = await GET(req);

        expect(response.status).toBe(401);
        const data = await response.json();
        expect(data).toEqual({ message: 'Unauthorized' });
    });

    it('should return 401 if session has no user ID', async () => {
        const mockSession: MockSession = {
            user: { username: 'testuser' },
            expires: '2025-05-21T12:00:00.000Z',
        };
        (getServerSession as jest.Mock).mockResolvedValueOnce(mockSession);
        const req = createMockRequest();

        const response = await GET(req);

        expect(response.status).toBe(401);
        const data = await response.json();
        expect(data).toEqual({ message: 'Unauthorized' });
    });

    it('should generate a token for an authenticated user', async () => {
        const mockSession: MockSession = {
            user: {
                id: '1',
                username: 'testuser',
                householdId: '1',
            },
            expires: '2025-05-21T12:00:00.000Z',
        };
        (getServerSession as jest.Mock).mockResolvedValueOnce(mockSession);
        const req = createMockRequest();

        const response = await GET(req);

        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data).toEqual({
            token: 'mock-token',
            userId: '1',
            username: 'testuser',
        });

        expect(mockStreamChatInstance.createToken).toHaveBeenCalledWith('1');
        expect(mockStreamChatInstance.upsertUser).toHaveBeenCalledWith({
            id: '1',
            name: 'testuser',
            role: 'admin',
        });
    });

    it('should use "User" as default username if none is provided', async () => {
        const mockSession: MockSession = {
            user: {
                id: '1',
                householdId: '1',
            },
            expires: '2025-05-21T12:00:00.000Z',
        };
        (getServerSession as jest.Mock).mockResolvedValueOnce(mockSession);
        const req = createMockRequest();

        const response = await GET(req);

        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data).toEqual({
            token: 'mock-token',
            userId: '1',
            username: 'User',
        });

        expect(mockStreamChatInstance.upsertUser).toHaveBeenCalledWith({
            id: '1',
            name: 'User',
            role: 'admin',
        });
    });

    it('should handle errors during token generation', async () => {
        const mockSession: MockSession = {
            user: {
                id: '1',
                username: 'testuser',
                householdId: '1',
            },
            expires: '2025-05-21T12:00:00.000Z',
        };
        (getServerSession as jest.Mock).mockResolvedValueOnce(mockSession);

        (mockStreamChatInstance.upsertUser as jest.Mock).mockRejectedValueOnce(new Error('Connection error'));

        const req = createMockRequest();

        const response = await GET(req);

        expect(response.status).toBe(500);
        const data = await response.json();
        expect(data).toEqual({ message: 'Internal server error' });
    });
});
