'use client';

import React from 'react';
import Calendar from '@/components/generalUI/calendar';

export default function Bills() {
    const [showCalendar, setShowCalendar] = React.useState(false);
    const [selectedDate, setSelectedDate] = React.useState<Date | null>(null);

    const handleShowCalendar = () => {
        setShowCalendar(!showCalendar);
    };

    return (
        <>
            <div className="flex w-full self-stretch gap-[10px]">
                <form
                    id="bills-form"
                    className="gap-0 self-start w-1/6 flex flex-col items-center rounded-xl border border-zinc-800 bg-zinc-950"
                >
                    <div className="flex p-6 flex-col items-start justify-start w-full">
                        <h3 className="text-zinc-50 flex text-2xl font-semibold">Add new bill</h3>
                        <h4 className="text-zinc-400 mt-1.5 text-sm">Add an upcoming bill to pay</h4>
                    </div>
                    <div className="px-6 pb-6 space-y-4 flex flex-col items-start">
                        <div className="flex flex-col items-start justify-start w-full gap-2.5 mt-1.5">
                            <label className="text-zinc-50 text-sm px-1" htmlFor="name">
                                Name
                            </label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                placeholder="Name of the bill"
                                className="py-2 pl-3 pr-5 border bg-zinc-950 border-zinc-800 placeholder:text-zinc-400 rounded-xl focus:border-zinc-400 focus:outline-none"
                            />
                        </div>
                        <div className="flex flex-col items-start justify-start w-full mt-1.5 gap-2.5 ">
                            <label className="text-zinc-50 text-sm px-1" htmlFor="cost">
                                Cost
                            </label>
                            <div
                                id="costdiv"
                                className="costInput py-2 px-3 border bg-zinc-950 border-zinc-800 rounded-xl flex items-center justify-between"
                            >
                                <input
                                    type="number"
                                    id="cost"
                                    name="cost"
                                    placeholder="Cost of the bill"
                                    min="0.1"
                                    step="0.1"
                                    className="bg-zinc-950 no-spinner focus:border-none focus:outline-none"
                                />
                                <span className="text-zinc-400">$</span>
                            </div>
                        </div>
                        <div className="flex flex-col items-start justify-start w-full mt-1.5 gap-2.5 ">
                            <label className="text-zinc-50 text-sm px-1" htmlFor="cost">
                                Due to
                            </label>
                            <div
                                onClick={handleShowCalendar}
                                className="w-full border rounded-xl gap-2.5 px-6 py-2 border-zinc-800 flex max-h-10 min-h-10 flex-col justify-center items-center hover:bg-zinc-800 hover:border-zinc-400 text-zinc-50 font-medium text-sm cursor-pointer"
                            >
                                Pick date
                            </div>
                        </div>
                        <div className=" flex w-full gap-[10px] justify-between items-center">
                            <input
                                type="reset"
                                value="Cancel"
                                className="border rounded-xl gap-2.5 px-6 py-2 border-zinc-800 flex max-h-10 min-h-10 flex-col justify-center items-center hover:bg-zinc-800 hover:border-zinc-400 text-zinc-50 font-medium text-sm cursor-pointer"
                            />
                            <input
                                type="submit"
                                value="Add"
                                className="bg-zinc-50 text-zinc-900 px-6 py-2 rounded-xl gap-2.5 hover:bg-zinc-600 hover:text-zinc-200 hover:border hover:border-zinc-200 cursor-pointer text-sm font-medium"
                            />
                        </div>
                    </div>
                </form>
            </div>

            {showCalendar && (
                <div className="fixed inset-0 bg-zinc-950 bg-opacity-50 flex flex-col items-center justify-center z-50">
                    <div className="bg-zinc-950 rounded-xl p-6 w-96 flex flex-col items-center justify-center border border-zinc-800">
                        <Calendar />
                        <div className="mt-2 text-zinc-50 text-sm">
                            {selectedDate ? selectedDate.toLocaleDateString() : 'No date selected'}
                        </div>
                        <div className="flex justify-between items-center gap-4 mt-2 w-full px-3">
                            <button className="w-1/2 rounded-xl px-4 py-2 transition bg-blue-600 hover:bg-blue-500">
                                Select
                            </button>
                            <button
                                onClick={handleShowCalendar}
                                className="w-1/2 rounded-xl px-4 py-2 bg-zinc-700 hover:bg-zinc-600 transition"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
