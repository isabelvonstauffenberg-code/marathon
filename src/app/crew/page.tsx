"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Check } from "lucide-react";
import { duo, sisters } from "@/config/runner";
import { spots, spotLabel } from "@/data/spots";
import { CREW_KEY } from "@/lib/me";
import { insert, rememberName, rememberedName, useCollection } from "@/lib/store";
import { CourseMap } from "@/components/CourseMap";
import { Field, Honeypot, LocalModeNote, PageHeader, PrimaryButton, Train, inputClass } from "@/components/ui";
import { Hi, Star } from "@/components/Stickers";

function CrewInner() {
  const params = useSearchParams();
  const { rows: claims } = useCollection("claims", CREW_KEY);
  const [spotId, setSpotId] = useState(params.get("spot") ?? "");
  const [name, setName] = useState("");
  const [outfit, setOutfit] = useState("");
  const [trap, setTrap] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => setName(rememberedName()), []);

  const bySpot = useMemo(() => {
    const m: Record<string, typeof claims> = {};
    for (const c of claims) (m[c.spot_id] ??= []).push(c);
    return m;
  }, [claims]);
  const badges = Object.fromEntries(Object.entries(bySpot).map(([k, v]) => [k, v.length]));
  // Late miles matter most; miles before 8 are hard to see the runner anyway.
  const gap = [...spots].reverse().find((s) => s.mileFrom >= 8 && !bySpot[s.id]?.length);
  const covered = spots.filter((s) => bySpot[s.id]?.length).length;

  useEffect(() => {
    if (!spotId && gap) setSpotId(gap.id);
  }, [gap, spotId]);

  const pick = (id: string) => {
    setSpotId(id);
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (trap) return;
    setBusy(true);
    setError(null);
    try {
      await insert("claims", { runner: CREW_KEY, spot_id: spotId, name: name.trim(), outfit: outfit.trim() || null });
      rememberName(name.trim());
      setDone(true);
      setOutfit("");
      setTimeout(() => setDone(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main>
      <PageHeader
        egg={{ src: "/pics/sunset-crew.jpg" }}
        eyebrow="cheer coverage"
        title={
          <>
            claim a <Hi tone="pink">mile</Hi>
          </>
        }
        subtitle="spread out. the later miles need people more than the early ones."
      />
      <LocalModeNote />

      <div className="mx-5 grid grid-cols-[auto_1fr] items-stretch overflow-hidden rounded-[28px] border-[2.5px] border-ink bg-ink text-paper">
        <div className="flex flex-col justify-center bg-sun px-5 py-4 text-ink">
          <p className="tag !text-[10px]">coverage</p>
          <p className="display text-[56px] leading-[0.9] tabular">
            {covered}
            <span className="text-[24px] text-ink/50">/{spots.length}</span>
          </p>
        </div>
        {gap ? (
          <button onClick={() => pick(gap.id)} className="group px-5 py-4 text-left">
            <p className="display text-[18px] leading-[1.15] lowercase">
              nobody at {spotLabel(gap).toLowerCase()}. {duo} will cry.
            </p>
            <p className="display mt-2.5 inline-flex items-center gap-1 rounded-full bg-pink px-3 py-1 text-[13px] text-ink lowercase transition group-hover:translate-x-1">fix it →</p>
          </button>
        ) : (
          <p className="display flex items-center px-5 py-4 text-[19px] leading-snug lowercase">every spot is covered.</p>
        )}
      </div>

      <div className="mt-5 px-5">
        <CourseMap runners={[]} spots={spots} spotBadges={badges} onSpotClick={(s) => pick(s.id)} height={320} claimMode />
      </div>

      <ol className="mx-5 mt-6 space-y-2">
        {spots.map((s) => {
          const crew = bySpot[s.id] ?? [];
          return (
            <li key={s.id}>
              <button
                onClick={() => pick(s.id)}
                className={`press flex w-full items-center gap-3 rounded-[22px] border-[2.5px] border-ink px-3.5 py-3 text-left ${spotId === s.id ? "bg-bubble" : crew.length ? "bg-paper" : "bg-sun-soft"}`}
              >
                {crew.length ? (
                  <Star size={28} fill="#fff200" strokeWidth={8} className="shrink-0" />
                ) : (
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-[2.5px] border-dashed border-ink/50" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="tag !text-[9.5px]">{spotLabel(s)}</p>
                  <p className="display truncate text-[18px] leading-tight lowercase">{s.name}</p>
                  <p className="truncate text-[11px] text-ink/70 lowercase">
                    {crew.length ? crew.map((c) => (c.outfit ? `${c.name} (${c.outfit})` : c.name)).join(" · ") : "nobody yet. be a hero."}
                  </p>
                </div>
                <div className="flex shrink-0 gap-0.5">
                  {s.trains.slice(0, 3).map((t) => (
                    <Train key={t} line={t} size={16} />
                  ))}
                </div>
              </button>
            </li>
          );
        })}
      </ol>

      <p className="mx-5 mt-5 rounded-[22px] border-2 border-dashed border-ink/40 p-4 text-[11.5px] leading-[1.6] text-ink/80 lowercase">
        ★ Miles 0–2 are on the bridge with no fans allowed. On Fourth Ave the start colours run in separate lanes until about mile 8, so stand on the{" "}
        {[...new Set(sisters.map((s) => s.startColor))].map((c, i) => (
          <span key={c}>
            {i > 0 && " or "}
            <span className="display text-ink">{c}</span> side for {sisters.filter((s) => s.startColor === c).map((s) => s.name).join(" & ")}
          </span>
        ))}
        , or they&apos;ll be a blur behind a barrier.
      </p>

      <form ref={formRef} onSubmit={submit} className="relative mx-5 mt-10 scroll-mt-4 space-y-5 rounded-[30px] border-[2.5px] border-ink bg-paper p-5">
        <Star size={56} fill="#ff3ec8" strokeWidth={6} className="float absolute -top-6 -right-3" style={{ ["--r" as string]: "14deg" }} />
        <h2 className="display text-[36px] leading-none lowercase">
          i&apos;ll be <Hi tone="sun">there</Hi>
        </h2>
        <Field label="your name">
          <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} maxLength={40} required />
        </Field>
        <Field label="where you'll be">
          <select className={inputClass} value={spotId} onChange={(e) => setSpotId(e.target.value)} required>
            {spots.map((s) => (
              <option key={s.id} value={s.id}>
                {spotLabel(s)} · {s.name}
                {bySpot[s.id]?.length ? "" : " (open)"}
              </option>
            ))}
          </select>
        </Field>
        <Field label="what you're wearing" hint={`so ${duo} can spot you first.`}>
          <input className={inputClass} value={outfit} onChange={(e) => setOutfit(e.target.value)} maxLength={80} placeholder="giant orange hat" />
        </Field>
        <Honeypot value={trap} onChange={setTrap} />
        {error && <p className="display text-[14px] text-cherry">{error}</p>}
        <PrimaryButton type="submit" disabled={busy || !name.trim() || !spotId}>
          {done ? (
            <span className="inline-flex items-center gap-2">
              <Check size={18} strokeWidth={3} /> you&apos;re on the board!
            </span>
          ) : busy ? (
            "saving…"
          ) : (
            "claim it"
          )}
        </PrimaryButton>
      </form>
    </main>
  );
}

export default function CrewPage() {
  return (
    <Suspense>
      <CrewInner />
    </Suspense>
  );
}
