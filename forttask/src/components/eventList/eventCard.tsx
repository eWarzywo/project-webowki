import React from "react";
import { createRoot } from "react-dom/client";

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

type EventCardProps = {
    event: Event;
    emitUpdate?: () => void;
}

type DetailsBoxProps = {
    name: string;
    description: string;
    date: Date;
    location: string;
    attendees: EventAttendee[];
    onClose: () => void;
}

type ConfirmationBoxProps = {
    eventName: string;
    onConfirm: () => void;
    onCancel: () => void;
}

function ConfirmationBox({ eventName, onConfirm, onCancel }: ConfirmationBoxProps) {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-zinc-900 text-zinc-100 rounded-xl p-6 w-1/4 relative">
                <h2 className="text-xl font-semibold mb-4">Confirm Deletion</h2>
                <p className="mb-6">Are you sure you want to mark <b>{eventName}</b> as done and delete it?</p>

                <div className="flex justify-center gap-4">
                    <button
                        onClick={onCancel}
                        className="px-6 py-2 bg-zinc-700 text-zinc-100 hover:bg-zinc-600 transition-colors rounded-xl"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className="px-6 py-2 bg-red-600 text-white hover:bg-red-700 transition-colors rounded-xl"
                    >
                        Delete
                    </button>
                </div>

                <button
                    className="absolute top-4 right-4 text-gray-300 hover:text-white"
                    onClick={onCancel}
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                        />
                    </svg>
                </button>
            </div>
        </div>
    );
}

function DetailsBox({ name, description, date, location, attendees, onClose }: DetailsBoxProps) {
    const dateObject = new Date(date);

    const formattedDate = dateObject.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-zinc-900 text-zinc-100 rounded-xl p-6 w-1/3 relative">
                <h2 className="text-2xl font-semibold mb-3">{name}</h2>
                <p className="mb-2">{description}</p>
                <p className="mb-2">Event happening at: {location}</p>
                <p className="mb-4">{formattedDate}</p>
                <div className="border-t border-zinc-700 pt-3 mt-3">
                    <h3 className="font-medium mb-2">Attendees:</h3>
                    <div className="flex flex-wrap gap-2">
                        {attendees.map((attendee) => (
                            <span key={attendee.user.id} className="px-2 py-1 bg-zinc-800 rounded-lg text-sm">
                                {attendee.user.username}
                            </span>
                        ))}
                    </div>
                </div>

                <button
                    className="absolute top-4 right-4 text-gray-300 hover:text-white"
                    onClick={onClose}
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                        />
                    </svg>
                </button>
            </div>
        </div>
    );
}

export default function EventCard({ event, emitUpdate }: EventCardProps) {
    const dateObject = new Date(event.date);

    const formattedDate = dateObject.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    const handleDone = (e: React.MouseEvent) => {
        e.stopPropagation();

        const confirmationBox = document.createElement('div');
        document.body.appendChild(confirmationBox);

        const root = createRoot(confirmationBox);
        root.render(
            <ConfirmationBox
                eventName={event.name}
                onConfirm={async () => {
                    root.unmount();
                    document.body.removeChild(confirmationBox);

                    try {
                        const response = await fetch(`/api/event/delete?eventId=${event.id}`, {
                            method: 'DELETE',
                        });
                        if (!response.ok) {
                            throw new Error(`Failed to delete event: ${response.status}`);
                        }
                        if (emitUpdate) {
                            emitUpdate();
                        }
                    } catch (error) {
                        console.error('Error deleting events:', error);
                    }
                }}
                onCancel={() => {
                    root.unmount();
                    document.body.removeChild(confirmationBox);
                }}
            />
        );
    }

    const showDetails = () => {
        const detailsBox = document.createElement('div');
        document.body.appendChild(detailsBox);

        const root = createRoot(detailsBox);
        root.render(
            <DetailsBox
                name={event.name}
                description={event.description}
                date={event.date}
                location={event.location}
                attendees={event.attendees}
                onClose={() => {
                    root.unmount();
                    document.body.removeChild(detailsBox);
                }}
            />
        );
    }

    return (
        <div
            className="flex w-full h-fit gap-2 border border-zinc-800 bg-zinc-950 rounded-xl p-4 cursor-pointer hover:bg-zinc-900 transition-colors"
            key={event.id}
            onClick={showDetails}
        >
            <div className="flex flex-col w-4/5">
                <h2 className="text-lg font-semibold text-zinc-100">{event.name}</h2>
                <p className="text-zinc-400 text-sm">{formattedDate}</p>
            </div>
            <div className="flex flex-col w-1/5 justify-center">
                <input
                    type="button"
                    value="Done"
                    onClick={handleDone}
                    className="bg-zinc-50 text-zinc-900 px-4 py-2 rounded-xl gap-2.5 hover:bg-zinc-600 hover:text-zinc-200 hover:border hover:border-zinc-200 cursor-pointer text-sm font-medium"
                />
            </div>
        </div>
    );
}