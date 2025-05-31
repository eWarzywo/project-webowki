import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import Bills from '../src/app/(app)/bills/page';
import BillsHandler from '../src/components/bills/billsHandler';
import BillRecord from '../src/components/bills/billRecord';
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
        billsRefresh: false,
        emitUpdate: emitUpdateMock,
        joinHousehold: vi.fn(),
        leaveHousehold: vi.fn(),
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
    usePathname: () => '/bills',
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

const mockBills = [
    {
        id: 1,
        name: 'Electricity',
        amount: 75.5,
        createdBy: { id: 1, username: 'testuser' },
        createdAt: '2025-05-01T14:30:00.000Z',
        updatedAt: null,
        dueDate: '2025-05-30T14:30:00.000Z',
        cycle: 30,
        description: 'Monthly electric bill',
        paidBy: null,
    },
    {
        id: 2,
        name: 'Internet',
        amount: 50.0,
        createdBy: { id: 1, username: 'testuser' },
        createdAt: '2025-05-02T10:15:00.000Z',
        updatedAt: null,
        dueDate: '2025-06-05T10:15:00.000Z',
        cycle: 30,
        description: 'Monthly internet service',
        paidBy: null,
    },
    {
        id: 3,
        name: 'Water Bill',
        amount: 35.25,
        createdBy: { id: 2, username: 'anotheruser' },
        createdAt: '2025-05-03T08:45:00.000Z',
        updatedAt: '2025-05-20T09:30:00.000Z',
        dueDate: '2025-05-25T08:45:00.000Z',
        cycle: 30,
        description: 'Monthly water bill',
        paidBy: { id: 1, username: 'testuser' },
    },
];

const createMockFetch = (options = {}) => {
    const defaultResponses = {
        userResponse: { householdId: 1 },
        billsResponse: mockBills,
        totalNumberResponse: { count: mockBills.length },
        billDetailsResponse: mockBills[0],
        createBillResponse: { message: 'Bill created successfully', bill: mockBills[0] },
        deleteBillResponse: { message: 'Bill deleted successfully' },
        paidToggleResponse: { message: 'Bill payment status updated' },
    };

    const responses = { ...defaultResponses, ...options };

    return vi.fn().mockImplementation((input: RequestInfo | URL, init?: RequestInit) => {
        const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;

        if (url === '/api/user/get') {
            return Promise.resolve(new Response(JSON.stringify(responses.userResponse)));
        } else if (
            url.includes('/api/bill') &&
            !url.includes('details') &&
            !url.includes('totalNumber') &&
            !url.includes('paidToggle')
        ) {
            if (url === '/api/bill' && init?.method === 'POST') {
                return Promise.resolve(new Response(JSON.stringify(responses.createBillResponse), { status: 201 }));
            } else if (url.includes('/api/bill?id=') && init?.method === 'DELETE') {
                return Promise.resolve(new Response(JSON.stringify(responses.deleteBillResponse)));
            }
            return Promise.resolve(new Response(JSON.stringify(responses.billsResponse)));
        } else if (url.includes('/api/bill/totalNumber')) {
            return Promise.resolve(new Response(JSON.stringify(responses.totalNumberResponse)));
        } else if (url.includes('/api/bill/details')) {
            const id = new URL(url, 'http://localhost').searchParams.get('id');
            const item = mockBills.find((item) => item.id === Number(id)) || responses.billDetailsResponse;
            return Promise.resolve(new Response(JSON.stringify(item)));
        } else if (url.includes('/api/bill/paidToggle')) {
            return Promise.resolve(new Response(JSON.stringify(responses.paidToggleResponse)));
        }

        return Promise.resolve(new Response(JSON.stringify({}), { status: 400 }));
    });
};

