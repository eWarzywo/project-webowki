'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Page() {
    return (
        <div className="flex justify-center items-center w-full pt-6 pb-8 px-8 h-full border-zinc-800 border rounded-[6px]">
            <div className="px-8 md:px-32 flex-col items-center">
                <div className="flex items-center justify-center flex-wrap flex-col">
                    <div className="self-stretch inline-flex flex-col justify-start items-center">
                        <div className="inline-flex justify-center items-center gap-2.5">
                            <div className="justify-start text-zinc-50 text-2xl font-semibold font-['Inter']">
                                Sign Up
                            </div>
                        </div>
                        <div className="self-stretch pt-2 flex flex-col justify-start items-start gap-2.5">
                            <div className="self-stretch inline-flex justify-center items-center gap-2.5">
                                <div className="justify-start text-zinc-400 text-sm font-normal font-['Inter']">
                                    Create an account to get started
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="w-full flex flex-col justify-center items-center gap-2.5 mt-6 space-y-2">
                        <SignupForm />
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

        // Basic validation
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

        console.log('About to send this data:', JSON.stringify({
            firstName, 
            lastName,
            email,
            password: '[REDACTED]' // Never log actual passwords
        }));

        try {
            console.log('Submitting signup data:', { firstName, lastName, email }); // Don't log password
            
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

            // Get the response as text first
            const rawText = await response.text();
            
            // Try to parse it as JSON
            let data;
            try {
                data = JSON.parse(rawText);
            } catch (e) {
                console.error('Failed to parse response as JSON:', rawText);
                throw new Error('Invalid response from server');
            }

            console.log('API response:', data);

            if (!response.ok) {
                throw new Error(data.message || 'Something went wrong');
            }

            // If successful, redirect to login page
            router.push('/login');
        } catch (error) {
            setError(error instanceof Error ? error.message : 'An error occurred during sign up');
            console.error('Signup error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form
            onSubmit={handleSubmit}
            className="self-stretch inline-flex flex-col justify-start items-start gap-2.5 w-full"
        >
            <div className="w-full self-stretch inline-flex flex-col justify-start items-start gap-2.5">
                {/* First Name Input */}
                <input
                    type="text"
                    value={firstName}
                    placeholder="First Name"
                    onChange={(e) => setFirstName(e.target.value)}
                    className="self-stretch inline-flex justify-start items-center h-10 px-4 w-full text-zinc-400 text-sm font-normal font-['Inter'] bg-zinc-950 border border-zinc-800 rounded-[6px]"
                />

                {/* Last Name Input */}
                <input
                    type="text"
                    value={lastName}
                    placeholder="Last Name"
                    onChange={(e) => setLastName(e.target.value)}
                    className="self-stretch inline-flex justify-start items-center h-10 px-4 w-full text-zinc-400 text-sm font-normal font-['Inter'] bg-zinc-950 border border-zinc-800 rounded-[6px]"
                />

                {/* Email Input */}
                <input
                    type="email"
                    value={email}
                    placeholder="Email"
                    onChange={(e) => setEmail(e.target.value)}
                    className="self-stretch inline-flex justify-start items-center h-10 px-4 w-full text-zinc-400 text-sm font-normal font-['Inter'] bg-zinc-950 border border-zinc-800 rounded-[6px]"
                />

                {/* Password Input */}
                <input
                    type="password"
                    value={password}
                    placeholder="Password"
                    onChange={(e) => setPassword(e.target.value)}
                    className="self-stretch inline-flex justify-start items-center h-10 w-full px-4 text-zinc-400 text-sm font-normal font-['Inter'] bg-zinc-950 border border-zinc-800 rounded-[6px]"
                />
            </div>

            {/* Error Message Display */}
            {error && (
                <div className="self-stretch inline-flex justify-start items-start mt-2 w-full">
                    <div className="justify-start text-sm font-normal font-['Inter'] text-red-500">{error}</div>
                </div>
            )}

            {/* Submit Button */}
            <div className="self-stretch inline-flex justify-start items-start w-full mt-4">
                <button
                    type="submit"
                    disabled={isLoading}
                    className="self-stretch inline-flex justify-center items-center h-10 w-full px-4 text-zinc-900 text-sm font-normal font-['Inter'] bg-zinc-50 border rounded-[6px] hover:bg-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isLoading ? 'Creating Account...' : 'Sign Up'}
                </button>
            </div>

            {/* Login Link */}
            <div className="self-stretch text-center mt-4">
                <span className="text-zinc-400 text-sm font-['Inter']">
                    Already have an account?{' '}
                </span>
                <a 
                    href="/login"
                    className="text-zinc-50 text-sm font-['Inter'] hover:underline cursor-pointer"
                >
                    Log in
                </a>
            </div>
        </form>
    );
}