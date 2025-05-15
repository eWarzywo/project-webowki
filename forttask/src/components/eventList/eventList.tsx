'use client';
import EventCard from "@/components/eventList/eventCard";
import Pagination from "@/components/generalUI/pagination";
import { useEffect } from "react";
import {useSearchParams} from "next/navigation";

type User = {
    id: number;
    username: string;
}

type EventAttendee = {
    userId: number;
    eventId: number;
    user: User;
}

type Event = {
    id: number;
    name: string;
    description: string;
    date: Date;
    createdById: number;
    attendees: EventAttendee[];
    location: string;
    cycle: number;
}

type EventListProps = {
    events: Event[];
    loading?: boolean;
    error?: Error | null;
    setPage?: (page: number) => void;
    totalItems: number;
    emitUpdate?: () => void;
}

export default function EventList({ events, loading, error, setPage, totalItems, emitUpdate }: EventListProps) {
    const searchParams = useSearchParams();
    const currentPage = parseInt(searchParams.get('page') || '1', 10);

    useEffect(() => {
        if (setPage) {
            setPage(currentPage);
        }
    }, [searchParams, setPage]);

    return (
        <div className="flex w-full h-fit flex-col border border-zinc-800 bg-zinc-950 rounded-xl p-6">
            <p className="text-zinc-50 text-2xl font-semibold w-full text-center">Event list</p>
            <p className="text-zinc-400 mt-1.5 text-sm pb-6 text-center">List of events you participate in</p>
            <div className="flex w-full h-fit flex-col gap-2">
                {loading ? (
                    <p className="text-zinc-400 text-center">Loading...</p>
                ) : error ? (
                    <p className="text-zinc-400 text-center">Error: {error.message}</p>
                ) : events && events.length > 0 ? (
                    events.map((event) => <EventCard key={event.id} event={event} emitUpdate={emitUpdate} />)
                ) : (
                    <p className="text-zinc-400 text-center">No events found</p>
                )}
            </div>
            {Math.ceil(totalItems / 5) > 1 && (
                <span className="flex justify-center items-center w-full mt-5">
                    <Pagination totalNumberOfItems={totalItems} itemsPerPage={5} key={`pagination-${currentPage}`} />
                </span>
            )}
        </div>
    );
}