describe('Bills Page Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        global.fetch = createMockFetch() as unknown as typeof fetch;
    });

    it('should render the bills page with form and list components', async () => {
        render(<Bills />);

        expect(screen.getByText('Add new bill')).toBeInTheDocument();
        expect(screen.getByText('Add an upcoming bill to pay')).toBeInTheDocument();
        expect(screen.getByLabelText('Name')).toBeInTheDocument();
        expect(screen.getByLabelText('Cost')).toBeInTheDocument();
        expect(screen.getByLabelText('Due to')).toBeInTheDocument();
        expect(screen.getByText('Does this bill repeat?')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Cancel')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Add')).toBeInTheDocument();

        await waitFor(() => {
            expect(screen.getByText('Your bills')).toBeInTheDocument();
            expect(screen.getByText('Manage your expenses')).toBeInTheDocument();
        });
    });

    it('should fetch user household ID on mount', async () => {
        render(<Bills />);

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith('/api/user/get');
        });
    });

    it('should handle bill form submission', async () => {
        vi.mock('../src/components/generalUI/datePicker', () => ({
            default: ({
                setSelectedDate,
                handleShowCalendar,
            }: {
                setSelectedDate: (date: Date) => void;
                handleShowCalendar: () => void;
                selectedDate: Date | null;
            }) => (
                <div data-testid="mock-date-picker">
                    <button onClick={() => setSelectedDate(new Date('2025-05-31'))} data-testid="select-date-button">
                        Select
                    </button>
                    <button onClick={handleShowCalendar} data-testid="close-calendar">
                        Close
                    </button>
                </div>
            ),
        }));

        const { default: BillsWithMockedDatePicker } = await import('../src/app/(app)/bills/page');

        render(<BillsWithMockedDatePicker />);

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith('/api/user/get');
        });

        const nameInput = screen.getByPlaceholderText('Name of the bill');
        const costInput = screen.getByPlaceholderText('Cost of the bill');
        const dateButton = screen.getByText('Select a date');

        fireEvent.change(nameInput, { target: { value: 'Rent' } });
        fireEvent.change(costInput, { target: { value: '800' } });

        fireEvent.click(dateButton);

        await waitFor(() => {
            expect(screen.getByTestId('mock-date-picker')).toBeInTheDocument();
        });

        const selectDateButton = screen.getByTestId('select-date-button');
        fireEvent.click(selectDateButton);

        vi.clearAllMocks();

        const addButton = screen.getByDisplayValue('Add');
        fireEvent.click(addButton);

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith(
                '/api/bill',
                expect.objectContaining({
                    method: 'POST',
                    headers: expect.objectContaining({
                        'Content-Type': 'application/json',
                    }),
                    body: expect.stringMatching(/.*"name":"Rent".*"amount":800.*"dueDate":"2025-05-31.*/),
                }),
            );

            expect(emitUpdateMock).toHaveBeenCalled();
        });

        vi.resetModules();
    });

    it('should validate form input and show error messages', async () => {
        vi.mock('../src/components/generalUI/datePicker', () => ({
            default: ({
                setSelectedDate,
                handleShowCalendar,
            }: {
                setSelectedDate: (date: Date) => void;
                handleShowCalendar: () => void;
                selectedDate: Date | null;
            }) => (
                <div data-testid="mock-date-picker">
                    <button onClick={() => setSelectedDate(new Date('2025-05-31'))} data-testid="select-date-button">
                        Select
                    </button>
                    <button onClick={handleShowCalendar} data-testid="close-calendar">
                        Close
                    </button>
                </div>
            ),
        }));

        const { default: BillsWithMockedDatePicker } = await import('../src/app/(app)/bills/page');

        const { container } = render(<BillsWithMockedDatePicker />);

        const nameInput = screen.getByPlaceholderText('Name of the bill');
        const costInput = screen.getByPlaceholderText('Cost of the bill');
        const addButton = screen.getByDisplayValue('Add');
        let dateButton = screen.getByText('Select a date');

        fireEvent.click(dateButton);

        await waitFor(() => {
            expect(screen.getByTestId('mock-date-picker')).toBeInTheDocument();
        });

        let selectDateButton = screen.getByTestId('select-date-button');
        fireEvent.click(selectDateButton);

        fireEvent.change(nameInput, { target: { value: 'Re' } });
        fireEvent.change(costInput, { target: { value: '10' } });
        fireEvent.click(addButton);

        await waitFor(() => {
            const errorDiv = container.querySelector('.text-red-500');
            expect(errorDiv).not.toBeNull();
            expect(errorDiv?.textContent).toBeTruthy();
            expect(errorDiv?.textContent).toContain('Name must be at least 3');
        });

        fireEvent.change(nameInput, { target: { value: '' } });
        fireEvent.change(costInput, { target: { value: '' } });
        fireEvent.click(addButton);

        await waitFor(() => {
            const errorDiv = container.querySelector('.text-red-500');
            expect(errorDiv).not.toBeNull();
            expect(errorDiv?.textContent).toBeTruthy();
            expect(errorDiv?.textContent).toContain('Please fill in');
        });
    });

    it('should reset form on cancel', async () => {
        const { container } = render(<Bills />);

        const nameInput = screen.getByPlaceholderText('Name of the bill');
        const costInput = screen.getByPlaceholderText('Cost of the bill');
        const cancelButton = screen.getByDisplayValue('Cancel');

        fireEvent.change(nameInput, { target: { value: 'Rent' } });
        fireEvent.change(costInput, { target: { value: '800' } });

        expect(nameInput).toHaveValue('Rent');
        expect(costInput).toHaveValue(800);

        fireEvent.click(cancelButton);

        expect(nameInput).toHaveValue('');
        expect(costInput).toHaveValue(null);
    });
});

