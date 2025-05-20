'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import LogoutButton from '../../components/generalUI/logoutButton';

export default function Page() {
    return (
        <div className="font-['Inter'] flex flex-col min-h-screen justify-center items-center w-full pt-6 pb-16 md:pb-8 px-2 sm:px-4 md:px-8 border-zinc-800 border rounded-[6px] relative">
            <div className="fixed sm:absolute bottom-4 left-4 z-10">
                <LogoutButton />
            </div>
            <div className="w-full max-w-5xl">
                <h2 className="text-xl sm:text-2xl font-semibold text-center text-zinc-50 mb-4 sm:mb-8">
                    Household Management
                </h2>
                <div className="flex flex-col gap-4 sm:gap-6 md:gap-8 md:flex-row flex-wrap justify-center items-stretch">
                    <div className="border-zinc-800 border rounded-[6px] p-4 sm:p-6 md:p-8 flex flex-col w-full max-w-md min-w-0 flex-1">
                        <h3 className="text-base sm:text-lg md:text-xl font-semibold mb-2 sm:mb-4 text-zinc-50 text-center">
                            Create new household
                        </h3>
                        <p className="text-center text-zinc-400 text-xs sm:text-sm leading-relaxed mb-4 sm:mb-6">
                            You will become an owner of new household with full administrative privileges.
                        </p>
                        <div className="mt-auto w-full">
                            <AddHousehold />
                        </div>
                    </div>
                    <div className="border-zinc-800 border rounded-[6px] p-4 sm:p-6 md:p-8 flex flex-col w-full max-w-md min-w-0 flex-1">
                        <h3 className="text-base sm:text-lg md:text-xl font-semibold mb-2 sm:mb-4 text-zinc-50 text-center">
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
