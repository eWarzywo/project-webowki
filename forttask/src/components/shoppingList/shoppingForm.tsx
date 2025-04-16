'use client';
import { useState } from 'react';

export default function ShoppingForm() {
    function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        alert('Form submitted!');
    }

    const [name, setName] = useState<string>('');
    const [cost, setCost] = useState<number>();

    return (
        <form
            onSubmit={handleSubmit}
            className="w-1/6 flex flex-col items-center rounded-xl border border-zinc-800 bg-zinc-950 max-h-96"
        >
            <div className="flex p-6 flex-col items-start justify-center">
                <h3 className="text-zinc-50 flex text-2xl font-semibold">Add new item</h3>
                <h4 className="text-zinc-400 mt-1.5 text-sm">Add a new item to your shopping list</h4>
            </div>
            <div className="px-6 pb-6 space-y-4 flex flex-col items-start">
                <div className="flex flex-col items-start justify-start w-full gap-2.5 mt-1.5">
                    <label className="text-zinc-50 text-sm" htmlFor="name">
                        Name
                    </label>
                    <input
                        onChange={(e) => setName(e.target.value)}
                        value={name}
                        type="text"
                        id="name"
                        placeholder="Name of the item"
                        className="py-2 pl-3 pr-5 border bg-zinc-950 border-zinc-800 placeholder:text-zinc-400 rounded-xl focus:border-zinc-400 focus:outline-none"
                    />
                </div>
                <div className="flex flex-col items-start justify-start w-full mt-1.5 gap-2.5 ">
                    <label className="text-zinc-50 text-sm" htmlFor="name">
                        Cost
                    </label>
                    <div className="costInput py-2 px-3 border bg-zinc-950 border-zinc-800 rounded-xl flex items-center justify-between">
                        <input
                            onChange={(e) => setCost(parseFloat(e.target.value))}
                            value={cost ? cost : ''}
                            type="number"
                            id="cost"
                            placeholder="Cost of the item"
                            min="0.1"
                            step="0.1"
                            className="bg-zinc-950 no-spinner focus:border-none focus:outline-none"
                        />

                        <span className="text-zinc-400">$</span>
                    </div>
                </div>
            </div>
            <div className="w-full flex justify-between px-6 pb-6 items-center">
                <input
                    type="reset"
                    value="Cancel"
                    className="border rounded-xl gap-2.5 px-4 py-2 border-zinc-800 flex max-h-10 min-h-10 flex-col justify-center items-center hover:bg-zinc-800 hover:border-zinc-400 text-zinc-50 font-medium text-sm cursor-pointer"
                />
                <input
                    type="submit"
                    value="Add"
                    className="bg-zinc-50 text-zinc-900 px-4 py-2 rounded-xl gap-2.5 hover:bg-zinc-600 hover:text-zinc-200 hover:border hover:border-zinc-200 cursor-pointer text-sm font-medium"
                />
            </div>
        </form>
    );
}
