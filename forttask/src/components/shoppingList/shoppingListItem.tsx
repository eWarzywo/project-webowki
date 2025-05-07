'use client';

import React, { useState } from 'react';
import Image from 'next/image';

export default function ShoppingListItem({
    id,
    name,
    cost,
    userName,
    boughtById,
}: {
    id: number;
    name: string;
    cost: number;
    userName: string;
    boughtById: number | null;
}) {
    const [showConfirm, setShowConfirm] = useState(false);
    const [isBought, setIsBought] = useState(boughtById !== null);

    React.useEffect(() => {
        setIsBought(boughtById !== null);
    }, [boughtById]);

    const handleBought = () => {
        fetch(`/api/shoppingList/bought?id=${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ id }),
        })
            .then((response) => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then((data) => {
                console.log('Item bought:', data);
                setIsBought(!isBought);
            })
            .catch((error) => {
                console.error('Error marking item as bought:', error);
            });
    };

    const handleDelete = () => {
        setShowConfirm(true);
    };

    const confirmDelete = () => {
        setShowConfirm(false);
        fetch(`/api/shoppingList?id=${id}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ id }),
        })
            .then((response) => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then((data: any) => {
                console.log('Item deleted:', data);
                window.location.reload();
            })
            .catch((error: any) => {
                console.error('Error deleting item:', error);
            });
    };

    const cancelDelete = () => {
        setShowConfirm(false);
    };

    return (
        <>
            <div className="flex flex-col w-full gap-2.5 items-start py-4">
                <div className="flex justify-between w-full py-2">
                    <div className="text-zinc-50 w-1/3 flex justify-start items-center">
                        {name + (cost ? ` - ${cost}$` : '')}
                    </div>
                    <div className="text-zinc-400 w-1/3 flex justify-center items-center">{`Added by ${userName}`}</div>
                    <div className="w-1/3 flex justify-end items-center">
                        <span className="flex gap-2.5">
                            {!isBought && (
                                <div
                                    onClick={handleBought}
                                    className="hover:bg-zinc-100 border-2 border-zinc-200 rounded-[5px] size-5 cursor-pointer hover:scale-110 transition-transform duration-200 ease-in-out"
                                />
                            )}
                            <Image
                                onClick={handleDelete}
                                src="/shopping-list-vector.svg"
                                alt="close"
                                width={20}
                                height={20}
                                className="cursor-pointer hover:scale-110 transition-transform duration-200 ease-in-out"
                                style={{
                                    filter: 'invert(16%) sepia(91%) saturate(7496%) hue-rotate(0deg) brightness(96%) contrast(104%)',
                                }}
                            />
                        </span>
                    </div>
                </div>
            </div>

            {showConfirm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-zinc-900 text-white rounded-xl shadow-lg p-6 w-96">
                        <h2 className="text-lg font-semibold mb-4">Are you sure?</h2>
                        <p className="text-zinc-400 mb-6">
                            Do you really want to delete <span className="text-white font-bold">{name}</span> from the
                            list?
                        </p>
                        <div className="flex justify-end gap-4">
                            <button
                                onClick={cancelDelete}
                                className="px-4 py-2 rounded bg-zinc-700 hover:bg-zinc-600 transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDelete}
                                className="px-4 py-2 rounded bg-red-600 hover:bg-red-500 transition"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
