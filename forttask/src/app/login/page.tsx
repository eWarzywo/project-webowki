'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function Page() {
    const router = useRouter();
    return (
        <div className="flex justify-center items-center w-full px-4 py-8 sm:py-12 bg-zinc-950">
            <div className="w-full max-w-md bg-zinc-900 border-zinc-800 border rounded-[6px] p-6 sm:p-8 flex flex-col items-center">
                <div className="w-full flex flex-col items-center">
                    <div className="w-full flex flex-col items-center">
                        <div className="flex justify-center items-center gap-2.5">
                            <div className="text-zinc-50 text-2xl font-semibold font-['Inter']">Login</div>
                        </div>
                        <div className="w-full pt-2 flex flex-col items-center gap-2.5">
                            <div className="text-zinc-400 text-sm font-normal font-['Inter'] text-center">
                                Enter your email below to login
                            </div>
                        </div>
                    </div>
                    <div className="w-full flex flex-col items-center gap-2.5 mt-6">
                        <Form />
                        <button
                            onClick={() => router.push('/signup')}
                            className="w-full h-10 px-4 py-2 text-zinc-50 text-sm font-normal font-['Inter'] bg-zinc-950 border border-zinc-800 rounded-[6px] hover:bg-zinc-800"
                        >
                            Sign Up
                        </button>
                    </div>
                    <div className="w-full mt-6">
                        <div className="text-center font-['Inter'] font-normal text-sm text-zinc-400">
                            <span>By clicking continue, you agree to our </span>
                            <span className="underline">Terms of Service</span>
                            <span> and </span>
                            <span className="underline">Privacy Policy</span>
                            <span>.</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function Form() {
    const router = useRouter();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!username || !password) {
            setError('Please enter both username and password');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            const result = await signIn('credentials', {
                username,
                password,
                redirect: false,
            });

            if (result?.error) {
                setError('Invalid username or password');
            } else {
                router.push('/');
            }
        } catch (error) {
            setError('An error occurred during login');
            console.error('Login error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-2.5">
            <div className="w-full flex flex-col gap-2.5">
                <input
                    type="text"
                    value={username}
                    placeholder="Username or Email"
                    onChange={(e) => setUsername(e.target.value)}
                    className="h-10 px-4 w-full text-zinc-400 text-sm font-normal font-['Inter'] bg-zinc-950 border border-zinc-800 rounded-[6px]"
                />
                <input
                    type="password"
                    value={password}
                    placeholder="Password"
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-10 w-full px-4 text-zinc-400 text-sm font-normal font-['Inter'] bg-zinc-950 border border-zinc-800 rounded-[6px]"
                />
            </div>
            <button
                type="submit"
                disabled={isLoading}
                className="h-10 w-full px-4 text-zinc-900 text-sm font-normal font-['Inter'] bg-zinc-50 border rounded-[6px] hover:bg-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isLoading ? 'Loading...' : 'Login'}
            </button>
            {error && (
                <>
                    <div className="mt-2 w-full"></div>
                    <div className="text-sm font-normal font-['Inter'] text-red-500">{error}</div>
                </>
            )}
        </form>
    );
}
