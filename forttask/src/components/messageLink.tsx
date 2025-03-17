'use client';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function MessageLink() {
    const path = usePathname();
    return (
        <>
            {path !== '/messages' && (
                <Link href="/messages" className="sticky left-0 bottom-0 bg-[#FAFAFA] rounded-xl p-3 mt-3">
                    <Image src="/Messages.svg" alt="FortTask logo" width={32} height={20} />
                </Link>
            )}
        </>
    );
}
