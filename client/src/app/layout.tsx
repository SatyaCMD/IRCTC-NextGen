import type { Metadata } from "next";
import { Toaster } from "react-hot-toast";
import "./globals.css";
import DishaAI from "@/components/DishaAI";

export const metadata: Metadata = {
  title: "IRCTC 2.0 - Next Gen Indian Railways",
  description: "AI powered train booking inspired by IRCTC",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <Toaster 
          position="top-center"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#111111',
              color: '#fff',
              border: '1px solid #333',
              borderRadius: '12px',
            },
            success: {
              iconTheme: {
                primary: '#10b981',
                secondary: '#fff',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
        {children}
        <DishaAI />
      </body>
    </html>
  );
}
