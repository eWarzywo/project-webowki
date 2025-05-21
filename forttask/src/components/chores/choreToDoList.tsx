'use client';
import Pagination from '@/components/generalUI/pagination';
import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import ChoreToDoCard from '@/components/chores/choreToDoCard';

type User = {
    id: number;
    username: string;
};

type Chore = {
    id: number;
    name: string;
    description: string;
    dueDate: Date;
    createdById: number;
    createdBy: User;
    priority: number;
    done: boolean;
    doneById?: number;
    doneBy?: User;
};

type ChoreListProps = {
    chores: Chore[];
    loading?: boolean;
    error?: Error | null;
    setPage?: (page: number) => void;
    totalItems: number;
    emitUpdate?: () => void;
    toggle?: () => void;
};

export default function ChoreToDoList({
    toggle,
    chores,
    loading,
    error,
    setPage,
    totalItems,
    emitUpdate,
}: ChoreListProps) {
    const searchParams = useSearchParams();
    const currentPage = parseInt(searchParams.get('page') || '1', 10);

    useEffect(() => {
        if (setPage) {
            setPage(currentPage);
        }
    }, [searchParams, setPage]);

    return (
        <div className="flex w-full max-w-2xl mx-auto h-fit flex-col border border-zinc-800 bg-zinc-950 rounded-xl p-4 sm:p-6">
            <p className="text-zinc-50 text-xl sm:text-2xl font-semibold w-full text-center">Chores ToDo list</p>
            <p className="text-zinc-400 mt-1.5 text-xs sm:text-sm pb-4 text-center">
                Click on any chore to see more details
            </p>
            <div className="flex justify-center items-center mb-4">
                <button
                    onClick={toggle}
                    className="px-3 py-2 sm:px-4 sm:py-2 bg-zinc-700 text-zinc-100 hover:bg-zinc-600 transition-colors rounded-xl text-xs sm:text-base"
                >
                    Toggle between lists
                </button>
            </div>
            <div className="flex w-full h-fit flex-col gap-2">
                {loading ? (
                    <p className="text-zinc-400 text-center">Loading...</p>
                ) : error ? (
                    <p className="text-zinc-400 text-center">Error: {error.message}</p>
                ) : chores.length > 0 ? (
                    chores.map((chore) => <ChoreToDoCard key={chore.id} chore={chore} emitUpdate={emitUpdate} />)
                ) : (
                    <p className="text-zinc-400 text-center">No pending chores found</p>
                )}
            </div>
            {Math.ceil(totalItems / 5) > 1 && (
                <span className="flex justify-center items-center w-full mt-5">
                    <Pagination totalNumberOfItems={totalItems} itemsPerPage={5} key={`pagination-${currentPage}`} />
                </span>
            )}
        </div>
    );
}
