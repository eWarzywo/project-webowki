import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import Messages from '../src/app/(app)/messages/page';
import '@testing-library/jest-dom';

vi.mock('stream-chat', () => {
    const mockSendMessage = vi.fn().mockResolvedValue({});

    const mockChannel = {
        watch: vi.fn().mockResolvedValue({}),
        query: vi.fn().mockResolvedValue({
            messages: [],
        }),
        on: vi.fn(),
        off: vi.fn(),
        sendMessage: mockSendMessage,
    };

    const mockStreamClient = {
        connectUser: vi.fn().mockResolvedValue({}),
        disconnectUser: vi.fn().mockResolvedValue({}),
        userID: '1',
        channel: vi.fn().mockReturnValue(mockChannel),
    };

    return {
        StreamChat: {
            getInstance: vi.fn().mockReturnValue(mockStreamClient),
        },
        Channel: vi.fn(),
        MessageResponse: vi.fn(),
    };
});

vi.mock('next-auth/react', () => ({
    useSession: () => ({
        data: {
            user: {
                id: '1',
                householdId: '1',
                username: 'testuser',
            },
        },
        status: 'authenticated',
    }),
}));

vi.mock('next/image', () => ({
    default: ({
        src,
        alt,
        width,
        height,
        className,
    }: {
        src: string;
        alt: string;
        width: number | string;
        height: number | string;
        className?: string;
    }) => <img src={src} alt={alt} width={width} height={height} className={className} />,
}));

vi.mock('next/navigation', () => {
    const router = {
        push: vi.fn(),
        refresh: vi.fn(),
    };
    return {
        useRouter: () => router,
        useSearchParams: () => ({
            get: vi.fn(),
        }),
        usePathname: () => '/',
    };
});

vi.mock('@/lib/socket', () => ({
    useSocket: () => ({
        isConnected: true,
    }),
}));

const createMockFetch = (options = {}) => {
    const defaultResponses = {
        tokenResponse: { token: 'mock-token', userId: '1' },
        householdData: {
            id: 1,
            name: 'Test Household',
            joinCode: 'ABC123',
            ownerId: 1,
        },
        userProfilesResponse: [
            {
                id: '1',
                username: 'testuser',
                email: 'test@example.com',
                profilePicture: {
                    id: 1,
                    name: 'Avatar 1',
                    imageUrl: '/images/avatars/avatar1.jpg',
                    category: 'avatar',
                },
            },
            {
                id: '2',
                username: 'anotheruser',
                email: 'another@example.com',
                profilePicture: {
                    id: 2,
                    name: 'Avatar 2',
                    imageUrl: '/images/avatars/avatar2.jpg',
                    category: 'avatar',
                },
            },
        ],
    };

    const responses = { ...defaultResponses, ...options };

    return vi.fn().mockImplementation((input) => {
        const url = typeof input === 'string' ? input : input.url;

        if (url.includes('/api/messages/token')) {
            return Promise.resolve(new Response(JSON.stringify(responses.tokenResponse)));
        } else if (url.includes('/api/household?householdId=1')) {
            return Promise.resolve(new Response(JSON.stringify(responses.householdData)));
        } else if (url.includes('/api/household/users/profiles?householdId=1')) {
            return Promise.resolve(new Response(JSON.stringify(responses.userProfilesResponse)));
        }

        return Promise.resolve(new Response(JSON.stringify({}), { status: 400 }));
    });
};

describe('Messages Page Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        global.fetch = createMockFetch();

        global.IntersectionObserver = vi.fn().mockImplementation(() => ({
            observe: vi.fn(),
            unobserve: vi.fn(),
            disconnect: vi.fn(),
        }));

        Object.defineProperty(document, 'visibilityState', {
            configurable: true,
            get: vi.fn().mockReturnValue('visible'),
        });
    });

    it('should show loading state initially', async () => {
        render(<Messages />);
        expect(screen.getByText(/loading user profiles/i)).toBeInTheDocument();
    });

    it('should fetch user profiles and initialize chat', async () => {
        render(<Messages />);

        await waitFor(
            () => {
                const messagesHeading = screen.getAllByText(/messages/i)[0];
                expect(messagesHeading).toBeInTheDocument();

                expect(screen.getByText('testuser')).toBeInTheDocument();
                expect(screen.getByText('anotheruser')).toBeInTheDocument();
            },
            { timeout: 3000 },
        );

        expect(global.fetch).toHaveBeenCalledWith('/api/household?householdId=1');
        expect(global.fetch).toHaveBeenCalledWith('/api/household/users/profiles?householdId=1');
    });

    it('should show empty state when no messages', async () => {
        render(<Messages />);

        await waitFor(
            () => {
                const emptyStateText = screen.getByText(/no messages yet/i);
                expect(emptyStateText).toBeInTheDocument();

                const startConversationText = screen.getByText(/start a conversation/i);
                expect(startConversationText).toBeInTheDocument();
            },
            { timeout: 3000 },
        );
    });

    it('should handle failed API responses', async () => {
        global.fetch = vi.fn().mockImplementation((url) => {
            if (url.includes('/api/household?householdId=1')) {
                return Promise.resolve(
                    new Response(
                        JSON.stringify({
                            id: 1,
                            name: 'Test Household',
                            joinCode: 'ABC123',
                        }),
                    ),
                );
            } else if (url.includes('/api/household/users/profiles?householdId=1')) {
                return Promise.resolve(new Response(JSON.stringify([{ id: '1', username: 'testuser' }])));
            } else if (url.includes('/api/messages/token')) {
                return Promise.resolve(new Response(JSON.stringify({ error: 'Auth failed' }), { status: 401 }));
            }
            return Promise.resolve(new Response(JSON.stringify({})));
        });

        console.error = vi.fn();

        render(<Messages />);

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith('/api/household?householdId=1');
            expect(global.fetch).toHaveBeenCalledWith('/api/household/users/profiles?householdId=1');
        });

        await waitFor(() => {
            expect(console.error).toHaveBeenCalled();
        });
    });
});
