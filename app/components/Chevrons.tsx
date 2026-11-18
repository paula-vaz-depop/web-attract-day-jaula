// The stacked down-chevrons Inverse puts next to section titles.
export function Chevrons({ className = "" }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 24 32" className={className} fill="none" stroke="currentColor" strokeWidth="5">
      <path d="M3 3l9 9 9-9M3 17l9 9 9-9" />
    </svg>
  );
}
