import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { GET } from '../src/app/api/user/profilepictures/route';

interface ProfilePictureData {
  id: number;
  name: string;
  imageUrl: string;
  category: string | null;
  createdAt: Date;
}

vi.mock('next-auth');
vi.mock('../libs/prisma', () => {
  return {
    default: {
      profilePicture: {
        findMany: vi.fn(),
      }
    }
  };
});

import prisma from '../libs/prisma';

describe('Profile Pictures Collection API', () => {
  const mockSession = {
    user: {
      id: '1',
      name: 'Test User',
      email: 'test@example.com',
    }
  };

  const mockProfilePictures: ProfilePictureData[] = [
    {
      id: 1,
      name: 'Default Avatar',
      imageUrl: '/images/avatars/defaultAvatar.png',
      category: 'default',
      createdAt: new Date('2025-01-01T00:00:00Z'),
    },
    {
      id: 2,
      name: 'Cat',
      imageUrl: '/images/avatars/cat.png',
      category: 'animals',
      createdAt: new Date('2025-01-02T00:00:00Z'),
    },
    {
      id: 3,
      name: 'Dog',
      imageUrl: '/images/avatars/dog.png',
      category: 'animals',
      createdAt: new Date('2025-01-03T00:00:00Z'),
    },
    {
      id: 4,
      name: 'Smiley',
      imageUrl: '/images/avatars/smiley.png',
      category: 'emojis',
      createdAt: new Date('2025-01-04T00:00:00Z'),
    }
  ];

  const mockProfilePicturesResponse = mockProfilePictures.map(pic => ({
    ...pic,
    createdAt: pic.createdAt.toISOString()
  }));

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getServerSession).mockResolvedValue(mockSession);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('GET /api/user/profilepictures', () => {
    it('should return 401 if user is not authenticated', async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce(null);
      
      const request = new NextRequest('http://localhost:3000/api/user/profilepictures', {
        method: 'GET',
      });
      
      const response = await GET(request);
      const data = await response.json();
      
      expect(response.status).toBe(401);
      expect(data).toEqual({ error: 'Unauthorized' });
    });

    it('should return all profile pictures when authenticated', async () => {
      vi.mocked(prisma.profilePicture.findMany).mockResolvedValueOnce(mockProfilePictures);
      
      const request = new NextRequest('http://localhost:3000/api/user/profilepictures', {
        method: 'GET',
      });
      
      const response = await GET(request);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data).toEqual({ profilePictures: mockProfilePicturesResponse });
      expect(prisma.profilePicture.findMany).toHaveBeenCalledWith({
        where: {},
        orderBy: {
          createdAt: 'asc',
        }
      });
    });

    it('should return empty array when no profile pictures exist', async () => {
      vi.mocked(prisma.profilePicture.findMany).mockResolvedValueOnce([]);
      
      const request = new NextRequest('http://localhost:3000/api/user/profilepictures', {
        method: 'GET',
      });
      
      const response = await GET(request);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data).toEqual({ profilePictures: [] });
    });

    it('should return 500 if database query fails', async () => {
      vi.mocked(prisma.profilePicture.findMany).mockRejectedValueOnce(new Error('Database error'));
      
      const request = new NextRequest('http://localhost:3000/api/user/profilepictures', {
        method: 'GET',
      });
      
      const response = await GET(request);
      const data = await response.json();
      
      expect(response.status).toBe(500);
      expect(data).toEqual({ error: 'Failed to fetch profile pictures' });
    });
  });
});