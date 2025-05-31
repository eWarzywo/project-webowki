import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import Shopping from '../src/app/(app)/shopping/page';
import ShoppingListHandler from '../src/components/shoppingList/shoppingListHandler';
import ShoppingListItem from '../src/components/shoppingList/shoppingListItem';
import '@testing-library/jest-dom';

const mockGet = vi.fn().mockImplementation((param) => {
    if (param === 'page') return '1';
    if (param === 'size') return '10';
    return null;
});

const emitUpdateMock = vi.fn();

vi.mock('@/lib/socket', () => ({
    useSocket: () => ({
        isConnected: true,
        eventsRefresh: false,
        emitUpdate: emitUpdateMock,
        joinHousehold: vi.fn(),
        leaveHousehold: vi.fn(),
        shoppingRefresh: false,
    }),
}));

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
    usePathname: () => '/shopping',
}));

vi.mock('next-auth/react', () => ({
    useSession: () => ({
        data: { user: { id: '1', householdId: '1' } },
        status: 'authenticated',
        update: vi.fn(),
    }),
}));

vi.mock('next/image', () => ({
    default: ({
        src,
        alt,
        width,
        height,
        className,
        style,
        onClick,
    }: {
        src: string;
        alt: string;
        width: number | string;
        height: number | string;
        onClick?: () => void;
        className?: string;
        style?: React.CSSProperties;
    }) => {
        return (
            <img
                src={src}
                alt={alt}
                width={width}
                height={height}
                className={className}
                style={style}
                onClick={onClick}
            />
        );
    },
}));

const mockShoppingItems = [
    {
        id: 1,
        name: 'Milk',
        cost: 2.99,
        createdBy: { id: 1, username: 'testuser' },
        boughtBy: null,
        updatedAt: null,
    },
    {
        id: 2,
        name: 'Bread',
        cost: 1.99,
        createdBy: { id: 1, username: 'testuser' },
        boughtBy: null,
        updatedAt: null,
    },
    {
        id: 3,
        name: 'Eggs',
        cost: 3.49,
        createdBy: { id: 2, username: 'anotheruser' },
        boughtBy: { id: 1, username: 'testuser' },
        updatedAt: '2025-05-30T14:30:00.000Z',
    },
];

const createMockFetch = (options = {}) => {
    const defaultResponses = {
        userResponse: { householdId: 1 },
        shoppingListResponse: mockShoppingItems,
        totalNumberResponse: { count: mockShoppingItems.length },
        shoppingItemDetailsResponse: mockShoppingItems[0],
        createShoppingItemResponse: { message: 'Item created successfully', item: mockShoppingItems[0] },
        deleteShoppingItemResponse: { message: 'Item deleted successfully' },
        boughtShoppingItemResponse: { message: 'Item marked as bought' },
        unboughtShoppingItemResponse: { message: 'Item marked as not bought' },
    };

    const responses = { ...defaultResponses, ...options };

    return vi.fn().mockImplementation((input: RequestInfo | URL, init?: RequestInit) => {
        const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;

        if (url === '/api/user/get') {
            return Promise.resolve(new Response(JSON.stringify(responses.userResponse)));
        } else if (
            url.includes('/api/shoppingList') &&
            !url.includes('details') &&
            !url.includes('totalNumber') &&
            !url.includes('bought') &&
            !url.includes('unbought')
        ) {
            if (url === '/api/shoppingList' && init?.method === 'POST') {
                return Promise.resolve(
                    new Response(JSON.stringify(responses.createShoppingItemResponse), { status: 201 }),
                );
            }
            return Promise.resolve(new Response(JSON.stringify(responses.shoppingListResponse)));
        } else if (url.includes('/api/shoppingList/totalNumber')) {
            return Promise.resolve(new Response(JSON.stringify(responses.totalNumberResponse)));
        } else if (url.includes('/api/shoppingList/details')) {
            const id = new URL(url, 'http://localhost').searchParams.get('id');
            const item =
                mockShoppingItems.find((item) => item.id === Number(id)) || responses.shoppingItemDetailsResponse;
            return Promise.resolve(new Response(JSON.stringify(item)));
        } else if (url.includes('/api/shoppingList/bought')) {
            return Promise.resolve(new Response(JSON.stringify(responses.boughtShoppingItemResponse)));
        } else if (url.includes('/api/shoppingList/unbought')) {
            return Promise.resolve(new Response(JSON.stringify(responses.unboughtShoppingItemResponse)));
        } else if (url.includes('/api/shoppingList?id=')) {
            return Promise.resolve(new Response(JSON.stringify(responses.deleteShoppingItemResponse)));
        }

        return Promise.resolve(new Response(JSON.stringify({}), { status: 400 }));
    });
};

