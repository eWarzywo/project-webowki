import Header from '@/components/generalUI/header';
import Footer from '@/components/generalUI/footer';

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-grow pb-28">{children}</main>
            <Footer />
        </div>
    );
}
