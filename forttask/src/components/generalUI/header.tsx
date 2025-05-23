'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ProfilePicture } from './profilePicture';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

export default function Header() {
    const [menuOpen, setMenuOpen] = useState(false);

    return (
        <span className="sticky top-0 z-50">
            <header className="flex justify-between items-center py-4 px-4 bg-zinc-950">
                <div className="flex items-center w-auto">
                    <button
                        className="md:hidden mr-2 p-2 rounded hover:bg-zinc-900 focus:outline-hidden"
                        onClick={() => setMenuOpen((open) => !open)}
                        aria-label="Toggle navigation menu"
                    >
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            {menuOpen ? (
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            ) : (
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M4 6h16M4 12h16M4 18h16"
                                />
                            )}
                        </svg>
                    </button>
                    <nav className="hidden md:flex">
                        <NavMenu />
                    </nav>
                </div>
                <div className="flex items-center">
                    <Link href="/managment">
                        <ProfilePicture />
                    </Link>
                </div>
            </header>
            {menuOpen && (
                <div className="md:hidden bg-zinc-950 px-4 pb-4">
                    <NavMenu mobile onClickLink={() => setMenuOpen(false)} />
                </div>
            )}
            <hr className="border-zinc-800" />
        </span>
    );
}

function NavMenu({ mobile = false, onClickLink }: { mobile?: boolean; onClickLink?: () => void }) {
    const pathname = usePathname();

    const links = [
        { href: '/', label: 'Overview' },
        { href: '/events', label: 'Events' },
        { href: '/chores', label: 'Chores' },
        { href: '/bills', label: 'Bills' },
        { href: '/shopping', label: 'Shopping list' },
        { href: '/managment', label: 'Management' },
    ];

    const mobileLinks = mobile ? [...links, { href: '/messages', label: 'Messages' }] : links;

    return (
        <ul
            className={
                mobile
                    ? 'flex flex-col space-y-3 text-gray-400'
                    : 'flex justify-around items-center space-x-5 text-gray-400'
            }
        >
            {mobileLinks.map((link) => (
                <li key={link.href}>
                    <Link
                        href={link.href}
                        className={
                            `hover:text-white transition-colors duration-200 ` +
                            (pathname === link.href ? 'text-white' : 'text-gray-400')
                        }
                        onClick={onClickLink}
                    >
                        <span className="relative group">
                            {link.label}
                            <span
                                className="absolute left-0 -bottom-1 w-0 h-0.5 bg-white transition-all duration-200 group-hover:w-full"
                                aria-hidden="true"
                            />
                        </span>
                    </Link>
                </li>
            ))}
        </ul>
    );
}
