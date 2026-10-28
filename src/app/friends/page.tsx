"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { X } from "lucide-react";
import { sisters } from "@/config/runner";
import { CREW_KEY, friendProfile, mains, toAnchors } from "@/lib/me";
import { estimate, fmtClock, fmtDuration, fmtPace, parseDuration, type RunnerProfile } from "@/lib/model";
import { MARATHON_MILES } from "@/lib/geo";
import { insert, rememberedName, useCollection, useNow, type Sighting } from "@/lib/store";
import { CourseMap, type MapRunner } from "@/components/CourseMap";
import { Field, Honeypot, LocalModeNote, PageHeader, PrimaryButton, inputClass } from "@/components/ui";
import { Hi, Star } from "@/components/Stickers";

const COLORS = ["#3ee04f", "#ff8a1f", "#a66bff", "#ffa6ec", "#00d1c1", "#ff3b3b", "#c8efff", "#ffffff"];


const slugify = (name: string) =>
  `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 30) || "runner"}-${Math.random().toString(36).slice(2, 6)}`;

function useRunnerRow(profile: RunnerProfile, sightings: Sighting[], now: Date | null) {
  return useMemo(() => {
    const mine = sightings.filter((s) => s.runner === profile.slug);
    const est = now ? estimate(now, profile, toAnchors(mine)) : null;
    return { profile, est };
  }, [profile, sightings, now]);
}

function RunnerRow({ profile, sightings, now, href }: { profile: RunnerProfile; sightings: Sighting[]; now: Date | null; href: string }) {
  const { est } = useRunnerRow(profile, sightings, now);
  const mile = est && est.status !== "pre" ? est.mile : 0;
  const label = !est ? "" : est.status === "pre" ? `starts ${fmtClock(est.startsAt)}` : est.status === "finished" ? "finished!" : `mile ${est.mile.toFixed(1)}`;
  return (
    <Link href={href} className="press group block rounded-[24px] border-[2.5px] border-ink bg-paper p-3.5">
      <div className="flex items-center justify-between gap-3">
        <p className="display flex min-w-0 items-center gap-2 text-[22px] leading-none lowercase">
          <Star size={26} fill={profile.color} strokeWidth={8} className="shrink-0 transition-transform duration-500 group-hover:rotate-[72deg]" />
          <span className="truncate">{profile.name}</span>
        </p>
        <p className="display shrink-0 rounded-full border-2 border-ink px-2.5 py-0.5 text-[12px] lowercase tabular" style={{ background: profile.color }}>
          {label}
        </p>
      </div>
      <div className="relative mt-3 h-3 overflow-hidden rounded-full border-2 border-ink bg-sun-soft">
        <div className="absolute inset-y-0 left-0 rounded-full border-r-2 border-ink" style={{ width: `${Math.max(4, (mile / MARATHON_MILES) * 100)}%`, background: profile.color }} />
      </div>
      <p className="tag mt-2 flex justify-between !text-[9.5px] tabular">
        <span>
          {fmtPace(profile.pace.goal)} a mile{profile.bib && profile.bib !== "TBD" ? ` · bib ${profile.bib}` : ""}
        </span>
        <span className="transition group-hover:translate-x-1">→</span>
      </p>
    </Link>
  );
}

