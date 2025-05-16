import React from "react";
import { createRoot } from "react-dom/client";

type User = {
    id: number;
    username: string;
}

type Chore = {
    id: number;
    name: string;
    description: string;
    dueDate: Date;
    createdById: number;
    priority: number;
    done: boolean;
    doneById?: number;
    doneBy?: User;
}

type ChoreCardProps = {
    chore: Chore;
    emitUpdate?: () => void;
}

type DetailsBoxProps = {
    name: string;
    description: string;
    dueDate: Date;
    priority: number;
    doneBy: string;
    onClose: () => void;
}

type ConfirmationBoxProps = {
    choreName: string;
    onConfirm: () => void;
    onCancel: () => void;
}

function ConfirmationBox({ choreName, onConfirm, onCancel }: ConfirmationBoxProps) {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-zinc-900 text-zinc-100 rounded-xl p-6 w-1/4 relative">
                <h2 className="text-xl font-semibold mb-4">Confirm Reverse of Completion</h2>
                <p className="mb-6">Are you sure you want to mark <b>{choreName}</b> as not done?</p>

                <div className="flex justify-center gap-4">
                    <button
                        onClick={onCancel}
                        className="px-6 py-2 bg-zinc-700 text-zinc-100 hover:bg-zinc-600 transition-colors rounded-xl"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className="px-6 py-2 bg-red-600 text-white hover:bg-red-700 transition-colors rounded-xl"
                    >
                        Uncomplete
                    </button>
                </div>

                <button
                    className="absolute top-4 right-4 text-gray-300 hover:text-white"
                    onClick={onCancel}
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                        />
                    </svg>
                </button>
            </div>
        </div>
    );
}

function DetailsBox({ name, description, dueDate, priority, doneBy, onClose }: DetailsBoxProps) {
    const dateObject = new Date(dueDate);

    const formattedDate = dateObject.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-zinc-900 text-zinc-100 rounded-xl p-6 w-1/3 relative">
                <h2 className="text-2xl font-semibold mb-3">{name}</h2>
                <p className="mb-2">{description}</p>
                <p className="mb-2">Due date: {formattedDate}</p>
                <p className="mb-2">Priority: {priority}</p>
                <p className="mb-2">Done by: {doneBy}</p>

                <button
                    className="absolute top-4 right-4 text-gray-300 hover:text-white"
                    onClick={onClose}
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                        />
                    </svg>
                </button>
            </div>
        </div>
    );
}

export default function ChoreDoneCard({ chore, emitUpdate }: ChoreCardProps) {
    const dateObject = new Date(chore.dueDate);

    const formattedDate = dateObject.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    const handleUndone = (e: React.MouseEvent) => {
        e.stopPropagation();

        const confirmationBox = document.createElement('div');
        document.body.appendChild(confirmationBox);

        const root = createRoot(confirmationBox);
        root.render(
            <ConfirmationBox
                choreName={chore.name}
                onConfirm={async () => {
                    root.unmount();
                    document.body.removeChild(confirmationBox);

                    try {
                        const response = await fetch(`/api/chore/undone`, {
                            method: 'PUT',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({ choreId: chore.id }),
                        });

                        if (!response.ok) {
                            throw new Error('Failed to mark chore as undone');
                        }

                        if (emitUpdate) {
                            emitUpdate();
                        }
                    } catch (error) {
                        console.error('Error marking chore as undone:', error);
                    }
                }}
                onCancel={() => {
                    root.unmount();
                    document.body.removeChild(confirmationBox);
                }}
            />
        );
    }

    const showDetails = () => {
        const detailsBox = document.createElement('div');
        document.body.appendChild(detailsBox);

        const root = createRoot(detailsBox);
        root.render(
            <DetailsBox
                name={chore.name}
                description={chore.description}
                dueDate={chore.dueDate}
                priority={chore.priority}
                doneBy={chore.doneBy?.username || 'Unknown'}
                onClose={() => {
                    root.unmount();
                    document.body.removeChild(detailsBox);
                }}
            />
        );
    }

    return (
        <div
            className="flex w-full h-fit gap-2 border border-zinc-800 bg-zinc-950 rounded-xl p-4 cursor-pointer hover:bg-zinc-900 transition-colors"
            key={chore.id}
            onClick={showDetails}
        >
            <div className="flex flex-col w-4/5">
                <h2 className="text-lg font-semibold text-zinc-100">{chore.name}</h2>
                <p className="text-zinc-400 text-sm">Due: {formattedDate}</p>
            </div>
            <div className="flex flex-col w-1/5 justify-center">
                <input
                    type="button"
                    value="Mark as not done"
                    onClick={handleUndone}
                    className="bg-red-600 text-white px-4 py-2 rounded-xl gap-2.5 hover:bg-red-700 cursor-pointer text-sm font-medium"
                />
            </div>
        </div>
    );
}