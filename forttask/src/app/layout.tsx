import type { Metadata } from "next";
import "./globals.css";
import Header from "../components/header";
import Footer from "@/components/footer";
import { Inter } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FortTask",
  description: "Emati pisz kod",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.className}>
      <body className="bg-[#09090B] text-[#FAFAFA] py-6 px-10 space-y-10 w-full h-screen">
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}
