"use client";
import Link from "next/link";

export default function Error({ retry }: { error: Error; retry: () => void }) {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-8">
      <h1 className="display text-5xl sm:text-7xl">The box office is down</h1>
      <p className="mt-4 max-w-xl text-lg text-muted">
        We couldn&apos;t load this right now. It&apos;s not you, it&apos;s us. Give it another go in a moment.
      </p>
      <div className="mt-8 flex gap-3">
        <button type="button" className="btn btn-primary" onClick={() => retry()}>Try again</button>
        <Link href="/" className="btn btn-ghost">All events</Link>
      </div>
    </main>
  );
}
