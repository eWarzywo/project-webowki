import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST, DELETE } from '../src/app/api/bill/route';
import { GET as GET_Details } from '../src/app/api/bill/details/route';
import { GET as GET_TotalNumber } from '../src/app/api/bill/totalNumber/route';
import { PUT } from '../src/app/api/bill/paidToggle/route';
import { GET as GET_Mobile_Paid } from '../src/app/api/bill/mobile/paid/route';
import { GET as GET_Mobile_NotPaid } from '../src/app/api/bill/mobile/notpaid/route';
import prisma from '../libs/__mocks__/prisma';
import { getServerSession } from 'next-auth/next';
import { Prisma } from '@prisma/client';

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

describe('Bill GET API', () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    const createMockRequest = (options: MockRequestOptions): Request => {
        const { searchParams = {}, body = {} } = options;

        const url = new URL('http://localhost:3000/api/bill');
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

        const response = await GET(request);

        expect(response.status).toBe(401);
        const data = await response.json();
        expect(data).toEqual({ message: 'You must be logged in to get the bills' });
    });

    it('should return 404 if user is not found', async () => {
        const mockSession: MockSession = {
            user: { id: '1' },
        };
        vi.mocked(getServerSession).mockResolvedValueOnce(mockSession);

        vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null);

        const request = createMockRequest({});

        const response = await GET(request);

        expect(response.status).toBe(404);
        const data = await response.json();
        expect(data).toEqual({ message: 'User not found' });
    });

    it('should return 403 if user is not a member of a household', async () => {
        const mockSession: MockSession = {
            user: { id: '1' },
        };
        vi.mocked(getServerSession).mockResolvedValueOnce(mockSession);

        const request = createMockRequest({});

        vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
            id: 1,
            createdAt: new Date('2023-10-01'),
            username: 'testuser',
            email: 'test@test.test',
            passwordHash: 'hashedpassword',
            profilePictureId: null,
            householdId: null,
        });

        const response = await GET(request);

        expect(response.status).toBe(403);
        const data = await response.json();
        expect(data).toEqual({ message: 'You must be a member of a household to get the bills' });
    });

    it('should return 200 and the list of bills', async () => {
        const mockSession: MockSession = {
            user: { id: '1', householdId: '1' },
        };
        vi.mocked(getServerSession).mockResolvedValueOnce(mockSession);

        const mockBills = [
            {
                id: 1,
                name: 'Bill 1',
                amount: Prisma.Decimal(100),
                cycle: 1,
                dueDate: new Date('2023-10-01'),
                createdById: 1,
                createdAt: new Date('2023-10-01'),
                updatedAt: new Date('2023-10-01'),
                description: 'Test bill 1',
                householdId: 1,
                paidById: null,
            },
            {
                id: 2,
                name: 'Bill 2',
                amount: Prisma.Decimal(200),
                cycle: 1,
                dueDate: new Date('2023-11-01'),
                createdById: 1,
                createdAt: new Date('2023-10-01'),
                updatedAt: new Date('2023-10-01'),
                description: 'Test bill 2',
                householdId: 1,
                paidById: null,
            },
        ];

        vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
            id: 1,
            createdAt: new Date('2023-10-01'),
            username: 'testuser',
            email: 'test@test.test',
            passwordHash: 'hashedpassword',
            profilePictureId: null,
            householdId: 1,
        });

        vi.mocked(prisma.bill.findMany).mockResolvedValueOnce(mockBills);

        const serializedBills = JSON.parse(JSON.stringify(mockBills));

        const request = createMockRequest({});

        const response = await GET(request);

        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data).toEqual(serializedBills);
    });

    it('should return 500 if an error occurs', async () => {
        const mockSession: MockSession = {
            user: { id: '1', householdId: '1' },
        };
        vi.mocked(getServerSession).mockResolvedValueOnce(mockSession);

        vi.mocked(prisma.bill.findMany).mockRejectedValueOnce(new Error('Database error'));

        vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
            id: 1,
            createdAt: new Date('2023-10-01'),
            username: 'testuser',
            email: 'test@test.test',
            passwordHash: 'hashedpassword',
            profilePictureId: null,
            householdId: 1,
        });

        const request = createMockRequest({});

        const response = await GET(request);

        expect(response.status).toBe(500);
        const data = await response.json();
        expect(data).toEqual({ error: 'Internal Server Error' });
    });
});

