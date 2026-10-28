"use client";

import { useEffect, useState } from "react";
import { Plus, Printer, Shuffle, X } from "lucide-react";
import { duo, sisters } from "@/config/runner";
import { Chip, Field, PageHeader, inputClass } from "@/components/ui";
import { Hi, Star } from "@/components/Stickers";
import { useCollection } from "@/lib/store";

const heads = ["GO {N}", "{N}", "RUN {N}", "GO {N}", "{N}", "HI {N}"];
const lines = [
  "THE BAGELS ARE GETTING COLD",
  "YOU'RE RUNNING BETTER THAN THE G TRAIN",
  "TOUCH HERE FOR POWER",
  "YOU PAID TO DO THIS",
  "WORST PARADE EVER",
  "I'D HAVE STAYED IN BED",
  "BLINK IF YOU WANT ME TO CALL AN UBER",
  "YOUR LEGS WILL FORGIVE YOU. EVENTUALLY.",
  "HURRY UP, I'M HUNGRY",
  "I'M COLD",
  "THE WALL IS A SOCIAL CONSTRUCT",
  "PAIN IS JUST THE FRENCH WORD FOR BREAD",
  "THERE'S A BRUNCH RESERVATION AT STAKE",
  "THIS IS A LOT OF WORK FOR A FREE BANANA",
  "YOU'RE ALMOST THERE (WE LIED)",
  "26.2 BECAUSE 26.3 WOULD BE CRAZY",
  "THE FINISH LINE HAS WI-FI",
  "DON'T STOP, PEOPLE ARE WATCHING",
  "STATEN ISLAND TO CENTRAL PARK, ON FOOT",
  "SEE YOU IN CENTRAL PARK",
];
const palettes = [
  { bg: "#fff200", fg: "#0b0b0b", sub: "#ff3ec8", star: "#ff3ec8" },
  { bg: "#ff3ec8", fg: "#0b0b0b", sub: "#ffffff", star: "#fff200" },
  { bg: "#0b0b0b", fg: "#fff200", sub: "#ffa6ec", star: "#ff3ec8" },
  { bg: "#22b5ff", fg: "#0b0b0b", sub: "#fff200", star: "#fff200" },
  { bg: "#3ee04f", fg: "#0b0b0b", sub: "#ffffff", star: "#ff3ec8" },
  { bg: "#ffffff", fg: "#0b0b0b", sub: "#ff3ec8", star: "#fff200" },
];

const EXTRA_KEY = "fi-sign-names";
const joinNames = (n: string[]) => (n.length < 2 ? n.join("") : `${n.slice(0, -1).join(", ")} & ${n[n.length - 1]}`);

