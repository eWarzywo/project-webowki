'use client';
import React from 'react';
import ConfirmationBox from '../generalUI/confirmation';
import Image from 'next/image';

interface BillDetails {
    name: string;
    createdAt: Date;
    householdId: number;
    description: string;
    amount: number;
    cycle: number;
    dueDate: Date;
    updatedAt: Date;
    createdBy: {
        username: string;
    };
    paidBy: {
        username: string;
    };
}

function DetailsBox({ id, onCancel }: { id: number; onCancel: (value: boolean) => void }) {
    const [details, setDetails] = React.useState<BillDetails | null>(null);
    const [loading, setLoading] = React.useState(true);
    const [reload, setReload] = React.useState(false);

    React.useEffect(() => {
        const fetchDetails = async () => {
            const response = await fetch(`/api/bill/details?id=${id}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                const data = await response.json();
                setDetails(data);
            } else {
                console.error('Failed to fetch bill details');
            }
            setLoading(false);
        };
        fetchDetails();
    }, [id, reload]);

    const handleMarkAsPaid = async (paid: boolean) => {
        const response = await fetch(`/api/bill/paidToggle`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ id, paid }),
        });

        if (response.ok) {
            console.log('Bill updated successfully');
        } else {
            console.error('Failed to update bill');
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-zinc-900 text-white rounded-xl shadow-lg p-6 w-[40rem]">
                {loading ? (
                    <div className="flex justify-center items-center h-full">
                        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500 border-solid"></div>
                    </div>
                ) : (
                    <>
                        <h2 className="text-3xl font-semibold mb-4 pl-2">Details of {details?.name} bill</h2>
                        {details?.description ? (
                            <p className="text-zinc-400 mb-2 pl-4">Description: {details.description}</p>
                        ) : (
                            <></>
                        )}
                        <p className="text-zinc-400 mb-2 text-xl pl-2">Cost: {details?.amount}$</p>
                        {details?.cycle ? (
                            <p className="text-zinc-400 mb-2 text-xl pl-2">
                                Repeated:{' '}
                                {details.cycle === 7
                                    ? 'Weekly'
                                    : details.cycle === 30 || details.cycle === 31
                                      ? 'Monthly'
                                      : details.cycle === 365 || details.cycle === 366
                                        ? 'Yearly'
                                        : ''}
                            </p>
                        ) : (
                            <></>
                        )}
                        <p className="text-zinc-400 mb-2 text-xl pl-2">Due date: {details?.dueDate.toString()}</p>
                        <p className="text-zinc-400 mb-2 text-xl pl-2">
                            Created at: {details?.createdAt ? new Date(details.createdAt).toLocaleDateString() : 'N/A'}
                        </p>
                        <p className="text-zinc-400 mb-2 text-xl pl-2">Created by: {details?.createdBy.username}</p>
                        {details?.paidBy ? (
                            <>
                                <p className="text-zinc-400 mb-2 text-xl pl-2">
                                    Paid at:{' '}
                                    {details?.updatedAt ? new Date(details.updatedAt).toLocaleDateString() : 'N/A'}
                                </p>
                                <p className="text-zinc-400 mb-2 text-xl pl-2">Paid by: {details?.paidBy.username}</p>
                            </>
                        ) : (
                            <p className="mb-2 text-xl text-red-500 pl-2">Not paid yet</p>
                        )}
                        <div className="flex justify-between w-full mt-4">
                            <button
                                onClick={() => {
                                    handleMarkAsPaid(!details?.paidBy);
                                    setReload(!reload);
                                    onCancel(false);
                                }}
                                className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-500 transition w-1/2 mr-2"
                            >
                                {details?.paidBy ? 'Mark as unpaid' : 'Mark as paid'}
                            </button>
                            <button
                                onClick={() => {
                                    onCancel(false);
                                }}
                                className="px-4 py-2 rounded bg-zinc-700 hover:bg-zinc-600 transition w-1/2"
                            >
                                Close
                            </button>
                        </div>
                    </>
                )}
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
                    id={id}
                    onCancel={(value: boolean) => {
                        setShowDetails(value);
                    }}
                />
            )}
        </>
    );
}
