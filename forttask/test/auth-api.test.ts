import { expect, test, describe, vi, beforeEach } from 'vitest';
import { POST as userCreateHandler } from '../src/app/api/user/route';
import {
    signIn,
    signOut,
    SignInResponse as NextAuthSignInResponse,
    SignOutResponse as NextAuthSignOutResponse,
} from 'next-auth/react';
import prisma from '../libs/__mocks__/prisma';
import bcrypt from 'bcrypt';

interface MockSignInResponse extends NextAuthSignInResponse {
    ok: boolean;
    error: string | null;
    status: number;
    url: string;
}

interface MockSignOutResponse extends NextAuthSignOutResponse {
    ok: boolean;
    url: string;
}

vi.mock('next-auth/react', () => ({
    signIn: vi.fn(),
    signOut: vi.fn(),
}));

vi.mock('bcrypt', () => {
    return {
        default: {
            hash: vi.fn().mockResolvedValue('hashed_password'),
            compare: vi.fn().mockResolvedValue(true),
        },
        hash: vi.fn().mockResolvedValue('hashed_password'),
        compare: vi.fn().mockResolvedValue(true),
    };
});

vi.mock('../libs/prisma');

describe('Authentication API endpoint tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    test('signIn should authenticate user with valid credentials', async () => {
        vi.mocked(signIn).mockResolvedValue({
            ok: true,
            error: null,
            status: 200,
            url: '',
        } as MockSignInResponse);

        const result = await signIn('credentials', {
            username: 'testuser',
            password: 'correct_password',
            redirect: false,
        });

        expect(result).toEqual({
            ok: true,
            error: null,
            status: 200,
            url: '',
        });
        expect(signIn).toHaveBeenCalledWith('credentials', {
            username: 'testuser',
            password: 'correct_password',
            redirect: false,
        });
    });

    test('signIn should return error with invalid credentials', async () => {
        vi.mocked(signIn).mockResolvedValue({
            ok: false,
            error: 'Invalid username or password',
            status: 401,
            url: '',
        } as MockSignInResponse);

        const result = await signIn('credentials', {
            username: 'testuser',
            password: 'wrong_password',
            redirect: false,
        });

        expect(result).toEqual({
            ok: false,
            error: 'Invalid username or password',
            status: 401,
            url: '',
        });
    });

    test('signOut should successfully log user out', async () => {
        vi.mocked(signOut).mockResolvedValue({
            ok: true,
            url: '',
        } as MockSignOutResponse);

        const result = await signOut({
            redirect: false,
        });

        expect(result).toEqual({
            ok: true,
            url: '',
        });
        expect(signOut).toHaveBeenCalledWith({
            redirect: false,
        });
    });

    test('User registration should create account and return 201', async () => {
        const mockUserInput = {
            firstName: 'Test',
            lastName: 'User',
            email: 'newuser@example.com',
            password: 'password123',
        };

        const req = new Request('http://localhost/api/user', {
            method: 'POST',
            body: JSON.stringify(mockUserInput),
            headers: {
                'Content-Type': 'application/json',
            },
        });

        vi.mocked(prisma.user.findFirst).mockResolvedValue(null); // No existing user
        vi.mocked(bcrypt.hash).mockImplementation(() => Promise.resolve('hashed_password'));

        const mockCreatedUser = {
            id: 1,
            username: 'test_user',
            email: 'newuser@example.com',
            passwordHash: 'hashed_password',
            createdAt: new Date(),
            profilePictureId: null,
            householdId: null,
        };

        vi.mocked(prisma.user.create).mockResolvedValue(mockCreatedUser);

        const response = await userCreateHandler(req as Request);
        const data = await response.json();

        expect(response.status).toBe(201);
        expect(data).toHaveProperty('message', 'Konto zostało utworzone');
        expect(data).toHaveProperty('user');
        expect(data.user).toHaveProperty('email', 'newuser@example.com');
        expect(data.user).not.toHaveProperty('passwordHash');

        expect(bcrypt.hash).toHaveBeenCalledWith('password123', expect.any(Number));

        expect(prisma.user.create).toHaveBeenCalled();
    });

    test('User registration should fail with duplicate email', async () => {
        const mockUserInput = {
            firstName: 'Test',
            lastName: 'User',
            email: 'existing@example.com',
            password: 'password123',
        };

        const req = new Request('http://localhost/api/user', {
            method: 'POST',
            body: JSON.stringify(mockUserInput),
            headers: {
                'Content-Type': 'application/json',
            },
        });

        vi.mocked(prisma.user.findFirst).mockResolvedValue({
            id: 1,
            email: 'existing@example.com',
            username: 'existinguser',
            passwordHash: 'hashed_password',
            createdAt: new Date(),
            profilePictureId: null,
            householdId: null,
        });

        const response = await userCreateHandler(req as Request);
        const data = await response.json();

        expect(response.status).toBe(409);
        expect(data).toHaveProperty('message', 'Użytkownik o podanym adresie email już istnieje');

        expect(prisma.user.create).not.toHaveBeenCalled();
    });
});
