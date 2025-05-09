import Calendar from '@/components/generalUI/calendar';
import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';

interface Householders {
    id: number;
    username: string;
}

type EventAddFormProps = {
    onRefresh?: () => void;
}

export default function EventAddForm({ onRefresh }: EventAddFormProps) {
    const [eventName, setEventName] = useState('');
    const [eventDate, setEventDate] = useState(new Date());
    const [participants, setParticipants] = useState<number[]>([]);
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const [householders, setHouseholders] = useState<Householders[]>([]);

    useEffect(() => {
        const fetchHouseholders = async () => {
            try {
                const response = await fetch('/api/household/users/get');
                if (!response.ok) {
                    throw new Error(`Failed to fetch household members: ${response.status}`);
                }
                const data = await response.json();
                setHouseholders(data);
            } catch (error) {
                console.error('Error fetching household members:', error);
                setError(error instanceof Error ? error : new Error('Failed to load household members'));
            }
        };

        fetchHouseholders();
    }, []);

    const handleRefresh = () => {
        setError(null);
        if (onRefresh) {
            onRefresh();
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (participants.length === 0) {
            setError(new Error('Please select at least one participant.'));
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/event/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: eventName,
                    date: format(eventDate, 'yyyy-MM-dd'),
                    attendees: participants,
                    description: description,
                }),
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            handleCancel();
            handleRefresh();
        } catch (error) {
            setError(error instanceof Error ? error : new Error('An unknown error occurred'));
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        setEventName('');
        setEventDate(new Date());
        setParticipants([]);
        setDescription('');
    };

    useEffect(() => {
        if (error) {
            console.error('Error:', error.message);
        }
    }, [error]);

    if (loading) {
        return (
            <div className="flex w-auto flex-col items-center">
                <div className="flex w-full justify-center items-center rounded-xl border border-zinc-800 bg-zinc-950 mb-2 p-2">
                    <p className="text-4m text-zinc-400 w-full text-end pl-1">Loading...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex w-auto flex-col items-center">
                <div className="flex flex-col w-full justify-center items-center rounded-xl border border-zinc-800 bg-zinc-950 mb-2 p-2">
                    <p className="mb-2 text-4m text-zinc-400 w-full text-center pl-1">Error: {error.message}</p>
                    <input type="button" value="Retry" onClick={handleRefresh} className="bg-zinc-50 text-zinc-900 px-4 py-2 rounded-xl gap-2.5 hover:bg-zinc-600 hover:text-zinc-200 hover:border hover:border-zinc-200 cursor-pointer text-sm font-medium" />
                </div>
            </div>
        );
    }

    return (
        <div className="flex w-auto flex-col items-center">
            <div className="flex w-full justify-center items-center rounded-xl border border-zinc-800 bg-zinc-950 mb-2 p-2">
                <p className="text-4m text-zinc-400 w-full text-end pl-1">Add Event</p>
            </div>
            <form className="flex flex-col w-full justify-center items-end rounded-xl border border-zinc-800 bg-zinc-950 mb-2 p-2">
                <label htmlFor="eventName">Name</label>
                <input
                    type="text"
                    id="eventName"
                    placeholder="Name of the event"
                    value={eventName}
                    onChange={(e) => setEventName(e.target.value)}
                    required
                    className="py-2 pl-3 pr-5 mb-2 w-full border bg-zinc-950 border-zinc-800 placeholder:text-zinc-400 rounded-xl focus:border-zinc-400 focus:outline-none"
                />
                <label htmlFor="eventDate">Date</label>
                <Calendar onChange={setEventDate} />
                <label htmlFor="participants" className="mt-2">
                    Participants
                </label>
                <p className="text-zinc-400 text-sm mb-1">Hold control for multiple choice</p>
                <select
                    id="participants"
                    multiple
                    onChange={(e) => {
                        const selectedOptions = Array.from(e.target.selectedOptions, (option) => Number(option.value));
                        setParticipants(selectedOptions);
                    }}
                    className="py-2 pl-3 pr-5 mb-2 w-full border bg-zinc-950 border-zinc-800 placeholder:text-zinc-400 rounded-xl focus:border-zinc-400 focus:outline-none"
                >
                    {householders.map((householder) => (
                        <option key={householder.id} value={householder.id} className="rounded-xl text-center">
                            {householder.username}
                        </option>
                    ))}
                </select>
                <label htmlFor="description">Description</label>
                <input
                    type="text"
                    id="description"
                    placeholder="Enter event description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                    className="py-2 pl-3 pr-5 mb-2 w-full border bg-zinc-950 border-zinc-800 placeholder:text-zinc-400 rounded-xl focus:border-zinc-400 focus:outline-none"
                />
                <div className="w-full flex justify-between px-6 pb-2 items-center">
                    <input
                        type="reset"
                        value="Cancel"
                        onClick={handleCancel}
                        className="border rounded-xl gap-2.5 px-4 py-2 border-zinc-800 flex max-h-10 min-h-10 flex-col justify-center items-center hover:bg-zinc-800 hover:border-zinc-400 text-zinc-50 font-medium text-sm cursor-pointer"
                    />
                    <input
                        type="submit"
                        value="Add"
                        onClick={handleSubmit}
                        className="bg-zinc-50 text-zinc-900 px-4 py-2 rounded-xl gap-2.5 hover:bg-zinc-600 hover:text-zinc-200 hover:border hover:border-zinc-200 cursor-pointer text-sm font-medium"
                    />
                </div>
            </form>
        </div>
    );
}