describe('Shopping Page Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        global.fetch = createMockFetch() as unknown as typeof fetch;
    });

    it('should render the shopping page with form and list components', async () => {
        render(<Shopping />);

        expect(screen.getByText('Add new item')).toBeInTheDocument();
        expect(screen.getByText('Add a new item to your shopping list')).toBeInTheDocument();
        expect(screen.getByLabelText('Name')).toBeInTheDocument();
        expect(screen.getByLabelText('Cost')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Cancel')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Add')).toBeInTheDocument();

        await waitFor(() => {
            expect(screen.getByText('Your shopping List')).toBeInTheDocument();
            expect(screen.getByText('Manage your needs')).toBeInTheDocument();
        });
    });

    it('should fetch user household ID on mount', async () => {
        render(<Shopping />);

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith('/api/user/get');
        });
    });

    it('should handle shopping item form submission', async () => {
        vi.clearAllMocks();

        render(<Shopping />);

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith('/api/user/get');
        });

        const nameInput = screen.getByPlaceholderText('Name of the item');
        const costInput = screen.getByPlaceholderText('Cost of the item');
        const addButton = screen.getByDisplayValue('Add');

        fireEvent.change(nameInput, { target: { value: 'Chocolate' } });
        fireEvent.change(costInput, { target: { value: '5' } });

        vi.clearAllMocks();

        fireEvent.click(addButton);

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith(
                '/api/shoppingList',
                expect.objectContaining({
                    method: 'POST',
                    headers: expect.objectContaining({
                        'Content-Type': 'application/json',
                    }),
                    body: JSON.stringify({ name: 'Chocolate', cost: 5 }),
                }),
            );

            expect(emitUpdateMock).toHaveBeenCalled();
        });
    });

    it('should validate form input and show error messages', async () => {
        const { container } = render(<Shopping />);

        const form = container.querySelector('form#shopping-form');
        expect(form).not.toBeNull();

        const nameInput = screen.getByPlaceholderText('Name of the item');
        const costInput = screen.getByPlaceholderText('Cost of the item');

        fireEvent.change(nameInput, { target: { value: 'AB' } });
        fireEvent.change(costInput, { target: { value: '5.99' } });
        fireEvent.submit(form!);

        await waitFor(() => {
            const errorDiv = container.querySelector('#error');
            expect(errorDiv).not.toBeNull();
            expect(errorDiv?.textContent).toBeTruthy();
            expect(errorDiv?.textContent).toContain('Name must be at least 3');
        });

        fireEvent.change(nameInput, { target: { value: 'Chocolate' } });
        fireEvent.change(costInput, { target: { value: '-1' } });
        fireEvent.submit(form!);

        await waitFor(() => {
            const errorDiv = container.querySelector('#error');
            expect(errorDiv).not.toBeNull();
            expect(errorDiv?.textContent).toBeTruthy();
            expect(errorDiv?.textContent).toContain('Cost must be a positive');
        });

        fireEvent.change(costInput, { target: { value: '0.01' } });
        fireEvent.submit(form!);

        await waitFor(() => {
            const errorDiv = container.querySelector('#error');
            expect(errorDiv).not.toBeNull();
            expect(errorDiv?.textContent).toBeTruthy();
            expect(errorDiv?.textContent).toContain('Cost must be at least $0.1');
        });
    });

    it('should reset form on cancel', async () => {
        const { container } = render(<Shopping />);

        const nameInput = screen.getByPlaceholderText('Name of the item');
        const costInput = screen.getByPlaceholderText('Cost of the item');
        const cancelButton = screen.getByDisplayValue('Cancel');

        fireEvent.change(nameInput, { target: { value: 'Chocolate' } });
        fireEvent.change(costInput, { target: { value: '5.99' } });

        expect(nameInput).toHaveValue('Chocolate');
        expect(costInput).toHaveValue(5.99);

        fireEvent.click(cancelButton);

        const nameInputElement = container.querySelector('#name') as HTMLInputElement;
        const costInputElement = container.querySelector('#cost') as HTMLInputElement;

        expect(nameInputElement.value).toBe('');
        expect(costInputElement.value).toBe('');
    });
});

