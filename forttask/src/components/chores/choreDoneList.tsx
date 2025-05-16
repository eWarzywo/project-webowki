'use client';
import Pagination from "@/components/generalUI/pagination";
import { useEffect} from 'react';
import { useSearchParams } from "next/navigation";
import ChoreDoneCard from "@/components/chores/choreDoneCard";

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

type ChoreListProps = {
    chores: Chore[];
    loading?: boolean;
    error?: Error | null;
    setPage?: (page: number) => void;
    totalItems: number;
    emitUpdate?: () => void;
    toggle?: () => void;
}

export default function ChoreToDoList({ toggle, chores, loading, error, setPage, totalItems, emitUpdate }: ChoreListProps) {
    const searchParams = useSearchParams();
    const currentPage = parseInt(searchParams.get('page') || '1', 10);

    const doneChores = chores ? chores.filter(chore => chore.done) : [];

    useEffect(() => {
        if (setPage) {
            setPage(currentPage);
        }
    }, [searchParams, setPage]);

    return (
        <div className="flex w-full h-fit flex-col border border-zinc-800 bg-zinc-950 rounded-xl p-6">
            <p className="text-zinc-50 text-2xl font-semibold w-full text-center">Chores done list</p>
            <p className="text-zinc-400 mt-1.5 text-sm pb-4 text-center">Click on any chore to see more details</p>
            <div className="flex justify-center items-center mb-4">
                <button
                    onClick={toggle}
                    className="px-4 py-2 bg-zinc-700 text-zinc-100 hover:bg-zinc-600 transition-colors rounded-xl"
                >
                    Toggle between lists
                </button>
            </div>
            <div className="flex w-full h-fit flex-col gap-2">
                {loading ? (
                    <p className="text-zinc-400 text-center">Loading...</p>
                ) : error ? (
                    <p className="text-zinc-400 text-center">Error: {error.message}</p>
                ) : doneChores.length > 0 ? (
                    doneChores.map((chore) => <ChoreDoneCard key={chore.id} chore={chore} emitUpdate={emitUpdate}/>)
                ) : (
                    <p className="text-zinc-400 text-center">No pending chores found</p>
                )}
            </div>
            {Math.ceil(totalItems / 5) > 1 && (
                <span className="flex justify-center items-center w-full mt-5">
                    <Pagination totalNumberOfItems={totalItems} itemsPerPage={5} key={`pagination-${currentPage}`}/>
                </span>
            )}
        </div>
    );
}