describe('Bill POST API', () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    const createMockRequest = (options: MockRequestOptions): Request => {
        const { searchParams = {}, body = {} } = options;

        const url = new URL('http://localhost:3000/api/bill');
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
        expect(data).toEqual({ message: 'You must be logged in to create a bill' });
    });

    it('should return 404 if user is not found', async () => {
        const mockSession: MockSession = {
            user: { id: '1' },
        };
        vi.mocked(getServerSession).mockResolvedValueOnce(mockSession);

        vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null);

        const request = createMockRequest({});

        const response = await POST(request);

        expect(response.status).toBe(404);
        const data = await response.json();
        expect(data).toEqual({ message: 'User not found' });
    });

    it('should return 403 if user is not a member of a household', async () => {
        const mockSession: MockSession = {
            user: { id: '1' },
        };
        vi.mocked(getServerSession).mockResolvedValueOnce(mockSession);

        const request = createMockRequest({});

        vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
            id: 1,
            createdAt: new Date('2023-10-01'),
            username: 'testuser',
            email: 'test@test.test',
            passwordHash: 'hashedpassword',
            profilePictureId: null,
            householdId: null,
        });

        const response = await POST(request);

        expect(response.status).toBe(403);
        const data = await response.json();
        expect(data).toEqual({ message: 'You must be a member of a household to create a bill' });
    });

    it('should return 201 and create a new bill', async () => {
        const mockSession: MockSession = {
            user: { id: '1', householdId: '1' },
        };
        vi.mocked(getServerSession).mockResolvedValueOnce(mockSession);

        const body = {
            name: 'Test Bill',
            amount: Prisma.Decimal(100),
            cycle: 1,
            dueDate: new Date('2023-10-01'),
            description: 'Test bill',
        };

        const mockBill = {
            id: 1,
            ...body,
            createdById: 1,
            createdAt: new Date('2023-10-01'),
            updatedAt: new Date('2023-10-01'),
            householdId: 1,
            paidById: null,
        };

        vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
            id: 1,
            createdAt: new Date('2023-10-01'),
            username: 'testuser',
            email: 'test@test.test',
            passwordHash: 'hashedpassword',
            profilePictureId: null,
            householdId: 1,
        });

        vi.mocked(prisma.bill.create).mockResolvedValueOnce(mockBill);

        const serializedBill = JSON.parse(JSON.stringify(mockBill));

        const request = createMockRequest({ body });

        const response = await POST(request);

        expect(response.status).toBe(201);
        const data = await response.json();
        expect(data).toEqual(serializedBill);
    });

    it('should return 500 if an error occurs', async () => {
        const mockSession: MockSession = {
            user: { id: '1', householdId: '1' },
        };
        vi.mocked(getServerSession).mockResolvedValueOnce(mockSession);

        const body = {
            name: 'Test Bill',
            amount: Prisma.Decimal(100),
            cycle: 1,
            dueDate: new Date('2023-10-01'),
            description: 'Test bill',
        };

        vi.mocked(prisma.bill.create).mockRejectedValueOnce(new Error('Database error'));

        vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
            id: 1,
            createdAt: new Date('2023-10-01'),
            username: 'testuser',
            email: 'test@test.test',
            passwordHash: 'hashedpassword',
            profilePictureId: null,
            householdId: 1,
        });

        const request = createMockRequest({ body });

        const response = await POST(request);
        expect(response.status).toBe(500);
        const data = await response.json();
        expect(data).toEqual({ error: 'Internal Server Error' });
    });
});

