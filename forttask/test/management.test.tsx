import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import Management from '../src/app/(app)/managment/page';
import '@testing-library/jest-dom';

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

vi.mock('next-auth/react', () => ({
    useSession: () => ({
        data: { user: { id: '1', householdId: '1' } },
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

interface MockResponseOptions {
    userData?: {
        id: number;
        username: string;
        email: string;
    };
    householdData?: {
        id: number;
        name: string;
        joinCode: string;
        ownerId: number;
    };
    householdUsers?: Array<{
        id: number;
        username: string;
        email: string;
    }>;
    profilePictures?: {
        profilePictures: Array<{
            id: number;
            name: string;
            imageUrl: string;
            category: string;
        }>;
    };
    userProfilePicture?: {
        profilePicture: {
            id: number;
            name: string;
            imageUrl: string;
            category: string;
        };
    };
    updateUserResponse?: { message: string };
    updateHouseholdResponse?: { message: string };
    updateProfilePictureResponse?: { message: string };
}

type FetchInput = string | URL | Request | RequestInput;

interface RequestInput {
    url?: string;
    method?: string;
    headers?: Record<string, string>;
    body?: string;
}

const createMockFetch = (options: MockResponseOptions = {}) => {
    const defaultResponses = {
        userData: {
            id: 1,
            username: 'testuser',
            email: 'test@example.com',
        },
        householdData: {
            id: 1,
            name: 'Test Household',
            joinCode: 'ABC123',
            ownerId: 1,
        },
        householdUsers: [
            { id: 1, username: 'testuser', email: 'test@example.com' },
            { id: 2, username: 'anotheruser', email: 'another@example.com' },
        ],
        profilePictures: {
            profilePictures: [
                { id: 1, name: 'Avatar 1', imageUrl: '/images/avatars/avatar1.jpg', category: 'avatar' },
                { id: 2, name: 'Avatar 2', imageUrl: '/images/avatars/avatar2.jpg', category: 'avatar' },
            ],
        },
        userProfilePicture: {
            profilePicture: { id: 1, name: 'Avatar 1', imageUrl: '/images/avatars/avatar1.jpg', category: 'avatar' },
        },
        updateUserResponse: { message: 'User updated successfully' },
        updateHouseholdResponse: { message: 'Household updated successfully' },
        updateProfilePictureResponse: { message: 'Profile picture updated successfully' },
    };

    const responses = { ...defaultResponses, ...options };

    return vi.fn().mockImplementation((input: FetchInput, init?: RequestInit) => {
        const url =
            typeof input === 'string'
                ? input
                : input instanceof URL
                  ? input.toString()
                  : input instanceof Request
                    ? input.url
                    : input.url || '';

        const method =
            init?.method || (input instanceof Request ? input.method : (input as RequestInput)?.method) || 'GET';

        if (url.includes('/api/user?userId=1')) {
            return Promise.resolve(new Response(JSON.stringify(responses.userData)));
        } else if (url.includes('/api/user/profilepictures')) {
            return Promise.resolve(new Response(JSON.stringify(responses.profilePictures)));
        } else if (url.includes('/api/user/profilepicture') && method === 'POST') {
            return Promise.resolve(new Response(JSON.stringify(responses.updateProfilePictureResponse)));
        } else if (url.includes('/api/user/profilepicture')) {
            return Promise.resolve(new Response(JSON.stringify(responses.userProfilePicture)));
        } else if (url === '/api/user' && method === 'PUT') {
            return Promise.resolve(new Response(JSON.stringify(responses.updateUserResponse)));
        } else if (url.includes('/api/household?householdId=1')) {
            return Promise.resolve(new Response(JSON.stringify(responses.householdData)));
        } else if (url.includes('/api/household/users')) {
            return Promise.resolve(new Response(JSON.stringify(responses.householdUsers)));
        } else if (url === '/api/household' && method === 'PUT') {
            return Promise.resolve(new Response(JSON.stringify(responses.updateHouseholdResponse)));
        }

        return Promise.resolve(new Response(JSON.stringify({}), { status: 400 }));
    });
};

// Mock clipboard API
Object.assign(navigator, {
    clipboard: {
        writeText: vi.fn().mockImplementation(() => Promise.resolve()),
    },
});

describe('Management Page Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        global.fetch = createMockFetch() as unknown as typeof fetch;
    });

    it('should render the management page with tabs', async () => {
        render(<Management />);

        expect(screen.getByText('Management')).toBeInTheDocument();

        expect(screen.getByRole('list')).toBeInTheDocument();
        expect(screen.getAllByText('Account').length).toBeGreaterThan(0);
        expect(screen.getByText('Profile Picture')).toBeInTheDocument();
        expect(screen.getByText('Household')).toBeInTheDocument();
    });

    it('should show Account tab content by default', async () => {
        render(<Management />);

        await waitFor(() => {
            expect(screen.queryByText('Loading user data...')).not.toBeInTheDocument();
        });

        expect(screen.getByText('Username')).toBeInTheDocument();
        expect(screen.getByText('Email')).toBeInTheDocument();

        const usernameInput = screen.getByPlaceholderText('Enter your new username');
        const emailInput = screen.getByPlaceholderText('Enter your new email');

        expect(usernameInput).toHaveValue('testuser');
        expect(emailInput).toHaveValue('test@example.com');
    });

    it('should switch to Profile Picture tab and show avatars', async () => {
        render(<Management />);

        await waitFor(() => {
            expect(screen.queryByText('Loading user data...')).not.toBeInTheDocument();
        });

        const profilePictureTab = screen.getByText('Profile Picture');
        fireEvent.click(profilePictureTab);

        await waitFor(() => {
            expect(screen.queryByText('Loading avatars...')).not.toBeInTheDocument();
        });

        const avatar1Elements = screen.getAllByText('Avatar 1');
        const avatar2Elements = screen.getAllByText('Avatar 2');

        expect(avatar1Elements.length).toBeGreaterThan(0);
        expect(avatar2Elements.length).toBeGreaterThan(0);
    });

    it('should handle profile picture selection and save', async () => {
        global.fetch = vi.fn().mockImplementation((url: string | URL | Request, options?: RequestInit) => {
            if (url === '/api/user/profilepicture' && options?.method === 'POST') {
                return Promise.resolve(
                    new Response(
                        JSON.stringify({
                            message: 'Profile picture updated successfully',
                            profilePicture: {
                                id: 2,
                                name: 'Avatar 2',
                                imageUrl: '/images/avatars/avatar2.jpg',
                                category: 'avatar',
                            },
                        }),
                    ),
                );
            }
            return createMockFetch()(url as any, options as any);
        }) as unknown as typeof fetch;

        render(<Management />);

        await waitFor(() => {
            expect(screen.queryByText('Loading user data...')).not.toBeInTheDocument();
        });

        const profilePictureTab = screen.getByText('Profile Picture');
        fireEvent.click(profilePictureTab);

        await waitFor(() => {
            expect(screen.getByText('Choose a New Avatar')).toBeInTheDocument();
            expect(screen.queryByText('Loading avatars...')).not.toBeInTheDocument();
        });

        const avatarImages = screen.getAllByAltText('Avatar 2');
        if (avatarImages.length > 0) {
            const avatar2 = avatarImages[0];
            const container = avatar2.closest('div')?.parentElement;
            if (container) {
                fireEvent.click(container);
            }
        }

        await waitFor(() => {
            const saveButton = screen.getByText('Save Profile Picture');
            fireEvent.click(saveButton);
        });

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith(
                '/api/user/profilepicture',
                expect.objectContaining({
                    method: 'POST',
                    headers: expect.objectContaining({
                        'Content-Type': 'application/json',
                    }),
                    body: expect.stringContaining('profilePictureId'),
                }),
            );
        });

        await waitFor(() => {
            expect(screen.getByText('Profile picture updated successfully!')).toBeInTheDocument();
        });
    });

    it('should switch to Household tab and show household settings', async () => {
        render(<Management />);

        await waitFor(() => {
            expect(screen.queryByText('Loading user data...')).not.toBeInTheDocument();
        });

        const householdTab = screen.getByText('Household');
        fireEvent.click(householdTab);

        await waitFor(() => {
            expect(screen.queryByText('Loading household data...')).not.toBeInTheDocument();
        });

        expect(screen.getByText('Household Name')).toBeInTheDocument();
        expect(screen.getByText('Join Code')).toBeInTheDocument();
        expect(screen.getByText('Household Members')).toBeInTheDocument();

        const nameInput = screen.getByDisplayValue('Test Household');
        const joinCodeInput = screen.getByDisplayValue('ABC123');

        expect(nameInput).toBeInTheDocument();
        expect(joinCodeInput).toBeInTheDocument();
    });

    it('should handle copy join code button', async () => {
        render(<Management />);

        await waitFor(() => {
            expect(screen.queryByText('Loading user data...')).not.toBeInTheDocument();
        });

        const householdTab = screen.getByText('Household');
        fireEvent.click(householdTab);

        await waitFor(() => {
            expect(screen.queryByText('Loading household data...')).not.toBeInTheDocument();
        });

        await waitFor(() => {
            expect(screen.getByText('Household Name')).toBeInTheDocument();
        });

        const copyButton = screen.getByText('Copy');
        fireEvent.click(copyButton);

        expect(navigator.clipboard.writeText).toHaveBeenCalledWith('ABC123');

        await waitFor(() => {
            expect(screen.getByText('Join code copied to clipboard!')).toBeInTheDocument();
        });
    });
});
