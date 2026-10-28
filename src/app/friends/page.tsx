"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { X } from "lucide-react";
import { duo, sisters } from "@/config/runner";
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

const lead = sisters[0];

function AddRunner({ onDone, scrollIntoView = false }: { onDone: (added?: string) => void; scrollIntoView?: boolean }) {
  const [name, setName] = useState("");
  const [bib, setBib] = useState("");
  const [together, setTogether] = useState(true);
  const [wave, setWave] = useState(lead.gunTime.slice(11, 16));
  const [goal, setGoal] = useState("");
  const [color, setColor] = useState(COLORS[0]);
  const [trap, setTrap] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const goalSec = parseDuration(goal);
  const pace = goalSec ? goalSec / MARATHON_MILES : null;
  const form = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (scrollIntoView) form.current?.scrollIntoView({ block: "start", behavior: "smooth" });
  }, [scrollIntoView]);

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
        gun_time: together ? lead.gunTime : `${lead.gunTime.slice(0, 10)}T${wave}:00-05:00`,
        corral_delay_min: together ? lead.corralDelayMin : 4,
        pace_goal: Math.round(pace),
        pace_fast: Math.round(pace * 0.96),
        pace_slow: Math.round(pace * 1.04),
        color,
        added_by: rememberedName() || null,
      });
      onDone(name.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form ref={form} onSubmit={submit} className="pop relative mt-5 scroll-mt-4 space-y-5 rounded-[30px] border-[2.5px] border-ink bg-ice p-5">
      <div className="flex items-center justify-between">
        <h2 className="display text-[32px] leading-none lowercase">add a runner</h2>
        <button type="button" onClick={() => onDone()} className="press flex h-9 w-9 items-center justify-center rounded-full border-2 border-ink bg-paper" aria-label="Close">
          <X size={18} strokeWidth={2.6} />
        </button>
      </div>
      <label className="block overflow-hidden rounded-[24px] border-[2.5px] border-ink bg-paper">
        <span className="flex items-center justify-between border-b-[2.5px] border-ink px-4 py-1.5" style={{ background: color }}>
          <span className="display text-[16px] lowercase">bib number</span>
          <span className="tag !text-[9.5px]">nyc ’26</span>
        </span>
        <input
          className="display w-full bg-transparent px-4 pt-3 pb-1 text-center text-[52px] leading-none tracking-[-0.04em] tabular outline-none placeholder:text-ink/20"
          value={bib}
          onChange={(e) => setBib(e.target.value.replace(/\s+/g, ""))}
          maxLength={10}
          inputMode="numeric"
          autoComplete="off"
          placeholder="00000"
          aria-label="bib number"
        />
        <span className="tag block px-4 pb-3 text-center !text-[9.5px] text-ink/60">optional, but it&apos;s how you find them in the official tracker</span>
      </label>
      <Field label="name">
        <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} maxLength={40} required placeholder="who are we chasing?" />
      </Field>
      <button
        type="button"
        role="switch"
        aria-checked={together}
        onClick={() => setTogether((v) => !v)}
        className="press flex w-full items-center justify-between gap-3 rounded-[22px] border-[2.5px] border-ink bg-paper px-4 py-3 text-left"
      >
        <span className="min-w-0">
          <span className="display block text-[17px] leading-tight lowercase">starting with {duo.toLowerCase()}</span>
          <span className="tag mt-1 block !text-[9.5px] text-ink/70">
            {together ? `wave ${lead.wave} · corral ${lead.corral.toLowerCase()} · gun ${fmtClock(new Date(lead.gunTime))}` : "own wave. set their start time below"}
          </span>
        </span>
        <span aria-hidden className={`relative h-10 w-[68px] shrink-0 rounded-full border-[2.5px] border-ink transition-colors ${together ? "bg-lime" : "bg-sun-soft"}`}>
          <span className={`absolute top-1/2 -translate-y-1/2 transition-[left] duration-300 ${together ? "left-[calc(100%-34px)]" : "left-0.5"}`}>
            <Star size={30} fill={together ? lead.color : "#ffffff"} strokeWidth={8} />
          </span>
        </span>
      </button>
      {!together && (
        <Field label="start time" hint="their wave's gun time, nyc time.">
          <input type="time" className={inputClass} value={wave} onChange={(e) => setWave(e.target.value)} required />
        </Field>
      )}
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
  const [fromLink, setFromLink] = useState(false);
  const [justAdded, setJustAdded] = useState<string | null>(null);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("add") !== "1") return;
    setAdding(true);
    setFromLink(true);
  }, []);

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
        eyebrow="friends"
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
        {!loading && friends.length === 0 && !adding && <p className="display py-3 text-center text-[17px] lowercase">no friends added yet.</p>}
        {justAdded && !adding && (
          <div className="stamp mt-5 flex items-center justify-between gap-3 rounded-[24px] border-[2.5px] border-ink bg-lime px-4 py-3" style={{ ["--r" as string]: "-1deg" }}>
            <p className="display min-w-0 text-[16px] leading-tight lowercase">{justAdded} is on the map with {duo.toLowerCase()}.</p>
            <Link href="/" className="press display shrink-0 rounded-full border-2 border-ink bg-ink px-3 py-1 text-[12.5px] text-sun lowercase">
              home map →
            </Link>
          </div>
        )}
        {adding ? (
          <AddRunner
            scrollIntoView={fromLink}
            onDone={(added) => {
              setAdding(false);
              setJustAdded(added ?? null);
            }}
          />
        ) : (
          <button onClick={() => { setJustAdded(null); setFromLink(false); setAdding(true); }} className="press display mt-5 flex w-full items-center justify-between rounded-full border-[2.5px] border-dashed border-ink bg-sun-soft py-2 pr-2 pl-6 text-[19px] lowercase hover:bg-lime">
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
