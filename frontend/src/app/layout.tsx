import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TravelOS AI - Enterprise Operating System for Travel & Pilgrimage",
  description: "Next-Generation AI Operating System for Travel Agencies, Hajj & Umrah Offices",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans bg-slate-50 text-slate-900 selection:bg-indigo-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
