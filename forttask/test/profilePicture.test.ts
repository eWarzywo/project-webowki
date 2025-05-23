import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { GET, POST } from '../src/app/api/user/profilepicture/route';

interface ProfilePictureData {
  id: number;
  name: string;
  imageUrl: string;
  category: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface UserWithProfilePicture {
  id: number;
  username: string;
  email: string;
  passwordHash: string;
  profilePictureId: number | null;
  householdId: number | null;
  createdAt: Date;
  profilePicture: ProfilePictureData | null;
  _count?: { events: number };
}

vi.mock('next-auth');
vi.mock('../libs/prisma', () => {
  return {
    default: {
      user: {
        findUnique: vi.fn(),
        update: vi.fn(),
      },
      profilePicture: {
        findUnique: vi.fn(),
      }
    }
  };
});

import prisma from '../libs/prisma';

describe('Profile Picture API', () => {
  const mockSession = {
    user: {
      id: '1',
      name: 'Test User',
      email: 'test@example.com',
    }
  };

  const mockProfilePicture: ProfilePictureData = {
    id: 2,
    name: 'Test Avatar',
    imageUrl: '/images/avatars/test.png',
    category: 'test',
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const mockProfilePictureResponse = {
    ...mockProfilePicture,
    createdAt: mockProfilePicture.createdAt.toISOString(),
    updatedAt: mockProfilePicture.updatedAt.toISOString()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getServerSession).mockResolvedValue(mockSession);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('GET /api/user/profilepicture', () => {
    it('should return 401 if user is not authenticated', async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce(null);
      
      const request = new NextRequest('http://localhost:3000/api/user/profilepicture', {
        method: 'GET',
      });
      
      const response = await GET(request);
      const data = await response.json();
      
      expect(response.status).toBe(401);
      expect(data).toEqual({ error: 'Unauthorized' });
    });

    it('should return 404 if user is not found', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null);
      
      const request = new NextRequest('http://localhost:3000/api/user/profilepicture', {
        method: 'GET',
      });
      
      const response = await GET(request);
      const data = await response.json();
      
      expect(response.status).toBe(404);
      expect(data).toEqual({ error: 'User not found' });
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        select: { profilePicture: true },
      });
    });

    it('should return the user profile picture when found', async () => {
      const mockUserWithProfilePicture: UserWithProfilePicture = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        passwordHash: 'hashedpassword',
        profilePictureId: 2,
        householdId: 1,
        createdAt: new Date(),
        _count: { events: 0 },
        profilePicture: mockProfilePicture
      };
      
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(mockUserWithProfilePicture);
      
      const request = new NextRequest('http://localhost:3000/api/user/profilepicture', {
        method: 'GET',
      });
      
      const response = await GET(request);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data).toEqual({ profilePicture: mockProfilePictureResponse });
    });

    it('should return null profile picture when user has no profile picture', async () => {
      const mockUserWithoutProfilePicture: UserWithProfilePicture = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        passwordHash: 'hashedpassword',
        profilePictureId: null,
        householdId: 1,
        createdAt: new Date(),
        _count: { events: 0 },
        profilePicture: null
      };
      
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(mockUserWithoutProfilePicture);
      
      const request = new NextRequest('http://localhost:3000/api/user/profilepicture', {
        method: 'GET',
      });
      
      const response = await GET(request);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data).toEqual({ profilePicture: null });
    });

    it('should return 500 if an error occurs', async () => {
      vi.mocked(prisma.user.findUnique).mockRejectedValueOnce(new Error('Database error'));
      
      const request = new NextRequest('http://localhost:3000/api/user/profilepicture', {
        method: 'GET',
      });
      
      const response = await GET(request);
      const data = await response.json();
      
      expect(response.status).toBe(500);
      expect(data).toEqual({ error: 'Failed to fetch profile picture' });
    });
  });

  describe('POST /api/user/profilepicture', () => {
    const mockRequestBody = {
      userId: 1,
      profilePictureId: 2
    };

    it('should return 401 if user is not authenticated', async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce(null);
      
      const request = new NextRequest('http://localhost:3000/api/user/profilepicture', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mockRequestBody),
      });
      
      const response = await POST(request);
      const data = await response.json();
      
      expect(response.status).toBe(401);
      expect(data).toEqual({ error: 'Unauthorized' });
    });

    it('should return 401 if user tries to update someone else\'s profile picture', async () => {
      const mockDifferentUserRequestBody = {
        userId: 2,
        profilePictureId: 2
      };
      
      const request = new NextRequest('http://localhost:3000/api/user/profilepicture', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mockDifferentUserRequestBody),
      });
      
      const response = await POST(request);
      const data = await response.json();
      
      expect(response.status).toBe(401);
      expect(data).toEqual({ error: 'Unauthorized' });
    });

    it('should set profilePictureId to null when id is 0', async () => {
      const mockRequestWithDefaultAvatar = {
        userId: 1,
        profilePictureId: 0
      };
      
      const mockUserWithoutProfilePicture: UserWithProfilePicture = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        passwordHash: 'hashedpassword',
        profilePictureId: null,
        householdId: 1,
        createdAt: new Date(),
        _count: { events: 0 },
        profilePicture: null
      };
      
      vi.mocked(prisma.user.update).mockResolvedValueOnce(mockUserWithoutProfilePicture);
      
      const request = new NextRequest('http://localhost:3000/api/user/profilepicture', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mockRequestWithDefaultAvatar),
      });
      
      const response = await POST(request);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data).toEqual({ 
        profilePicture: null,
        message: 'Profile picture updated successfully' 
      });
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { profilePictureId: null },
        select: { profilePicture: true },
      });
    });

    it('should update the user profile picture', async () => {
      const mockUserWithProfilePicture: UserWithProfilePicture = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        passwordHash: 'hashedpassword',
        profilePictureId: 2,
        householdId: 1,
        createdAt: new Date(),
        _count: { events: 0 },
        profilePicture: mockProfilePicture
      };
      
      vi.mocked(prisma.user.update).mockResolvedValueOnce(mockUserWithProfilePicture);
      
      const request = new NextRequest('http://localhost:3000/api/user/profilepicture', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mockRequestBody),
      });
      
      const response = await POST(request);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data).toEqual({ 
        profilePicture: mockProfilePictureResponse,
        message: 'Profile picture updated successfully' 
      });
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { profilePictureId: 2 },
        select: { profilePicture: true },
      });
    });

    it('should return 500 if an error occurs', async () => {
      vi.mocked(prisma.user.update).mockRejectedValueOnce(new Error('Database error'));
      
      const request = new NextRequest('http://localhost:3000/api/user/profilepicture', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mockRequestBody),
      });
      
      const response = await POST(request);
      const data = await response.json();
      
      expect(response.status).toBe(500);
      expect(data).toEqual({ error: 'Failed to update profile picture' });
    });
  });
});