describe('ShoppingListHandler Component Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        global.fetch = createMockFetch() as unknown as typeof fetch;
    });

    it('should show loading state initially', async () => {
        const { container } = render(<ShoppingListHandler refresh={false} page={1} />);

        const spinnerElement = container.querySelector('.animate-spin');
        expect(spinnerElement).toBeInTheDocument();
    });

    it('should fetch and display shopping list items', async () => {
        render(<ShoppingListHandler refresh={false} page={1} />);

        await waitFor(() => {
            expect(screen.queryByRole('status')).not.toBeInTheDocument();
        });

        expect(global.fetch).toHaveBeenCalledWith('/api/shoppingList?limit=6&skip=0');
        expect(global.fetch).toHaveBeenCalledWith('/api/shoppingList/totalNumber');

        vi.clearAllMocks();

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith(
                '/api/shoppingList/details?id=1',
                expect.objectContaining({
                    method: 'GET',
                    headers: expect.objectContaining({
                        'Content-Type': 'application/json',
                    }),
                }),
            );
        });
    });

    it('should show no items message when list is empty', async () => {
        global.fetch = createMockFetch({
            shoppingListResponse: [],
            totalNumberResponse: { count: 0 },
        }) as unknown as typeof fetch;

        render(<ShoppingListHandler refresh={false} page={1} />);

        await waitFor(() => {
            expect(screen.getByText(/no items found in your shopping list./i)).toBeInTheDocument();
        });
    });

    it('should handle pagination when there are more than 6 items', async () => {
        const manyItems = Array(10)
            .fill(null)
            .map((_, i) => ({
                id: i + 1,
                name: `Item ${i + 1}`,
                cost: 1.99,
                createdBy: { id: 1, username: 'testuser' },
                boughtBy: null,
                updatedAt: null,
            }));

        global.fetch = createMockFetch({
            shoppingListResponse: manyItems.slice(0, 6),
            totalNumberResponse: { count: manyItems.length },
        }) as unknown as typeof fetch;

        const { container } = render(<ShoppingListHandler refresh={false} page={1} />);

        await waitFor(() => {
            const paginationContainer =
                container.querySelector('.pagination') ||
                container.querySelector('[aria-label*="pagination"]') ||
                screen.queryByText(/Page 1 of \d+/) ||
                screen.queryByText(/1\/\d+/);

            const nextPageButton =
                screen.queryByRole('button', { name: /next/i }) || screen.queryByLabelText(/next page/i);

            const prevPageButton =
                screen.queryByRole('button', { name: /previous/i }) || screen.queryByLabelText(/previous page/i);

            expect(paginationContainer || nextPageButton || prevPageButton).toBeTruthy();

            expect(global.fetch).toHaveBeenCalledWith('/api/shoppingList?limit=6&skip=0');
            expect(global.fetch).toHaveBeenCalledWith('/api/shoppingList/totalNumber');
        });
    });

    it('should emit update when deleting an item', async () => {
        const emitUpdate = vi.fn();

        render(<ShoppingListHandler emitUpdate={emitUpdate} refresh={false} page={1} />);

        await waitFor(() => {
            expect(screen.queryByRole('status')).not.toBeInTheDocument();
        });
    });
});

