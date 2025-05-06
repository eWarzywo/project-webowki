import { expect, test, vi } from 'vitest';
import { POST, GET, PUT, DELETE } from '../src/app/api/user/route';
import prisma from '../libs/__mocks__/prisma';
import bcrypt from 'bcrypt';

vi.mock('../libs/prisma');

vi.mock('bcrypt', () => {
  const hash = vi.fn().mockResolvedValue('hashed_password');
  const compare = vi.fn().mockResolvedValue(true);
  
  return {
    hash,
    compare,
    default: {
      hash,
      compare
    }
  };
});

test('POST User with correct data should return new User and status 201', async () => {
    const mockUserInput = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@email.com',
        password: 'password123',
    };

    const req = new Request('http://localhost/api/user', {
        method: 'POST',
        body: JSON.stringify(mockUserInput),
        headers: {
            'Content-Type': 'application/json',
        },
    });

    vi.clearAllMocks();
    
    prisma.user.findFirst.mockResolvedValue(null);
    
    const originalConsoleError = console.error;
    console.error = vi.fn();
    
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    // tajpskript diff
    bcrypt.hash.mockResolvedValue('hashed_password');
    
    
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    // tajpskript diff
    prisma.user.findUnique.mockImplementation(({ where }) => {
        return Promise.resolve(null);
    });

    const mockCreatedUser = {
        id: 1,
        username: 'john_doe',
        email: 'john@email.com',
        passwordHash: 'hashed_password',
        createdAt: new Date(),
    };

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    // tajpskript diff
    prisma.user.create.mockResolvedValue(mockCreatedUser);

    try {
        const response = await POST(req as Request);
        const data = await response.json();

        console.log('Response status:', response.status);
        console.log('Response data:', data);

        expect(response.status).toBe(201);
        expect(data).toHaveProperty('message', 'Konto zostało utworzone');
        expect(data).toHaveProperty('user');
        expect(data.user).toHaveProperty('username', 'john_doe');
        expect(data.user).toHaveProperty('email', 'john@email.com');
        expect(data.user).not.toHaveProperty('passwordHash');
    } finally {
 
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    // tajpskript diff
        if (console.error.mock.calls.length > 0) {

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    // tajpskript diff
            console.log('Captured errors:', console.error.mock.calls);
        }
        console.error = originalConsoleError;
    }
});

test('POST User with missing fields should return 400', async () => {
    const req = new Request('http://localhost/api/user', {
        method: 'POST',
        body: JSON.stringify({}),
        headers: {
            'Content-Type': 'application/json',
        },
    });

    const response = await POST(req as Request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toHaveProperty('message', 'Wymagane są wszystkie pola: imię, nazwisko, email i hasło');
});

test('POST User with invalid email should return 400', async () => {
    const mockInvalidUser = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'invalid_email',
        password: 'password123',
    };

    const req = new Request('http://localhost/api/user', {
        method: 'POST',
        body: JSON.stringify(mockInvalidUser),
        headers: {
            'Content-Type': 'application/json',
        },
    });

    const response = await POST(req as Request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toHaveProperty('message', 'Podaj prawidłowy adres email');
});

test('POST User with too short password should return 400', async () => {
    const mockInvalidUser = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@email.com',
        password: '123', // Too short
    };

    const req = new Request('http://localhost/api/user', {
        method: 'POST',
        body: JSON.stringify(mockInvalidUser),
        headers: {
            'Content-Type': 'application/json',
        },
    });

    const response = await POST(req as Request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toHaveProperty('message', 'Hasło musi mieć co najmniej 8 znaków');
});

test('POST User with existing email should return 409', async () => {
    const mockUser = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'existing@email.com',
        password: 'password123',
    };

    const req = new Request('http://localhost/api/user', {
        method: 'POST',
        body: JSON.stringify(mockUser),
        headers: {
            'Content-Type': 'application/json',
        },
    });

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    // tajpskript diff
    prisma.user.findFirst.mockResolvedValue({ id: 1, email: 'existing@email.com' });

    const response = await POST(req as Request);
    const data = await response.json();

    expect(response.status).toBe(409);
    expect(data).toHaveProperty('message', 'Użytkownik o podanym adresie email już istnieje');
});

