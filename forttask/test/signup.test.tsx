import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import SignupPage from '../src/app/signup/page';
import '@testing-library/jest-dom';

const mockPush = vi.fn();

vi.mock('next/navigation', () => ({
    useRouter: () => ({
        push: mockPush,
        refresh: vi.fn(),
    }),
}));

global.fetch = vi.fn();

describe('Signup Page Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (global.fetch as jest.Mock).mockResolvedValue({
            ok: true,
            json: async () => ({ success: true }),
            text: async () => JSON.stringify({ success: true }),
        });
    });

    it('should render signup form', () => {
        render(<SignupPage />);

        expect(screen.getAllByText('Sign Up')[0]).toBeInTheDocument();
        expect(screen.getByText('Create an account to get started')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('First Name')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Last Name')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Sign Up/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Log In/i })).toBeInTheDocument();
    });

    it('should show validation error when form is submitted with missing fields', async () => {
        render(<SignupPage />);

        const signupButton = screen.getByRole('button', { name: /Sign Up/i });
        fireEvent.click(signupButton);

        await waitFor(() => {
            expect(screen.getByText('Please fill in all fields')).toBeInTheDocument();
        });
    });

    it('should show validation error for short names', async () => {
        render(<SignupPage />);

        const firstNameInput = screen.getByPlaceholderText('First Name');
        const lastNameInput = screen.getByPlaceholderText('Last Name');
        const emailInput = screen.getByPlaceholderText('Email');
        const passwordInput = screen.getByPlaceholderText('Password');
        const signupButton = screen.getByRole('button', { name: /Sign Up/i });

        fireEvent.change(firstNameInput, { target: { value: 'A' } });
        fireEvent.change(lastNameInput, { target: { value: 'B' } });
        fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
        fireEvent.change(passwordInput, { target: { value: 'password123' } });

        fireEvent.click(signupButton);

        await waitFor(() => {
            expect(screen.getByText('First and last names must be at least 2 characters long')).toBeInTheDocument();
        });
    });

    it('should show validation error for invalid email', async () => {
        render(<SignupPage />);

        const firstNameInput = screen.getByPlaceholderText('First Name');
        const lastNameInput = screen.getByPlaceholderText('Last Name');
        const emailInput = screen.getByPlaceholderText('Email');
        const passwordInput = screen.getByPlaceholderText('Password');
        const signupButton = screen.getByRole('button', { name: /Sign Up/i });

        fireEvent.change(firstNameInput, { target: { value: 'John' } });
        fireEvent.change(lastNameInput, { target: { value: 'Doe' } });
        fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
        fireEvent.change(passwordInput, { target: { value: 'password123' } });

        fireEvent.click(signupButton);

        await waitFor(() => {
            expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
        });
    });

    it('should show validation error for short password', async () => {
        render(<SignupPage />);

        const firstNameInput = screen.getByPlaceholderText('First Name');
        const lastNameInput = screen.getByPlaceholderText('Last Name');
        const emailInput = screen.getByPlaceholderText('Email');
        const passwordInput = screen.getByPlaceholderText('Password');
        const signupButton = screen.getByRole('button', { name: /Sign Up/i });

        fireEvent.change(firstNameInput, { target: { value: 'John' } });
        fireEvent.change(lastNameInput, { target: { value: 'Doe' } });
        fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
        fireEvent.change(passwordInput, { target: { value: 'pass' } });

        fireEvent.click(signupButton);

        await waitFor(() => {
            expect(screen.getByText('Password must be at least 8 characters long')).toBeInTheDocument();
        });
    });

    it('should call API when form is submitted with valid data', async () => {
        render(<SignupPage />);

        const firstNameInput = screen.getByPlaceholderText('First Name');
        const lastNameInput = screen.getByPlaceholderText('Last Name');
        const emailInput = screen.getByPlaceholderText('Email');
        const passwordInput = screen.getByPlaceholderText('Password');
        const signupButton = screen.getByRole('button', { name: /Sign Up/i });

        fireEvent.change(firstNameInput, { target: { value: 'John' } });
        fireEvent.change(lastNameInput, { target: { value: 'Doe' } });
        fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
        fireEvent.change(passwordInput, { target: { value: 'password123' } });

        fireEvent.click(signupButton);

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith(
                '/api/user',
                expect.objectContaining({
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        firstName: 'John',
                        lastName: 'Doe',
                        email: 'test@example.com',
                        password: 'password123',
                    }),
                }),
            );
            expect(mockPush).toHaveBeenCalledWith('/login');
        });
    });

    it('should show error message when signup fails', async () => {
        const errorMessage = 'Email already in use';
        (global.fetch as jest.Mock).mockImplementationOnce(() =>
            Promise.resolve({
                ok: false,
                text: async () => JSON.stringify({ message: errorMessage }),
            }),
        );

        render(<SignupPage />);

        const firstNameInput = screen.getByPlaceholderText('First Name');
        const lastNameInput = screen.getByPlaceholderText('Last Name');
        const emailInput = screen.getByPlaceholderText('Email');
        const passwordInput = screen.getByPlaceholderText('Password');
        const signupButton = screen.getByRole('button', { name: /Sign Up/i });

        fireEvent.change(firstNameInput, { target: { value: 'John' } });
        fireEvent.change(lastNameInput, { target: { value: 'Doe' } });
        fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
        fireEvent.change(passwordInput, { target: { value: 'password123' } });

        fireEvent.click(signupButton);

        await waitFor(() => {
            expect(screen.getByText(errorMessage)).toBeInTheDocument();
        });
    });

    it('should navigate to login page when login button is clicked', () => {
        render(<SignupPage />);

        const loginButton = screen.getByRole('button', { name: /Log In/i });
        fireEvent.click(loginButton);

        expect(mockPush).toHaveBeenCalledWith('/login');
    });
});
