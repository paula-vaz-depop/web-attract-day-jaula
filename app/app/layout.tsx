import type { Metadata } from "next";
import Link from "next/link";
import { Archivo, Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const archivo = Archivo({ variable: "--font-archivo", subsets: ["latin"], axes: ["wdth"] });

export const metadata: Metadata = {
  title: "Tickets",
  description: "Pick an event, pick a seat, you're in.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geist.variable} ${archivo.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        <header className="border-b-4 border-ink">
          <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-5 sm:px-8">
            <Link href="/" className="display text-4xl sm:text-6xl focus-visible:outline-3 focus-visible:outline-accent">
              Tickets
            </Link>
            <span className="hidden text-xs font-semibold uppercase tracking-[0.2em] text-muted sm:block">
              Live music · Seats you pick
            </span>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
