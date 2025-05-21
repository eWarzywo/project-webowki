'use client';
import EventDatePicker from '@/components/events/eventDatePicker';
import EventAddForm from '@/components/events/eventAddForm';
import EventList from '@/components/events/eventList';
import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import { useSocket } from '@/lib/socket';

export default function Events() {
    const [date, setDate] = useState<Date>(new Date());
    const [events, setEvents] = useState([]);
    const [page, setPage] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [householdId, setHouseholdId] = useState<number | null>(null);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const [refresh, setRefresh] = useState(false);

    const router = useRouter();
    const { isConnected, eventsRefresh, emitUpdate, joinHousehold, leaveHousehold } = useSocket();

    const handleDateChange = (newDate: Date) => {
        setDate(newDate);
        handleRefresh();
    };

    useEffect(() => {
        const fetchHouseholdId = async () => {
            try {
                const response = await fetch('/api/user/get');
                if (response.ok) {
                    const data = await response.json();
                    setHouseholdId(data.householdId);
                }
            } catch (err) {
                console.error('Failed to fetch household ID:', err);
            }
        };
        fetchHouseholdId();
    }, []);

    useEffect(() => {
        const fetchTotalItems = async () => {
            try {
                const response = await fetch(`/api/events/get?date=${format(date, 'yyyy-MM-dd')}`);
                if (response.ok) {
                    const { count } = await response.json();
                    setTotalItems(count);
                }
            } catch {}
        };
        fetchTotalItems();
    }, [date, refresh]);

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

    useEffect(() => {
        handleRefresh();
    }, [eventsRefresh]);

    useEffect(() => {
        const fetchEvents = async () => {
            setLoading(true);
            setError(null);
            try {
                const dateString = format(date, 'yyyy-MM-dd');
                const response = await fetch(`/api/events/get?date=${dateString}&limit=5&skip=${(page - 1) * 5}`);
                if (!response.ok) {
                    throw new Error(`Failed to fetch events: ${response.status}`);
                }
                const data = await response.json();
                setEvents(data.events);
            } catch (error) {
                setError(error instanceof Error ? error : new Error('Failed to load events'));
            } finally {
                setLoading(false);
            }
        };
        fetchEvents();
    }, [date, refresh, page]);

    const handleRefresh = () => {
        setPage(1);
        router.push(`?page=1`);
        setRefresh(!refresh);
    };

    const handlePageChange = (newPage: number) => {
        setPage(newPage);
    };

    return (
        <div className="flex flex-col gap-4 w-full px-2 sm:px-0">
            <div className="flex flex-col sm:flex-row w-full gap-4">
                <div className="w-full sm:w-auto">
                    <EventDatePicker onChange={handleDateChange} />
                </div>
                <div className="flex-1 w-full mt-8 sm:mt-0">
                    <EventList
                        events={events}
                        loading={loading}
                        error={error}
                        setPage={handlePageChange}
                        totalItems={totalItems}
                        emitUpdate={() => householdId && emitUpdate(householdId, 'events')}
                    />
                </div>
                <div className="w-full sm:w-auto">
                    <EventAddForm
                        onRefresh={handleRefresh}
                        emitUpdate={() => householdId && emitUpdate(householdId, 'events')}
                    />
                </div>
            </div>
        </div>
    );
}
