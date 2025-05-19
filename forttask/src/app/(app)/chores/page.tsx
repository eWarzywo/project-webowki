'use client';
import React, { useState, useEffect } from 'react';
import ChoreAddForm from '@/components/chores/choreAddForm';
import ChoreToDoList from '@/components/chores/choreToDoList';
import ChoreDoneList from '@/components/chores/choreDoneList';
import ChoreLeaderboard from '@/components/chores/choreLeaderboard';
import { useSocket } from '@/lib/socket';
import { useRouter } from 'next/navigation';

type User = {
    id: number;
    username: string;
}

type Chores = {
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
}

export default function Chores() {
    const { isConnected, choresRefresh, emitUpdate, joinHousehold, leaveHousehold } = useSocket();
    const [householdId, setHouseholdId] = useState<number | null>(null);

    const [chores, setChores] = useState<Chores[]>([]);
    const [totalItems, setTotalItems] = useState(0);

    const [choreListToggle, setChoreListToggle] = useState(false);
    const [refresh, setRefresh] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const [page, setPage] = useState(1);
    const router = useRouter();

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
        const fetchTotalItems = async () => {
            try {
                const route = choreListToggle ? 'done' : 'todo';
                const response = await fetch(`/api/chores/${route}/get`);
                if (response.ok) {
                    const { count } = await response.json();
                    setTotalItems(count);
                } else {
                    console.error(`Failed to fetch total items, Status: ${response.status}`);
                }
            } catch (error) {
                console.error('Error fetching total items:', error);
            }
        }
        
        fetchTotalItems();
    }, [refresh, choreListToggle]);

    useEffect(() => {
        const fetchChores = async () => {
            setLoading(true);
            setError(null);

            try {
                const route = choreListToggle ? 'done' : 'todo';
                const response = await fetch(`/api/chores/${route}/get?limit=5&skip=${(page - 1) * 5}`);
                if (response.ok) {
                    const data = await response.json();
                    setChores(data.chores);
                } else {
                    console.error(`Failed to fetch chores, Status: ${response.status}`);
                }
            } catch (error) {
                console.error('Error fetching chores:', error);
                setError(error instanceof Error ? error : new Error('An unknown error occurred'));
            } finally {
                setLoading(false);
            }
        }

        fetchChores();
    }, [page, refresh, choreListToggle]);

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
        handleRefresh();
    }, [choresRefresh]);

    const handleRefresh = () => {
        setPage(1);
        router.push('?page=1');
        setRefresh(!refresh);
    };

    const handlePageChange = (newPage: number) => {
        setPage(newPage);
    };

    const handleChoreListToggle = () => {
        setChoreListToggle(!choreListToggle);
    }

    return (
        <>
            <div className="flex w-full self-stretch gap-[10px]">
                <ChoreLeaderboard refresh={refresh}/>
                {choreListToggle ? (
                    <ChoreDoneList toggle={handleChoreListToggle} chores={chores} loading={loading} error={error} setPage={handlePageChange} totalItems={totalItems} emitUpdate={() => householdId && emitUpdate(householdId, 'chores')}/>
                    ) : (
                    <ChoreToDoList toggle={handleChoreListToggle} chores={chores} loading={loading} error={error} setPage={handlePageChange} totalItems={totalItems} emitUpdate={() => householdId && emitUpdate(householdId, 'chores')}/>
                )}
                <ChoreAddForm onRefresh={handleRefresh} emitUpdate={() => householdId && emitUpdate(householdId, 'chores')}/>
            </div>
        </>
    );
}
