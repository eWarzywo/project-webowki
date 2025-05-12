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
    const [eventLocation, setLocation] = useState('');
    const [repeat, setRepeat] = useState(0);
    const [description, setDescription] = useState('');
    const [error, setError] = useState<Error | null>(null);
    const [householders, setHouseholders] = useState<Householders[]>([]);
    const [validationErrors, setValidationErrors] = useState<Record<string, boolean>>({});


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

        const errors: Record<string, boolean> = {};

        if (!eventName.trim()) {
            errors.eventName = true;
        }

        if (participants.length === 0) {
            errors.participants = true;
        }

        if (!eventLocation.trim()) {
            errors.eventLocation = true;
        }

        if (!description.trim()) {
            errors.description = true;
        }

        if (Object.keys(errors).length > 0) {
            setValidationErrors(errors);
            return;
        }

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
                    location: eventLocation,
                    repeat: repeat,
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
        }
    };

    const handleCancel = () => {
        setEventName('');
        setEventDate(new Date());
        setParticipants([]);
        setLocation('');
        setRepeat(0);
        setDescription('');
        setValidationErrors({});
    };

    useEffect(() => {
        if (error) {
            console.error('Error:', error.message);
        }
    }, [error]);

    if (error) {
        return (
            <div className="flex flex-col items-center w-1/5">
                <div className="flex flex-col w-full justify-center items-center rounded-xl border border-zinc-800 bg-zinc-950 mb-2 p-2">
                    <p className="mb-2 text-4m text-zinc-400 w-full text-center pl-1">Error: {error.message}</p>
                    <input type="button" value="Retry" onClick={handleRefresh} className="bg-zinc-50 text-zinc-900 px-4 py-2 rounded-xl gap-2.5 hover:bg-zinc-600 hover:text-zinc-200 hover:border hover:border-zinc-200 cursor-pointer text-sm font-medium" />
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col w-1/5 justify-center items-end rounded-xl border border-zinc-800 bg-zinc-950 mb-2 p-6">
            <p className="text-zinc-50 text-2xl font-semibold w-full text-end">Add Event</p>
            <p className="text-zinc-400 mt-1.5 text-sm pb-6">Add a new event for you or your buddy</p>
            <form className="flex flex-col w-full justify-center items-end">
                <label htmlFor="eventName">Name</label>
                <input
                    type="text"
                    id="eventName"
                    placeholder="Name of the event"
                    value={eventName}
                    onChange={(e) => {
                        setEventName(e.target.value);
                        if (validationErrors.eventName && e.target.value.trim()) {
                            setValidationErrors({ ...validationErrors, eventName: false });
                        }
                    }}
                    className={`py-2 pl-3 pr-5 mb-2 w-full border bg-zinc-950 ${
                        validationErrors.eventName ? 'border-red-500' : 'border-zinc-800'
                    } placeholder:text-zinc-400 rounded-xl focus:border-zinc-400 focus:outline-none`}
                />
                {validationErrors.eventName && <p className="text-red-500 text-xs mb-2">Event name is required</p>}
                <label htmlFor="eventDate">Date</label>
                <Calendar onChange={setEventDate} />
                <label htmlFor="participants" className="mt-2">
                    Participants
                </label>
                <p className="text-zinc-400 text-sm mb-1">Hold control for multiple choice</p>
                <select
                    id="participants"
                    multiple
                    value={participants.map(String)} // Add this to make it fully controlled
                    onChange={(e) => {
                        const selectedOptions = Array.from(e.target.selectedOptions, (option) => Number(option.value));
                        setParticipants(selectedOptions);
                        if (validationErrors.participants && selectedOptions.length > 0) {
                            setValidationErrors({ ...validationErrors, participants: false });
                        }
                    }}
                    className={`py-2 pl-3 pr-5 mb-2 w-full border bg-zinc-950 ${
                        validationErrors.participants ? 'border-red-500' : 'border-zinc-800'
                    } placeholder:text-zinc-400 rounded-xl focus:border-zinc-400 focus:outline-none`}
                >
                    {householders.map((householder) => (
                        <option key={householder.id} value={householder.id} className="rounded-xl text-center">
                            {householder.username}
                        </option>
                    ))}
                </select>
                {validationErrors.participants && (
                    <p className="text-red-500 text-xs mb-2">Please select at least one participant</p>
                )}
                <label htmlFor="eventLocation">Location</label>
                <input
                    type="text"
                    id="eventLocation"
                    placeholder="Enter event location"
                    value={eventLocation}
                    onChange={(e) => {
                        setLocation(e.target.value);
                        if (validationErrors.eventLocation && e.target.value.trim()) {
                            setValidationErrors({ ...validationErrors, eventLocation: false });
                        }
                    }}
                    className={`py-2 pl-3 pr-5 mb-2 w-full border bg-zinc-950 ${
                        validationErrors.eventLocation ? 'border-red-500' : 'border-zinc-800'
                    } placeholder:text-zinc-400 rounded-xl focus:border-zinc-400 focus:outline-none`}
                />
                {validationErrors.eventLocation && <p className="text-red-500 text-xs mb-2">Location is required</p>}
                <label htmlFor="repeat">Repeat after x days?</label>
                <p className="text-zinc-400 text-sm mb-1">Leave 0 if not repeatable</p>
                <input
                    type="text"
                    id="repeat"
                    placeholder="Enter event repeat interval"
                    value={repeat}
                    onChange={(e) =>
                        parseInt(e.target.value) >= 0
                            ? parseInt(e.target.value) <= 365
                                ? setRepeat(parseInt(e.target.value))
                                : setRepeat(365)
                            : setRepeat(0)
                    }
                    min={0}
                    max={365}
                    className="py-2 pl-3 pr-5 mb-2 w-full border bg-zinc-950 border-zinc-800 placeholder:text-zinc-400 rounded-xl focus:border-zinc-400 focus:outline-none"
                />
                <label htmlFor="description">Description</label>
                <input
                    type="text"
                    id="description"
                    placeholder="Enter event description"
                    value={description}
                    onChange={(e) => {
                        setDescription(e.target.value);
                        if (validationErrors.description && e.target.value.trim()) {
                            setValidationErrors({ ...validationErrors, description: false });
                        }
                    }}
                    className={`py-2 pl-3 pr-5 mb-2 w-full border bg-zinc-950 ${
                        validationErrors.description ? 'border-red-500' : 'border-zinc-800'
                    } placeholder:text-zinc-400 rounded-xl focus:border-zinc-400 focus:outline-none`}
                />
                {validationErrors.description && <p className="text-red-500 text-xs mb-2">Description is required</p>}
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