import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import LogoutPage from '../src/app/logout/page';
import LogoutButton from '../src/components/generalUI/logoutButton';
import '@testing-library/jest-dom';

const mockPush = vi.fn();

vi.mock('next/navigation', () => ({
    useRouter: () => ({
        push: mockPush,
        refresh: vi.fn(),
    }),
}));

const mockSignOut = vi.fn();
vi.mock('next-auth/react', () => ({
    signOut: (options?: { callbackUrl?: string; redirect?: boolean }) => mockSignOut(options),
}));

describe('Logout Functionality Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should render the logout button', () => {
        render(<LogoutButton />);

        const logoutButton = screen.getByRole('button', { name: /logout/i });
        expect(logoutButton).toBeInTheDocument();
    });

    it('should navigate to logout page when logout button is clicked', () => {
        render(<LogoutButton />);

        const logoutButton = screen.getByRole('button', { name: /logout/i });
        fireEvent.click(logoutButton);

        expect(mockPush).toHaveBeenCalledWith('/logout');
    });

    it('should render the logout confirmation page', () => {
        render(<LogoutPage />);

        expect(screen.getByText('Logout')).toBeInTheDocument();
        expect(screen.getByText('Are you sure you want to log out?')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /log out/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    it('should handle logout when confirmed', async () => {
        mockSignOut.mockResolvedValueOnce({});

        render(<LogoutPage />);

        const logoutButton = screen.getByRole('button', { name: /log out/i });
        fireEvent.click(logoutButton);

        await waitFor(() => {
            expect(mockSignOut).toHaveBeenCalledWith({ redirect: false });
            expect(mockPush).toHaveBeenCalledWith('/login');
        });
    });

    it('should navigate back to dashboard when cancelled', () => {
        render(<LogoutPage />);

        const cancelButton = screen.getByRole('button', { name: /cancel/i });
        fireEvent.click(cancelButton);

        expect(mockPush).toHaveBeenCalledWith('/');
    });

    it('should show loading state while logging out', async () => {
        const signOutPromise = new Promise((resolve) => setTimeout(() => resolve({}), 100));
        mockSignOut.mockReturnValueOnce(signOutPromise);

        render(<LogoutPage />);

        const logoutButton = screen.getByRole('button', { name: /log out/i });
        fireEvent.click(logoutButton);

        expect(screen.getByText('Logging out...')).toBeInTheDocument();

        await waitFor(() => {
            expect(mockSignOut).toHaveBeenCalled();
        });
    });
});
