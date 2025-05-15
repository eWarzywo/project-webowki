'use client';
import React, { useEffect, useState } from 'react';
import ShoppingListHandler from '@/components/shoppingList/shoppingListHandler';
import { useSocket } from '@/lib/socket';

export default function Shopping() {
    const [addedToggle, setAddedToggle] = useState<boolean>(false);
    const [errorMessage, setErrorMessage] = useState<string>('');

    React.useEffect(() => {
        setAddedToggle(false);
    }, [addedToggle]);

    const [householdId, setHouseholdId] = useState<number | null>(null);
    const { isConnected, socketRefresh, emitUpdate, joinHousehold, leaveHousehold } = useSocket();

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
        setAddedToggle(!addedToggle);
    }, [socketRefresh]);

    function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const name = formData.get('name') as string;
        const cost = parseFloat(formData.get('cost') as string);

        setErrorMessage('');
        if (name.trim().length < 3) {
            setErrorMessage('Name must be at least 3 characters');
            return;
        }
        if (isNaN(cost) || cost <= 0) {
            setErrorMessage('Cost must be a positive number');
            return;
        }
        if (cost < 0.1) {
            setErrorMessage('Cost must be at least $0.1');
            return;
        }

        if (!isNaN(cost) && cost > 0 && name.trim().length >= 3) {
            try {
                fetch('/api/shoppingList', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        name: name.trim(),
                        cost: parseFloat(cost.toString()),
                    }),
                })
                    .then((res) => {
                        if (res.status === 201) {
                            return res.json();
                        } else {
                            throw new Error('Failed to create shopping item');
                        }
                    })
                    .then((data) => {
                        console.log('Shopping item created:', data);
                        if (householdId) {
                            emitUpdate(householdId);
                        }
                    })
                    .catch((error) => {
                        console.error('Error creating shopping item:', error);
                    });
            } catch (error) {
                console.error('Error creating shopping item:', error);
            }
            setAddedToggle(!addedToggle);
            setName('');
            setCost(undefined);
        }
    }

    const [name, setName] = useState<string>('');
    const [cost, setCost] = useState<number>();

    return (
        <>
            <div className="flex w-full self-stretch gap-[10px]">
                <form
                    id="shopping-form"
                    autoComplete="off"
                    autoCorrect="off"
                    onSubmit={handleSubmit}
                    className="gap-0 self-start w-1/6 flex flex-col items-center rounded-xl border border-zinc-800 bg-zinc-950 max-h-[400px]"
                >
                    <div className="flex p-6 flex-col items-start justify-start w-full">
                        <h3 className="text-zinc-50 flex text-2xl font-semibold">Add new item</h3>
                        <h4 className="text-zinc-400 mt-1.5 text-sm">Add a new item to your shopping list</h4>
                    </div>
                    <div className="px-6 pb-6 space-y-4 flex flex-col items-start">
                        <div className="flex flex-col items-start justify-start w-full gap-2.5 mt-1.5">
                            <label className="text-zinc-50 text-sm px-1" htmlFor="name">
                                Name
                            </label>
                            <input
                                onChange={(e) => setName(e.target.value)}
                                value={name}
                                type="text"
                                id="name"
                                name="name"
                                placeholder="Name of the item"
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
                                    onChange={(e) => setCost(parseFloat(e.target.value))}
                                    value={cost ? cost : ''}
                                    type="number"
                                    id="cost"
                                    name="cost"
                                    placeholder="Cost of the item"
                                    min="0.1"
                                    step="0.1"
                                    className="bg-zinc-950 no-spinner focus:border-none focus:outline-none"
                                />
                                <span className="text-zinc-400">$</span>
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
                        <div id="error" className="text-red-500 text-sm">
                            {errorMessage}
                        </div>
                    </div>
                </form>
                {!addedToggle && <ShoppingListHandler emitUpdate={() => householdId && emitUpdate(householdId)} />}
            </div>
        </>
    );
}
