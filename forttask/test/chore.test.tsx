import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import Chores from '../src/app/(app)/chores/page';
import ChoreAddForm from '../src/components/chores/choreAddForm';
import ChoreToDoList from '../src/components/chores/choreToDoList';
import ChoreToDoCard from '../src/components/chores/choreToDoCard';
import ChoreDoneList from '../src/components/chores/choreDoneList';
import ChoreDoneCard from '../src/components/chores/choreDoneCard';
import ChoreLeaderboard from '../src/components/chores/choreLeaderboard';
import '@testing-library/jest-dom';

const mockGet = vi.fn().mockImplementation((param) => {
    if (param === 'page') return '1';
    if (param === 'size') return '10';
    return null;
});

vi.mock('next/navigation', () => ({
    useRouter: () => ({
        push: vi.fn(),
        refresh: vi.fn(),
    }),
    useSearchParams: () => ({
        get: mockGet,
        getAll: vi.fn(),
        has: vi.fn(),
        forEach: vi.fn(),
        entries: vi.fn(),
        keys: vi.fn(),
        values: vi.fn(),
        toString: vi.fn(),
    }),
}));

vi.mock('next-auth/react', () => ({
    useSession: () => ({
        data: { user: { id: '1', householdId: '1' } },
        status: 'authenticated',
        update: vi.fn(),
    }),
}));

vi.mock('@/lib/socket', () => ({
    useSocket: () => ({
        isConnected: true,
        choresRefresh: false,
        emitUpdate: vi.fn(),
        joinHousehold: vi.fn(),
        leaveHousehold: vi.fn(),
    }),
}));

const mockChores = [
    {
        id: 1,
        name: 'Test Chore',
        description: 'This is a test chore',
        dueDate: new Date('2023-10-01'),
        createdById: 1,
        createdBy: { id: 1, username: 'testuser' },
        priority: 1,
        done: false,
    },
    {
        id: 2,
        name: 'Another Chore',
        description: 'Another test chore',
        dueDate: new Date('2023-10-02'),
        createdById: 1,
        createdBy: { id: 1, username: 'testuser' },
        priority: 2,
        done: false,
    },
];

const mockDoneChores = [
    {
        id: 3,
        name: 'Completed Chore',
        description: 'This chore is completed',
        dueDate: new Date('2023-09-30'),
        createdById: 1,
        createdBy: { id: 1, username: 'testuser' },
        priority: 1,
        done: true,
        doneById: 1,
        doneBy: { id: 1, username: 'testuser' },
    },
];

const mockLeaderboardData = [
    {
        username: 'testuser',
        choresDone: 5,
        profilePicture: {
            id: 1,
            name: 'Avatar 1',
            imageUrl: '/images/avatars/avatar1.jpg',
            category: 'avatar',
        },
    },
    {
        username: 'anotheruser',
        choresDone: 3,
        profilePicture: {
            id: 2,
            name: 'Avatar 2',
            imageUrl: '/images/avatars/avatar2.jpg',
            category: 'avatar',
        },
    },
];

const mockUserProfiles = [
    {
        id: 1,
        username: 'testuser',
        profilePicture: {
            id: 1,
            name: 'Avatar 1',
            imageUrl: '/images/avatars/avatar1.jpg',
            category: 'avatar',
        },
    },
    {
        id: 2,
        username: 'anotheruser',
        profilePicture: {
            id: 2,
            name: 'Avatar 2',
            imageUrl: '/images/avatars/avatar2.jpg',
            category: 'avatar',
        },
    },
];

