'use client';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function MessageLink() {
    const path = usePathname();
    return (
        <>
            {path !== '/messages' ? (
                <Link href="/messages" className="sticky right-0 bottom-0 bg-zinc-50 rounded-xl p-3">
                    <Image src="/Messages.svg" alt="Messages link" width={24} height={24} className="text-zinc-900" />
                </Link>
            ) : (
                <Link href="#" className="sticky right-0 bottom-0 bg-zinc-50 rounded-xl p-3 opacity-0 cursor-default">
                    <Image src="/Messages.svg" alt="Messages link" width={24} height={24} className="text-zinc-900" />
                </Link>
            )}
        </>
    );
}
