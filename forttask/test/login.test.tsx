import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import LoginPage from '../src/app/login/page';
import '@testing-library/jest-dom';

const mockPush = vi.fn();

vi.mock('next/navigation', () => ({
    useRouter: () => ({
        push: mockPush,
        refresh: vi.fn(),
    }),
}));

const mockSignIn = vi.fn();
vi.mock('next-auth/react', () => ({
    signIn: (
        provider?: string | undefined,
        options?: { redirect?: boolean; callbackUrl?: string; username?: string; password?: string },
    ) => mockSignIn(provider, options),
}));

describe('Login Page Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should render login form', () => {
        render(<LoginPage />);
        expect(screen.queryByText('Login', { selector: '.text-2xl' })).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Username or Email')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /^login$/i })).toBeInTheDocument();
    });

    it('should show validation error when form is submitted without data', async () => {
        render(<LoginPage />);

        const loginButton = screen.getByRole('button', { name: /^login$/i });
        fireEvent.click(loginButton);

        await waitFor(() => {
            expect(screen.getByText('Please enter both username and password')).toBeInTheDocument();
        });
    });

    it('should call signIn when form is submitted with data', async () => {
        mockSignIn.mockResolvedValueOnce({ error: null });

        render(<LoginPage />);

        const usernameInput = screen.getByPlaceholderText('Username or Email');
        const passwordInput = screen.getByPlaceholderText('Password');
        const loginButton = screen.getByRole('button', { name: /^login$/i });

        fireEvent.change(usernameInput, { target: { value: 'testuser' } });
        fireEvent.change(passwordInput, { target: { value: 'password123' } });
        fireEvent.click(loginButton);

        await waitFor(() => {
            expect(mockSignIn).toHaveBeenCalledWith('credentials', {
                username: 'testuser',
                password: 'password123',
                redirect: false,
            });
        });

        await waitFor(() => {
            expect(mockPush).toHaveBeenCalledWith('/');
        });
    });

    it('should show error message when login fails', async () => {
        mockSignIn.mockResolvedValueOnce({ error: 'Invalid credentials' });

        render(<LoginPage />);

        const usernameInput = screen.getByPlaceholderText('Username or Email');
        const passwordInput = screen.getByPlaceholderText('Password');
        const loginButton = screen.getByRole('button', { name: /^login$/i });

        fireEvent.change(usernameInput, { target: { value: 'testuser' } });
        fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
        fireEvent.click(loginButton);

        await waitFor(() => {
            expect(screen.getByText('Invalid username or password')).toBeInTheDocument();
        });
    });

    it('should navigate to signup page when signup button is clicked', () => {
        render(<LoginPage />);

        const signupButton = screen.getByRole('button', { name: /sign up/i });
        fireEvent.click(signupButton);

        expect(mockPush).toHaveBeenCalledWith('/signup');
    });
});
