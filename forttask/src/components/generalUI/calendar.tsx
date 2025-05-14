'use client';
import { useState } from 'react';
import {
    format,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    addMonths,
    subMonths,
    eachDayOfInterval,
    isSameMonth,
    isToday,
    isBefore,
    startOfDay,
} from 'date-fns';

type CalendarProps = {
    initialDate?: Date;
    onChange?: (date: Date) => void;
}

export default function Calendar({initialDate = new Date(), onChange}: CalendarProps) {
    const [currentMonth, setCurrentMonth] = useState(new Date(initialDate));
    const [selectedDate, setSelectedDate] = useState(initialDate);
    const today = new Date();

    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);
    const days = eachDayOfInterval({ start: startDate, end: endDate });

    const styleForSelected = "bg-zinc-50 text-[#18181B] font-semibold hover:bg-zinc-300 hover:text-[#FAFAFA]";

    const handleDateClick = (day: Date) => {
        if (isSameMonth(day, monthStart) && (isToday(day) || !isBefore(day, today))) {
            setSelectedDate(startOfDay(day));
            if (onChange) {
                onChange(startOfDay(day));
            }
        }
    }

    return (
        <div className="w-80 p-4 bg-[#09090B] text-[#FAFAFA] rounded-xl shadow-md border border-[#27272A]">
            <div className="flex justify-between items-center mb-4">
                <button
                    onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                    className="text-[#A1A1AA] hover:text-white text-lg border border-[#27272A] rounded-xl px-3 py-1"
                >
                    {'<'}
                </button>
                <h2 className="text-lg font-medium">{format(currentMonth, 'MMMM yyyy')}</h2>
                <button
                    onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                    className="text-[#A1A1AA] hover:text-white text-lg border border-[#27272A] rounded-xl px-3 py-1"
                >
                    {'>'}
                </button>
            </div>
            <div className="grid grid-cols-7 text-center text-gray-500 mb-2">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
                    <div key={day} className="p-1">
                        {day}
                    </div>
                ))}
            </div>
            <div className="grid grid-cols-7 text-center gap-1">
                {days.map((day) => (
                    <div
                        key={day.toString()}
                        onClick={() => handleDateClick(day)}
                        className={`p-2 rounded-xl flex items-center justify-center h-10 w-10 text-lg cursor-pointer
                          ${isToday(day) ? 'bg-zinc-600 text-[#18181B] font-semibold hover:text-[#FAFAFA]' : ''} 
                          ${isBefore(day, today) && !isToday(day) ? 'text-[#A1A1AA]' : ''} 
                          ${!isSameMonth(day, monthStart) ? 'opacity-40' : !isToday(day) ? 'hover:bg-[#18181B]' : ''}
                          ${format(day, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd') ? styleForSelected : ''}`}
                    >
                        {format(day, 'd')}
                    </div>
                ))}
            </div>
        </div>
    );
}
