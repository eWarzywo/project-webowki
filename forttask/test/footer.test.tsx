import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import Footer from '../src/components/generalUI/footer';

vi.mock('../src/components/generalUI/messageLink', () => ({
    default: () => <div data-testid="message-link-mock">Message Link Mock</div>,
}));

vi.mock('../src/components/generalUI/logoutButton', () => ({
    default: () => <div data-testid="logout-button-mock">Logout Button Mock</div>,
}));

describe('Footer Component', () => {
    it('renders the footer with all elements', () => {
        render(<Footer />);

        expect(screen.getByText('© 2025 FortTask. All rights reserved.')).toBeInTheDocument();

        expect(screen.getByTestId('message-link-mock')).toBeInTheDocument();
        expect(screen.getByTestId('logout-button-mock')).toBeInTheDocument();
    });
});
