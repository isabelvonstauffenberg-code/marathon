"use client";

import { useMemo } from "react";
import { CourseMap, type MapRunner } from "@/components/CourseMap";
import { estimate, fmtClock, fmtPace, projectedFinish, type Estimate, type RunnerProfile } from "@/lib/model";
import { sightingsFor, toAnchors } from "@/lib/me";
import { useLiveSplits, withLiveStart } from "@/lib/nyrr";
import type { Sighting } from "@/lib/store";
import { spots, spotById } from "@/data/spots";
import { MARATHON_MILES } from "@/lib/geo";
import { timeAgo } from "@/components/ui";
import { Star } from "@/components/Stickers";

const BOROUGHS = [
  { at: 0, label: "SI" },
  { at: 2, label: "BK" },
  { at: 13.1, label: "QN" },
  { at: 15.6, label: "MN" },
  { at: 19.9, label: "BX" },
  { at: 21.1, label: "" },
];

function statusLine(r: RunnerProfile, est: Estimate, sightings: Sighting[], now: Date) {
  if (est.status === "pre") return `not started. starts around ${fmtClock(est.startsAt)}`;
  if (est.status === "finished") return `probably finished.`;
  if (est.anchor) {
    const s = sightings.find((x) => x.seen_at === est.anchor!.seenAt);
    if (!s) return `crossed the official mat at mile ${est.anchor.mile.toFixed(1)} ${timeAgo(est.anchor.seenAt, now)}. Now around mile ${est.mile.toFixed(1)}.`;
    const where = spotById(s.spot_id)?.name ?? `mile ${s.mile}`;
    return `spotted at ${where} ${timeAgo(est.anchor.seenAt, now)} by ${s.name}. Now around mile ${est.mile.toFixed(1)}.`;
  }
  return `estimated from projected splits. the shaded stretch on the map is the likely range.`;
}

const mileOf = (est: Estimate | null) => (est && est.status !== "pre" ? est.mile : 0);

function BoroughTrack({ items }: { items: { color: string; progress: number }[] }) {
  return (
    <div className="relative mt-7 mb-1 px-3">
      <div className="relative h-[18px] rounded-full border-[2.5px] border-ink bg-paper">
        {BOROUGHS.slice(1).map((b, i) => (
          <div key={i} className="absolute top-0 bottom-0 w-[2px] bg-ink/25" style={{ left: `${(b.at / MARATHON_MILES) * 100}%` }} />
        ))}
        {items.map((it, i) => (
          <div key={`f${i}`} className="absolute top-0 bottom-0 left-0 rounded-full opacity-35 transition-[width] duration-1000" style={{ width: `${it.progress * 100}%`, background: it.color }} />
        ))}
        {items.map((it, i) => (
          <div key={i} className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 transition-[left] duration-1000" style={{ left: `${it.progress * 100}%`, zIndex: 2 + i }}>
            <Star size={30} fill={it.color} strokeWidth={8} className="float" style={{ ["--r" as string]: `${i ? 8 : -8}deg`, animationDelay: `${i * -1.1}s` }} />
          </div>
        ))}
      </div>
      <div className="relative mt-2 h-4">
        {BOROUGHS.map((b, i) =>
          b.label ? (
            <p key={i} className={`tag absolute !text-[10px] ${i === 0 ? "" : "-translate-x-1/2"}`} style={{ left: `${(b.at / MARATHON_MILES) * 100}%` }}>
              {b.label.toLowerCase()}
            </p>
          ) : null,
        )}
        <p className="display absolute right-0 translate-x-1/3 text-[11px]">26.2</p>
      </div>
    </div>
  );
}