describe('Bill DELETE API', () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    const createMockRequest = (options: MockRequestOptions): Request => {
        const { searchParams = {}, body = {} } = options;

        const url = new URL('http://localhost:3000/api/bill');
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
        expect(data).toEqual({ message: 'You must be logged in to delete a bill' });
    });

    it('should return 404 if user is not found', async () => {
        const mockSession: MockSession = {
            user: { id: '1' },
        };
        vi.mocked(getServerSession).mockResolvedValueOnce(mockSession);

        vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null);

        vi.mocked(prisma.bill.findUnique).mockResolvedValueOnce({
            id: 1,
            name: 'Test Bill',
            amount: Prisma.Decimal(100),
            cycle: 1,
            dueDate: new Date('2023-10-01'),
            createdById: 2,
            createdAt: new Date('2023-10-01'),
            updatedAt: new Date('2023-10-01'),
            description: 'Test bill',
            householdId: 1,
            paidById: null,
        });

        const request = createMockRequest({ searchParams: { id: '1' } });

        const response = await DELETE(request);

        expect(response.status).toBe(404);
        const data = await response.json();
        expect(data).toEqual({ message: 'User not found' });
    });

    it('should return 403 if user is not authorized to delete', async () => {
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

        vi.mocked(prisma.bill.findUnique).mockResolvedValueOnce({
            id: 1,
            name: 'Test Bill',
            amount: Prisma.Decimal(100),
            cycle: 1,
            dueDate: new Date('2023-10-01'),
            createdById: 2,
            createdAt: new Date('2023-10-01'),
            updatedAt: new Date('2023-10-01'),
            description: 'Test bill',
            householdId: 1,
            paidById: null,
        });

        const request = createMockRequest({ searchParams: { id: '1' } });

        const response = await DELETE(request);

        expect(response.status).toBe(403);
        const data = await response.json();
        expect(data).toEqual({ message: 'You are not authorized to delete this bill' });
    });

    it('should return 404 if bill is not found', async () => {
        const mockSession: MockSession = {
            user: { id: '1', householdId: '1' },
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

        vi.mocked(prisma.bill.findUnique).mockResolvedValueOnce(null);

        const request = createMockRequest({ searchParams: { id: '2' } });

        const response = await DELETE(request);
        expect(response.status).toBe(404);
        const data = await response.json();
        expect(data).toEqual({ message: 'Bill not found' });
    });

    it('should return 400 if bill id is invalid', async () => {
        const mockSession: MockSession = {
            user: { id: '1', householdId: '1' },
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

        vi.mocked(prisma.bill.findUnique).mockResolvedValueOnce({
            id: 1,
            name: 'Test Bill',
            amount: Prisma.Decimal(100),
            cycle: 1,
            dueDate: new Date('2023-10-01'),
            createdById: 2,
            createdAt: new Date('2023-10-01'),
            updatedAt: new Date('2023-10-01'),
            description: 'Test bill',
            householdId: 1,
            paidById: null,
        });

        const request = createMockRequest({ searchParams: { id: 'invalid' } });

        const response = await DELETE(request);

        expect(response.status).toBe(400);
        const data = await response.json();
        expect(data).toEqual({ message: 'Invalid bill ID' });
    });

    it('should return 200 and delete the bill', async () => {
        const mockSession: MockSession = {
            user: { id: '1', householdId: '1' },
        };
        vi.mocked(getServerSession).mockResolvedValueOnce(mockSession);

        const mockBill = {
            id: 1,
            name: 'Test Bill',
            amount: Prisma.Decimal(100),
            cycle: 1,
            dueDate: new Date('2023-10-01'),
            createdById: 1,
            createdAt: new Date('2023-10-01'),
            updatedAt: new Date('2023-10-01'),
            description: 'Test bill',
            householdId: 1,
            paidById: null,
        };

        vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
            id: 1,
            createdAt: new Date('2023-10-01'),
            username: 'testuser',
            email: 'test@test.test',
            passwordHash: 'hashedpassword',
            profilePictureId: null,
            householdId: 1,
        });

        vi.mocked(prisma.bill.findUnique).mockResolvedValueOnce(mockBill);
        vi.mocked(prisma.bill.delete).mockResolvedValueOnce(mockBill);

        const request = createMockRequest({ searchParams: { id: '1' } });

        const response = await DELETE(request);

        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data).toEqual({ message: 'Bill deleted successfully' });
    });

    it('should return 500 if an error occurs', async () => {
        const mockSession: MockSession = {
            user: { id: '1', householdId: '1' },
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

        vi.mocked(prisma.bill.findUnique).mockResolvedValueOnce({
            id: 1,
            name: 'Test Bill',
            amount: Prisma.Decimal(100),
            cycle: 1,
            dueDate: new Date('2023-10-01'),
            createdById: 1,
            createdAt: new Date('2023-10-01'),
            updatedAt: new Date('2023-10-01'),
            description: 'Test bill',
            householdId: 1,
            paidById: null,
        });

        vi.mocked(prisma.bill.delete).mockRejectedValueOnce(new Error('Database error'));

        const request = createMockRequest({ searchParams: { id: '1' } });

        const response = await DELETE(request);

        expect(response.status).toBe(500);
        const data = await response.json();
        expect(data).toEqual({ message: 'Internal Server Error' });
    });
});

