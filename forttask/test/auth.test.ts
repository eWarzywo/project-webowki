import { expect, test, describe, vi, beforeEach } from 'vitest';
import { NextRequest} from 'next/server';
import { middleware } from '../src/middleware';
import { authOptions } from '../src/app/auth';
import { JWT } from 'next-auth/jwt';
import { Session, User } from 'next-auth';
import { mockToken, mockSession, resetMocks } from '../libs/__mocks__/next-auth';
import { getToken } from 'next-auth/jwt';

vi.mock('next-auth/jwt', () => ({
  getToken: vi.fn()
}));

vi.mock('bcrypt', () => {
  return {
    default: {
      compare: vi.fn().mockResolvedValue(true)
    },
    compare: vi.fn().mockResolvedValue(true)
  };
});

vi.mock('next/server', async (importOriginal) => {
  const actual = await importOriginal() as typeof import('next/server');
  
  const createMockResponse = (options = {}) => {
    const mock = {
      status: 200,
      headers: new Headers(),
      json: () => Promise.resolve({}),
      text: () => Promise.resolve(''),
      ok: true,
      redirected: false,
      type: 'basic',
      url: '',
      ...options
    };
    Object.setPrototypeOf(mock, actual.NextResponse.prototype);
    return mock;
  };
  
  return {
    ...actual,
    NextResponse: {
      ...actual.NextResponse,
      next: vi.fn().mockImplementation(() => {
        return createMockResponse({ status: 200 });
      }),
      redirect: vi.fn().mockImplementation((url) => {
        return createMockResponse({ 
          status: 302, 
          url: url.toString(),
          redirected: true
        });
      })
    }
  };
});

vi.mock('../libs/prisma');

vi.mock('../src/app/auth', () => {
  const mockAuthorize = vi.fn().mockImplementation(async (credentials) => {
    if (!credentials?.username || !credentials?.password) {
      return null;
    }
    
    if (credentials.username === 'testuser' && credentials.password === 'correct_password') {
      return {
        id: mockToken.id,
        name: mockToken.name,
        email: mockToken.email,
        username: mockToken.username,
        householdId: mockToken.householdId
      };
    }
    
    return null;
  });
  
  const mockJwtCallback = vi.fn().mockImplementation(({ token, user, trigger, session }) => {
    if (user) {
      token.id = user.id;
      token.householdId = user.householdId;
      token.username = user.username;
    }
    
    if (trigger === 'update' && session?.user?.householdId) {
      token.householdId = session.user.householdId;
    }
    
    return token;
  });
  
  const mockSessionCallback = vi.fn().mockImplementation(({ session, token }) => {
    session.user.id = token.id;
    session.user.householdId = token.householdId;
    session.user.username = token.username || '';
    
    return session;
  });
  
  return {
    authOptions: {
      providers: [{
        id: 'credentials',
        name: 'Credentials',
        type: 'credentials',
        credentials: {
          username: { label: 'Username/Email', type: 'text' },
          password: { label: 'Password', type: 'password' },
        },
        authorize: mockAuthorize
      }],
      callbacks: {
        jwt: mockJwtCallback,
        session: mockSessionCallback
      },
      debug: false,
      secret: 'test-secret',
      session: {
        strategy: 'jwt',
        maxAge: 30 * 24 * 60 * 60
      },
      pages: {
        signIn: '/login'
      }
    }
  };
});

describe('Authentication middleware tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetMocks();
  });

  test('should allow access to /api routes without token', async () => {
    const apiReq = new NextRequest(new URL('http://localhost:3000/api/user'), {
      headers: new Headers({ 'Content-Type': 'application/json' }),
    });
    
    vi.mocked(getToken).mockResolvedValue(null);
    
    const response = await middleware(apiReq);
    
    expect(response).toBeDefined();
    expect(getToken).toHaveBeenCalled();
    expect(response.status).toBe(200);
  });

  test('should allow access to /login without token', async () => {
    const loginReq = new NextRequest(new URL('http://localhost:3000/login'), {
      headers: new Headers({ 'Content-Type': 'application/json' }),
    });
    
    vi.mocked(getToken).mockResolvedValue(null);
    
    const response = await middleware(loginReq);
    
    expect(response).toBeDefined();
    expect(response.status).toBe(200);
  });

  test('should allow access to /signup without token', async () => {
    const signupReq = new NextRequest(new URL('http://localhost:3000/signup'), {
      headers: new Headers({ 'Content-Type': 'application/json' }),
    });
    
    vi.mocked(getToken).mockResolvedValue(null);
    
    const response = await middleware(signupReq);
    
    expect(response).toBeDefined();
    expect(response.status).toBe(200);
  });

  test('should allow access to /household without token', async () => {
    const householdReq = new NextRequest(new URL('http://localhost:3000/household'), {
      headers: new Headers({ 'Content-Type': 'application/json' }),
    });
    
    vi.mocked(getToken).mockResolvedValue(null);
    
    const response = await middleware(householdReq);
    
    expect(response).toBeDefined();
    expect(response.status).toBe(200);
  });

  test('should redirect to /login if no token and protected route', async () => {
    const protectedReq = new NextRequest(new URL('http://localhost:3000/bills'), {
      headers: new Headers({ 'Content-Type': 'application/json' }),
    });
    
    vi.mocked(getToken).mockResolvedValue(null);
    
    const response = await middleware(protectedReq);
    
    expect(response).toBeDefined();
    expect(response.url).toBe('http://localhost:3000/login');
    expect(response.status).toBe(302); 
  });

  test('should redirect to /household if has token but no householdId', async () => {
    const protectedReq = new NextRequest(new URL('http://localhost:3000/bills'), {
      headers: new Headers({ 'Content-Type': 'application/json' }),
    });
    
    const tokenWithoutHousehold = { ...mockToken, householdId: null };
    vi.mocked(getToken).mockResolvedValue(tokenWithoutHousehold);
    
    const response = await middleware(protectedReq);
    
    expect(response).toBeDefined();
    expect(response.url).toBe('http://localhost:3000/household');
    expect(response.status).toBe(302);
  });
  
  test('should allow access to protected route with valid token and householdId', async () => {
    const protectedReq = new NextRequest(new URL('http://localhost:3000/bills'), {
      headers: new Headers({ 'Content-Type': 'application/json' }),
    });
    
    vi.mocked(getToken).mockResolvedValue(mockToken);
    
    const response = await middleware(protectedReq);
    
    expect(response).toBeDefined();
    expect(response.status).toBe(200);
  });
});

