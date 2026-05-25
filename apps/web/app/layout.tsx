import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { GlobalProviders } from "~/providers/global";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: "Sensus",
  description: "Build dynamic forms, publish shareable links, collect responses.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // `suppressHydrationWarning` is needed because next-themes (in GlobalProviders)
    // sets `class` on <html> client-side via an inline script — server can't know
    // the system preference. Without this, every page hydrates with a warning.
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <GlobalProviders>{children}</GlobalProviders>
      </body>
    </html>
  );
}
