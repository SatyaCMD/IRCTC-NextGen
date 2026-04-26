import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RailAI - Next Gen Indian Railways",
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
        {children}
      </body>
    </html>
  );
}