describe('Bill GET Details API', () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    const createMockRequest = (options: MockRequestOptions): Request => {
        const { searchParams = {}, body = {} } = options;

        const url = new URL('http://localhost:3000/api/bill/details');
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

        const response = await GET_Details(request);

        expect(response.status).toBe(401);
        const data = await response.json();
        expect(data).toEqual({ error: 'Unauthorized' });
    });

    it('should return 400 if id is not provided', async () => {
        const mockSession: MockSession = {
            user: { id: '1' },
        };
        vi.mocked(getServerSession).mockResolvedValueOnce(mockSession);

        const request = createMockRequest({});

        const response = await GET_Details(request);

        expect(response.status).toBe(400);
        const data = await response.json();
        expect(data).toEqual({ error: 'ID is required' });
    });

    it('should return 404 if bill is not found', async () => {
        const mockSession: MockSession = {
            user: { id: '1', householdId: '1' },
        };
        vi.mocked(getServerSession).mockResolvedValueOnce(mockSession);

        const request = createMockRequest({ searchParams: { id: '1' } });

        vi.mocked(prisma.bill.findUnique).mockResolvedValueOnce(null);

        const response = await GET_Details(request);

        expect(response.status).toBe(404);
        const data = await response.json();
        expect(data).toEqual({ error: 'Bill not found' });
    });

    it('should return 200 and bill details', async () => {
        const mockSession: MockSession = {
            user: { id: '1', householdId: '1' },
        };
        vi.mocked(getServerSession).mockResolvedValueOnce(mockSession);

        const mockBillDetails = {
            id: 1,
            name: 'Test Bill',
            amount: Prisma.Decimal(100),
            cycle: 1,
            dueDate: new Date('2023-10-01'),
            createdById: 1,
            createdAt: new Date('2023-10-01'),
            updatedAt: new Date('2023-10-01'),
            description: 'Test bill',
            householdId: 1,
            paidById: null,
        };

        vi.mocked(prisma.bill.findUnique).mockResolvedValueOnce(mockBillDetails);

        const serializedBillDetails = JSON.parse(JSON.stringify(mockBillDetails));

        const request = createMockRequest({ searchParams: { id: '1' } });

        const response = await GET_Details(request);

        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data).toEqual(serializedBillDetails);
    });

    it('should return 500 if an error occurs', async () => {
        const mockSession: MockSession = {
            user: { id: '1', householdId: '1' },
        };
        vi.mocked(getServerSession).mockResolvedValueOnce(mockSession);

        vi.mocked(prisma.bill.findUnique).mockRejectedValueOnce(new Error('Database error'));

        const request = createMockRequest({ searchParams: { id: '1' } });

        const response = await GET_Details(request);

        expect(response.status).toBe(500);
        const data = await response.json();
        expect(data).toEqual({ error: 'Internal Server Error' });
    });
});

describe('Bill GET Total Number API', () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    const createMockRequest = (options: MockRequestOptions): Request => {
        const { searchParams = {}, body = {} } = options;

        const url = new URL('http://localhost:3000/api/bill/totalNumber');
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

        const response = await GET_TotalNumber(request);

        expect(response.status).toBe(401);
        const data = await response.json();
        expect(data).toEqual({ message: 'You must be logged in to get the total number of bills' });
    });

    it('should return 404 if user is not found', async () => {
        const mockSession: MockSession = {
            user: { id: '1' },
        };
        vi.mocked(getServerSession).mockResolvedValueOnce(mockSession);

        vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null);

        const request = createMockRequest({});

        const response = await GET_TotalNumber(request);

        expect(response.status).toBe(404);
        const data = await response.json();
        expect(data).toEqual({ message: 'User not found' });
    });

    it('should return 403 if user is not a member of a household', async () => {
        const mockSession: MockSession = {
            user: { id: '1' },
        };
        vi.mocked(getServerSession).mockResolvedValueOnce(mockSession);

        const request = createMockRequest({});

        vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
            id: 1,
            createdAt: new Date('2023-10-01'),
            username: 'testuser',
            email: 'test@test.test',
            passwordHash: 'hashedpassword',
            profilePictureId: null,
            householdId: null,
        });

        const response = await GET_TotalNumber(request);

        expect(response.status).toBe(403);
        const data = await response.json();
        expect(data).toEqual({ message: 'You must be a member of a household to get the total number of bills' });
    });

    it('should return 200 and the total number of bills', async () => {
        const mockSession: MockSession = {
            user: { id: '1', householdId: '1' },
        };
        vi.mocked(getServerSession).mockResolvedValueOnce(mockSession);

        const mockCount = 5;

        vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
            id: 1,
            createdAt: new Date('2023-10-01'),
            username: 'testuser',
            email: 'test@test.test',
            passwordHash: 'hashedpassword',
            profilePictureId: null,
            householdId: 1,
        });

        vi.mocked(prisma.bill.count).mockResolvedValueOnce(mockCount);

        const request = createMockRequest({});

        const response = await GET_TotalNumber(request);

        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data).toEqual({ count: mockCount });
    });

    it('should return 500 if an error occurs', async () => {
        const mockSession: MockSession = {
            user: { id: '1', householdId: '1' },
        };
        vi.mocked(getServerSession).mockResolvedValueOnce(mockSession);

        vi.mocked(prisma.bill.count).mockRejectedValueOnce(new Error('Database error'));
        vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
            id: 1,
            createdAt: new Date('2023-10-01'),
            username: 'testuser',
            email: 'test@test.test',
            passwordHash: 'hashedpassword',
            profilePictureId: null,
            householdId: 1,
        });

        const request = createMockRequest({});

        const response = await GET_TotalNumber(request);

        expect(response.status).toBe(500);
        const data = await response.json();
        expect(data).toEqual({ error: 'Internal Server Error' });
    });
});