describe('BillsHandler Component Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        global.fetch = createMockFetch() as unknown as typeof fetch;
    });

    it('should show loading state initially', async () => {
        const { container } = render(<BillsHandler refresh={false} page={1} />);

        const spinnerElement = container.querySelector('.animate-spin');
        expect(spinnerElement).toBeInTheDocument();
    });

    it('should fetch and display bill items', async () => {
        render(<BillsHandler refresh={false} page={1} />);

        await waitFor(() => {
            expect(screen.queryByText('No bills found.')).not.toBeInTheDocument();
        });

        expect(global.fetch).toHaveBeenCalledWith('/api/bill?limit=6&skip=0');
        expect(global.fetch).toHaveBeenCalledWith('/api/bill/totalNumber');

        expect(screen.getAllByText('Electricity - 75.5$')[0]).toBeInTheDocument();
        expect(screen.getAllByText('Internet - 50$')[0]).toBeInTheDocument();
        expect(screen.getAllByText('Water Bill - 35.25$')[0]).toBeInTheDocument();
    });

    it('should show no bills message when list is empty', async () => {
        global.fetch = createMockFetch({
            billsResponse: [],
            totalNumberResponse: { count: 0 },
        }) as unknown as typeof fetch;

        render(<BillsHandler refresh={false} page={1} />);

        await waitFor(() => {
            expect(screen.getByText(/no bills found./i)).toBeInTheDocument();
        });
    });

    it('should handle pagination when there are more than 6 items', async () => {
        const manyBills = Array(10)
            .fill(null)
            .map((_, i) => ({
                id: i + 1,
                name: `Bill ${i + 1}`,
                amount: 50 + i * 10,
                createdBy: { id: 1, username: 'testuser' },
                createdAt: '2025-05-01T14:30:00.000Z',
                updatedAt: null,
                dueDate: '2025-05-30T14:30:00.000Z',
                cycle: 30,
                description: `Test bill ${i + 1}`,
                paidBy: null,
            }));

        global.fetch = createMockFetch({
            billsResponse: manyBills.slice(0, 6),
            totalNumberResponse: { count: manyBills.length },
        }) as unknown as typeof fetch;

        const { container } = render(<BillsHandler refresh={false} page={1} />);

        await waitFor(() => {
            expect(screen.getAllByText('Bill 1 - 50$')[0]).toBeInTheDocument();

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

            expect(global.fetch).toHaveBeenCalledWith('/api/bill?limit=6&skip=0');
            expect(global.fetch).toHaveBeenCalledWith('/api/bill/totalNumber');
        });
    });

    it('should emit update when deleting a bill', async () => {
        const emitUpdate = vi.fn();

        render(<BillsHandler emitUpdate={emitUpdate} refresh={false} page={1} />);

        await waitFor(() => {
            expect(screen.queryByRole('status')).not.toBeInTheDocument();
        });

        const deleteButtons = screen.getAllByAltText('delete');
        fireEvent.click(deleteButtons[0]);

        await waitFor(() => {
            expect(screen.getByText('Are you sure?')).toBeInTheDocument();
        });

        const confirmButton = screen.getByText('Delete');
        fireEvent.click(confirmButton);

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith(
                '/api/bill?id=1',
                expect.objectContaining({
                    method: 'DELETE',
                    headers: expect.objectContaining({
                        'Content-Type': 'application/json',
                    }),
                }),
            );
            expect(emitUpdate).toHaveBeenCalled();
        });
    });
});

