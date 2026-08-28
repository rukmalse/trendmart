import BottomNav from "@/components/BottomNav";
import 'leaflet/dist/leaflet.css'
import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Navbar from "@/components/navbar"; // 👈 Navbar එක මෙතැනින් Import කර ඇත
import Footer from "@/components/Footer"; // 👈 Footer එක මෙතැනින් Import කර ඇත
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Trend Mart - Classifieds & Manpower Job Bank",
  description: "Buy, Sell, and Find Skilled Workers in Sri Lanka",
  manifest: "/manifest.json", // 👈 PWA Manifest එක මෙහි එකතු කර ඇත
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Trend Mart",
  },
};

export const viewport: Viewport = {
  themeColor: "#2563eb",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body suppressHydrationWarning className="min-h-full flex flex-col bg-gray-50 text-gray-900 pb-16 md:pb-0">
        
        {/* 🚀 Dynamic Client Navbar */}
        <Navbar />

        {/* Main Content Area */}
        <div className="flex-1">
          {children}
        </div>

        {/* 🚀 Professional Footer */}
        <Footer />

        {/* 🚀 Mobile App Bottom Navigation Bar */}
        <BottomNav />

      </body>
    </html>
  );
}