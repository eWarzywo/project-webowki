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
        router.push('/dashboard');
    };

    return (
        <div className="font-['Inter'] flex justify-center items-center w-full pt-6 pb-8 px-8 h-full border-zinc-800 border rounded-[6px]">
            <div className="px-8 md:px-32 flex-col items-center">
                <div className="flex items-center justify-center flex-wrap flex-col">
                    <h1 className="mb-6 justify-start text-zinc-50 text-2xl font-semibold font-['Inter']">Logout</h1>
                    <p className="mb-6 text-center justify-start text-zinc-400 text-sm font-normal font-['Inter']">Are you sure you want to log out?</p>
                    
                    <div className="flex gap-4">
                        <button
                            onClick={handleLogout}
                            disabled={isLoggingOut}
                            className="px-4 py-2 bg-red-600 font-['Inter'] text-white hover:bg-red-700 transition disabled:opacity-50 rounded-[6px]"
                        >
                            {isLoggingOut ? 'Logging out...' : 'Log out'}
                        </button>
                        
                        <button
                            onClick={handleCancel}
                            className="px-4 py-2 bg-zinc-50 font-['Inter'] text-gray-800 hover:bg-zinc-100 transition rounded-[6px]"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

