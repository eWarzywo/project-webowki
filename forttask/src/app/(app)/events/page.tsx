"use client";
import EventDatePicker from "@/components/eventList/eventDatePicker";
import EventAddForm from "@/components/eventList/eventAddForm";
import EventList from "@/components/eventList/eventList";
import { useState, useEffect } from "react";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
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
    const { isConnected, socketRefresh, emitUpdate, joinHousehold, leaveHousehold } = useSocket();

    const handleDateChange = (newDate: Date) => {
        setDate(newDate);
        handleRefresh();
    }

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
        const fetchTotalItems = async () => {
            try {
                const response = await fetch(`/api/events/get?date=${format(date, 'yyyy-MM-dd')}`);
                if (response.ok) {
                    const { count } = await response.json();
                    setTotalItems(count);
                } else {
                    console.error(`Failed to fetch total items, Status: ${response.status}`);
                }
            } catch (error) {
                console.error('Error fetching total items:', error);
            }
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
    }, [socketRefresh]);

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
                console.error('Error fetching events:', error);
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
    }

    const handlePageChange = (newPage: number) => {
        setPage(newPage);
    }

    return (
        <>
            <div className="flex w-full self-stretch gap-[10px]">
                <EventDatePicker
                    onChange={handleDateChange}
                />
                <EventList
                    events={events}
                    loading={loading}
                    error={error}
                    setPage={handlePageChange}
                    totalItems={totalItems}
                    emitUpdate={() => householdId && emitUpdate(householdId)}
                />
                <EventAddForm
                    onRefresh={handleRefresh}
                    emitUpdate={() => householdId && emitUpdate(householdId)}
                />
            </div>
        </>
    );
}
