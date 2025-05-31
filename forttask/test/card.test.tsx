import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { Card, DataType } from '../src/components/generalUI/card';
import { format } from 'date-fns';

global.fetch = vi.fn();

vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: string; alt: string }) => (
    <img src={src} alt={alt} />
  ),
}));

vi.mock('next/link', () => ({
  default: ({ href, children, className }: any) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

describe('Card Component', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('renders with loading state initially', async () => {
    const today = new Date();
    render(
      <Card
        title="Test Title"
        subtitle="Test Subtitle"
        dataType={DataType.events}
        selectedDate={today}
        refresh={false}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Test Title')).toBeInTheDocument();
      expect(screen.getByText('Test Subtitle')).toBeInTheDocument();
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });
  });

  it('shows error message when fetch fails', async () => {
    const today = new Date();
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Failed to fetch'));

    render(
      <Card
        title="Test Title"
        subtitle="Test Subtitle"
        dataType={DataType.events}
        selectedDate={today}
        refresh={false}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Failed to load data')).toBeInTheDocument();
    });
  });

  it('displays "No items available" when data is empty', async () => {
    const today = new Date();
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ events: [] })
    });

    render(
      <Card
        title="Test Title"
        subtitle="Test Subtitle"
        dataType={DataType.events}
        selectedDate={today}
        refresh={false}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('No items available')).toBeInTheDocument();
    });
  });

  it('renders events correctly', async () => {
    const today = new Date();
    const mockEvents = [
      { id: 1, name: 'Event 1', description: 'Description 1', date: new Date(), location: 'Location 1' },
      { id: 2, name: 'Event 2', description: 'Description 2', date: new Date(), location: 'Location 2' }
    ];

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ events: mockEvents })
    });

    render(
      <Card
        title="Events"
        subtitle="Upcoming events"
        dataType={DataType.events}
        selectedDate={today}
        refresh={false}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Event 1')).toBeInTheDocument();
      expect(screen.getByText('Event 2')).toBeInTheDocument();
    });

    if (screen.queryByRole('button')) {
      fireEvent.click(screen.getByRole('button'));
    }
  });

  it('renders chores correctly', async () => {
    const today = new Date();
    const mockChores = [
      { id: 1, name: 'Chore 1', dueDate: new Date(), assignedTo: { username: 'User1' } },
      { id: 2, name: 'Chore 2', dueDate: new Date(), assignedTo: { username: 'User2' } }
    ];

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ chores: mockChores })
    });

    render(
      <Card
        title="Chores"
        subtitle="Pending chores"
        dataType={DataType.chores}
        selectedDate={today}
        refresh={false}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Chore 1')).toBeInTheDocument();
      expect(screen.getByText('Chore 2')).toBeInTheDocument();
    });
  });

  it('renders shopping items correctly', async () => {
    const today = new Date();
    const mockShoppingItems = [
      { id: 1, name: 'Item 1', cost: 10, createdBy: { username: 'User1' } },
      { id: 2, name: 'Item 2', cost: 20, createdBy: { username: 'User2' } }
    ];

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ shoppingItems: mockShoppingItems })
    });

    render(
      <Card
        title="Shopping List"
        subtitle="Items to buy"
        dataType={DataType.shopping}
        selectedDate={today}
        refresh={false}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Item 1')).toBeInTheDocument();
      expect(screen.getByText('10$')).toBeInTheDocument();
      expect(screen.getByText('Item 2')).toBeInTheDocument();
      expect(screen.getByText('20$')).toBeInTheDocument();
    });
  });

  it('renders bills correctly', async () => {
    const today = new Date();
    const mockBills = [
      { id: 1, name: 'Bill 1', amount: 100, dueDate: new Date() },
      { id: 2, name: 'Bill 2', amount: 200 }
    ];

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ bills: mockBills })
    });

    render(
      <Card
        title="Bills"
        subtitle="Pending bills"
        dataType={DataType.bills}
        selectedDate={today}
        refresh={false}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/Bill 1 - 100\$/)).toBeInTheDocument();
      expect(screen.getByText(/Bill 2 - 200\$/)).toBeInTheDocument();
      expect(screen.getByText('Optional')).toBeInTheDocument();
    });
  });

  it('uses the correct endpoint based on dataType', async () => {
    const today = new Date();
    const dateParam = format(today, 'yyyy-MM-dd');

    render(
      <Card
        title="Events"
        subtitle="Test"
        dataType={DataType.events}
        selectedDate={today}
        refresh={false}
      />
    );

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(`/api/overview/events?date=${dateParam}`);
    });

    vi.resetAllMocks();

    render(
      <Card
        title="Chores"
        subtitle="Test"
        dataType={DataType.chores}
        selectedDate={today}
        refresh={false}
      />
    );

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(`/api/overview/chores?date=${dateParam}`);
    });
  });

  it('refreshes data when refresh prop changes', async () => {
    const today = new Date();
    const { rerender } = render(
      <Card
        title="Test"
        subtitle="Test"
        dataType={DataType.events}
        selectedDate={today}
        refresh={false}
      />
    );

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    rerender(
      <Card
        title="Test"
        subtitle="Test"
        dataType={DataType.events}
        selectedDate={today}
        refresh={true}
      />
    );

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });

  it('shows only the last 3 items when more items are available', async () => {
    const today = new Date();
    const mockEvents = [
      { id: 1, name: 'Event 1', description: 'Description 1', date: new Date(), location: 'Location 1' },
      { id: 2, name: 'Event 2', description: 'Description 2', date: new Date(), location: 'Location 2' },
      { id: 3, name: 'Event 3', description: 'Description 3', date: new Date(), location: 'Location 3' },
      { id: 4, name: 'Event 4', description: 'Description 4', date: new Date(), location: 'Location 4' },
    ];

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ events: mockEvents })
    });

    render(
      <Card
        title="Events"
        subtitle="Upcoming events"
        dataType={DataType.events}
        selectedDate={today}
        refresh={false}
      />
    );

    await waitFor(() => {
      expect(screen.queryByText('Event 1')).not.toBeInTheDocument();
      expect(screen.getByText('Event 2')).toBeInTheDocument();
      expect(screen.getByText('Event 3')).toBeInTheDocument();
      expect(screen.getByText('Event 4')).toBeInTheDocument();
    });
  });

  it('generates correct link URLs for different item types', async () => {
    const today = new Date();
    const mockEvents = [
      { id: 1, name: 'Event 1', description: 'Description 1', date: new Date(), location: 'Location 1' }
    ];

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ events: mockEvents })
    });

    render(
      <Card
        title="Events"
        subtitle="Upcoming events"
        dataType={DataType.events}
        selectedDate={today}
        refresh={false}
      />
    );

    await waitFor(() => {
      const link = screen.getByText('Event 1').closest('a');
      expect(link).toHaveAttribute('href', '/events?id=1');
    });

    const eventLink = screen.getByText('Event 1');
    if (eventLink) {
      fireEvent.click(eventLink);
    }
  });
});
