'use client';

import { signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function LogoutPage() {
    const router = useRouter();
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const handleLogout = async () => {
        setIsLoggingOut(true);
        try {
            await signOut({ redirect: false });
            router.push('/login');
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            setIsLoggingOut(false);
        }
    };

    const handleCancel = () => {
        router.push('/');
    };

    return (
        <div className="flex justify-center items-center w-full min-h-screen px-4 py-8 sm:py-12 bg-transparent">
            <div className="w-full max-w-md bg-zinc-900 border-zinc-800 border rounded-[6px] p-6 sm:p-8 flex flex-col items-center">
                <h1 className="mb-6 text-zinc-50 text-2xl font-semibold font-['Inter'] w-full text-center">Logout</h1>
                <p className="mb-6 text-center text-zinc-400 text-sm font-normal font-['Inter'] w-full">
                    Are you sure you want to log out?
                </p>
                <div className="flex flex-col sm:flex-row gap-4 w-full">
                    <button
                        onClick={handleLogout}
                        disabled={isLoggingOut}
                        className="flex-1 px-4 py-2 bg-red-600 font-['Inter'] text-white hover:bg-red-700 transition disabled:opacity-50 rounded-[6px]"
                    >
                        {isLoggingOut ? 'Logging out...' : 'Log out'}
                    </button>
                    <button
                        onClick={handleCancel}
                        className="flex-1 px-4 py-2 bg-zinc-50 font-['Inter'] text-gray-800 hover:bg-zinc-100 transition rounded-[6px]"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}
