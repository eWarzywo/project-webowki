import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '../src/app/api/chore/create/route';
import { GET as GET_ToDo } from '../src/app/api/chores/todo/get/route';
import { GET as GET_Done } from '../src/app/api/chores/done/get/route';
import { PUT as PUT_ToDo } from '../src/app/api/chore/todo/route';
import { PUT as PUT_Done } from '../src/app/api/chore/done/route';
import { DELETE } from '../src/app/api/chore/delete/route';
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

describe('Chore POST API', () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    const createMockRequest = (options: MockRequestOptions): Request => {
        const { searchParams = {}, body = {} } = options;

        const url = new URL('http://localhost:3000/api/chore/create');
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

        const request = createMockRequest({});

        const response = await POST(request);

        expect(response.status).toBe(401);
        const data = await response.json();
        expect(data.message).toBe('You must be logged in to create chores');
    });

    it('should return 401 if user is not part of a household', async () => {
        const mockSession: MockSession = {
            user: { id: '1' },
        };
        vi.mocked(getServerSession).mockResolvedValueOnce(mockSession);

        const request = createMockRequest({});

        const response = await POST(request);

        expect(response.status).toBe(401);
        const data = await response.json();
        expect(data.message).toBe('You must be part of a household to create chores');
    });

    it('should create a new chore and return it', async () => {
        const mockSession: MockSession = {
            user: { id: '1', householdId: '1' },
        };
        vi.mocked(getServerSession).mockResolvedValueOnce(mockSession);

        const requestBody = {
            name: 'Test Chore',
            dueDate: new Date('2023-10-01'),
            priority: 1,
            cycle: 0,
            repeatCount: 0,
            description: 'Test Description',
        };

        const request = createMockRequest({ body: requestBody });

        const mockChore = {
            id: 1,
            ...requestBody,
            createdById: 1,
            householdId: 1,
            createdAt: new Date('2023-09-01'),
            updatedAt: new Date('2023-09-01'),
            done: false,
            doneById: null,
            parentChoreId: null,
        };

        const serializedChore = JSON.parse(JSON.stringify(mockChore));

        vi.mocked(prisma.chore.create).mockResolvedValueOnce(mockChore);

        const response = await POST(request);

        expect(response.status).toBe(201);
        const data = await response.json();
        expect(data).toEqual(serializedChore);
    });

    it('should handle errors and return 500', async () => {
        const mockSession: MockSession = {
            user: { id: '1', householdId: '1' },
        };
        vi.mocked(getServerSession).mockResolvedValueOnce(mockSession);

        const requestBody = {
            name: 'Test Chore',
            dueDate: new Date('2023-10-01'),
            priority: 1,
            cycle: 0,
            repeatCount: 0,
            description: 'Test Description',
        };

        const request = createMockRequest({ body: requestBody });

        vi.mocked(prisma.chore.create).mockRejectedValueOnce(new Error('Database error'));

        const response = await POST(request);

        expect(response.status).toBe(500);
        const data = await response.json();
        expect(data.error).toBe('Internal Server Error');
    });
});

