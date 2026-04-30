import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Quick Poll — Real-Time Polling",
  description: "Create polls instantly, share dynamic links, and watch the votes roll in live. No sign-up required.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
