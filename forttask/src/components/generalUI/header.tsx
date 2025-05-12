import Image from 'next/image';
import Link from 'next/link';
import { ProfilePicture } from './profilePicture';

export default function Header() {
    return (
        <span className="sticky top-0 z-50">
            <header className="flex justify-center items-center py-8 h-8 bg-[#09090B]">
                <div className="flex justify-start items-center w-[70%]">
                    <div className="w-full p-0 flex justify-start items-center">
                        <nav className="flex justify-start pl-4 items-center w-full">
                            <NavMenu />
                        </nav>
                    </div>
                </div>
                <div className="flex flex-row-reverse items-center w-[30%]">
                    <ProfilePicture />
                    <SearchBar />
                </div>
            </header>
            <hr className=" border-[#27272A]" />
        </span>
    );
}

function NavMenu() {
    return (
        <ul className="flex justify-around items-center space-x-5 text-gray-400">
            <li>
                <Link href="/" className="hover:text-white">
                    Overview
                </Link>
            </li>
            <li>
                <Link href="/events" className="hover:text-white">
                    Events
                </Link>
            </li>
            <li>
                <Link href="/chores" className="hover:text-white">
                    Chores
                </Link>
            </li>
            <li>
                <Link href="/bills" className="hover:text-white">
                    Bills
                </Link>
            </li>
            <li>
                <Link href="/shopping" className="hover:text-white">
                    Shopping list
                </Link>
            </li>
            <li>
                <Link href="/managment" className="hover:text-white">
                    Managment
                </Link>
            </li>
        </ul>
    );
}

function SearchBar() {
    return (
        <input
            type="text"
            placeholder="Search..."
            className="w-1/2 h-8 p-2 mx-3 bg-[#09090B] rounded-[6px] border border-[#27272A] text-sm text-gray-300 placeholder:text-[#A1A1AA]"
        />
    );
}