describe('Chore GET ToDo API', () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    const createMockRequest = (options: MockRequestOptions): Request => {
        const { searchParams = {}, body = {} } = options;

        const url = new URL('http://localhost:3000/api/chores/todo/get');
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

        const request = createMockRequest({});

        const response = await GET_ToDo(request);

        expect(response.status).toBe(401);
        const data = await response.json();
        expect(data.message).toBe('You must be logged in to view chores');
    });

    it('should return 401 if user is not part of a household', async () => {
        const mockSession: MockSession = {
            user: { id: '1' },
        };
        vi.mocked(getServerSession).mockResolvedValueOnce(mockSession);

        const request = createMockRequest({});

        const response = await GET_ToDo(request);

        expect(response.status).toBe(401);
        const data = await response.json();
        expect(data.message).toBe('You must be a part of a household to view chores');
    });

    it('should return a list of chores', async () => {
        const mockSession: MockSession = {
            user: { id: '1', householdId: '1' },
        };
        vi.mocked(getServerSession).mockResolvedValueOnce(mockSession);

        const request = createMockRequest({});

        const mockChores = [
            {
                id: 1,
                name: 'Test Chore 1',
                dueDate: new Date('2023-10-01'),
                priority: 1,
                cycle: 0,
                repeatCount: 0,
                description: 'Test Description 1',
                createdAt: new Date('2023-09-01'),
                updatedAt: new Date('2023-09-01'),
                done: false,
                doneById: null,
                parentChoreId: null,
                householdId: 1,
                createdById: 1,
            },
            {
                id: 2,
                name: 'Test Chore 2',
                dueDate: new Date('2023-10-02'),
                priority: 2,
                cycle: 0,
                repeatCount: 0,
                description: 'Test Description 2',
                createdAt: new Date('2023-09-02'),
                updatedAt: new Date('2023-09-02'),
                done: false,
                doneById: null,
                parentChoreId: null,
                householdId: 1,
                createdById: 1,
            },
        ];

        const serializedChores = JSON.parse(JSON.stringify(mockChores));

        vi.mocked(prisma.chore.findMany).mockResolvedValueOnce(mockChores);
        vi.mocked(prisma.chore.count).mockResolvedValueOnce(mockChores.length);

        const response = await GET_ToDo(request);

        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data.chores).toEqual(serializedChores);
        expect(data.count).toBe(mockChores.length);
    });

    it('should handle errors and return 500', async () => {
        const mockSession: MockSession = {
            user: { id: '1', householdId: '1' },
        };
        vi.mocked(getServerSession).mockResolvedValueOnce(mockSession);

        const request = createMockRequest({});

        vi.mocked(prisma.chore.findMany).mockRejectedValueOnce(new Error('Database error'));

        const response = await GET_ToDo(request);

        expect(response.status).toBe(500);
        const data = await response.json();
        expect(data.error).toBe('Internal Server Error');
    });
});

describe('Chore GET Done API', () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    const createMockRequest = (options: MockRequestOptions): Request => {
        const { searchParams = {}, body = {} } = options;

        const url = new URL('http://localhost:3000/api/chores/done/get');
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

        const request = createMockRequest({});

        const response = await GET_Done(request);

        expect(response.status).toBe(401);
        const data = await response.json();
        expect(data.message).toBe('You must be logged in to view chores');
    });

    it('should return 401 if user is not part of a household', async () => {
        const mockSession: MockSession = {
            user: { id: '1' },
        };
        vi.mocked(getServerSession).mockResolvedValueOnce(mockSession);

        const request = createMockRequest({});

        const response = await GET_Done(request);

        expect(response.status).toBe(401);
        const data = await response.json();
        expect(data.message).toBe('You must be a part of a household to view chores');
    });

    it('should return a list of done chores', async () => {
        const mockSession: MockSession = {
            user: { id: '1', householdId: '1' },
        };
        vi.mocked(getServerSession).mockResolvedValueOnce(mockSession);

        const request = createMockRequest({});

        const mockChores = [
            {
                id: 1,
                name: 'Test Chore 1',
                dueDate: new Date('2023-10-01'),
                priority: 1,
                cycle: 0,
                repeatCount: 0,
                description: 'Test Description 1',
                createdAt: new Date('2023-09-01'),
                updatedAt: new Date('2023-09-01'),
                done: true,
                doneById: 1,
                parentChoreId: null,
                householdId: 1,
                createdById: 1,
            },
            {
                id: 2,
                name: 'Test Chore 2',
                dueDate: new Date('2023-10-02'),
                priority: 2,
                cycle: 0,
                repeatCount: 0,
                description: 'Test Description 2',
                createdAt: new Date('2023-09-02'),
                updatedAt: new Date('2023-09-02'),
                done: true,
                doneById: 1,
                parentChoreId: null,
                householdId: 1,
                createdById: 1,
            },
        ];

        const serializedChores = JSON.parse(JSON.stringify(mockChores));

        vi.mocked(prisma.chore.findMany).mockResolvedValueOnce(mockChores);
        vi.mocked(prisma.chore.count).mockResolvedValueOnce(mockChores.length);

        const response = await GET_Done(request);

        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data.chores).toEqual(serializedChores);
        expect(data.count).toBe(mockChores.length);
    });

    it('should handle errors and return 500', async () => {
        const mockSession: MockSession = {
            user: { id: '1', householdId: '1' },
        };
        vi.mocked(getServerSession).mockResolvedValueOnce(mockSession);

        const request = createMockRequest({});

        vi.mocked(prisma.chore.findMany).mockRejectedValueOnce(new Error('Database error'));

        const response = await GET_Done(request);

        expect(response.status).toBe(500);
        const data = await response.json();
        expect(data.error).toBe('Internal Server Error');
    });
});

