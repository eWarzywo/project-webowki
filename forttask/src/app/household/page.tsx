'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import LogoutButton from '../../components/generalUI/logoutButton';

export default function Page() {
    return (
        <div className="flex justify-center items-center w-full px-4 py-8 sm:py-12 bg-zinc-950 relative">
            <div className="fixed bottom-4 left-4 z-10">
                <LogoutButton />
            </div>
            <div className="w-full max-w-5xl">
                <div className="text-center mb-6 sm:mb-8">
                    <div className="text-zinc-50 text-xl sm:text-2xl font-semibold font-['Inter'] mb-2">
                        Household Management
                    </div>
                    <div className="text-zinc-400 text-sm font-normal font-['Inter']">
                        Create a new household or join an existing one
                    </div>
                </div>
                <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 justify-center items-center lg:items-stretch">
                    <div className="w-full max-w-sm bg-zinc-900 border-zinc-800 border rounded-[6px] p-4 sm:p-6 flex flex-col">
                        <div className="flex justify-center items-center gap-2.5 mb-2">
                            <div className="text-zinc-50 text-lg sm:text-xl font-semibold font-['Inter']">
                                Create Household
                            </div>
                        </div>
                        <div className="text-center text-zinc-400 text-xs sm:text-sm font-normal font-['Inter'] mb-4 sm:mb-6">
                            You will become an owner of new household with full administrative privileges.
                        </div>
                        <div className="mt-auto w-full">
                            <AddHousehold />
                        </div>
                    </div>
                    <div className="w-full max-w-sm bg-zinc-900 border-zinc-800 border rounded-[6px] p-4 sm:p-6 flex flex-col">
                        <div className="flex justify-center items-center gap-2.5 mb-2">
                            <div className="text-zinc-50 text-lg sm:text-xl font-semibold font-['Inter']">
                                Join Household
                            </div>
                        </div>
                        <div className="text-center text-zinc-400 text-xs sm:text-sm font-normal font-['Inter'] mb-4 sm:mb-6">
                            You are required to have a join code provided by the household owner to connect to an
                            existing group.
                        </div>
                        <div className="mt-auto w-full">
                            <JoinHousehold />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export function AddHousehold() {
    const router = useRouter();
    const { data: session, update } = useSession();
    const [householdName, setHouseholdName] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!householdName) {
            setError('Please enter a household name');
            return;
        }
        if (householdName.length < 3) {
            setError('Household name must be at least 3 characters long');
            return;
        }

        setIsLoading(true);
        setError('');
        setSuccess(false);

        try {
            const response = await fetch('/api/household/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ householdName }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to create household');
            }

            setSuccess(true);

            await update({
                ...session,
                householdId: data.household.id.toString(),
            });

            setTimeout(() => {
                router.push('/');
            }, 1500);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create household');
        } finally {
            setIsLoading(false);
        }
    };
    return (
        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-2.5">
            <input
                type="text"
                value={householdName}
                onChange={(e) => setHouseholdName(e.target.value)}
                placeholder="Enter household name"
                className="h-10 px-4 w-full text-zinc-400 text-sm font-normal font-['Inter'] bg-zinc-950 border border-zinc-800 rounded-[6px] focus:outline-none focus:ring-1 focus:ring-zinc-600"
                disabled={isLoading || success}
            />
            <button
                type="submit"
                disabled={isLoading || success}
                className={`h-10 w-full px-4 text-zinc-900 text-sm font-normal font-['Inter'] bg-zinc-50 border rounded-[6px] hover:bg-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed`}
            >
                {isLoading ? 'Creating...' : success ? 'Created!' : 'Create Household'}
            </button>
            {error && <div className="text-sm font-normal font-['Inter'] text-red-500 mt-2">{error}</div>}
            {success && (
                <div className="text-sm font-normal font-['Inter'] text-green-500 mt-2">
                    Household created successfully! Redirecting...
                </div>
            )}
        </form>
    );
}

export function JoinHousehold() {
    const router = useRouter();
    const { data: session, update } = useSession();
    const [joinCode, setJoinCode] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!joinCode) {
            setError('Please enter a join code');
            return;
        }

        setIsLoading(true);
        setError('');
        setSuccess(false);

        try {
            const response = await fetch('/api/household/join', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ joinCode }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to join household');
            }

            setSuccess(true);

            await update({
                ...session,
                householdId: data.household.id.toString(),
            });

            setTimeout(() => {
                router.push('/');
            }, 1500);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to join household');
        } finally {
            setIsLoading(false);
        }
    };
    return (
        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-2.5">
            <input
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="Enter join code"
                className="h-10 px-4 w-full text-zinc-400 text-sm font-normal font-['Inter'] bg-zinc-950 border border-zinc-800 rounded-[6px] focus:outline-none focus:ring-1 focus:ring-zinc-600"
                disabled={isLoading || success}
                maxLength={8}
            />
            <button
                type="submit"
                disabled={isLoading || success}
                className={`h-10 w-full px-4 text-zinc-900 text-sm font-normal font-['Inter'] bg-zinc-50 border rounded-[6px] hover:bg-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed`}
            >
                {isLoading ? 'Joining...' : success ? 'Joined!' : 'Join Household'}
            </button>
            {error && <div className="text-sm font-normal font-['Inter'] text-red-500 mt-2">{error}</div>}
            {success && (
                <div className="text-sm font-normal font-['Inter'] text-green-500 mt-2">
                    Successfully joined household! Redirecting...
                </div>
            )}
        </form>
    );
}
