"use client";

import { duo, sisters } from "@/config/runner";
import { CREW_KEY, mains } from "@/lib/me";
import { fmtClock, fmtPace } from "@/lib/model";
import { useCollection, useNow } from "@/lib/store";
import { PageHeader } from "@/components/ui";
import { SpotTimeline } from "@/components/SpotTimeline";
import { Hi, Sparkle } from "@/components/Stickers";

export default function StandPage() {
  const now = useNow();
  const { rows: sightings } = useCollection("sightings");
  const { rows: claims } = useCollection("claims", CREW_KEY);
  return (
    <main>
      <PageHeader
        egg={{ src: "/pics/subway.jpg" }}
        eyebrow="plan your day"
        title={
          <>
            where should <Hi tone="sky">i</Hi> stand?
          </>
        }
        subtitle={`get there early. tracking is approximate and ${duo} won't stop.`}
      />
      <SpotTimeline runners={mains} now={now} sightings={sightings} claims={claims} />
      <div className="mx-5 mt-8 rounded-[28px] border-[2.5px] border-ink bg-ink p-5 text-paper">
        <p className="display flex items-center gap-2 text-[20px] text-sun lowercase">
          <Sparkle size={16} fill="var(--pink)" /> the fine print
        </p>
        <ul className="mt-3 space-y-3 text-[12.5px] leading-[1.6] lowercase">
          {sisters.map((s) => (
            <li key={s.slug} className="flex gap-2.5">
              <span className="mt-1.5 inline-block h-2.5 w-2.5 shrink-0 rounded-full border-[1.5px] border-paper" style={{ background: s.color }} />
              <span>
                <b className="display text-[14px]" style={{ color: s.color }}>
                  {s.name}:
                </b>{" "}
                the {fmtClock(new Date(s.gunTime))} gun, {fmtPace(s.pace.fast)} to {fmtPace(s.pace.slow)} a mile, from corral {s.corral}. expect {s.pronouns.object} after the early time, never
                before.
              </span>
            </li>
          ))}
          <li className="flex gap-2.5">
            <span className="mt-1 shrink-0 text-sun">★</span>
            <span>once someone posts a sighting, every time on this page re-centres on it.</span>
          </li>
          <li className="flex gap-2.5">
            <span className="mt-1 shrink-0 text-sun">★</span>
            <span>clocks fall back at 2 a.m. on race morning. all times here are after the change.</span>
          </li>
        </ul>
      </div>
    </main>
  );
}
