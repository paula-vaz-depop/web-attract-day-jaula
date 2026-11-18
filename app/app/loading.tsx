export default function Loading() {
  return (
    <main role="status" className="mx-auto flex w-full max-w-7xl flex-1 flex-col items-start gap-4 px-4 py-14 sm:px-8">
      <p className="display animate-pulse text-[clamp(2rem,10vw,4.5rem)]">Warming up the stage…</p>
      <p className="text-muted">Grabbing the latest seats.</p>
    </main>
  );
}