describe('Bill PUT Paid Toggle API', () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    const createMockRequest = (options: MockRequestOptions): Request => {
        const { searchParams = {}, body = {} } = options;

        const url = new URL('http://localhost:3000/api/bill/paidToggle');
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

        const response = await PUT(request);

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

        const request = createMockRequest({});

        const response = await PUT(request);

        expect(response.status).toBe(404);
        const data = await response.json();
        expect(data).toEqual({ message: 'User not found' });
    });

    it('should return 403 if user is not a member of a household', async () => {
        const mockSession: MockSession = {
            user: { id: '1' },
        };
        vi.mocked(getServerSession).mockResolvedValueOnce(mockSession);

        const request = createMockRequest({});

        vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
            id: 1,
            createdAt: new Date('2023-10-01'),
            username: 'testuser',
            email: 'test@test.test',
            passwordHash: 'hashedpassword',
            profilePictureId: null,
            householdId: null,
        });

        const response = await PUT(request);

        expect(response.status).toBe(403);
        const data = await response.json();
        expect(data).toEqual({ message: 'You must be a member of a household to mark items as bought' });
    });

    it('should return 400 if request body is invalid', async () => {
        const mockSession: MockSession = {
            user: { id: '1', householdId: '1' },
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

        const request = createMockRequest({ body: {} });

        const response = await PUT(request);

        expect(response.status).toBe(400);
        const data = await response.json();
        expect(data).toEqual({ message: 'Invalid request' });
    });

    it('should return 404 if bill is not found', async () => {
        const mockSession: MockSession = {
            user: { id: '1', householdId: '1' },
        };
        vi.mocked(getServerSession).mockResolvedValueOnce(mockSession);

        const request = createMockRequest({ body: { id: 1, paid: true } });

        vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
            id: 1,
            createdAt: new Date('2023-10-01'),
            username: 'testuser',
            email: 'test@test.test',
            passwordHash: 'hashedpassword',
            profilePictureId: null,
            householdId: 1,
        });

        vi.mocked(prisma.bill.findUnique).mockResolvedValueOnce(null);

        const response = await PUT(request);

        expect(response.status).toBe(404);
        const data = await response.json();
        expect(data).toEqual({ message: 'Bill not found' });
    });

    it('should return 403 if user does not have permission to mark the bill as paid', async () => {
        const mockSession: MockSession = {
            user: { id: '1', householdId: '1' },
        };
        vi.mocked(getServerSession).mockResolvedValueOnce(mockSession);

        const request = createMockRequest({ body: { id: 1, paid: true } });

        vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
            id: 1,
            createdAt: new Date('2023-10-01'),
            username: 'testuser',
            email: 'test@test.test',
            passwordHash: 'hashedpassword',
            profilePictureId: null,
            householdId: 1,
        });

        vi.mocked(prisma.bill.findUnique).mockResolvedValueOnce({
            id: 1,
            name: 'Test Bill',
            amount: Prisma.Decimal(100),
            cycle: 1,
            dueDate: new Date('2023-10-01'),
            createdById: 2,
            createdAt: new Date('2023-10-01'),
            updatedAt: new Date('2023-10-01'),
            description: 'Test bill',
            householdId: 2,
            paidById: null,
        });

        const response = await PUT(request);

        expect(response.status).toBe(403);
        const data = await response.json();
        expect(data).toEqual({ message: 'You do not have permission to mark this bill as paid' });
    });

    it('should return 200 and update the bill as paid', async () => {
        const mockSession: MockSession = {
            user: { id: '1', householdId: '1' },
        };
        vi.mocked(getServerSession).mockResolvedValueOnce(mockSession);

        const request = createMockRequest({ body: { id: 1, paid: true } });

        const mockBill = {
            id: 1,
            name: 'Test Bill',
            amount: Prisma.Decimal(100),
            cycle: 1,
            dueDate: new Date('2023-10-01'),
            createdById: 1,
            createdAt: new Date('2023-10-01'),
            updatedAt: new Date('2023-10-01'),
            description: 'Test bill',
            householdId: 1,
            paidById: null,
        };

        vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
            id: 1,
            createdAt: new Date('2023-10-01'),
            username: 'testuser',
            email: 'test@test.test',
            passwordHash: 'hashedpassword',
            profilePictureId: null,
            householdId: 1,
        });

        vi.mocked(prisma.bill.findUnique).mockResolvedValueOnce(mockBill);
        vi.mocked(prisma.bill.update).mockResolvedValueOnce({
            ...mockBill,
            paidById: 1,
            updatedAt: new Date('2023-10-01'),
        });

        const serializedBill = JSON.parse(
            JSON.stringify({
                ...mockBill,
                paidById: 1,
                updatedAt: new Date('2023-10-01'),
            }),
        );

        const response = await PUT(request);

        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data).toEqual({ message: 'Bill updated successfully', bill: serializedBill });
    });
});

