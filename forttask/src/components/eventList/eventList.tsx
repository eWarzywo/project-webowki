import EventCard from "@/components/eventList/eventCard";

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
}

type EventListProps = {
    events: Event[];
    loading?: boolean;
    error?: Error | null;
}

export default function EventList({ events, loading, error }: EventListProps) {
    return (
        <div className="w-full">
            <div className="flex w-full justify-center items-center rounded-xl border border-zinc-800 bg-zinc-950 max-h-96 mb-2 p-2">
                <p className="text-4m text-zinc-400 w-full text-center pl-1">Event List</p>
            </div>
            <div className="flex w-full h-fit flex-col gap-2 border border-zinc-800 bg-zinc-950 rounded-xl p-4">
                {loading ? (
                    <p className="text-zinc-400 text-center">Loading...</p>
                ) : error ? (
                    <p className="text-zinc-400 text-center">Error: {error.message}</p>
                ) : events && events.length > 0 ? (
                    events.map((event) => <EventCard key={event.id} event={event} />)
                ) : (
                    <p className="text-zinc-400 text-center">No events found</p>
                )}
            </div>
        </div>
    );
}