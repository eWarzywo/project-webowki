import { Session } from 'next-auth';
import { JWT } from 'next-auth/jwt';
import { vi } from 'vitest';

export const mockToken: JWT = {
    id: '1',
    name: 'Test User',
    email: 'test@example.com',
    picture: '/images/avatars/defaultAvatar.png',
    sub: 'user-123',
    householdId: '1',
    username: 'testuser',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60,
    jti: 'mock-jwt-id',
};

export const mockSession: Session = {
    user: {
        id: '1',
        name: 'Test User',
        email: 'test@example.com',
        image: '/images/avatars/defaultAvatar.png',
        username: 'testuser',
        householdId: '1',
    },
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
};

export const getToken = vi.fn().mockImplementation(() => {
    return Promise.resolve(mockToken);
});

export const getSession = vi.fn().mockImplementation(() => {
    return Promise.resolve(mockSession);
});

export const useSession = vi.fn().mockReturnValue({
    data: mockSession,
    status: 'authenticated',
    update: vi.fn(),
});

export const signIn = vi.fn().mockImplementation(() => {
    return Promise.resolve({ ok: true, error: null });
});

export const signOut = vi.fn().mockImplementation(() => {
    return Promise.resolve({ ok: true });
});

export const setMockToken = (newToken: Partial<JWT>) => {
    Object.assign(mockToken, newToken);
};

export const setMockSession = (newSession: Partial<Session>) => {
    if (newSession.user) {
        Object.assign(mockSession.user, newSession.user);
    }
    if (newSession.expires) {
        mockSession.expires = newSession.expires;
    }
};

export const resetMocks = () => {
    setMockToken({
        id: '1',
        name: 'Test User',
        email: 'test@example.com',
        picture: '/images/avatars/defaultAvatar.png',
        sub: 'user-123',
        householdId: '1',
        username: 'testuser',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60,
        jti: 'mock-jwt-id',
    });

    setMockSession({
        user: {
            id: '1',
            name: 'Test User',
            email: 'test@example.com',
            image: '/images/avatars/defaultAvatar.png',
            username: 'testuser',
            householdId: '1',
        },
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    });

    getToken.mockImplementation(() => Promise.resolve(mockToken));
    getSession.mockImplementation(() => Promise.resolve(mockSession));
    useSession.mockReturnValue({
        data: mockSession,
        status: 'authenticated',
        update: vi.fn(),
    });
};

const nextAuth = {
    getToken,
    getSession,
    useSession,
    signIn,
    signOut,
    setMockToken,
    setMockSession,
    resetMocks,
};

export default nextAuth;
