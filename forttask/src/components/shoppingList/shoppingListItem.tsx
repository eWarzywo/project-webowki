'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import ConfirmationBox from '../generalUI/confirmation';

interface ShoppingListItemProps {
    id: number;
    handleDelete: () => void;
    emitUpdate?: () => void;
}

interface DetailsBoxProps {
    name: string;
    cost: number;
    userName: string;
    updatedAt: string | null;
    boughtBy: string | null;
    onClose: () => void;
    onUnBought: () => void;
}

function DetailsBox({ name, cost, userName, updatedAt, boughtBy, onClose, onUnBought }: DetailsBoxProps) {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-zinc-900 text-white rounded-xl shadow-lg p-6 w-11/12 max-w-md">
                <h2 className="text-lg font-semibold mb-4">Item Details</h2>
                <p className="text-zinc-400 mb-2">Item name: {name}</p>
                <p className="text-zinc-400 mb-2">Cost: {cost}$</p>
                <p className="text-zinc-400 mb-2">Added by: {userName}</p>
                <p className="text-zinc-400 mb-2">Bought by: {boughtBy || 'N/A'}</p>
                <p className="text-zinc-400 mb-4">
                    Bought at: {updatedAt ? new Date(updatedAt).toLocaleString() : 'N/A'}
                </p>
                <div className="flex flex-col sm:flex-row justify-between gap-4">
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

export default function ShoppingListItem({ id, handleDelete, emitUpdate }: ShoppingListItemProps) {
    const [showConfirm, setShowConfirm] = useState(false);
    const [showDetails, setShowDetails] = useState(false);
    const [data, setData] = useState<null | {
        id: number;
        name: string;
        cost: number;
        updatedAt: string | null;
        createdBy: { id: number; username: string };
        boughtBy: { id: number; username: string } | null;
    }>(null);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        try {
            const res = await fetch(`/api/shoppingList/details?id=${id}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
            });
            if (res.ok) {
                const item: {
                    id: number;
                    name: string;
                    cost: number;
                    updatedAt: string | null;
                    createdBy: { id: number; username: string };
                    boughtBy: { id: number; username: string } | null;
                } = await res.json();
                setData(item);
            } else {
                console.error('Failed to fetch item:', res.status);
            }
        } catch (error) {
            console.error('Error fetching item:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [id]);

    const toggleBoughtStatus = async (url: string) => {
        try {
            const res = await fetch(url, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id }),
            });
            if (!res.ok) throw new Error('Failed to toggle bought status');
            await fetchData();
            if (emitUpdate) {
                emitUpdate();
            }
            setShowDetails(false);
        } catch (error) {
            console.error('Error toggling status:', error);
        }
    };

    if (loading) return <div className="text-zinc-400">Loading...</div>;
    if (!data) return <div className="text-red-500">Item not found</div>;

    const isBought = !!data.boughtBy;

    return (
        <>
            <div className="w-full py-4">
                <div className="flex w-full justify-between items-center sm:hidden gap-2.5">
                    <div className="flex flex-col">
                        <div className="text-zinc-50 text-base break-words">
                            {data.name + (data.cost ? ` - ${data.cost}$` : '')}
                        </div>
                        <div className="text-zinc-400 text-sm">{`Added by ${data.createdBy.username}`}</div>
                    </div>
                    <div className="flex gap-4 items-center">
                        {!isBought ? (
                            <div
                                onClick={() => toggleBoughtStatus(`/api/shoppingList/bought?id=${id}`)}
                                className="hover:bg-zinc-100 border-2 border-zinc-200 rounded-[5px] h-5 w-5 cursor-pointer hover:scale-110 transition-transform duration-200 ease-in-out"
                            />
                        ) : (
                            <div
                                onClick={() => setShowDetails(true)}
                                className="bg-blue-600 text-zinc-50 rounded-[15px] h-6 w-6 flex justify-center items-center cursor-pointer hover:scale-110 transition-transform duration-200 ease-in-out text-xl"
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
                    </div>
                </div>
                <div className="hidden sm:flex flex-row w-full gap-2 sm:gap-0 sm:items-center">
                    <div className="text-zinc-50 w-full sm:w-1/3 flex justify-start items-center text-lg break-words">
                        {data.name + (data.cost ? ` - ${data.cost}$` : '')}
                    </div>
                    <div className="text-zinc-400 w-full sm:w-1/3 flex justify-start sm:justify-center items-center text-base">
                        {`Added by ${data.createdBy.username}`}
                    </div>
                    <div className="w-full sm:w-1/3 flex justify-start sm:justify-end items-center">
                        <span className="flex gap-4">
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
                <ConfirmationBox
                    name={data.name}
                    onCancel={() => setShowConfirm(false)}
                    onConfirm={() => {
                        handleDelete();
                        setShowConfirm(false);
                    }}
                />
            )}

            {showDetails && (
                <DetailsBox
                    name={data.name}
                    cost={data.cost}
                    userName={data.createdBy.username}
                    updatedAt={data.updatedAt}
                    boughtBy={data.boughtBy?.username || null}
                    onClose={() => setShowDetails(false)}
                    onUnBought={() => toggleBoughtStatus(`/api/shoppingList/unbought?id=${id}`)}
                />
            )}
        </>
    );
}