function AddRunner({ onDone }: { onDone: () => void }) {
  const [name, setName] = useState("");
  const [bib, setBib] = useState("");
  const [wave, setWave] = useState("11:30");
  const [goal, setGoal] = useState("");
  const [color, setColor] = useState(COLORS[0]);
  const [trap, setTrap] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const goalSec = parseDuration(goal);
  const pace = goalSec ? goalSec / MARATHON_MILES : null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (trap || !pace) return;
    setBusy(true);
    setError(null);
    try {
      await insert("friends", {
        runner: CREW_KEY,
        slug: slugify(name),
        name: name.trim(),
        bib: bib.trim() || null,
        gun_time: `${sisters[0].gunTime.slice(0, 10)}T${wave}:00-05:00`,
        corral_delay_min: 4,
        pace_goal: Math.round(pace),
        pace_fast: Math.round(pace * 0.96),
        pace_slow: Math.round(pace * 1.04),
        color,
        added_by: rememberedName() || null,
      });
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="pop relative mt-5 space-y-5 rounded-[30px] border-[2.5px] border-ink bg-ice p-5">
      <div className="flex items-center justify-between">
        <h2 className="display text-[32px] leading-none lowercase">add a runner</h2>
        <button type="button" onClick={onDone} className="press flex h-9 w-9 items-center justify-center rounded-full border-2 border-ink bg-paper" aria-label="Close">
          <X size={18} strokeWidth={2.6} />
        </button>
      </div>
      <Field label="name">
        <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} maxLength={40} required placeholder="who are we chasing?" />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="start time">
          <input type="time" className={inputClass} value={wave} onChange={(e) => setWave(e.target.value)} required />
        </Field>
        <Field label="bib (optional)">
          <input className={inputClass} value={bib} onChange={(e) => setBib(e.target.value)} maxLength={10} inputMode="numeric" />
        </Field>
      </div>
      <Field label="goal finish time" hint={pace ? `${fmtDuration(goalSec!)} · ${fmtPace(pace)}/mi` : "numbers only. 40000 becomes 4:00:00."}>
        <input className={`${inputClass} tabular`} value={goal} onChange={(e) => setGoal(e.target.value)} inputMode="numeric" required placeholder="4:00:00" />
      </Field>
      <div>
        <span className="display mb-2 block text-[16px] lowercase">your star colour</span>
        <div className="flex flex-wrap gap-1.5">
          {COLORS.map((c) => (
            <button
              type="button"
              key={c}
              onClick={() => setColor(c)}
              className={`press rounded-full p-0.5 ${color === c ? "bg-ink" : ""}`}
              aria-label={`Colour ${c}`}
              aria-pressed={color === c}
            >
              <Star size={30} fill={c} strokeWidth={8} className={color === c ? "stamp" : ""} />
            </button>
          ))}
        </div>
      </div>
      <Honeypot value={trap} onChange={setTrap} />
      {error && <p className="display text-[14px] text-cherry">{error}</p>}
      <PrimaryButton type="submit" disabled={busy || !name.trim() || !pace}>
        {busy ? "adding…" : "start tracking"}
      </PrimaryButton>
    </form>
  );
}

export default function FriendsPage() {
  const now = useNow();
  const { rows: friends, loading } = useCollection("friends");
  const { rows: sightings } = useCollection("sightings");
  const [adding, setAdding] = useState(false);

  const profiles = useMemo(() => [...mains, ...friends.map(friendProfile)], [friends]);
  const mapRunners: MapRunner[] = useMemo(
    () =>
      profiles.map((p) => {
        const est = now ? estimate(now, p, toAnchors(sightings.filter((s) => s.runner === p.slug))) : null;
        return { id: p.slug, name: p.name, color: p.color, mile: est ? (est.status === "pre" ? 0 : est.mile) : null };
      }),
    [profiles, sightings, now],
  );

  return (
    <main>
      <PageHeader
        eyebrow="the whole squad"
        title={
          <>
            track your <Hi tone="lime">friends</Hi>
          </>
        }
        subtitle="running with friends? add them here and follow everyone on one map. tap anyone for their spots and arrival times."
      />
      <LocalModeNote />
      <div className="px-5">
        <CourseMap runners={mapRunners} height={360} />
      </div>
      <div className="mx-5 mt-6 space-y-2.5">
        {mains.map((m) => (
          <RunnerRow key={m.slug} profile={m} sightings={sightings} now={now} href="/" />
        ))}
        {friends.map((f) => (
          <RunnerRow key={f.id} profile={friendProfile(f)} sightings={sightings} now={now} href={`/friends/${f.slug}`} />
        ))}
        {!loading && friends.length === 0 && !adding && <p className="display py-3 text-center text-[17px] lowercase">no friends added yet. be the first.</p>}
        {adding ? (
          <AddRunner onDone={() => setAdding(false)} />
        ) : (
          <button onClick={() => setAdding(true)} className="press display mt-5 flex w-full items-center justify-between rounded-full border-[2.5px] border-dashed border-ink bg-sun-soft py-2 pr-2 pl-6 text-[19px] lowercase hover:bg-lime">
            <span>add a runner</span>
            <span aria-hidden className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-ink bg-paper text-[24px]">
              +
            </span>
          </button>
        )}
      </div>
    </main>
  );
}
