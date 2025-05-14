'use client';
import { Card, DataType } from '@/components/generalUI/card';
import Calendar from '@/components/generalUI/calendar';
import { useState } from 'react';

export default function Dashboard() {
    const [selectedDate, setSelectedDate] = useState(new Date());

    const handleDateChange = (date: Date) => {
        setSelectedDate(date);
    };

    return (
        <div className="flex flex-col justify-center items-center w-full pt-6 pb-8 px-8">
            <div>
                <h1 className="text-4xl text-white w-full justify-between items-center font-semibold">Dashboard</h1>
            </div>
            <main className="flex justify-center items-center w-full pt-6 pb-8 px-8">
                <div className="flex flex-col w-full justify-center items-center ">
                    <div className="space-x-4 flex justify-between items-center w-full">
                        <Card
                            title="Upcoming events"
                            subtitle="See what's happening in your household"
                            dataType={DataType.events}
                            selectedDate={selectedDate}
                        />
                        <Card
                            title="Chores"
                            subtitle="Tasks that need to be done"
                            dataType={DataType.chores}
                            selectedDate={selectedDate}
                        />
                        <Card
                            title="Upcoming bills"
                            subtitle="Track household expenses and payments"
                            dataType={DataType.bills}
                            selectedDate={selectedDate}
                        />
                    </div>
                    <div className="flex justify-center gap-x-3 items-start w-full mt-4">
                        <Card
                            title="Shopping list"
                            subtitle="Items that need to be purchased"
                            dataType={DataType.shopping}
                            selectedDate={selectedDate}
                        />
                        <Calendar onChange={handleDateChange} initialDate={selectedDate} />
                    </div>
                </div>
            </main>
        </div>
    );
}