const createMockFetch = (options = {}) => {
    const defaultResponses = {
        userResponse: { householdId: 1 },
        todoChoresResponse: { chores: mockChores, count: mockChores.length },
        doneChoresResponse: { chores: mockDoneChores, count: mockDoneChores.length },
        leaderboardResponse: mockLeaderboardData,
        profilesResponse: mockUserProfiles,
        createChoreResponse: { message: 'Chore created successfully' },
        deleteChoreResponse: { message: 'Chore deleted successfully' },
        doneChoreResponse: { message: 'Chore marked as done' },
        undoneChoreResponse: { message: 'Chore marked as todo' },
    };

    const responses = { ...defaultResponses, ...options };

    return vi.fn().mockImplementation((input: RequestInfo | URL) => {
        const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;

        if (url.includes('/api/user/get')) {
            return Promise.resolve(new Response(JSON.stringify(responses.userResponse)));
        } else if (url.includes('/api/chores/todo/get')) {
            if ('error' in responses.todoChoresResponse) {
                return Promise.resolve(
                    new Response(JSON.stringify({ message: responses.todoChoresResponse.error }), { status: 500 }),
                );
            }
            return Promise.resolve(new Response(JSON.stringify(responses.todoChoresResponse)));
        } else if (url.includes('/api/chores/done/get')) {
            if ('error' in responses.doneChoresResponse) {
                return Promise.resolve(
                    new Response(JSON.stringify({ message: responses.doneChoresResponse.error }), { status: 500 }),
                );
            }
            return Promise.resolve(new Response(JSON.stringify(responses.doneChoresResponse)));
        } else if (url.includes('/api/household/users/count-chores-done')) {
            return Promise.resolve(new Response(JSON.stringify(responses.leaderboardResponse)));
        } else if (url.includes('/api/household/users/profiles')) {
            return Promise.resolve(new Response(JSON.stringify(responses.profilesResponse)));
        } else if (url.includes('/api/chore/create')) {
            return Promise.resolve(new Response(JSON.stringify(responses.createChoreResponse)));
        } else if (url.includes('/api/chore/delete')) {
            return Promise.resolve(new Response(JSON.stringify(responses.deleteChoreResponse)));
        } else if (url.includes('/api/chore/done')) {
            return Promise.resolve(new Response(JSON.stringify(responses.doneChoreResponse)));
        } else if (url.includes('/api/chore/undone')) {
            return Promise.resolve(new Response(JSON.stringify(responses.undoneChoreResponse)));
        }
        return Promise.resolve(new Response(JSON.stringify({}), { status: 400 }));
    });
};

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
        width: number;
        height: number;
        className?: string;
    }) => {
        return <img src={src} alt={alt} width={width} height={height} className={className} />;
    },
}));

