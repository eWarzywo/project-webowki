'use client';
import DatePicker from "@/components/generalUI/datePicker";
import React, { useState, useEffect } from "react";

type choreAddFormProps = {
    onRefresh?: () => void;
}

export default function ChoreAddForm({ onRefresh }: choreAddFormProps) {
    const [error, setError] = useState<Error | null>(null);
    const [validationErrors, setValidationErrors] = useState<Record<string, boolean>>({});

    const [choreName, setChoreName] = useState("");

    const [choreDate, setChoreDate] = useState<Date | null>(null);
    const [showCalendar, setShowCalendar] = useState(false);

    const [repetition, setRepetition] = useState(0);
    const [repetitionAmount, setRepetitionAmount] = useState(0);
    const [repetitionAmountInput, setRepetitionAmountInput] = useState('');
    const [isCustomRepetition, setIsCustomRepetition] = useState(false);
    const [customRepetitionInput, setCustomRepetitionInput] = useState('');

    const [priority, setPriority] = useState(1);

    const handleShowCalendar = () => {
        setShowCalendar(!showCalendar);
    };

    const handleSelectDate = (date: Date) => {
        setChoreDate(date);
        setShowCalendar(false);
    };

    const handleRefresh = () => {
        setError(null);
        if (onRefresh) {
            onRefresh();
        }
    };

    const handleCancel = () => {
        setChoreName("");
        setChoreDate(null);
        setRepetition(0);
        setRepetitionAmount(0);
        setRepetitionAmountInput('');
        setIsCustomRepetition(false);
        setCustomRepetitionInput('');
        setPriority(1);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const errors: Record<string, boolean> = {};

        if (choreName.length < 3) {
            errors.name = true;
        }

        if (!choreDate) {
            errors.choreDate = true;
        }

        if (repetitionAmount < 0) {
            errors.repetitionAmount = true;
        }

        if (priority < 1 || priority > 5) {
            errors.priority = true;
        }

        if (Object.keys(errors).length > 0) {
            setValidationErrors(errors);
            return;
        }

        try {
            const response = await fetch("/api/chore/create", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name: choreName,
                    dueDate: choreDate,
                    priority,
                    cycle: repetition,
                    repeatCount: repetitionAmount,
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to create chore");
            }

            handleRefresh();
            handleCancel();
        } catch (error) {
            if (error instanceof Error) {
                setError(error);
            } else {
                setError(new Error("An unknown error occurred"));
            }
        }
    }
    
    useEffect(() => {
        if (error) {
            console.error("Error: ", error);
        }
    }, [error]);
    
    if (error) {
        return (
            <div className="flex flex-col items-center w-1/5">
                <div className="flex flex-col w-full justify-center items-center rounded-xl border border-zinc-800 bg-zinc-950 mb-2 p-2">
                    <p className="mb-2 text-4m text-zinc-400 w-full text-center pl-1">Error: {error.message}</p>
                    <input
                        type="button"
                        value="Retry"
                        onClick={handleRefresh}
                        className="bg-zinc-50 text-zinc-900 px-4 py-2 rounded-xl gap-2.5 hover:bg-zinc-600 hover:text-zinc-200 hover:border hover:border-zinc-200 cursor-pointer text-sm font-medium"
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col w-1/5 justify-center items-end rounded-xl border border-zinc-800 bg-zinc-950 mb-2 p-6">
            <p className="text-zinc-50 text-2xl font-semibold w-full text-end">Add Chore</p>
            <p className="text-zinc-400 mt-1.5 text-sm pb-6 text-end">Add a new chore for your dirty ahh crib</p>
            <form className="flex flex-col w-full justify-center items-end">
                <label htmlFor="choreName">Name</label>
                <input
                    type="text"
                    id="eventName"
                    placeholder="Name of the event"
                    value={choreName}
                    onChange={(e) => {
                        setChoreName(e.target.value);
                        if (validationErrors.eventName && e.target.value.trim()) {
                            setValidationErrors({...validationErrors, eventName: false});
                        }
                    }}
                    className={`py-2 pl-3 pr-5 mb-2 w-full border bg-zinc-950 ${
                        validationErrors.eventName ? 'border-red-500' : 'border-zinc-800'
                    } placeholder:text-zinc-400 rounded-xl focus:border-zinc-400 focus:outline-none`}
                />
                {validationErrors.eventName && <p className="text-red-500 text-xs mb-2">Event name is required</p>}
                <label htmlFor="choreDate">Due to</label>
                <div
                    onClick={handleShowCalendar}
                    className="w-full border rounded-xl gap-2.5 px-6 py-2 border-zinc-800 flex max-h-10 min-h-10 flex-col justify-center items-center hover:bg-zinc-800 hover:border-zinc-400 text-zinc-50 font-medium text-sm cursor-pointer"
                >
                    {choreDate ? choreDate.toLocaleDateString() : 'Select a date'}
                </div>
                {validationErrors.choreDate && <p className="text-red-500 text-xs mb-2">Chore date is required</p>}
                <label
                    htmlFor="priority"
                    className="pt-2"
                >
                    Priority
                </label>
                <p className="text-zinc-400 text-sm mb-1 text-end">The higher the number, the more important</p>
                <select
                    id="priority"
                    value={priority}
                    onChange={(e) => {
                        const value = parseInt(e.target.value, 10);
                        setPriority(value);
                        if (validationErrors.priority && value >= 1 && value <= 5) {
                            setValidationErrors({...validationErrors, priority: false});
                        }
                    }}
                    className={`py-2 pl-3 pr-5 mb-2 w-full border bg-zinc-950 ${
                        validationErrors.priority ? 'border-red-500' : 'border-zinc-800'
                    } placeholder:text-zinc-400 rounded-xl focus:border-zinc-400 focus:outline-none`}
                >
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4">4</option>
                    <option value="5">5</option>
                </select>
                <label
                    htmlFor="repetition"
                    className="pt-2"
                >
                    Repeat after x days?
                </label>
                <select
                    id="repetition"
                    value={isCustomRepetition ? "-1" : repetition.toString()}
                    onChange={(e) => {
                        const value = parseInt(e.target.value, 10);
                        if (value === -1) {
                            setIsCustomRepetition(true);
                            setCustomRepetitionInput("");
                        } else {
                            setIsCustomRepetition(false);
                            setRepetition(value);
                        }

                        if (value === 0) {
                            setRepetitionAmount(0);
                            setRepetitionAmountInput("");
                        }
                    }}
                    className="py-2 pl-3 pr-5 mb-2 w-full border bg-zinc-950 border-zinc-800 placeholder:text-zinc-400 rounded-xl focus:border-zinc-400 focus:outline-none"
                >
                    <option value="0">No Repeat</option>
                    <option value="1">Daily</option>
                    <option value="7">Weekly</option>
                    <option value="-30">Monthly</option>
                    <option value="-365">Yearly</option>
                    <option value="-1">Custom...</option>
                </select>
                {isCustomRepetition && (
                    <input
                        type="number"
                        id="customRepeat"
                        placeholder="Enter days"
                        min="1"
                        value={customRepetitionInput}
                        onChange={(e) => {
                            const newValue = e.target.value;

                            if (newValue === "" || /^[0-9]+$/.test(newValue)) {
                                setCustomRepetitionInput(newValue);

                                if (newValue === "") {
                                    setRepetition(0);
                                } else {
                                    const value = parseInt(newValue, 10);
                                    if (value >= 1) {
                                        setRepetition(value);
                                    }
                                }
                            }
                        }}
                        className="py-2 pl-3 pr-5 mb-2 w-full border bg-zinc-950 border-zinc-800 placeholder:text-zinc-400 rounded-xl focus:border-zinc-400 focus:outline-none"
                    />
                )}
                {repetition !== 0 && (
                    <>
                        <label htmlFor="repeatCount" className="text-zinc-400 text-sm mb-1 text-end">
                            How many times should it repeat?
                        </label>
                        <input
                            type="number"
                            id="repeatCount"
                            placeholder="Enter repeat count"
                            min="1"
                            max="100"
                            value={repetitionAmountInput}
                            onChange={(e) => {
                                const newValue = e.target.value;

                                if (newValue === "" || /^[0-9]+$/.test(newValue)) {
                                    setRepetitionAmountInput(newValue);

                                    if (newValue === "") {
                                        setRepetitionAmount(0);
                                    } else {
                                        const value = parseInt(newValue, 10);
                                        if (value >= 1 && value <= 365) {
                                            setRepetitionAmount(value);
                                        }
                                    }
                                }
                            }}
                            className="py-2 pl-3 pr-5 mb-2 w-full border bg-zinc-950 border-zinc-800 placeholder:text-zinc-400 rounded-xl focus:border-zinc-400 focus:outline-none"
                        />
                    </>
                )}
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
            {showCalendar && (
                <DatePicker
                    selectedDate={choreDate}
                    setSelectedDate={handleSelectDate}
                    handleShowCalendar={handleShowCalendar}
                />
            )}
        </div>
    );
}