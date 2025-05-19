'use client';
import { Card, DataType } from '@/components/generalUI/card';
import Calendar from '@/components/generalUI/calendar';
import { useEffect, useState } from 'react';
import { useSocket } from '@/lib/socket';

export default function Dashboard() {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [householdId, setHouseholdId] = useState<number | null>(null);

    const { isConnected, eventsRefresh, shoppingRefresh, billsRefresh, choresRefresh, joinHousehold, leaveHousehold } =
        useSocket();

    useEffect(() => {
        const fetchHouseholdId = async () => {
            try {
                const response = await fetch('/api/user/get');
                if (response.ok) {
                    const data = await response.json();
                    setHouseholdId(data.householdId);
                } else {
                    console.error(`Failed to fetch household ID, Status: ${response.status}`);
                }
            } catch (error) {
                console.error('Error fetching household ID:', error);
            }
        };

        fetchHouseholdId();
    }, []);

    useEffect(() => {
        if (!isConnected) return;

        if (householdId) {
            joinHousehold(householdId.toString());
        }

        return () => {
            if (householdId) {
                leaveHousehold(householdId.toString());
            }
        };
    }, [isConnected, householdId]);

    const handleChange = (date: Date) => {
        if (date !== selectedDate) {
            setSelectedDate(date);
        }
    };

    return (
        <div className="flex flex-col justify-center items-center w-full pt-6 pb-8 px-4 sm:px-8">
            <div className="w-full">
                <h1 className="text-3xl sm:text-4xl text-white w-full font-semibold">Dashboard</h1>
            </div>
            <main className="flex flex-col w-full pt-6 pb-8">
                <div className="flex flex-col w-full justify-center items-center">
                    <div className="flex flex-col gap-4 sm:flex-row sm:space-x-4 sm:gap-0 justify-between items-center w-full">
                        <Card
                            title="Upcoming events"
                            subtitle="See what's happening in your household"
                            dataType={DataType.events}
                            selectedDate={selectedDate}
                            refresh={eventsRefresh}
                        />
                        <Card
                            title="Chores"
                            subtitle="Tasks that need to be done"
                            dataType={DataType.chores}
                            selectedDate={selectedDate}
                            refresh={choresRefresh}
                        />
                        <Card
                            title="Upcoming bills"
                            subtitle="Track household expenses and payments"
                            dataType={DataType.bills}
                            selectedDate={selectedDate}
                            refresh={billsRefresh}
                        />
                    </div>
                    <div className="flex justify-center flex-col gap-4 sm:flex-row sm:gap-x-3 items-start w-full mt-4">
                        <Card
                            title="Shopping list"
                            subtitle="Items that need to be purchased"
                            dataType={DataType.shopping}
                            selectedDate={selectedDate}
                            refresh={shoppingRefresh}
                        />
                        <div className="w-full sm:w-auto flex justify-center">
                            <Calendar onChange={handleChange} initialDate={selectedDate} />
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