describe('Chores Page Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        global.fetch = createMockFetch();
    });

    it('should show loading state initially', async () => {
        render(<Chores />);
        expect(screen.getAllByText(/loading/i)[0]).toBeInTheDocument();
        expect(screen.getAllByText(/loading/i)[1]).toBeInTheDocument();
    });

    it('should fetch and display to-do chores', async () => {
        render(<Chores />);
        await waitFor(() => expect(screen.queryByText(/to-?do list/i)).toBeInTheDocument());
        expect(screen.getByText(/test chore/i)).toBeInTheDocument();
        expect(screen.getByText(/another chore/i)).toBeInTheDocument();
    });

    it('should show no chores message when there are no to-do chores', async () => {
        global.fetch = createMockFetch({
            todoChoresResponse: { chores: [], count: 0 },
        });

        render(<Chores />);
        await waitFor(() => expect(screen.queryByText(/no pending chores/i)).toBeInTheDocument());
    });

    it('should show error message when fetch fails', async () => {
        global.fetch = vi.fn().mockImplementation((input: RequestInfo | URL) => {
            const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;

            if (url.includes('/api/chores/todo/get')) {
                return Promise.reject(new Error('Failed to fetch chores'));
            }

            return createMockFetch()(input);
        });

        render(<Chores />);
        await waitFor(() => {
            expect(screen.getByText(/error: failed to fetch chores/i)).toBeInTheDocument();
        });
    });

    it('should show chore add form', async () => {
        render(<ChoreAddForm onRefresh={vi.fn()} emitUpdate={vi.fn()} />);
        expect(screen.getByText(/add chore/i)).toBeInTheDocument();
    });

    it('should show chore to-do list', async () => {
        render(
            <ChoreToDoList chores={mockChores} totalItems={mockChores.length} toggle={vi.fn()} emitUpdate={vi.fn()} />,
        );
        expect(screen.getByText(/chores todo list/i)).toBeInTheDocument();
        expect(screen.getByText(/test chore/i)).toBeInTheDocument();
    });

    it('should show chore done list', async () => {
        render(
            <ChoreDoneList
                chores={mockDoneChores}
                totalItems={mockDoneChores.length}
                toggle={vi.fn()}
                emitUpdate={vi.fn()}
            />,
        );
        expect(screen.getByText(/chores done list/i)).toBeInTheDocument();
        expect(screen.getByText(/completed chore/i)).toBeInTheDocument();
    });

    it('should show chore leaderboard', async () => {
        render(<ChoreLeaderboard />);
        await waitFor(() => expect(screen.getByText(/chore leaderboard/i)).toBeInTheDocument());
    });

    it('should handle toggle between to-do and done lists', async () => {
        render(<Chores />);
        await waitFor(() => expect(screen.queryByText(/chores todo list/i)).toBeInTheDocument());

        const toggleButton = screen.getByText(/toggle between lists/i);
        fireEvent.click(toggleButton);

        await waitFor(() => {
            expect(screen.queryByText(/chores done list/i)).toBeInTheDocument();
        });
    });

    it('should handle chore add form submission', async () => {
        const emitUpdate = vi.fn();
        render(<ChoreAddForm onRefresh={vi.fn()} emitUpdate={emitUpdate} />);

        vi.clearAllMocks();

        const nameInput = screen.getByPlaceholderText(/name of the chore/i);
        const prioritySelect = screen.getByLabelText(/priority/i);
        const descriptionInput = screen.getByPlaceholderText(/description of the event/i);

        fireEvent.change(nameInput, { target: { value: 'New Chore' } });
        fireEvent.change(prioritySelect, { target: { value: '2' } });
        fireEvent.change(descriptionInput, { target: { value: 'New Chore Description' } });

        const submitButton = screen.getByDisplayValue(/add/i);
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith(
                '/api/chore/create',
                expect.objectContaining({
                    method: 'POST',
                    headers: expect.objectContaining({
                        'Content-Type': 'application/json',
                    }),
                    body: expect.any(String),
                }),
            );
            expect(emitUpdate).toHaveBeenCalled();
        });
    });

    it('should handle chore card done click', async () => {
        const emitUpdate = vi.fn();
        render(<ChoreToDoCard chore={mockChores[0]} emitUpdate={emitUpdate} />);

        const doneButton = screen.getByDisplayValue(/done/i);
        fireEvent.click(doneButton);

        const yesButton = screen.getByText(/yes/i);
        fireEvent.click(yesButton);

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith(
                '/api/chore/done',
                expect.objectContaining({
                    method: 'PUT',
                    headers: expect.objectContaining({
                        'Content-Type': 'application/json',
                    }),
                    body: expect.any(String),
                }),
            );
            expect(emitUpdate).toHaveBeenCalled();
        });
    });

    it('should handle chore card details click', async () => {
        render(<ChoreToDoCard chore={mockChores[0]} emitUpdate={vi.fn()} />);

        expect(screen.queryByText(/this is a test chore/i)).not.toBeInTheDocument();

        const cardElement = screen.getByText(/test chore/i).closest('div');
        if (cardElement) fireEvent.click(cardElement);

        await waitFor(() => {
            expect(screen.getByText(/this is a test chore/i)).toBeInTheDocument();
        });
    });

    it('should handle chore deletion from details modal', async () => {
        const emitUpdate = vi.fn();

        document.body.innerHTML = '';

        render(<ChoreToDoCard chore={mockChores[0]} emitUpdate={emitUpdate} />);

        const clickElement = screen.getByText('Due: October 1, 2023', { selector: 'p' });
        fireEvent.click(clickElement);

        await waitFor(() => {
            const deleteButtons = screen.getAllByText(/delete chore/i);
            expect(deleteButtons.length).toBe(1);
            fireEvent.click(deleteButtons[0]);
        });

        await waitFor(() => {
            const yesButton = screen.getByText(/yes/i);
            fireEvent.click(yesButton);
        });

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith(
                '/api/chore/delete',
                expect.objectContaining({
                    method: 'DELETE',
                    headers: expect.objectContaining({
                        'Content-Type': 'application/json',
                    }),
                    body: expect.any(String),
                }),
            );
            expect(emitUpdate).toHaveBeenCalled();
        });
    });

    it('should handle done chore card undone click', async () => {
        const emitUpdate = vi.fn();
        render(<ChoreDoneCard chore={mockDoneChores[0]} emitUpdate={emitUpdate} />);

        const undoneButton = screen.getByDisplayValue(/mark as not done/i);
        fireEvent.click(undoneButton);

        const uncompleteButton = screen.getByText(/uncomplete/i);
        fireEvent.click(uncompleteButton);

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith(
                '/api/chore/undone',
                expect.objectContaining({
                    method: 'PUT',
                    headers: expect.objectContaining({
                        'Content-Type': 'application/json',
                    }),
                    body: expect.any(String),
                }),
            );
            expect(emitUpdate).toHaveBeenCalled();
        });
    });

    it('should cancel undone action when cancel button is clicked', async () => {
        render(<ChoreDoneCard chore={mockDoneChores[0]} emitUpdate={vi.fn()} />);

        const undoneButton = screen.getByDisplayValue(/mark as not done/i);
        fireEvent.click(undoneButton);

        const cancelButton = screen.getByText(/cancel/i);
        fireEvent.click(cancelButton);

        await waitFor(() => {
            expect(screen.queryByText(/are you sure you want to mark/i)).not.toBeInTheDocument();
        });
    });

    it('should handle leaderboard data display', async () => {
        render(<ChoreLeaderboard />);

        await waitFor(() => {
            expect(screen.getByText(/chore leaderboard/i)).toBeInTheDocument();
            expect(screen.getByText(/testuser/i)).toBeInTheDocument();
            expect(screen.getByText(/5 done/i)).toBeInTheDocument();
            expect(screen.getByText(/anotheruser/i)).toBeInTheDocument();
            expect(screen.getByText(/3 done/i)).toBeInTheDocument();
        });
    });

    it('should show validation errors in chore add form', async () => {
        render(<ChoreAddForm onRefresh={vi.fn()} emitUpdate={vi.fn()} />);

        const submitButton = screen.getByDisplayValue(/add/i);
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(screen.getByText(/event name is required/i)).toBeInTheDocument();
        });
    });
});
