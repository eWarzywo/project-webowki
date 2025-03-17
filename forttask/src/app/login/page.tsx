'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function Page() {
    return (
        <div className="flex justify-center items-center w-full pt-6 pb-8 px-8 h-full border-zinc-800 border rounded-[6px]">
            <div className="px-32 flex-col items-center">
                <div className="flex items-center justify-center flex-wrap flex-col">
                    <div className="self-stretch inline-flex flex-col justify-start items-center">
                        <div className="inline-flex justify-center items-center gap-2.5">
                            <div className="justify-start text-zinc-50 text-2xl font-semibold font-['Inter']">
                                Login
                            </div>
                        </div>
                        <div className="self-stretch pt-2 flex flex-col justify-start items-start gap-2.5">
                            <div className="self-stretch inline-flex justify-center items-center gap-2.5">
                                <div className="justify-start text-zinc-400 text-sm font-normal font-['Inter']">
                                    Enter your email below to login
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="w-full flex flex-col justify-center items-center gap-2.5 mt-6 space-y-2">
                        <Form />
                        <button className="self-stretch inline-flex justify-center items-center h-10 w-full px-4 py-2 text-zinc-50 text-sm font-normal font-['Inter'] bg-zinc-950 border border-zinc-800 rounded-[6px] hover:bg-zinc-800">
                            Sign Up
                        </button>
                    </div>
                    <div className="flex flex-col self-stretch px-8 mt-6 gap-2.5">
                        <div className="self-stretch text-center justify-center font-['Inter'] font-normal text-sm text-zinc-400">
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
                router.push('/dashboard'); // Redirect to dashboard after successful login
            }
        } catch (error) {
            setError('An error occurred during login');
            console.error('Login error:', error);
        } finally {
            setIsLoading(false);
        }
    };
    return (
        <form onSubmit={handleSubmit} className="self-stretch inline-flex flex-col justify-start items-start gap-2.5">
            <div className="w-full self-stretch inline-flex flex-col justify-start items-start gap-2.5">
                <div className=" w-full self-stretch inline-flex flex-col justify-start items-start gap-2.5">
                    <input
                        type="text"
                        value={username}
                        placeholder="Email"
                        onChange={(e) => setUsername(e.target.value)}
                        className="self-stretch inline-flex justify-start items-center h-10 px-4 w-full text-zinc-400 text-sm font-normal font-['Inter'] bg-zinc-950 border border-zinc-800 rounded-[6px]"
                    />
                </div>
                <div className="self-stretch inline-flex flex-col justify-start items-start gap-2.5">
                    <input
                        type="password"
                        value={password}
                        placeholder="Password"
                        onChange={(e) => setPassword(e.target.value)}
                        className="self-stretch inline-flex justify-start items-center h-10 w-full px-4 text-zinc-400 text-sm font-normal font-['Inter'] bg-zinc-950 border border-zinc-800 rounded-[6px]"
                    />
                </div>
            </div>
            <div className="self-stretch inline-flex justify-start items-start">
                <button
                    type="submit"
                    disabled={isLoading}
                    className="self-stretch inline-flex justify-center items-center h-10 w-full px-4 text-zinc-900 text-sm font-normal font-['Inter'] bg-zinc-50 border rounded-[6px] hover:bg-zinc-100"
                >
                    {isLoading ? 'Loading...' : 'Login'}
                </button>
            </div>
            {error && (
                <div className="self-stretch inline-flex justify-start items-start">
                    <div className="justify-start text-sm font-normal font-['Inter'] text-red-500">{error}</div>
                </div>
            )}
        </form>
    );
}