describe('Chore PUT ToDo API', () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    const createMockRequest = (options: MockRequestOptions): Request => {
        const { searchParams = {}, body = {} } = options;

        const url = new URL('http://localhost:3000/api/chore/todo');
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

        const request = createMockRequest({});

        const response = await PUT_ToDo(request);

        expect(response.status).toBe(401);
        const data = await response.json();
        expect(data.message).toBe('You must be logged in to modify chores');
    });

    it('should return 401 if user is not part of a household', async () => {
        const mockSession: MockSession = {
            user: { id: '1' },
        };
        vi.mocked(getServerSession).mockResolvedValueOnce(mockSession);

        const request = createMockRequest({});

        const response = await PUT_ToDo(request);

        expect(response.status).toBe(401);
        const data = await response.json();
        expect(data.message).toBe('You must be part of a household to modify chores');
    });

    it('should return 400 if choreId is not provided', async () => {
        const mockSession: MockSession = {
            user: { id: '1', householdId: '1' },
        };
        vi.mocked(getServerSession).mockResolvedValueOnce(mockSession);

        const request = createMockRequest({ body: {} });

        const response = await PUT_ToDo(request);

        expect(response.status).toBe(400);
        const data = await response.json();
        expect(data.message).toBe('Chore ID is required');
    });

    it('should update a chore and return it', async () => {
        const mockSession: MockSession = {
            user: { id: '1', householdId: '1' },
        };
        vi.mocked(getServerSession).mockResolvedValueOnce(mockSession);

        const request = createMockRequest({ body: { choreId: 1 } });

        const mockChore = {
            id: 1,
            name: 'Updated Chore',
            dueDate: new Date('2023-10-01'),
            priority: 1,
            cycle: 0,
            repeatCount: 0,
            description: 'Updated Description',
            createdById: 1,
            householdId: 1,
            createdAt: new Date('2023-09-01'),
            updatedAt: new Date('2023-09-01'),
            done: true,
            doneById: null,
            parentChoreId: null,
        };

        const serializedChore = JSON.parse(JSON.stringify(mockChore));

        vi.mocked(prisma.chore.update).mockResolvedValueOnce(mockChore);

        const response = await PUT_ToDo(request);

        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data.chore).toEqual(serializedChore);
    });

    it('should handle errors and return 500', async () => {
        const mockSession: MockSession = {
            user: { id: '1', householdId: '1' },
        };
        vi.mocked(getServerSession).mockResolvedValueOnce(mockSession);

        const request = createMockRequest({ body: { choreId: 1 } });

        vi.mocked(prisma.chore.update).mockRejectedValueOnce(new Error('Database error'));

        const response = await PUT_ToDo(request);

        expect(response.status).toBe(500);
        const data = await response.json();
        expect(data.error).toBe('Internal Server Error');
    });
});

