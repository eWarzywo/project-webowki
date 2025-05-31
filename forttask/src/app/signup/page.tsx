'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Page() {
    const router = useRouter();
    return (
        <div className="flex justify-center items-end w-full px-4 py-8 sm:py-12 bg-zinc-950">
            <div className="w-full max-w-md bg-zinc-900 border-zinc-800 border rounded-[6px] p-6 sm:p-8 flex flex-col items-center">
                <div className="w-full flex flex-col items-center">
                    <div className="w-full flex flex-col items-center">
                        <div className="flex justify-center items-center gap-2.5">
                            <div className="text-zinc-50 text-2xl font-semibold font-['Inter']">Sign Up</div>
                        </div>
                        <div className="w-full pt-2 flex flex-col items-center gap-2.5">
                            <div className="text-zinc-400 text-sm font-normal font-['Inter'] text-center">
                                Create an account to get started
                            </div>
                        </div>
                    </div>
                    <div className="w-full flex flex-col items-center gap-2.5 mt-6">
                        <SignupForm />
                        <button
                            onClick={() => router.push('/login')}
                            className="w-full h-10 px-4 py-2 text-zinc-50 text-sm font-normal font-['Inter'] bg-zinc-950 border border-zinc-800 rounded-[6px] hover:bg-zinc-800"
                        >
                            Log In
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

function SignupForm() {
    const router = useRouter();
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!firstName || !lastName || !email || !password) {
            setError('Please fill in all fields');
            return;
        }
        if (firstName.length < 2 || lastName.length < 2) {
            setError('First and last names must be at least 2 characters long');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setError('Please enter a valid email address');
            return;
        }

        if (password.length < 8) {
            setError('Password must be at least 8 characters long');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            const response = await fetch('/api/user', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    firstName,
                    lastName,
                    email,
                    password,
                }),
            });

            const rawText = await response.text();

            let data;
            try {
                data = JSON.parse(rawText);
            } catch {
                throw new Error('Invalid response from server');
            }

            if (!response.ok) {
                throw new Error(data.message || 'Something went wrong');
            }

            router.push('/login');
        } catch (error) {
            setError(error instanceof Error ? error.message : 'An error occurred during sign up');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-2.5">
            <div className="w-full flex flex-col gap-2.5">
                <input
                    type="text"
                    value={firstName}
                    placeholder="First Name"
                    onChange={(e) => setFirstName(e.target.value)}
                    className="h-10 px-4 w-full text-zinc-400 text-sm font-normal font-['Inter'] bg-zinc-950 border border-zinc-800 rounded-[6px]"
                />
                <input
                    type="text"
                    value={lastName}
                    placeholder="Last Name"
                    onChange={(e) => setLastName(e.target.value)}
                    className="h-10 px-4 w-full text-zinc-400 text-sm font-normal font-['Inter'] bg-zinc-950 border border-zinc-800 rounded-[6px]"
                />
                <input
                    type="text"
                    value={email}
                    placeholder="Email"
                    onChange={(e) => setEmail(e.target.value)}
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
                {isLoading ? 'Creating Account...' : 'Sign Up'}
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
