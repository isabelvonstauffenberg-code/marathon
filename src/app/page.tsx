"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { duo, race, site, sisters } from "@/config/runner";
import { CREW_KEY, mains, toProfile } from "@/lib/me";
import { useCollection, useNow } from "@/lib/store";
import { fmtClock, fmtPace, projectedFinish, startTime } from "@/lib/model";
import { RunnerLive } from "@/components/RunnerLive";
import { SpotTimeline } from "@/components/SpotTimeline";
import { Pill, SectionHead } from "@/components/ui";
import { Hi, Sparkle, SpinBadge, Star } from "@/components/Stickers";

const START_COLORS = { orange: "#ff8a1f", blue: "#22b5ff", green: "#3ee04f", pink: "#ff3ec8" } as const;

const firstGun = new Date(Math.min(...sisters.map((s) => new Date(s.gunTime).getTime())));

function Countdown({ now }: { now: Date | null }) {
  const gun = firstGun;
  if (!now) return <div className="h-[104px]" />;
  const diff = Math.max(0, gun.getTime() - now.getTime());
  if (diff === 0) return null;
  const parts = [
    { v: Math.floor(diff / 86_400_000), l: "days" },
    { v: Math.floor((diff / 3_600_000) % 24), l: "hrs" },
    { v: Math.floor((diff / 60_000) % 60), l: "min" },
    { v: Math.floor((diff / 1000) % 60), l: "sec" },
  ];
  return (
    <div className="mx-5">
      <p className="display mb-2 text-[16px] lowercase">until the first gun</p>
      <div className="grid grid-cols-4 gap-2">
        {parts.map((p, i) => (
          <div key={p.l} className={`rounded-[22px] border-[2.5px] border-ink py-3 text-center ${i === 3 ? "bg-pink" : "bg-ink text-sun"}`}>
            <p className="display text-[40px] leading-none tabular">{String(p.v).padStart(2, "0")}</p>
            <p className="tag mt-1.5 !text-[10px] opacity-80">{p.l}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function Bib({ tilt }: { tilt: number }) {
  const lead = sisters[0];
  const band = START_COLORS[lead.startColor];
  return (
    <div className="px-6 py-1.5">
      <div className="sticker peel relative overflow-hidden rounded-[30px] bg-paper transition-transform duration-500 hover:rotate-0" style={{ transform: `rotate(${tilt}deg)` }}>
        <div className="flex items-center justify-between border-b-[2.5px] border-ink px-5 py-2" style={{ background: band }}>
          <span className="display text-[12px] lowercase">{lead.startColor} start · running together</span>
          <span className="display text-[12px]">nyc ’26</span>
        </div>
        <div className="relative px-5 pt-3 pb-5">
          <div className="grid grid-cols-2 gap-3">
            {sisters.map((s, i) => (
              <div key={s.slug} className={i ? "border-l-2 border-dashed border-ink/30 pl-3" : ""}>
                <p className="display text-[44px] leading-[0.95] tracking-[-0.05em] tabular">{s.bib}</p>
                <p className="tag mt-1 flex items-center gap-1.5 !text-[11px] text-ink/70">
                  <span className="inline-block h-2.5 w-2.5 rounded-full border border-ink" style={{ background: s.color }} />
                  {s.name}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2">
            {[
              { k: "wave", v: String(lead.wave) },
              { k: "corral", v: lead.corral },
              { k: "gun", v: fmtClock(new Date(lead.gunTime)).replace(/ [ap]\.m\./, "") },
            ].map((c) => (
              <div key={c.k} className="rounded-[16px] border-2 border-ink px-2.5 py-1.5" style={{ background: c.k === "gun" ? lead.color : "var(--sun)" }}>
                <p className="tag !text-[9.5px]">{c.k}</p>
                <p className="display text-[22px] leading-tight tabular">{c.v}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const contents = [
  { href: "/stand", title: "where to stand", body: "spots, trains, arrival windows", tone: "#ffffff" },
  { href: "/crew", title: "claim a mile", body: "so no mile goes unloved", tone: "#ffa6ec" },
  { href: "/spotted", title: "spotted!", body: "post a sighting, move the dot", tone: "#c8efff" },
  { href: "/pool", title: "the pool", body: "call the finish time", tone: "#ffffff" },
  { href: "/sign", title: "make a sign", body: "shuffle, print, hold high", tone: "#ffa6ec" },
  { href: "/friends", title: "friends", body: "follow everyone else running", tone: "#c8efff" },
];

export default function Home() {
  const now = useNow(1000);
  const router = useRouter();
  const { rows: sightings } = useCollection("sightings");
  const { rows: claims } = useCollection("claims", CREW_KEY);
  const badges = claims.reduce<Record<string, number>>((acc, c) => ({ ...acc, [c.spot_id]: (acc[c.spot_id] ?? 0) + 1 }), {});
  const gun = firstGun;
  const started = now && now >= gun;
  const dateLabel = gun.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "America/New_York" }).toLowerCase();

  return (
    <main className="pt-5">
      <header className="rise relative px-5">
        <div className="flex items-center justify-between">
          <span className="display rounded-full border-2 border-ink bg-paper px-3 py-1 text-[12.5px] lowercase">{race.shortName}</span>
          <span className="tag !text-[11px]">{dateLabel}</span>
        </div>
        <div className="relative mt-6">
          <h1 className="display lowercase">
            <span className="block text-[30px] leading-none">find</span>
            <span className="mt-1 block text-[84px] leading-[0.86] tracking-[-0.06em]">{sisters[0].name}</span>
            <span className="mt-2 flex items-center gap-2 text-[84px] leading-[0.86] tracking-[-0.06em]">
              <Hi tone="ink" tilt={-4}>
                <span className="px-1 text-[56px] text-sun">&amp;</span>
              </Hi>
              {sisters[1].name}
            </span>
          </h1>
          <Star size={78} fill={sisters[0].color} className="float absolute -top-3 right-2" style={{ ["--r" as string]: "14deg" }} />
          <Star size={46} fill={sisters[1].color} className="float absolute top-[96px] right-[74px]" style={{ ["--r" as string]: "-10deg", animationDelay: "-1.8s" }} />
          <Sparkle size={22} className="float absolute top-[54px] right-[104px]" style={{ animationDelay: "-0.9s" }} />
        </div>
        <div className="mt-6 flex items-end justify-between gap-4">
          <p className="max-w-[28ch] text-[13.5px] leading-[1.6] lowercase">
            a spectator&apos;s guide to spotting two sisters among tens of thousands of runners, across five boroughs, before they find the finish. snacks recommended.
          </p>
          <SpinBadge text="★ two sisters ★ one mission ★ 26.2 " size={92} className="-mb-1" />
        </div>
      </header>

      <div className="mt-8">
        <Bib tilt={-1.6} />
      </div>

      <div className="mt-9">
        {started ? (
          <div className="stamp mx-5 rounded-[24px] border-[2.5px] border-ink bg-ink px-5 py-4 text-sun" style={{ ["--r" as string]: "-1deg" }}>
            <p className="display text-[13px] text-pink lowercase">they&apos;re off!</p>
            <p className="display mt-1 text-[22px] leading-[1.08] lowercase">
              {sisters.map((s) => `${s.name} crossed the mat at ${fmtClock(startTime(toProfile(s)))}`).join(", ").replace(/\.$/, "")}. GO SUPPORT!!
            </p>
          </div>
        ) : (
          <Countdown now={now} />
        )}
      </div>

      <div className="mt-12">
        <SectionHead no="i." title="whereabouts" aside={<Pill tone="muted">live-ish</Pill>} />
        <RunnerLive runners={mains} sightings={sightings} now={now} spotBadges={badges} onSpotClick={(id) => router.push(`/crew?spot=${id}`)} />
      </div>

      <div className="mt-12">
        <SectionHead
          no="ii."
          title="next up"
          aside={
            <Link href="/stand" className="press display rounded-full border-2 border-ink bg-ink px-3 py-1 text-[12.5px] text-sun">
              all spots →
            </Link>
          }
        />
        <SpotTimeline runners={mains} now={now} sightings={sightings} claims={claims} limit={3} />
      </div>

      <div className="mt-12">
        <SectionHead no="iii." title="the goods" />
        <ol className="rise mx-5 overflow-hidden rounded-[28px] border-[2.5px] border-ink bg-lime">
          {contents.map((c, i) => (
            <li key={c.href} className={i ? "border-t-[2.5px] border-ink" : ""}>
              <Link href={c.href} className="group flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-paper">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center transition-transform duration-500 group-hover:rotate-[72deg] group-hover:scale-110">
                  <Star size={44} fill={c.tone} strokeWidth={7} gloss={false} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="display block text-[24px] leading-none lowercase">{c.title}</span>
                  <span className="tag mt-1 block !text-[10.5px] text-ink/70">{c.body}</span>
                </span>
                <span className="display text-[22px] transition-transform group-hover:translate-x-1" aria-hidden>
                  →
                </span>
              </Link>
            </li>
          ))}
        </ol>
      </div>

      {site.donateUrl && (
        <a href={site.donateUrl} target="_blank" rel="noreferrer" className="press group relative mx-5 mt-12 block overflow-hidden rounded-[28px] border-[2.5px] border-ink bg-pink p-6">
          <p className="tag">the actual point</p>
          <p className="display mt-2 text-[36px] leading-[0.95] lowercase">do the decent thing.</p>
          <p className="mt-3 text-[13px] leading-relaxed lowercase">
            {duo} run 26.2 miles for {site.donateCause || "a good cause"}. you tap one button. fair trade.
          </p>
          <p className="display mt-4 inline-block rounded-full bg-ink px-4 py-2 text-[15px] text-sun">donate →</p>
        </a>
      )}

      <footer className="mx-5 mt-12 rounded-[28px] border-[2.5px] border-ink bg-paper p-5">
        <p className="display flex items-center gap-2 text-[18px] lowercase">
          <Sparkle size={16} /> a note on accuracy
        </p>
        <p className="mt-2 text-[12px] leading-[1.65] lowercase">
          the stars are educated guesses from projected splits ({sisters.map((x) => `${x.name} ${fmtPace(x.pace.goal)}, finishing about ${fmtClock(projectedFinish(toProfile(x)))}`).join("; ")}) plus your
          sightings. official timing mats are at the start, every 5k, the half, mile 20 and the finish, in the nyrr app.
        </p>
        <a href={site.trackingUrl} target="_blank" rel="noreferrer" className="press display mt-4 inline-block rounded-full border-2 border-ink bg-sun px-4 py-1.5 text-[14px] lowercase">
          official tracking →
        </a>
      </footer>
    </main>
  );
}
