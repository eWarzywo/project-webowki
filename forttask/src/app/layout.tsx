import type { Metadata } from "next";
import "./globals.css";
import Header from "../components/header";

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
    <html lang="en">
      <body className="bg-[#09090B] text-[#FAFAFA] p-10 space-y-10 w-full h-screen">
        <Header />
        {children}
      </body>
    </html>
  );
}
