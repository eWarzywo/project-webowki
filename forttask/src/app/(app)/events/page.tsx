"use client";
import EventDatePicker from "@/components/eventList/eventDatePicker";
import EventAddForm from "@/components/eventList/eventAddForm";
import EventList from "@/components/eventList/eventList";
import { useState, useEffect } from "react";
import { format } from "date-fns";

export default function Events() {
    const [date, setDate] = useState<Date>(new Date());
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const [refresh, setRefresh] = useState(false);

    const handleDateChange = (newDate: Date) => {
        setDate(newDate);
    }

    useEffect(() => {
        const fetchEvents = async () => {
            setLoading(true);
            setError(null);

            try {
                const dateString = format(date, 'yyyy-MM-dd');
                const response = await fetch(`/api/events/get?date=${dateString}`);
                if (!response.ok) {
                    throw new Error(`Failed to fetch events: ${response.status}`);
                }
                const data = await response.json();
                setEvents(data);
            } catch (error) {
                console.error('Error fetching events:', error);
                setError(error instanceof Error ? error : new Error('Failed to load events'));
            } finally {
                setLoading(false);
            }
        };

        fetchEvents();
    }, [date, refresh]);

    const handleRefresh = () => {
        setRefresh(!refresh);
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
                    onRefresh={handleRefresh}
                />
                <EventAddForm
                    onRefresh={handleRefresh}
                />
            </div>
        </>
    );
}
