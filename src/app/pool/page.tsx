"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Lock } from "lucide-react";
import { site, sisters } from "@/config/runner";
import { fmtDuration, parseDuration, projectedFinish, startTime } from "@/lib/model";
import { toProfile } from "@/lib/me";
import { insert, rememberName, rememberedName, useCollection, useNow } from "@/lib/store";
import { Field, Honeypot, LocalModeNote, PageHeader, PrimaryButton, inputClass } from "@/components/ui";
import { Hi, Sparkle, Star } from "@/components/Stickers";

export default function PoolPage() {
  const now = useNow();
  const [slug, setSlug] = useState(sisters[0].slug);
  const runner = sisters.find((s) => s.slug === slug)!;
  const me = toProfile(runner);
  const { rows: guesses } = useCollection("guesses", slug);
  const [name, setName] = useState("");
  const [time, setTime] = useState("");
  const [trap, setTrap] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => setName(rememberedName()), []);

  const locked = now ? now >= new Date(runner.gunTime) : false;
  const seconds = parseDuration(time);
  const actual = runner.finishTimeSec;
  const goalSec = Math.round((projectedFinish(me).getTime() - startTime(me).getTime()) / 1000);

  const sorted = useMemo(() => [...guesses].sort((a, b) => a.seconds - b.seconds), [guesses]);
  const ranked = useMemo(
    () => (actual ? [...guesses].sort((a, b) => Math.abs(a.seconds - actual) - Math.abs(b.seconds - actual)) : []),
    [guesses, actual],
  );
  const min = Math.min(goalSec - 1800, ...sorted.map((g) => g.seconds));
  const max = Math.max(goalSec + 1800, ...sorted.map((g) => g.seconds));
  const pos = (s: number) => `${((s - min) / (max - min || 1)) * 100}%`;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (trap || seconds === null) return;
    setBusy(true);
    setError(null);
    try {
      await insert("guesses", { runner: slug, name: name.trim(), seconds });
      rememberName(name.trim());
      setDone(true);
      setTime("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main>
      <PageHeader
        back="/"
        eyebrow="the pool"
        title={
          <>
            call the <Hi tone="lime">time</Hi>
          </>
        }
        subtitle={`closest guess wins eternal glory. furthest gets publicly shamed. guesses lock at each sister's gun. no insider trading.`}
      />
      <LocalModeNote />

      <div className="mx-5 mb-6 grid grid-cols-2 gap-1 rounded-full border-[2.5px] border-ink bg-paper p-1">
        {sisters.map((s) => (
          <button
            key={s.slug}
            onClick={() => {
              setSlug(s.slug);
              setDone(false);
            }}
            className={`press display flex items-center justify-center gap-2 rounded-full py-2.5 text-[22px] lowercase ${slug === s.slug ? "border-2 border-ink" : "border-2 border-transparent hover:bg-sun-soft"}`}
            style={{ background: slug === s.slug ? s.color : undefined }}
          >
            {slug === s.slug && <Star size={22} fill="#fff200" strokeWidth={8} className="stamp" />}
            {s.name}
          </button>
        ))}
      </div>

      <section className="mx-5 rounded-[28px] border-[2.5px] border-ink bg-paper p-4">
        <div className="flex items-baseline justify-between">
          <p className="display text-[22px] lowercase">the board</p>
          <p className="tag !text-[11px] tabular">{guesses.length} guesses</p>
        </div>
        <div className="relative mx-2 mt-10 mb-3 h-[14px] rounded-full border-[2.5px] border-ink bg-sun">
          <div className="display absolute -top-8 -translate-x-1/2 rounded-full bg-ink px-2 py-0.5 text-[10.5px] text-sun" style={{ left: pos(goalSec) }}>
            goal
          </div>
          <div className="absolute -top-2 -bottom-2 w-[3px] -translate-x-1/2 rounded-full bg-ink" style={{ left: pos(goalSec) }} />
          {sorted.map((g) => (
            <div key={g.id} title={`${g.name}: ${fmtDuration(g.seconds)}`} className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2" style={{ left: pos(g.seconds) }}>
              <Star size={20} fill={runner.color} strokeWidth={9} gloss={false} />
            </div>
          ))}
          {actual && <div className="absolute -top-3 -bottom-3 w-[4px] -translate-x-1/2 rounded-full bg-lime ring-2 ring-ink" style={{ left: pos(actual) }} />}
        </div>
        <div className="tag flex justify-between !text-[10px] tabular">
          <span>{fmtDuration(min)}</span>
          <span>{fmtDuration(max)}</span>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-2.5">
          <div className="relative rounded-[22px] border-[2.5px] border-ink bg-lime p-3.5">
            <Star size={30} fill="#fff200" strokeWidth={8} className="float absolute -top-3 -right-2" style={{ ["--r" as string]: "12deg" }} />
            <p className="tag !text-[10px]">hall of glory</p>
            <p className="display mt-1 truncate text-[24px] leading-tight lowercase">{ranked[0]?.name ?? "tbd"}</p>
            <p className="text-[11px] leading-snug lowercase">{ranked[0] ? fmtDuration(ranked[0].seconds) : "bragging rights, forever"}</p>
          </div>
          <div className="relative rounded-[22px] border-[2.5px] border-ink bg-bubble p-3.5">
            <p className="tag !text-[10px]">wall of shame</p>
            <p className="display mt-1 truncate text-[24px] leading-tight lowercase">{ranked.length > 1 ? ranked[ranked.length - 1].name : "tbd"}</p>
            <p className="text-[11px] leading-snug lowercase">
              {ranked.length > 1 ? fmtDuration(ranked[ranked.length - 1].seconds) : `clearly doubted ${runner.pronouns.object}`}
            </p>
          </div>
        </div>

        {sorted.length > 0 && (
          <ul className="mt-2">
            {(actual ? ranked : sorted).map((g) => (
              <li key={g.id} className="flex items-baseline gap-3 border-b-2 border-dashed border-ink/20 py-2.5 last:border-0">
                <span className="display text-[19px] lowercase">{g.name}</span>
                <span className="flex-1" />
                <span className="display text-[19px] tabular">{fmtDuration(g.seconds)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <form onSubmit={submit} className="relative mx-5 mt-10 overflow-hidden rounded-[30px] border-[2.5px] border-ink bg-ink text-paper">
        <div className="flex items-center justify-between gap-3 border-b-[2.5px] border-dashed border-paper/25 px-5 py-4">
          <p className="display text-[32px] leading-none text-sun lowercase">your call</p>
          <span className="display rotate-6 rounded-full border-2 border-ink px-3 py-1 text-[12px] text-ink lowercase" style={{ background: runner.color }}>
            {runner.name}&apos;s pool
          </span>
        </div>
        <div className="px-5 pt-5 pb-6">
          {locked ? (
            <p className="display flex items-center gap-2 text-[18px] lowercase">
              <Lock size={17} strokeWidth={2.4} className="text-sun" /> guesses are locked. good luck, everyone.
            </p>
          ) : (
            <div className="space-y-5 [&_.display]:text-paper [&_label>span:not(.display)]:!text-paper/60">
              <Field label="your name">
                <input className={`${inputClass} text-ink`} value={name} onChange={(e) => setName(e.target.value)} maxLength={40} required />
              </Field>
              <Field label="finish time" hint="just type the numbers. 34107 becomes 3:41:07.">
                <input
                  className={`${inputClass} text-ink tabular`}
                  inputMode="numeric"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  placeholder={fmtDuration(goalSec)}
                  required
                />
              </Field>
              {seconds !== null && (
                <p className="stamp display flex items-center gap-2 text-[56px] leading-none !text-sun tabular" key={seconds}>
                  {fmtDuration(seconds)} <Sparkle size={22} fill="var(--pink)" />
                </p>
              )}
              <Honeypot value={trap} onChange={setTrap} />
              {error && <p className="display text-[14px] !text-cherry">{error}</p>}
              <PrimaryButton type="submit" disabled={busy || seconds === null || !name.trim() || done} className="!border-sun !bg-sun !text-ink hover:!bg-pink disabled:!border-paper/40 disabled:!bg-transparent disabled:!text-paper/50">
                {done ? (
                  <>
                    <Check size={18} strokeWidth={3} /> locked in!
                  </>
                ) : busy ? (
                  "saving…"
                ) : (
                  "lock it in"
                )}
              </PrimaryButton>
            </div>
          )}
          <p className="tag mt-6 !text-[9.5px] text-paper/40 tabular">admit one · no. 0026 · no refunds on hubris</p>
        </div>
      </form>
      {site.donateUrl && (
        <a href={site.donateUrl} target="_blank" rel="noreferrer" className="press display mx-5 mt-6 inline-block rounded-full border-2 border-ink bg-pink px-4 py-2 text-[15px] lowercase">
          put your money where your guess is →
        </a>
      )}
      <div className="h-6" aria-hidden />
    </main>
  );
}
