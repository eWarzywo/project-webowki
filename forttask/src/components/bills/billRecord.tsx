'use client';
import React from 'react';
import ConfirmationBox from '../generalUI/confirmation';
import Image from 'next/image';

interface BillDetails {
    id: number;
    name: string;
    description: string;
    amount: number;
    cycle: number;
    dueDate: Date;
    createdAt: Date;
    updatedAt: Date;
    createdBy: {
        username: string;
    };
    paidBy: {
        username: string;
    };
    householdId: number;
}

function DetailsBox({ onCancel }: { onCancel: (value: boolean) => void }) {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-zinc-900 text-white rounded-xl shadow-lg p-6 w-96">
                <h2 className="text-lg font-semibold mb-4">Details</h2>
                <div className="flex justify-end gap-4">
                    <button
                        onClick={() => {
                            onCancel(false);
                        }}
                        className="px-4 py-2 rounded bg-zinc-700 hover:bg-zinc-600 transition"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}

interface BillRecordProps {
    id: number;
    name: string;
    cost: number;
    addedBy: string;
    onDelete: (id: number) => void;
}

export default function BillRecord({ id, onDelete, name, cost, addedBy }: BillRecordProps) {
    const [showConfirmation, setShowConfirmation] = React.useState(false);
    const [showDetails, setShowDetails] = React.useState(false);

    return (
        <>
            <div className="flex flex-col w-full gap-2.5 items-start py-4">
                <div className="flex justify-between w-full py-2">
                    <div className="text-zinc-50 w-1/3 flex justify-start items-center">
                        {name + ' - ' + cost + '$'}
                    </div>
                    <div className="text-zinc-400 w-1/3 flex justify-center items-center">Added by: {addedBy}</div>
                    <div className="w-1/3 flex justify-end items-center">
                        <span className="flex gap-2.5">
                            <Image
                                onClick={() => setShowDetails(!showDetails)}
                                src="/ArrowDown.svg"
                                alt="edit"
                                width={20}
                                height={20}
                                className="cursor-pointer hover:scale-110 transition-transform duration-200 ease-in-out"
                                style={{
                                    filter: 'invert(33%) sepia(100%) saturate(748%) hue-rotate(200deg) brightness(92%) contrast(92%)',
                                }}
                            />
                            <Image
                                onClick={() => setShowConfirmation(true)}
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

            {showConfirmation && (
                <ConfirmationBox
                    name={name}
                    onConfirm={() => {
                        onDelete(id);
                        setShowConfirmation(false);
                    }}
                    onCancel={() => setShowConfirmation(false)}
                />
            )}

            {showDetails && (
                <DetailsBox
                    onCancel={(value: boolean) => {
                        setShowDetails(value);
                    }}
                />
            )}
        </>
    );
}
