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
} from 'date-fns';

export default function Calendar() {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const today = new Date();

    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);
    const days = eachDayOfInterval({ start: startDate, end: endDate });

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
                        className={`p-2 rounded-xl flex items-center justify-center h-10 w-10 text-lg cursor-pointer
              ${isToday(day) ? 'bg-[#FAFAFA] text-[#18181B] font-semibold hover:bg-[#A1A1AA] hover:text-[#FAFAFA]' : ''} 
              ${isBefore(day, today) && !isToday(day) ? 'text-[#A1A1AA]' : ''} 
              ${!isSameMonth(day, monthStart) ? 'opacity-40' : !isToday(day) ? 'hover:bg-[#18181B]' : ''}`}
                    >
                        {format(day, 'd')}
                    </div>
                ))}
            </div>
        </div>
    );
}
