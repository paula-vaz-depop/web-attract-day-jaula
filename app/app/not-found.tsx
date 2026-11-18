import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-8">
      <h1 className="display text-[clamp(2rem,10vw,4.5rem)]">Nothing here</h1>
      <p className="mt-4 max-w-xl text-lg text-muted">
        We can&apos;t find that event or booking. The link might be wrong, or it&apos;s been taken down.
      </p>
      <Link href="/" className="btn btn-primary mt-8">See all events</Link>
    </main>
  );
}