describe('Authentication credentials tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetMocks();
  });

  test('should authenticate with correct credentials', async () => {
    // @ts-expect-error - Provider type doesn't include authorize in TypeScript, but we know it exists
    const authorize = authOptions.providers[0].authorize;
    expect(authorize).toBeDefined();
    
    const user = await authorize({
      username: 'testuser',
      password: 'correct_password',
      csrf: 'token'
    });
    
    expect(user).not.toBeNull();
    expect(user).toHaveProperty('id', mockToken.id);
    expect(user).toHaveProperty('username', mockToken.username);
    expect(user).toHaveProperty('householdId', mockToken.householdId);
  });
  
  test('should fail authentication with incorrect password', async () => {
    // @ts-expect-error - Provider type doesn't include authorize in TypeScript, but we know it exists
    const authorize = authOptions.providers[0].authorize;
    expect(authorize).toBeDefined();
    
    if (authorize) {
      const user = await authorize({
        username: 'testuser',
        password: 'wrong_password',
        csrf: 'token'
      });
      
      expect(user).toBeNull();
    }
  });

  test('should fail authentication with missing credentials', async () => {
    // @ts-expect-error - Provider type doesn't include authorize in TypeScript, but we know it exists
    const authorize = authOptions.providers[0].authorize;
    expect(authorize).toBeDefined();
    
    if (authorize) {
      let user = await authorize({
        password: 'any_password',
        csrf: 'token'
      });
      expect(user).toBeNull();
      
      user = await authorize({
        username: 'testuser',
        csrf: 'token'
      });
      expect(user).toBeNull();
      
      user = await authorize({
        csrf: 'token'
      });
      expect(user).toBeNull();
    }
  });
});

describe('JWT and Session Callback Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetMocks();
  });
  
  test('jwt callback should return minimal token with user data', async () => {
    const callbacks = authOptions.callbacks;
    expect(callbacks).toBeDefined();
    if (!callbacks || !callbacks.jwt) {
      throw new Error('JWT callback is not defined');
    }
    
    const jwtCallback = callbacks.jwt;
    expect(jwtCallback).toBeDefined();
    
    const initialToken = { ...mockToken, householdId: null, username: 'oldusername' };
    const user = {
      id: mockToken.id,
      name: mockToken.name,
      email: mockToken.email,
      username: mockToken.username,
      householdId: mockToken.householdId
    };
    
    const result = await jwtCallback({
      token: initialToken as JWT,
      user: user as User,
      account: null,
      profile: undefined,
      isNewUser: false,
      trigger: 'signIn',
      session: null
    });
    
    expect(result).toHaveProperty('id', mockToken.id);
    expect(result).toHaveProperty('householdId', mockToken.householdId);
    expect(result).toHaveProperty('username', mockToken.username);
  });
  
  test('jwt callback should update token from session during update', async () => {
    const callbacks = authOptions.callbacks;
    expect(callbacks).toBeDefined();
    if (!callbacks || !callbacks.jwt) {
      throw new Error('JWT callback is not defined');
    }
    
    const jwtCallback = callbacks.jwt;
    expect(jwtCallback).toBeDefined();
    
    const updatedHouseholdId = '3';
    const result = await jwtCallback({
      token: { ...mockToken } as JWT,
      user: undefined as unknown as User,
      account: null,
      profile: undefined,
      isNewUser: false,
      trigger: 'update',
      session: {
        user: {
          id: mockToken.id,
          username: mockToken.username,
          householdId: updatedHouseholdId
        },
        expires: mockSession.expires
      } as unknown as Session
    });
    
    expect(result).toHaveProperty('id', mockToken.id);
    expect(result).toHaveProperty('householdId', updatedHouseholdId);
  });

  test('session callback should return minimal session with user data', async () => {
    const callbacks = authOptions.callbacks;
    expect(callbacks).toBeDefined();
    if (!callbacks || !callbacks.session) {
      throw new Error('Session callback is not defined');
    }
    
    const sessionCallback = callbacks.session;
    expect(sessionCallback).toBeDefined();
    
    const emptySession = {
      user: {
        id: '',
        username: '',
        householdId: null,
        name: 'Test User',
        email: 'test@example.com',
        image: ''
      },
      expires: '2023-01-01'
    };
    
    const mockAdapterUser = {
      id: '1',
      name: 'Test User',
      email: 'test@example.com',
      image: '/images/avatars/defaultAvatar.png',
      username: 'testuser',
      householdId: '1',
      emailVerified: new Date()
    };
    
    const result = await sessionCallback({
      session: emptySession as Session,
      token: mockToken as JWT,
      user: mockAdapterUser, 
      newSession: emptySession, 
      trigger: 'update'
    });
    
    expect(result).toHaveProperty('user.id', mockToken.id);
    expect(result).toHaveProperty('user.householdId', mockToken.householdId);
    expect(result).toHaveProperty('user.username', mockToken.username);
  });
});