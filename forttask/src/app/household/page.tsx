'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Image from 'next/image';

export default function Page() {
    const { data: session } = useSession();
    const router = useRouter();

    return (
        <div className="font-['Inter'] flex flex-col md:flex-row justify-center items-center w-full pt-6 pb-16 md:pb-8 px-4 sm:px-8 h-full border-zinc-800 border rounded-[6px] relative">
            <div className="fixed sm:absolute bottom-4 left-4 z-10">
                <button
                    onClick={() => router.push('/logout')}
                    className="group flex items-center gap-2 px-2.5 py-2 sm:px-3.5 sm:py-2.5 bg-red-800/80 hover:bg-zinc-700 active:bg-red-900/80 rounded-full text-xs font-medium text-zinc-300 hover:text-white transition-all duration-200 border border-transparent hover:border-red-800/30 shadow-sm"
                    aria-label="Logout"
                    title="Logout"
                >
                    <div className="relative flex items-center justify-center">
                        <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="text-red-400 group-hover:scale-110 transition-transform duration-200"
                        >
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                            <polyline points="16 17 21 12 16 7"></polyline>
                            <line x1="21" y1="12" x2="9" y2="12"></line>
                        </svg>
                        <div
                            className="absolute inset-0 bg-red-500/20 rounded-full opacity-0 group-hover:opacity-100 animate-pulse transition-opacity duration-300"
                            style={{ transform: 'scale(1.5)' }}
                        ></div>
                    </div>
                    <span className="hidden sm:inline">Logout</span>
                </button>
            </div>

            <div className="w-full max-w-5xl">
                <h2 className="text-2xl font-semibold text-center text-zinc-50 mb-4 sm:mb-8">Household Management</h2>
                <div className="flex flex-col sm:flex-row flex-wrap justify-center items-stretch gap-4 sm:gap-8">
                    <div className="border-zinc-800 border rounded-[6px] p-4 sm:p-8 flex flex-col w-full max-w-md">
                        <h3 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-4 text-zinc-50 text-center">
                            Create new household
                        </h3>
                        <p className="text-center text-zinc-400 text-xs sm:text-sm leading-relaxed mb-4 sm:mb-6">
                            You will become an owner of new household with full administrative privileges.
                        </p>
                        <div className="mt-auto w-full">
                            <AddHousehold />
                        </div>
                    </div>

                    <div className="border-zinc-800 border rounded-[6px] p-4 sm:p-8 flex flex-col w-full max-w-md">
                        <h3 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-4 text-zinc-50 text-center">
                            Join existing household
                        </h3>
                        <p className="text-center text-zinc-400 text-xs sm:text-sm leading-relaxed mb-4 sm:mb-6">
                            You are required to have a join code provided by the household owner to connect to an
                            existing group.
                        </p>
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
            console.log('Household created:', data.household);

            await update({
                ...session,
                householdId: data.household.id.toString(),
            });

            setTimeout(() => {
                router.push('/');
            }, 1500);
        } catch (err) {
            console.error(err);
            setError(err instanceof Error ? err.message : 'Failed to create household');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col w-full">
            <input
                type="text"
                value={householdName}
                onChange={(e) => setHouseholdName(e.target.value)}
                placeholder="Enter household name"
                className="border border-zinc-800 bg-zinc-950 text-zinc-400 rounded-[6px] p-3 mb-4 w-full focus:outline-none focus:ring-1 focus:ring-zinc-600"
                disabled={isLoading || success}
            />
            {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
            {success && <p className="text-green-500 text-sm mb-4">Household created successfully! Redirecting...</p>}
            <button
                type="submit"
                disabled={isLoading || success}
                className={`h-10 w-full px-4 py-2 text-zinc-50 text-sm font-medium bg-zinc-800 rounded-[6px] transition-colors ${
                    isLoading || success ? 'opacity-50 cursor-not-allowed' : 'hover:bg-zinc-700'
                }`}
            >
                {isLoading ? 'Creating...' : success ? 'Created!' : 'Create Household'}
            </button>
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
            console.log('Joined household:', data.household);

            await update({
                ...session,
                householdId: data.household.id.toString(),
            });

            setTimeout(() => {
                router.push('/');
            }, 1500);
        } catch (err) {
            console.error(err);
            setError(err instanceof Error ? err.message : 'Failed to join household');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col w-full">
            <input
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="Enter join code"
                className="border border-zinc-800 bg-zinc-950 text-zinc-400 rounded-[6px] p-3 mb-4 w-full focus:outline-none focus:ring-1 focus:ring-zinc-600"
                disabled={isLoading || success}
                maxLength={8}
            />
            {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
            {success && <p className="text-green-500 text-sm mb-4">Successfully joined household! Redirecting...</p>}
            <button
                type="submit"
                disabled={isLoading || success}
                className={`h-10 w-full px-4 py-2 text-zinc-50 text-sm font-medium bg-zinc-800 rounded-[6px] transition-colors ${
                    isLoading || success ? 'opacity-50 cursor-not-allowed' : 'hover:bg-zinc-700'
                }`}
            >
                {isLoading ? 'Joining...' : success ? 'Joined!' : 'Join Household'}
            </button>
        </form>
    );
}
