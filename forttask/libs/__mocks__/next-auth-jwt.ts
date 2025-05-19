import { vi } from 'vitest';
import { JWT } from 'next-auth/jwt';

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
  jti: 'mock-jwt-id'
};

export const getToken = vi.fn().mockImplementation(() => {
  return Promise.resolve(mockToken);
});

export const setMockToken = (newToken: Partial<JWT> | null) => {
  if (newToken === null) {
    getToken.mockImplementation(() => Promise.resolve(null));
  } else {
    Object.assign(mockToken, newToken);
    getToken.mockImplementation(() => Promise.resolve(mockToken));
  }
};

export const resetMock = () => {
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
    jti: 'mock-jwt-id'
  });
};

const nextAuthJwt = {
  getToken,
  setMockToken,
  resetMock
};

export default nextAuthJwt;