import { race } from "@/config/runner";

const bits = ["sun nov 1", "26.2 miles", "five boroughs", "two sisters", "staten island to central park", race.shortName.toLowerCase()];

export function Marquee() {
  const row = bits.map((b) => (
    <span key={b} className="flex items-center gap-4">
      <span>{b}</span>
      <span className="text-pink">★</span>
    </span>
  ));
  return (
    <div className="no-print overflow-hidden bg-ink py-2 text-sun" aria-hidden>
      <div className="marquee display flex w-max gap-4 text-[13px] tracking-[-0.01em] whitespace-nowrap">
        <div className="flex gap-4 pl-4">{row}</div>
        <div className="flex gap-4 pl-4">{row}</div>
      </div>
    </div>
  );
}