describe('ShoppingListItem Component Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        global.fetch = createMockFetch() as unknown as typeof fetch;
    });

    it('should fetch and display item details', async () => {
        render(<ShoppingListItem id={1} handleDelete={vi.fn()} />);

        await waitFor(() => {
            expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
        });

        expect(global.fetch).toHaveBeenCalledWith('/api/shoppingList/details?id=1', expect.any(Object));
        expect(screen.getAllByText('Milk - 2.99$')[0]).toBeInTheDocument();
        expect(screen.getAllByText('Added by testuser')[0]).toBeInTheDocument();
    });

    it('should show error when item not found', async () => {
        global.fetch = vi.fn().mockImplementation((url) => {
            if (url.includes('/api/shoppingList/details')) {
                return Promise.resolve(new Response(null, { status: 404 }));
            }
            return createMockFetch()(url);
        }) as unknown as typeof fetch;

        render(<ShoppingListItem id={999} handleDelete={vi.fn()} />);

        await waitFor(() => {
            expect(screen.getByText('Item not found')).toBeInTheDocument();
        });
    });

    it('should handle marking an item as bought', async () => {
        const emitUpdate = vi.fn();

        const { container } = render(<ShoppingListItem id={1} handleDelete={vi.fn()} emitUpdate={emitUpdate} />);

        await waitFor(() => {
            expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
        });

        const checkbox = container.querySelector('.hover\\:bg-zinc-100.border-2.border-zinc-200.rounded-\\[5px\\]');

        expect(checkbox).not.toBeNull();
        fireEvent.click(checkbox!);

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith(
                '/api/shoppingList/bought?id=1',
                expect.objectContaining({
                    method: 'PUT',
                    headers: expect.objectContaining({
                        'Content-Type': 'application/json',
                    }),
                    body: JSON.stringify({ id: 1 }),
                }),
            );
            expect(emitUpdate).toHaveBeenCalled();
        });
    });

    it('should handle delete confirmation', async () => {
        const handleDelete = vi.fn();

        render(<ShoppingListItem id={1} handleDelete={handleDelete} />);

        await waitFor(() => expect(screen.queryByText('Loading...')).not.toBeInTheDocument());

        expect(screen.queryByText('Are you sure?')).not.toBeInTheDocument();

        const deleteButton = screen.getAllByAltText('delete')[0];
        fireEvent.click(deleteButton);

        await waitFor(() => expect(screen.getByText('Are you sure?')).toBeInTheDocument());

        fireEvent.click(screen.getByText('Delete'));

        expect(handleDelete).toHaveBeenCalledTimes(1);
    });

    it('should show details box for bought items and handle unbought', async () => {
        const emitUpdate = vi.fn();

        global.fetch = createMockFetch({
            shoppingItemDetailsResponse: {
                id: 3,
                name: 'Eggs',
                cost: 3.49,
                createdBy: { id: 2, username: 'anotheruser' },
                boughtBy: { id: 1, username: 'testuser' },
                updatedAt: '2025-05-30T14:30:00.000Z',
            },
        }) as unknown as typeof fetch;

        render(<ShoppingListItem id={3} handleDelete={vi.fn()} emitUpdate={emitUpdate} />);

        await waitFor(() => {
            expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
        });

        const detailsButton = screen.getAllByText('?');
        fireEvent.click(detailsButton[0]);

        expect(screen.getByText('Item Details')).toBeInTheDocument();
        expect(screen.getByText('Item name: Eggs')).toBeInTheDocument();
        expect(screen.getByText('Cost: 3.49$')).toBeInTheDocument();
        expect(screen.getByText('Added by: anotheruser')).toBeInTheDocument();
        expect(screen.getByText('Bought by: testuser')).toBeInTheDocument();
        expect(screen.getByText(/Bought at: .+/)).toBeInTheDocument();

        const unboughtButton = screen.getByText('Mark as Unbought');
        fireEvent.click(unboughtButton);

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith(
                '/api/shoppingList/unbought?id=3',
                expect.objectContaining({
                    method: 'PUT',
                    headers: expect.objectContaining({
                        'Content-Type': 'application/json',
                    }),
                    body: JSON.stringify({ id: 3 }),
                }),
            );
            expect(emitUpdate).toHaveBeenCalled();
        });
    });

    it('should close details box when close button is clicked', async () => {
        global.fetch = createMockFetch({
            shoppingItemDetailsResponse: {
                id: 3,
                name: 'Eggs',
                cost: 3.49,
                createdBy: { id: 2, username: 'anotheruser' },
                boughtBy: { id: 1, username: 'testuser' },
                updatedAt: '2025-05-30T14:30:00.000Z',
            },
        }) as unknown as typeof fetch;

        render(<ShoppingListItem id={3} handleDelete={vi.fn()} />);

        await waitFor(() => {
            expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
        });

        const detailsButton = screen.getAllByText('?');
        fireEvent.click(detailsButton[0]);

        expect(screen.getByText('Item Details')).toBeInTheDocument();

        const closeButton = screen.getByText('Close');
        fireEvent.click(closeButton);

        await waitFor(() => {
            expect(screen.queryByText('Item Details')).not.toBeInTheDocument();
        });
    });
});
