import type { Metadata } from 'next';
import './globals.css';
import { Inter } from 'next/font/google';
import { SessionProviderWrapper } from '@/../../forttask/auth/sessionProviderWrapper';

const inter = Inter({
    subsets: ['latin'],
});

export const metadata: Metadata = {
    title: 'FortTask',
    description: 'Emati pisz kod',
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" className={inter.className}>
            <body className="bg-zinc-950 text-zinc-50 py-7 px-10 space-y-10 w-full h-screen">
                <SessionProviderWrapper>{children}</SessionProviderWrapper>
            </body>
        </html>
    );
}