describe('BillRecord Component Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        global.fetch = createMockFetch() as unknown as typeof fetch;
    });

    it('should display bill information correctly', () => {
        const handleDelete = vi.fn();
        render(<BillRecord id={1} name="Electricity" cost={75.5} addedBy="testuser" onDelete={handleDelete} />);

        expect(screen.getAllByText('Electricity - 75.5$')[0]).toBeInTheDocument();
        expect(screen.getAllByText('Added by: testuser')[0]).toBeInTheDocument();
    });

    it('should show details box when details button is clicked', async () => {
        const handleDelete = vi.fn();
        render(<BillRecord id={1} name="Electricity" cost={75.5} addedBy="testuser" onDelete={handleDelete} />);

        const detailsButtons = screen.getAllByAltText('details');
        fireEvent.click(detailsButtons[0]);

        await waitFor(() => {
            expect(screen.getByText('Details of Electricity bill')).toBeInTheDocument();
        });

        expect(screen.getByText('Cost: 75.5$')).toBeInTheDocument();
        expect(screen.getByText('Description: Monthly electric bill')).toBeInTheDocument();
        expect(screen.getByText('Repeated: Monthly')).toBeInTheDocument();
        expect(screen.getByText('Not paid yet')).toBeInTheDocument();

        const closeButton = screen.getByText('Close');
        fireEvent.click(closeButton);

        await waitFor(() => {
            expect(screen.queryByText('Details of Electricity bill')).not.toBeInTheDocument();
        });
    });

    it('should handle marking a bill as paid', async () => {
        const handleDelete = vi.fn();
        const emitUpdate = vi.fn();
        render(<BillRecord id={1} name="Electricity" cost={75.5} addedBy="testuser" onDelete={handleDelete} />);

        const detailsButtons = screen.getAllByAltText('details');
        fireEvent.click(detailsButtons[0]);

        await waitFor(() => {
            expect(screen.getByText('Details of Electricity bill')).toBeInTheDocument();
        });

        const markAsPaidButton = screen.getByText('Mark as paid');
        fireEvent.click(markAsPaidButton);

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith(
                '/api/bill/paidToggle',
                expect.objectContaining({
                    method: 'PUT',
                    headers: expect.objectContaining({
                        'Content-Type': 'application/json',
                    }),
                    body: JSON.stringify({ id: 1, paid: true }),
                }),
            );
        });
    });

    it('should handle delete confirmation', async () => {
        const handleDelete = vi.fn();
        render(<BillRecord id={1} name="Electricity" cost={75.5} addedBy="testuser" onDelete={handleDelete} />);

        const deleteButtons = screen.getAllByAltText('delete');
        fireEvent.click(deleteButtons[0]);

        await waitFor(() => {
            expect(screen.getByText('Are you sure?')).toBeInTheDocument();
        });

        const confirmButton = screen.getByText('Delete');
        fireEvent.click(confirmButton);

        expect(handleDelete).toHaveBeenCalledWith(1);
    });

    it('should cancel deletion when cancel button is clicked', async () => {
        const handleDelete = vi.fn();
        render(<BillRecord id={1} name="Electricity" cost={75.5} addedBy="testuser" onDelete={handleDelete} />);

        const deleteButtons = screen.getAllByAltText('delete');
        fireEvent.click(deleteButtons[0]);

        const cancelButton = screen.getByText('Cancel');
        fireEvent.click(cancelButton);

        expect(handleDelete).not.toHaveBeenCalled();

        await waitFor(() => {
            expect(screen.queryByText('Are you sure?')).not.toBeInTheDocument();
        });
    });
});
