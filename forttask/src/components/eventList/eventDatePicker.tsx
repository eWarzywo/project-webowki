'use client';
import Calendar from '@/components/generalUI/calendar';
import Image from 'next/image';
import { useState, useEffect } from 'react';

type EventDatePickerProps = {
    initialDate?: Date;
    onChange?: (date: Date) => void;
}

export default function EventDatePicker({ initialDate = new Date(), onChange }: EventDatePickerProps) {
    const [selectedDate, setSelectedDate] = useState<Date>(initialDate);

    useEffect(() => {
        if (onChange) {
            onChange(selectedDate);
        }
    }, [selectedDate, onChange]);

    return (
        <div className="flex w-auto h-auto flex-col items-center max-h-96">
            <div className="flex w-full justify-center items-center rounded-xl border border-zinc-800 bg-zinc-950 max-h-96 mb-2 p-3">
                <Image src="/Calendar.svg" alt="Calendar" width={32} height={20} />
                <p className="text-zinc-50 text-2xl font-semibold w-full text-start ms-2">Pick a date</p>
            </div>
            <Calendar
                onChange={setSelectedDate}
                initialDate={initialDate}
            />
        </div>
    )
}