describe('Bill Mobile GET Paid API', () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    const createMockRequest = (options: MockRequestOptions): Request => {
        const { searchParams = {}, body = {} } = options;

        const url = new URL('http://localhost:3000/api/bill/mobile/paid');
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

        const response = await GET_Mobile_Paid(request);

        expect(response.status).toBe(401);
        const data = await response.json();
        expect(data).toEqual({ message: 'You must be logged in to get the bills' });
    });

    it('should return 404 if user is not found', async () => {
        const mockSession: MockSession = {
            user: { id: '1' },
        };
        vi.mocked(getServerSession).mockResolvedValueOnce(mockSession);

        vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null);

        const request = createMockRequest({});

        const response = await GET_Mobile_Paid(request);

        expect(response.status).toBe(404);
        const data = await response.json();
        expect(data).toEqual({ message: 'User not found' });
    });

    it('should return 403 if user is not a member of a household', async () => {
        const mockSession: MockSession = {
            user: { id: '1' },
        };
        vi.mocked(getServerSession).mockResolvedValueOnce(mockSession);

        const request = createMockRequest({});

        vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
            id: 1,
            createdAt: new Date('2023-10-01'),
            username: 'testuser',
            email: 'test@test.test',
            passwordHash: 'hashedpassword',
            profilePictureId: null,
            householdId: null,
        });

        const response = await GET_Mobile_Paid(request);

        expect(response.status).toBe(403);
        const data = await response.json();
        expect(data).toEqual({ message: 'You must be a member of a household to get the bills' });
    });

    it('should return 200 and the list of paid bills', async () => {
        const mockSession: MockSession = {
            user: { id: '1', householdId: '1' },
        };
        vi.mocked(getServerSession).mockResolvedValueOnce(mockSession);

        const mockBills = [
            {
                id: 1,
                name: 'Bill 1',
                amount: Prisma.Decimal(100),
                cycle: 1,
                dueDate: new Date('2023-10-01'),
                createdById: 1,
                createdAt: new Date('2023-10-01'),
                updatedAt: new Date('2023-10-01'),
                description: 'Test bill 1',
                householdId: 1,
                paidById: 2,
                createdBy: {
                    username: 'testuser',
                },
            },
            {
                id: 2,
                name: 'Bill 2',
                amount: Prisma.Decimal(200),
                cycle: 1,
                dueDate: new Date('2023-11-01'),
                createdById: 1,
                createdAt: new Date('2023-10-01'),
                updatedAt: new Date('2023-10-01'),
                description: 'Test bill 2',
                householdId: 1,
                paidById: 3,
                createdBy: {
                    username: 'testuser',
                },
            },
        ];

        vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
            id: 1,
            createdAt: new Date('2023-10-01'),
            username: 'testuser',
            email: 'test@test.test',
            passwordHash: 'hashedpassword',
            profilePictureId: null,
            householdId: 1,
        });

        vi.mocked(prisma.bill.findMany).mockResolvedValueOnce(mockBills);

        const serializedBills = JSON.parse(JSON.stringify(mockBills));

        const request = createMockRequest({});

        const response = await GET_Mobile_Paid(request);

        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data).toEqual(serializedBills);
        expect(prisma.bill.findMany).toHaveBeenCalledWith({
            where: {
                householdId: 1,
                paidById: { not: null },
            },
            skip: 0,
            take: undefined,
            orderBy: {
                dueDate: 'asc',
            },
            include: {
                createdBy: {
                    select: {
                        username: true,
                    },
                },
            },
        });
    });

    it('should handle skip and limit parameters', async () => {
        const mockSession: MockSession = {
            user: { id: '1', householdId: '1' },
        };
        vi.mocked(getServerSession).mockResolvedValueOnce(mockSession);

        const mockBills = [
            {
                id: 1,
                name: 'Bill 1',
                amount: Prisma.Decimal(100),
                cycle: 1,
                dueDate: new Date('2023-10-01'),
                createdById: 1,
                createdAt: new Date('2023-10-01'),
                updatedAt: new Date('2023-10-01'),
                description: 'Test bill 1',
                householdId: 1,
                paidById: 2,
                createdBy: {
                    username: 'testuser',
                },
            },
        ];

        vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
            id: 1,
            createdAt: new Date('2023-10-01'),
            username: 'testuser',
            email: 'test@test.test',
            passwordHash: 'hashedpassword',
            profilePictureId: null,
            householdId: 1,
        });

        vi.mocked(prisma.bill.findMany).mockResolvedValueOnce(mockBills);

        const serializedBills = JSON.parse(JSON.stringify(mockBills));

        const request = createMockRequest({ searchParams: { skip: '5', limit: '10' } });

        const response = await GET_Mobile_Paid(request);

        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data).toEqual(serializedBills);
        expect(prisma.bill.findMany).toHaveBeenCalledWith({
            where: {
                householdId: 1,
                paidById: { not: null },
            },
            skip: 5,
            take: 10,
            orderBy: {
                dueDate: 'asc',
            },
            include: {
                createdBy: {
                    select: {
                        username: true,
                    },
                },
            },
        });
    });

    it('should return 500 if an error occurs', async () => {
        const mockSession: MockSession = {
            user: { id: '1', householdId: '1' },
        };
        vi.mocked(getServerSession).mockResolvedValueOnce(mockSession);

        vi.mocked(prisma.bill.findMany).mockRejectedValueOnce(new Error('Database error'));

        vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
            id: 1,
            createdAt: new Date('2023-10-01'),
            username: 'testuser',
            email: 'test@test.test',
            passwordHash: 'hashedpassword',
            profilePictureId: null,
            householdId: 1,
        });

        const request = createMockRequest({});

        const response = await GET_Mobile_Paid(request);

        expect(response.status).toBe(500);
        const data = await response.json();
        expect(data).toEqual({ error: 'Internal Server Error' });
    });
});

