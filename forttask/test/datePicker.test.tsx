import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import DatePicker from '../src/components/generalUI/datePicker';

vi.mock('../src/components/generalUI/calendar', () => ({
    default: ({ onChange }: { onChange: (date: Date) => void }) => (
        <div data-testid="mock-calendar">
            <button onClick={() => onChange(new Date(2025, 0, 1))}>Select Date</button>
        </div>
    ),
}));

describe('DatePicker Component', () => {
    const mockSetSelectedDate = vi.fn();
    const mockHandleShowCalendar = vi.fn();
    const mockDate = new Date(2025, 4, 31);

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders the DatePicker component', async () => {
        render(
            <DatePicker
                selectedDate={mockDate}
                setSelectedDate={mockSetSelectedDate}
                handleShowCalendar={mockHandleShowCalendar}
            />,
        );

        await waitFor(() => {
            expect(screen.getByTestId('mock-calendar')).toBeInTheDocument();
            expect(screen.getByText(mockDate.toLocaleDateString())).toBeInTheDocument();
            expect(screen.getByText('Select')).toBeInTheDocument();
            expect(screen.getByText('Close')).toBeInTheDocument();
        });
    });

    it('shows "No date selected" when selectedDate is null', async () => {
        render(
            <DatePicker
                selectedDate={null}
                setSelectedDate={mockSetSelectedDate}
                handleShowCalendar={mockHandleShowCalendar}
            />,
        );

        await waitFor(() => {
            expect(screen.getByText('No date selected')).toBeInTheDocument();
        });
    });

    it('selects a new date when calendar date is selected', async () => {
        render(
            <DatePicker
                selectedDate={null}
                setSelectedDate={mockSetSelectedDate}
                handleShowCalendar={mockHandleShowCalendar}
            />,
        );

        fireEvent.click(screen.getByText('Select Date'));

        fireEvent.click(screen.getByText('Select'));

        await waitFor(() => {
            expect(mockSetSelectedDate).toHaveBeenCalledWith(expect.any(Date));
            expect(mockHandleShowCalendar).toHaveBeenCalled();
        });
    });

    it('uses existing selected date if no new date is picked', async () => {
        render(
            <DatePicker
                selectedDate={mockDate}
                setSelectedDate={mockSetSelectedDate}
                handleShowCalendar={mockHandleShowCalendar}
            />,
        );

        fireEvent.click(screen.getByText('Select'));

        await waitFor(() => {
            expect(mockSetSelectedDate).toHaveBeenCalledWith(mockDate);
            expect(mockHandleShowCalendar).toHaveBeenCalled();
        });
    });

    it('shows error message when no date is selected', async () => {
        render(
            <DatePicker
                selectedDate={null}
                setSelectedDate={mockSetSelectedDate}
                handleShowCalendar={mockHandleShowCalendar}
            />,
        );

        fireEvent.click(screen.getByText('Select'));

        await waitFor(() => {
            expect(screen.getByText('Please select a date')).toBeInTheDocument();
            expect(mockSetSelectedDate).not.toHaveBeenCalled();
        });
    });

    it('closes the calendar when close button is clicked', async () => {
        render(
            <DatePicker
                selectedDate={mockDate}
                setSelectedDate={mockSetSelectedDate}
                handleShowCalendar={mockHandleShowCalendar}
            />,
        );

        fireEvent.click(screen.getByText('Close'));

        await waitFor(() => {
            expect(mockHandleShowCalendar).toHaveBeenCalled();
            expect(mockSetSelectedDate).not.toHaveBeenCalled();
        });
    });

    it('updates the displayed date when a new date is selected in the calendar', async () => {
        render(
            <DatePicker
                selectedDate={mockDate}
                setSelectedDate={mockSetSelectedDate}
                handleShowCalendar={mockHandleShowCalendar}
            />,
        );

        expect(screen.getByText(mockDate.toLocaleDateString())).toBeInTheDocument();

        fireEvent.click(screen.getByText('Select Date'));

        const newDate = new Date(2025, 0, 1);

        await waitFor(() => {
            expect(screen.getByText(newDate.toLocaleDateString())).toBeInTheDocument();
        });

        expect(screen.queryByText(mockDate.toLocaleDateString())).not.toBeInTheDocument();
    });
});
