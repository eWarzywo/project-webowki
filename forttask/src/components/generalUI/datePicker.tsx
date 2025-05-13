'use client';
import React from 'react';
import Calendar from './calendar';

interface DatePickerProps {
    selectedDate: Date | null;
    setSelectedDate: (date: Date) => void;
    handleShowCalendar: () => void;
}

export default function DatePicker({ selectedDate, setSelectedDate, handleShowCalendar }: DatePickerProps) {
    const [date, setDate] = React.useState<Date | null>(null);
    const [error, setError] = React.useState<string | null>(null);

    return (
        <div className="fixed inset-0 z-50 bg-zinc-950 bg-opacity-50 flex items-center justify-center">
            <div className="bg-zinc-950 rounded-xl p-6 w-96 flex flex-col items-center justify-center border border-zinc-800">
                <Calendar
                    onChange={(date) => {
                        setDate(date);
                    }}
                />
                <div className="mt-2 text-zinc-50 text-sm">
                    {date
                        ? date.toLocaleDateString()
                        : selectedDate
                          ? selectedDate.toLocaleDateString()
                          : 'No date selected'}
                </div>
                <div className="flex justify-between items-center gap-4 mt-2 w-full px-3">
                    <button
                        onClick={() => {
                            if (date) {
                                setSelectedDate(date);
                                handleShowCalendar();
                            } else if (selectedDate) {
                                setSelectedDate(selectedDate);
                                handleShowCalendar();
                            } else {
                                setError('Please select a date');
                            }
                        }}
                        className="w-1/2 rounded-xl px-4 py-2 transition bg-blue-600 hover:bg-blue-500"
                    >
                        Select
                    </button>
                    <button
                        onClick={() => {
                            handleShowCalendar();
                        }}
                        className="w-1/2 rounded-xl px-4 py-2 bg-zinc-700 hover:bg-zinc-600 transition"
                    >
                        Close
                    </button>
                </div>
                {error && <div className="text-red-500 mt-2">{error}</div>}
            </div>
        </div>
    );
}
