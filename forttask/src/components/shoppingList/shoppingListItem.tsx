'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import ConfirmationBox from '../generalUI/confirmation';

interface ShoppingListItemProps {
    id: number;
    name: string;
    cost: number;
    userName: string;
    boughtBy: { username: string } | null;
    updatedAt: string | null;
}

function DetailsBox({
    name,
    cost,
    userName,
    boughtBy,
    updatedAt,
    onClose,
    onUnBought,
}: ShoppingListItemProps & { onClose: () => void; onUnBought: () => void }) {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-zinc-900 text-white rounded-xl shadow-lg p-6 w-96">
                <h2 className="text-lg font-semibold mb-4">Item Details</h2>
                <p className="text-zinc-400 mb-6">Item name: {name}</p>
                <p className="text-zinc-400 mb-6">Cost: {cost}$</p>
                <p className="text-zinc-400 mb-6">Added by: {userName}</p>
                <p className="text-zinc-400 mb-6">Bought by: {boughtBy?.username || 'Not bought yet'}</p>
                <p className="text-zinc-400 mb-6">
                    Bought at: {updatedAt ? new Date(updatedAt).toLocaleString() : 'N/A'}
                </p>
                <div className="flex justify-between gap-4">
                    <button onClick={onUnBought} className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-500 transition">
                        Mark as Unbought
                    </button>
                    <button onClick={onClose} className="px-4 py-2 rounded bg-zinc-700 hover:bg-zinc-600 transition">
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function ShoppingListItem({ id, name, cost, userName, boughtBy, updatedAt }: ShoppingListItemProps) {
    const [showConfirm, setShowConfirm] = useState(false);
    const [showDetails, setShowDetails] = useState(false);
    const [isBought, setIsBought] = useState(!!boughtBy);

    const toggleBoughtStatus = (url: string) => {
        fetch(url, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id }),
        })
            .then((response) => {
                if (!response.ok) throw new Error('Failed to update item status');
                return response.json();
            })
            .then(() => {
                setIsBought((prev) => !prev);
                if (showDetails) setShowDetails(false);
            })
            .catch((error) => console.error('Error updating item status:', error));
    };

    const handleDelete = () => {
        fetch(`/api/shoppingList?id=${id}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
        })
            .then((response) => {
                if (!response.ok) throw new Error('Failed to delete item');
                return response.json();
            })
            .then(() => window.location.reload())
            .catch((error) => console.error('Error deleting item:', error));
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
                            {!isBought ? (
                                <div
                                    onClick={() => toggleBoughtStatus(`/api/shoppingList/bought?id=${id}`)}
                                    className="hover:bg-zinc-100 border-2 border-zinc-200 rounded-[5px] size-5 cursor-pointer hover:scale-110 transition-transform duration-200 ease-in-out"
                                />
                            ) : (
                                <div
                                    onClick={() => setShowDetails(true)}
                                    className="bg-blue-600 text-zinc-50 rounded-[15px] size-6 flex justify-center items-center cursor-pointer hover:scale-110 transition-transform duration-200 ease-in-out text-xl"
                                >
                                    ?
                                </div>
                            )}
                            <Image
                                onClick={() => setShowConfirm(true)}
                                src="/shopping-list-vector.svg"
                                alt="delete"
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
                <ConfirmationBox name={name} onCancel={() => setShowConfirm(false)} onConfirm={handleDelete} />
            )}

            {showDetails && (
                <DetailsBox
                    id={id}
                    name={name}
                    cost={cost}
                    userName={userName}
                    boughtBy={boughtBy}
                    updatedAt={updatedAt}
                    onClose={() => setShowDetails(false)}
                    onUnBought={() => toggleBoughtStatus(`/api/shoppingList/unbought?id=${id}`)}
                />
            )}
        </>
    );
}