test('POST User with invalid data should return 400', async () => {
    const mockInvalidUser = {
        username: 'invalid_name',
        email: 'invalid_email',
        passwordHash: 'hashed_password',
        householdId: 'invalid_id', // Not number
    };

    const req = new Request('http://localhost/api/user', {
        method: 'POST',
        body: JSON.stringify(mockInvalidUser),
        headers: {
            'Content-Type': 'application/json',
        },
    });

    const response = await POST(req as Request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toHaveProperty('message');
});

test('GET User with valid userId should return User', async () => {
    const mockUser = {
        id: 1,
        username: 'john',
        email: 'john@email.com',
        passwordHash: 'hashed_password',
        householdId: 1,
    };

    const req = new Request('http://localhost/api/user?userId=1', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    });

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    // tajpskript diff
    prisma.user.findUnique.mockResolvedValue(mockUser);

    const response = await GET(req as Request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toStrictEqual(mockUser);
});

test('GET User with missing userId should return 400', async () => {
    const req = new Request('http://localhost/api/user', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    });

    const response = await GET(req as Request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toStrictEqual({ error: 'Missing userId parameter' });
});

test('GET User with invalid userId should return 400', async () => {
    const req = new Request('http://localhost/api/user?userId=invalid', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    });

    const response = await GET(req as Request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toStrictEqual({ error: 'Invalid userId parameter' });
});

test('GET User rejected by database should return 400', async () => {
    const req = new Request('http://localhost/api/user?userId=1', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    });

    prisma.user.findUnique.mockRejectedValue(new Error('Database error'));

    const response = await GET(req as Request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toStrictEqual({ error: 'Invalid request' });
});

test('PUT User with correct data should return updated User and status 200', async () => {
    const mockUser = {
        id: 1,
        username: 'changed_name',
        email: 'changed@email.com',
        passwordHash: 'changed_password',
    };

    const req = new Request('http://localhost/api/user', {
        method: 'PUT',
        body: JSON.stringify(mockUser),
        headers: {
            'Content-Type': 'application/json',
        },
    });

    const mockResponse = { ...mockUser };

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    // tajpskript diff
    prisma.user.update.mockResolvedValue(mockResponse);

    const response = await PUT(req as Request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toStrictEqual(mockResponse);
});

test('PUT User with missing fields should return 400', async () => {
    const req = new Request('http://localhost/api/user', {
        method: 'PUT',
        body: JSON.stringify({}),
        headers: {
            'Content-Type': 'application/json',
        },
    });

    const response = await PUT(req as Request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toStrictEqual({ error: 'Missing userId parameter' });
});

test('PUT User with invalid data should return 400', async () => {
    const mockInvalidUser = {
        id: 1,
        username: 'invalid_name',
        email: 'invalid_email',
        passwordHash: 'hashed_password',
        householdId: 'invalid_id', // Not number
    };

    const req = new Request('http://localhost/api/user', {
        method: 'PUT',
        body: JSON.stringify(mockInvalidUser),
        headers: {
            'Content-Type': 'application/json',
        },
    });

    const response = await PUT(req as Request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toStrictEqual({ error: 'Invalid request' });
});

test('DELETE User with valid userId should return 200', async () => {
    const req = new Request('http://localhost/api/user?userId=1&householdId=1', {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
        },
    });

    const mockHousehold = {
        id: 1,
        name: 'Household 1',
        users: [],
    };

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    // tajpskript diff
    prisma.household.findUnique.mockResolvedValue(mockHousehold);

    prisma.user.deleteMany.mockResolvedValue({ count: 1 });

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    // tajpskript diff
    prisma.household.delete.mockResolvedValue({});

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    // tajpskript diff
    prisma.user.delete.mockResolvedValue({});

    const response = await DELETE(req as Request);

    expect(response.status).toBe(204);
});

test('DELETE User with missing userId or householdId should return 400', async () => {
    const req = new Request('http://localhost/api/user', {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
        },
    });

    const response = await DELETE(req as Request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toStrictEqual({ error: 'Missing userId or householdId parameter' });
});

test('DELETE User with invalid userId or householdId should return 400', async () => {
    const req = new Request('http://localhost/api/user?userId=invalid&householdId=invalid', {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
        },
    });

    const response = await DELETE(req as Request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toStrictEqual({ error: 'Invalid userId or householdId parameter' });
});