export function RunnerLive({
  runners,
  sightings,
  now,
  spotBadges,
  onSpotClick,
  extraMapRunners = [],
}: {
  runners: RunnerProfile[];
  sightings: Sighting[];
  now: Date | null;
  spotBadges?: Record<string, number>;
  onSpotClick?: (id: string) => void;
  // Map-only markers (e.g. friends), drawn beneath the main runners; no cards.
  extraMapRunners?: MapRunner[];
}) {
  const live = useLiveSplits(runners, now);
  const rows = useMemo(
    () =>
      runners.map((runner) => {
        const r = withLiveStart(runner, live[runner.slug]);
        const mine = sightingsFor(sightings, r.slug);
        const anchors = [...toAnchors(mine), ...(live[r.slug]?.anchors ?? [])];
        return { r, mine, est: now ? estimate(now, r, anchors) : null };
      }),
    [runners, sightings, now, live],
  );
  const mapRunners: MapRunner[] = [
    ...rows
      .filter(({ est }) => est)
      .map(({ r, est }) =>
        est!.status === "pre"
          ? { id: r.slug, name: r.name, color: r.color, mile: 0 }
          : { id: r.slug, name: r.name, color: r.color, mile: est!.mile, lo: est!.lo, hi: est!.hi },
      ),
    ...extraMapRunners.map((r) => ({ ...r, under: true })),
  ];
  const solo = runners.length === 1;
  const statusWord = (est: Estimate | null) => (est?.status === "running" ? "on the move" : est?.status === "finished" ? "finished!" : "pre-gun");

  return (
    <section className="rise px-5">
      <div className={solo ? "" : "grid grid-cols-2 gap-3"}>
        {rows.map(({ r, est }, i) => (
          <div
            key={r.slug}
            className={`peel relative rounded-[28px] border-[2.5px] border-ink p-4 pb-5 ${solo ? "flex items-end justify-between gap-4" : ""}`}
            style={{ background: r.color }}
          >
            <div className="min-w-0">
              <div className={solo ? "" : "flex flex-col items-start gap-1.5"}>
                <p className="display max-w-full truncate text-[22px] leading-none lowercase">{solo ? statusWord(est) : r.name}</p>
                {!solo && (
                  <span className={`display shrink-0 rounded-full border-2 border-ink bg-paper px-2 py-0.5 text-[10px] leading-[1.3] lowercase ${est?.status === "running" ? "" : "opacity-80"}`}>
                    {est?.status === "running" && <span className="blink mr-1 inline-block h-1.5 w-1.5 rounded-full bg-cherry align-middle" />}
                    {statusWord(est)}
                  </span>
                )}
              </div>
              <p className={`display mt-3 leading-[0.8] tabular ${solo ? "text-[96px]" : "text-[52px] tracking-[-0.04em]"}`} style={{ ["--i" as string]: i }}>
                {mileOf(est).toFixed(1)}
                <span className={`ml-1 tracking-normal ${solo ? "text-[24px]" : "text-[15px]"}`}>mi</span>
              </p>
            </div>
            <dl className={solo ? "shrink-0 space-y-2 pr-6 pb-2 text-right" : "mt-4 space-y-1.5 border-t-2 border-ink/80 pt-3 pr-5"}>
              <div className={solo ? "" : "flex items-baseline justify-between gap-2"}>
                <dt className="tag !text-[9.5px] text-ink/75">goal pace</dt>
                <dd className="display text-[16px] leading-tight tabular">{fmtPace(r.pace.goal)}</dd>
              </div>
              <div className={solo ? "" : "flex items-baseline justify-between gap-2"}>
                <dt className="tag !text-[9.5px] text-ink/75">{solo ? "finish ≈" : "eta"}</dt>
                <dd className="display text-[16px] leading-tight whitespace-nowrap tabular">{fmtClock(projectedFinish(r)).replace(" a.m.", "am").replace(" p.m.", "pm")}</dd>
              </div>
            </dl>
          </div>
        ))}
      </div>
      <BoroughTrack items={rows.map(({ r, est }) => ({ color: r.color, progress: mileOf(est) / MARATHON_MILES }))} />
      <div className="mt-4 space-y-2">
        {rows.map(({ r, est, mine }) => (
          <p key={r.slug} className="flex items-start gap-2 text-[12.5px] leading-[1.55] lowercase">
            {!solo && (
              <span className="display mt-[1px] shrink-0 rounded-full border-2 border-ink px-2 text-[11px] leading-[1.35]" style={{ background: r.color }}>
                {r.name.toLowerCase()}
              </span>
            )}
            <span>{est && now ? statusLine(r, est, mine, now) : "\u00a0"}</span>
          </p>
        ))}
      </div>
      <div className="mt-5">
        <CourseMap runners={mapRunners} spots={spots} spotBadges={spotBadges} onSpotClick={(s) => onSpotClick?.(s.id)} focusId={solo ? runners[0].slug : undefined} />
      </div>
    </section>
  );
}