describe('Chore PUT Done API', () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    const createMockRequest = (options: MockRequestOptions): Request => {
        const { searchParams = {}, body = {} } = options;

        const url = new URL('http://localhost:3000/api/chore/done');
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

        const request = createMockRequest({});

        const response = await PUT_Done(request);

        expect(response.status).toBe(401);
        const data = await response.json();
        expect(data.message).toBe('You must be logged in to modify chores');
    });

    it('should return 401 if user is not part of a household', async () => {
        const mockSession: MockSession = {
            user: { id: '1' },
        };
        vi.mocked(getServerSession).mockResolvedValueOnce(mockSession);

        const request = createMockRequest({});

        const response = await PUT_Done(request);

        expect(response.status).toBe(401);
        const data = await response.json();
        expect(data.message).toBe('You must be part of a household to modify chores');
    });

    it('should return 400 if choreId is not provided', async () => {
        const mockSession: MockSession = {
            user: { id: '1', householdId: '1' },
        };
        vi.mocked(getServerSession).mockResolvedValueOnce(mockSession);

        const request = createMockRequest({ body: {} });

        const response = await PUT_Done(request);

        expect(response.status).toBe(400);
        const data = await response.json();
        expect(data.message).toBe('Chore ID is required');
    });

    it('should update a chore and return it', async () => {
        const mockSession: MockSession = {
            user: { id: '1', householdId: '1' },
        };
        vi.mocked(getServerSession).mockResolvedValueOnce(mockSession);

        const request = createMockRequest({ body: { choreId: 1 } });

        const mockChore = {
            id: 1,
            name: 'Updated Chore',
            dueDate: new Date('2023-10-01'),
            priority: 1,
            cycle: 0,
            repeatCount: 0,
            description: 'Updated Description',
            createdById: 1,
            householdId: 1,
            createdAt: new Date('2023-09-01'),
            updatedAt: new Date('2023-09-01'),
            done: false,
            doneById: null,
            parentChoreId: null,
        };

        const serializedChore = JSON.parse(JSON.stringify(mockChore));

        vi.mocked(prisma.chore.update).mockResolvedValueOnce(mockChore);

        const response = await PUT_Done(request);

        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data.chore).toEqual(serializedChore);
    });

    it('should handle errors and return 500', async () => {
        const mockSession: MockSession = {
            user: { id: '1', householdId: '1' },
        };
        vi.mocked(getServerSession).mockResolvedValueOnce(mockSession);

        const request = createMockRequest({ body: { choreId: 1 } });

        vi.mocked(prisma.chore.update).mockRejectedValueOnce(new Error('Database error'));

        const response = await PUT_Done(request);

        expect(response.status).toBe(500);
        const data = await response.json();
        expect(data.error).toBe('Internal Server Error');
    });
});

describe('Chore DELETE API', () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    const createMockRequest = (options: MockRequestOptions): Request => {
        const { searchParams = {}, body = {} } = options;

        const url = new URL('http://localhost:3000/api/chore/delete');
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

        const request = createMockRequest({});

        const response = await DELETE(request);

        expect(response.status).toBe(401);
        const data = await response.json();
        expect(data.message).toBe('You must be logged in to delete chores');
    });

    it('should return 401 if user is not part of a household', async () => {
        const mockSession: MockSession = {
            user: { id: '1' },
        };
        vi.mocked(getServerSession).mockResolvedValueOnce(mockSession);

        const request = createMockRequest({});

        const response = await DELETE(request);

        expect(response.status).toBe(401);
        const data = await response.json();
        expect(data.message).toBe('You must be part of a household to delete chores');
    });

    it('should return 400 if choreId is not provided', async () => {
        const mockSession: MockSession = {
            user: { id: '1', householdId: '1' },
        };
        vi.mocked(getServerSession).mockResolvedValueOnce(mockSession);

        const request = createMockRequest({ body: {} });

        const response = await DELETE(request);

        expect(response.status).toBe(400);
        const data = await response.json();
        expect(data.message).toBe('Chore ID is required');
    });

    it('should delete a chore and return it', async () => {
        const mockSession: MockSession = {
            user: { id: '1', householdId: '1' },
        };
        vi.mocked(getServerSession).mockResolvedValueOnce(mockSession);

        const request = createMockRequest({ body: { choreId: 1 } });

        const mockChore = {
            id: 1,
            name: 'Deleted Chore',
            dueDate: new Date('2023-10-01'),
            priority: 1,
            cycle: 0,
            repeatCount: 0,
            description: 'Deleted Description',
            createdById: 1,
            householdId: 1,
            createdAt: new Date('2023-09-01'),
            updatedAt: new Date('2023-09-01'),
            done: false,
            doneById: null,
            parentChoreId: null,
        };

        const serializedChore = JSON.parse(JSON.stringify(mockChore));

        vi.mocked(prisma.chore.delete).mockResolvedValueOnce(mockChore);

        const response = await DELETE(request);

        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data.message).toBe('Chore deleted successfully');
        expect(data.chore).toEqual(serializedChore);
    });

    it('should handle errors and return 500', async () => {
        const mockSession: MockSession = {
            user: { id: '1', householdId: '1' },
        };
        vi.mocked(getServerSession).mockResolvedValueOnce(mockSession);

        const request = createMockRequest({ body: { choreId: 1 } });

        vi.mocked(prisma.chore.delete).mockRejectedValueOnce(new Error('Database error'));

        const response = await DELETE(request);

        expect(response.status).toBe(500);
        const data = await response.json();
        expect(data.error).toBe('Internal Server Error');
    });
});