describe('Bill Mobile GET NotPaid API', () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    const createMockRequest = (options: MockRequestOptions): Request => {
        const { searchParams = {}, body = {} } = options;

        const url = new URL('http://localhost:3000/api/bill/mobile/notpaid');
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

        const response = await GET_Mobile_NotPaid(request);

        expect(response.status).toBe(401);
        const data = await response.json();
        expect(data).toEqual({ message: 'You must be logged in to get the bills' });
    });

    it('should return 404 if user is not found', async () => {
        const mockSession: MockSession = {
            user: { id: '1' },
        };
        vi.mocked(getServerSession).mockResolvedValueOnce(mockSession);

        vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null);

        const request = createMockRequest({});

        const response = await GET_Mobile_NotPaid(request);

        expect(response.status).toBe(404);
        const data = await response.json();
        expect(data).toEqual({ message: 'User not found' });
    });

    it('should return 403 if user is not a member of a household', async () => {
        const mockSession: MockSession = {
            user: { id: '1' },
        };
        vi.mocked(getServerSession).mockResolvedValueOnce(mockSession);

        const request = createMockRequest({});

        vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
            id: 1,
            createdAt: new Date('2023-10-01'),
            username: 'testuser',
            email: 'test@test.test',
            passwordHash: 'hashedpassword',
            profilePictureId: null,
            householdId: null,
        });

        const response = await GET_Mobile_NotPaid(request);

        expect(response.status).toBe(403);
        const data = await response.json();
        expect(data).toEqual({ message: 'You must be a member of a household to get the bills' });
    });

    it('should return 200 and the list of unpaid bills', async () => {
        const mockSession: MockSession = {
            user: { id: '1', householdId: '1' },
        };
        vi.mocked(getServerSession).mockResolvedValueOnce(mockSession);

        const mockBills = [
            {
                id: 1,
                name: 'Bill 1',
                amount: Prisma.Decimal(100),
                cycle: 1,
                dueDate: new Date('2023-10-01'),
                createdById: 1,
                createdAt: new Date('2023-10-01'),
                updatedAt: new Date('2023-10-01'),
                description: 'Test bill 1',
                householdId: 1,
                paidById: null,
                createdBy: {
                    username: 'testuser',
                },
            },
            {
                id: 2,
                name: 'Bill 2',
                amount: Prisma.Decimal(200),
                cycle: 1,
                dueDate: new Date('2023-11-01'),
                createdById: 1,
                createdAt: new Date('2023-10-01'),
                updatedAt: new Date('2023-10-01'),
                description: 'Test bill 2',
                householdId: 1,
                paidById: null,
                createdBy: {
                    username: 'testuser',
                },
            },
        ];

        vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
            id: 1,
            createdAt: new Date('2023-10-01'),
            username: 'testuser',
            email: 'test@test.test',
            passwordHash: 'hashedpassword',
            profilePictureId: null,
            householdId: 1,
        });

        vi.mocked(prisma.bill.findMany).mockResolvedValueOnce(mockBills);

        const serializedBills = JSON.parse(JSON.stringify(mockBills));

        const request = createMockRequest({});

        const response = await GET_Mobile_NotPaid(request);

        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data).toEqual(serializedBills);
        expect(prisma.bill.findMany).toHaveBeenCalledWith({
            where: {
                householdId: 1,
                paidById: null,
            },
            skip: 0,
            take: undefined,
            orderBy: {
                dueDate: 'asc',
            },
            include: {
                createdBy: {
                    select: {
                        username: true,
                    },
                },
            },
        });
    });

    it('should handle skip and limit parameters', async () => {
        const mockSession: MockSession = {
            user: { id: '1', householdId: '1' },
        };
        vi.mocked(getServerSession).mockResolvedValueOnce(mockSession);

        const mockBills = [
            {
                id: 1,
                name: 'Bill 1',
                amount: Prisma.Decimal(100),
                cycle: 1,
                dueDate: new Date('2023-10-01'),
                createdById: 1,
                createdAt: new Date('2023-10-01'),
                updatedAt: new Date('2023-10-01'),
                description: 'Test bill 1',
                householdId: 1,
                paidById: null,
                createdBy: {
                    username: 'testuser',
                },
            },
        ];

        vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
            id: 1,
            createdAt: new Date('2023-10-01'),
            username: 'testuser',
            email: 'test@test.test',
            passwordHash: 'hashedpassword',
            profilePictureId: null,
            householdId: 1,
        });

        vi.mocked(prisma.bill.findMany).mockResolvedValueOnce(mockBills);

        const serializedBills = JSON.parse(JSON.stringify(mockBills));

        const request = createMockRequest({ searchParams: { skip: '5', limit: '10' } });

        const response = await GET_Mobile_NotPaid(request);

        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data).toEqual(serializedBills);
        expect(prisma.bill.findMany).toHaveBeenCalledWith({
            where: {
                householdId: 1,
                paidById: null,
            },
            skip: 5,
            take: 10,
            orderBy: {
                dueDate: 'asc',
            },
            include: {
                createdBy: {
                    select: {
                        username: true,
                    },
                },
            },
        });
    });

    it('should return 500 if an error occurs', async () => {
        const mockSession: MockSession = {
            user: { id: '1', householdId: '1' },
        };
        vi.mocked(getServerSession).mockResolvedValueOnce(mockSession);

        vi.mocked(prisma.bill.findMany).mockRejectedValueOnce(new Error('Database error'));

        vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
            id: 1,
            createdAt: new Date('2023-10-01'),
            username: 'testuser',
            email: 'test@test.test',
            passwordHash: 'hashedpassword',
            profilePictureId: null,
            householdId: 1,
        });

        const request = createMockRequest({});

        const response = await GET_Mobile_NotPaid(request);

        expect(response.status).toBe(500);
        const data = await response.json();
        expect(data).toEqual({ error: 'Internal Server Error' });
    });
});