export default function SignPage() {
  const { rows: friends } = useCollection("friends");
  const [extra, setExtra] = useState<string[]>([]);
  const [picked, setPicked] = useState<string[]>(sisters.map((s) => s.name));
  const [draft, setDraft] = useState("");
  const [ownLine, setOwnLine] = useState("");
  const [i, setI] = useState(0);
  const [p, setP] = useState(0);
  useEffect(() => {
    setI(Math.floor(Math.random() * lines.length));
    setP(Math.floor(Math.random() * palettes.length));
    try {
      setExtra(JSON.parse(localStorage.getItem(EXTRA_KEY) ?? "[]"));
    } catch {}
  }, []);
  const saveExtra = (next: string[]) => {
    setExtra(next);
    localStorage.setItem(EXTRA_KEY, JSON.stringify(next));
  };

  const options = [...new Set([...sisters.map((s) => s.name), ...friends.map((f) => f.name.trim()), ...extra].filter(Boolean))];
  const chosen = options.filter((n) => picked.includes(n));
  const toggle = (n: string) => setPicked((x) => (x.includes(n) ? x.filter((y) => y !== n) : [...x, n]));
  const addName = () => {
    const n = draft.trim();
    if (!n) return;
    if (!options.includes(n)) saveExtra([...extra, n]);
    setPicked((x) => (x.includes(n) ? x : [...x, n]));
    setDraft("");
  };

  const who = (chosen.length ? joinNames(chosen) : duo).toUpperCase();
  const title = heads[i % heads.length].replace("{N}", who);
  const line = ownLine.trim() ? ownLine.trim().toUpperCase() : lines[i];
  const k = Math.max(0.42, Math.min(1, Math.sqrt(11 / title.length)));
  const pal = palettes[p];
  const shuffle = () => {
    setI((x) => (x + 1 + Math.floor(Math.random() * (lines.length - 1))) % lines.length);
    setP((x) => (x + 1) % palettes.length);
  };

  return (
    <main>
      <div className="no-print">
        <PageHeader
          egg={{ src: "/pics/dirndl.jpg" }}
          back="/"
          eyebrow="make a sign"
          title={
            <>
              hold it <Hi tone="lime">up</Hi>
            </>
          }
          subtitle="pick the names, pick a line or write your own, print it."
        />
      </div>
      <div className="no-print mx-5 mb-3">
        <p className="display mb-2 text-[16px] lowercase">names on the sign</p>
        <div className="flex flex-wrap gap-2">
          {options.map((n) => (
            <span key={n} className="relative">
              <Chip on={picked.includes(n)} onClick={() => toggle(n)} aria-pressed={picked.includes(n)}>
                {n.toLowerCase()}
              </Chip>
              {extra.includes(n) && (
                <button
                  onClick={() => {
                    saveExtra(extra.filter((x) => x !== n));
                    setPicked((x) => x.filter((y) => y !== n));
                  }}
                  aria-label={`remove ${n}`}
                  className="press absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full border-2 border-ink bg-paper"
                >
                  <X size={11} strokeWidth={3} />
                </button>
              )}
            </span>
          ))}
        </div>
        <form
          className="mt-3 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            addName();
          }}
        >
          <input className={inputClass} value={draft} onChange={(e) => setDraft(e.target.value)} maxLength={24} placeholder="add a name" aria-label="add a name" />
          <button type="submit" disabled={!draft.trim()} className="press display flex shrink-0 items-center gap-1 rounded-[18px] border-[2.5px] border-ink bg-lime px-4 text-[16px] lowercase disabled:opacity-40">
            <Plus size={16} strokeWidth={3} /> add
          </button>
        </form>
      </div>
      <div className="px-5 pt-2">
        <div
          key={`${i}-${p}`}
          className="pop relative flex aspect-[11/8.5] flex-col items-center justify-center overflow-hidden rounded-[30px] border-[3px] border-ink p-7 text-center print:aspect-auto print:h-[95vh] print:rounded-none print:border-0"
          style={{ background: pal.bg, ["--k" as string]: k }}
        >
          <Star size={64} fill={pal.star} strokeWidth={6} className="absolute -top-3 -left-3 -rotate-12 print:!h-[200px] print:!w-[200px]" />
          <Star size={40} fill={pal.star} strokeWidth={7} className="absolute right-3 bottom-3 rotate-12 print:!h-[120px] print:!w-[120px]" />
          <p className="display text-[calc(12.5vw*var(--k))] leading-[0.86] tracking-[-0.04em] break-words uppercase sm:text-[calc(64px*var(--k))] print:text-[calc(150px*var(--k))]" style={{ color: pal.fg }}>
            {title}
          </p>
          <p className="display mt-4 text-[3.6vw] leading-tight tracking-[0.02em] sm:text-[18px] print:text-[46px]" style={{ color: pal.sub }}>
            {line}
          </p>
        </div>
      </div>
      <div className="no-print mx-5 mt-5">
        <Field label="your own line" hint="optional. leave blank to use the shuffled one.">
          <input className={inputClass} value={ownLine} onChange={(e) => setOwnLine(e.target.value)} maxLength={60} placeholder={lines[i].toLowerCase()} />
        </Field>
      </div>
      <div className="no-print mt-5 grid grid-cols-2 gap-3 px-5">
        <button onClick={shuffle} className="press display flex items-center justify-center gap-2 rounded-full border-[2.5px] border-ink bg-ink py-3.5 text-[18px] text-sun lowercase hover:bg-pink hover:text-ink">
          <Shuffle size={18} strokeWidth={2.6} /> shuffle
        </button>
        <button onClick={() => window.print()} className="press display flex items-center justify-center gap-2 rounded-full border-[2.5px] border-ink bg-paper py-3.5 text-[18px] lowercase hover:bg-lime">
          <Printer size={18} strokeWidth={2.6} /> print
        </button>
      </div>
      <p className="no-print mx-5 mt-4 text-center text-[11.5px] text-ink/70 lowercase tabular">
        line {i + 1} of {lines.length}. friends you&apos;re tracking show up as names automatically.
      </p>
    </main>
  );
}
