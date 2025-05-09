'use client';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

export default function LogoutButton() {
    const router = useRouter();
    const { data: session } = useSession();

    return (                
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
    </button>)
};