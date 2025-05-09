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

type EventCardProps = {
    event: Event;
    onRefresh?: () => void;
}

export default function EventCard({ event, onRefresh }: EventCardProps) {
    const dateObject = new Date(event.date);

    const formattedDate = dateObject.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    const handleDone = async () => {
        try {
            const response = await fetch(`/api/event/delete?eventId=${event.id}`, {
                method: 'DELETE',
            });
            if (!response.ok) {
                throw new Error(`Failed to delete event: ${response.status}`);
            }
            handleRefresh();
        } catch (error) {
            console.error('Error deleting events:', error);
        }
    }

    const handleRefresh = () => {
        if (onRefresh) {
            onRefresh();
        }
    }

    return (
        <div className="flex w-full h-fit gap-2 border border-zinc-800 bg-zinc-950 rounded-xl p-4">
            <div className="flex flex-col w-4/5">
                <h2 className="text-2xl font-semibold">{event.name}</h2>
                <div className="flex">
                    {event.attendees.map((attendee) => (
                        <p key={attendee.user.id} className="mr-2">{attendee.user.username}</p>
                    ))}
                </div>
                <p>{event.description}</p>
                <p className="mr-2">{formattedDate}</p>
            </div>
            <div className="flex flex-col w-1/5 justify-center">
                <input type="button" value="Done" onClick={handleDone} className="bg-zinc-50 text-zinc-900 px-4 py-2 rounded-xl gap-2.5 hover:bg-zinc-600 hover:text-zinc-200 hover:border hover:border-zinc-200 cursor-pointer text-sm font-medium" />
            </div>
        </div>
    );
}