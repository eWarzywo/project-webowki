'use client';

import React, { useEffect } from 'react';
import DatePicker from '@/components/generalUI/datePicker';
import BillsHandler from '@/components/bills/billsHandler';
import Image from 'next/image';
import { useSocket } from '@/lib/socket';
import { useRouter } from 'next/navigation';

export default function Bills() {
    const [showCalendar, setShowCalendar] = React.useState(false);
    const [selectedDate, setSelectedDate] = React.useState<Date | null>(null);
    const [name, setName] = React.useState<string>('');
    const [cost, setCost] = React.useState<number | null>(null);
    const [recurring, setRecurring] = React.useState<boolean>(false);
    const [showDropdown, setShowDropdown] = React.useState<boolean>(false);
    const [selectedOption, setSelectedOption] = React.useState<string | null>(null);
    const [description, setDescription] = React.useState<string>('');
    const [error, setError] = React.useState<string | null>(null);
    const [refresh, setRefresh] = React.useState<boolean>(false);

    const [page, setPage] = React.useState<number>(1);
    const router = useRouter();

    const handlePageChange = (newPage: number) => {
        setPage(newPage);
    };

    const [householdId, setHouseholdId] = React.useState<number | null>(null);
    const { isConnected, billsRefresh, emitUpdate, joinHousehold, leaveHousehold } = useSocket();

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
        setPage(1);
        router.push('?page=1');
        setRefresh(!refresh);
    }, [billsRefresh]);

    React.useEffect(() => {
        if (refresh) {
            setName('');
            setCost(null);
            setRecurring(false);
            setSelectedOption(null);
            setDescription('');
            setSelectedDate(null);
            setRefresh(false);
        }
    }, [refresh]);

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        function calculateCycle(date: Date, option: string): number {
            const year = date.getFullYear();
            switch (option) {
                case 'Week':
                    return 7;
                case 'Month':
                    const month = date.getMonth();
                    return new Date(year, month + 1, 0).getDate();
                case 'Year':
                    return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0 ? 366 : 365;
                default:
                    throw new Error('Invalid cycle option');
            }
        }

        e.preventDefault();
        setError(null);
        if (!name || !cost || !selectedDate) {
            setError('Please fill in all fields');
            return;
        }
        if (cost <= 0) {
            setError('Cost must be greater than 0');
            return;
        }
        if (name.length < 3) {
            setError('Name must be at least 3 characters long');
            return;
        }
        if (description.length > 200) {
            setError('Description must be less than 200 characters');
            return;
        }

        const cycle = selectedOption ? calculateCycle(selectedDate, selectedOption) : 0;

        const billData = {
            name,
            amount: cost,
            cycle,
            dueDate: selectedDate.toISOString(),
            description,
        };

        fetch('/api/bill', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(billData),
        })
            .then((res) => {
                if (!res.ok) {
                    throw new Error('Failed to create bill');
                }
                return res.json();
            })
            .then(() => {
                if (householdId) {
                    emitUpdate(householdId, 'bills');
                }
            })
            .catch((error) => {
                console.error(error);
                setError('Failed to create bill');
            });
    };

    const handleShowCalendar = () => {
        setShowCalendar(!showCalendar);
    };

    const handleSelectDate = (date: Date) => {
        setSelectedDate(date);
    };

    const handleReset = () => {
        setName('');
        setCost(null);
        setRecurring(false);
        setSelectedOption(null);
        setDescription('');
        setSelectedDate(null);
        setError(null);
        setShowDropdown(false);
    };

    return (
        <>
            <div className="flex flex-col md:flex-row w-full self-stretch gap-3 py-3">
                <form
                    onSubmit={handleSubmit}
                    onReset={handleReset}
                    autoComplete="off"
                    autoCorrect="off"
                    id="bills-form"
                    className="gap-0 self-start w-full md:w-1/3 lg:w-1/4 flex flex-col items-center rounded-xl border border-zinc-800 bg-zinc-950"
                >
                    <div className="flex p-6 flex-col items-start justify-start w-full">
                        <h3 className="text-zinc-50 flex text-2xl font-semibold">Add new bill</h3>
                        <h4 className="text-zinc-400 mt-1.5 text-sm">Add an upcoming bill to pay</h4>
                    </div>
                    <div className="px-6 pb-6 space-y-4 flex flex-col items-start w-full">
                        <div className="flex flex-col items-start justify-start w-full">
                            <label htmlFor="name">Name</label>
                            <input
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                type="text"
                                id="name"
                                name="name"
                                placeholder="Name of the bill"
                                className="py-2 pl-3 pr-5 border bg-zinc-950 border-zinc-800 placeholder:text-zinc-400 rounded-xl focus:border-zinc-400 focus:outline-hidden w-full"
                            />
                        </div>
                        <div className="flex flex-col items-start justify-start w-full">
                            <label htmlFor="cost">Cost</label>
                            <div
                                id="costdiv"
                                className="costInput py-2 px-3 border bg-zinc-950 border-zinc-800 rounded-xl flex items-center justify-between w-full"
                            >
                                <input
                                    value={cost || ''}
                                    onChange={(e) => setCost(parseFloat(e.target.value))}
                                    type="number"
                                    id="cost"
                                    name="cost"
                                    placeholder="Cost of the bill"
                                    min="1"
                                    step="1"
                                    className="bg-zinc-950 no-spinner focus:border-none focus:outline-hidden w-full"
                                />
                                <span className="text-zinc-400 ml-2">$</span>
                            </div>
                        </div>
                        <div className="flex flex-col items-start justify-start w-full">
                            <label htmlFor="cost">Due to</label>
                            <div
                                onClick={handleShowCalendar}
                                className="w-full border rounded-xl gap-2.5 px-6 py-2 border-zinc-800 flex max-h-10 min-h-10 flex-col justify-center items-center hover:bg-zinc-800 hover:border-zinc-400 text-zinc-50 font-medium text-sm cursor-pointer"
                            >
                                {selectedDate ? selectedDate.toLocaleDateString() : 'Select a date'}
                            </div>
                        </div>
                        <div className="flex flex-col items-start justify-start w-full">
                            <label htmlFor="cost">Description</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                id="description"
                                name="description"
                                placeholder="Description of the bill"
                                className="w-full py-2 pl-3 pr-5 border bg-zinc-950 border-zinc-800 placeholder:text-zinc-400 rounded-xl focus:border-zinc-400 focus:outline-hidden min-h-14 max-h-40"
                            />
                        </div>
                        <div className="flex items-start justify-start w-full">
                            <div className="flex items-center gap-2 px-1">
                                <div
                                    onClick={() => {
                                        if (recurring) {
                                            setSelectedOption(null);
                                        }
                                        setRecurring(!recurring);
                                    }}
                                    className={`w-5 h-5 flex items-center justify-center border rounded cursor-pointer ${
                                        recurring ? 'bg-zinc-50 border-zinc-400' : 'bg-zinc-950 border-zinc-800'
                                    }`}
                                >
                                    {recurring && <span className="text-zinc-900 font-bold text-sm">✔</span>}
                                </div>
                                <label onClick={() => setRecurring(!recurring)} className="cursor-pointer text-zinc-50">
                                    Does this bill repeat?
                                </label>
                            </div>
                        </div>
                        {recurring && (
                            <div className="flex flex-col items-start justify-start w-full">
                                <label htmlFor="repeat">Repeat every</label>
                                <div className="relative w-full">
                                    <button
                                        type="button"
                                        className="w-full py-2 pl-3 pr-5 border bg-zinc-950 border-zinc-800 placeholder:text-zinc-400 rounded-xl focus:border-zinc-400 focus:outline-hidden flex justify-between items-center"
                                        onClick={() => setShowDropdown(!showDropdown)}
                                    >
                                        {selectedOption || 'Select an option'}
                                        <span className="text-zinc-400">
                                            <Image src="/ArrowDown.svg" alt="chevron down" width={20} height={20} />
                                        </span>
                                    </button>
                                    {showDropdown && (
                                        <ul className="absolute z-10 w-full mt-1 bg-zinc-950 border border-zinc-800 rounded-xl shadow-lg">
                                            {['Week', 'Month', 'Year'].map((option) => (
                                                <li
                                                    key={option}
                                                    className="px-3 py-2 hover:bg-zinc-800 cursor-pointer text-zinc-50"
                                                    onClick={() => {
                                                        setSelectedOption(option);
                                                        setShowDropdown(false);
                                                    }}
                                                >
                                                    {option}
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            </div>
                        )}
                        <div className="flex w-full gap-2 justify-between items-center">
                            <input
                                type="reset"
                                value="Cancel"
                                className="border rounded-xl gap-2.5 px-6 py-2 border-zinc-800 flex max-h-10 min-h-10 flex-col justify-center items-center hover:bg-zinc-800 hover:border-zinc-400 text-zinc-50 font-medium text-sm cursor-pointer w-1/2"
                            />
                            <input
                                type="submit"
                                value="Add"
                                className="bg-zinc-50 text-zinc-900 px-6 py-2 rounded-xl gap-2.5 hover:bg-zinc-600 hover:text-zinc-200 hover:border hover:border-zinc-200 cursor-pointer text-sm font-medium w-1/2"
                            />
                        </div>
                    </div>
                    {error && <p className="text-red-500 text-sm pb-1">{error}</p>}
                </form>
                <div className="w-full md:w-2/3 lg:w-3/4">
                    {!refresh && (
                        <BillsHandler
                            emitUpdate={() => householdId && emitUpdate(householdId, 'bills')}
                            refresh={refresh}
                            setPage={handlePageChange}
                            page={page}
                        />
                    )}
                </div>
            </div>

            {showCalendar && (
                <DatePicker
                    selectedDate={selectedDate}
                    setSelectedDate={handleSelectDate}
                    handleShowCalendar={handleShowCalendar}
                />
            )}
        </>
    );
}
