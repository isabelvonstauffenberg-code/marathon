"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { Camera, Plus } from "lucide-react";
import { duo, race, site, sisters } from "@/config/runner";
import { CREW_KEY, friendProfile, mains, sightingsFor, toAnchors, toProfile } from "@/lib/me";
import { useCollection, useNow } from "@/lib/store";
import { useLiveSplits, withLiveStart } from "@/lib/nyrr";
import { estimate, fmtClock, fmtPace, projectedFinish, startTime, type Estimate, type RunnerProfile } from "@/lib/model";
import { RunnerLive } from "@/components/RunnerLive";
import type { MapRunner } from "@/components/CourseMap";
import { SpotTimeline } from "@/components/SpotTimeline";
import { Throwback } from "@/components/Snaps";
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

function BigButtons() {
  const buttons = [
    { href: "/spotted?photo=1", title: "upload pictures", tag: "photos", cta: "upload", bg: "bg-pink", star: "#fff200", icon: <Camera size={24} strokeWidth={2.5} />, tilt: -1.5 },
    { href: "/friends?add=1", title: "find your other friends", tag: "friends", cta: "add by bib", bg: "bg-sky", star: "#3ee04f", icon: <Plus size={26} strokeWidth={3} />, tilt: 1.5 },
  ];
  return (
    <div className="rise mx-5 grid grid-cols-2 gap-3.5">
      {buttons.map((b, i) => (
        <div key={b.href}>
          <div className="h-full" style={{ transform: `rotate(${b.tilt}deg)` }}>
          <Link href={b.href} className={`press group relative flex h-full min-h-[196px] flex-col rounded-[28px] border-[2.5px] border-ink p-4 pt-5 ${b.bg}`}>
            <span className="absolute -top-5 -right-3 transition-transform duration-500 group-hover:rotate-[72deg] group-hover:scale-110">
              <Star size={66} fill={b.star} strokeWidth={6} className="float" style={{ ["--r" as string]: `${i ? 10 : -12}deg`, animationDelay: `${i * -1.6}s` }} />
              <span className="absolute top-[53%] left-1/2 -translate-x-1/2 -translate-y-1/2">{b.icon}</span>
            </span>
            <span className="tag !text-[10px]">{b.tag}</span>
            <span className="display mt-2 block pr-2 text-[30px] leading-[0.9] tracking-[-0.03em] lowercase">{b.title}</span>
            <span className="mt-auto flex items-center justify-between gap-2 pt-4">
              <span className="display rounded-full border-2 border-ink bg-ink px-3 py-1 text-[13px] text-sun lowercase">{b.cta}</span>
              <span aria-hidden className="display flex h-9 w-9 items-center justify-center rounded-full border-2 border-ink bg-lime text-[18px] transition-transform group-hover:translate-x-1">
                →
              </span>
            </span>
          </Link>
          </div>
        </div>
      ))}
    </div>
  );
}

const mileLabel = (est: Estimate | null) =>
  !est ? "" : est.status === "pre" ? `starts ${fmtClock(est.startsAt)}` : est.status === "finished" ? "finished!" : `mile ${est.mile.toFixed(1)}`;

function YourFriends({ rows }: { rows: { profile: RunnerProfile; est: Estimate | null }[] }) {
  return (
    <div className="mx-5 mt-4 rounded-[24px] border-[2.5px] border-ink bg-paper p-3.5">
      <div className="flex items-center justify-between gap-3">
        <p className="display flex items-center gap-2 text-[20px] leading-none lowercase">
          <Sparkle size={16} /> your friends
        </p>
        <Link href="/friends?add=1" className="press display shrink-0 rounded-full border-2 border-ink bg-lime px-3 py-1 text-[12.5px] lowercase">
          + {rows.length ? "add another" : "add a friend"}
        </Link>
      </div>
      {rows.length ? (
        <ul className="mt-3 border-t-2 border-dashed border-ink/30">
          {rows.map(({ profile, est }) => (
            <li key={profile.slug} className="border-b-2 border-dashed border-ink/30 last:border-b-0">
              <Link href={`/friends/${profile.slug}`} className="group flex items-center gap-2.5 py-2.5">
                <Star size={26} fill={profile.color} strokeWidth={8} className="shrink-0 transition-transform duration-500 group-hover:rotate-[72deg]" />
                <span className="display min-w-0 flex-1 truncate text-[19px] leading-none lowercase">{profile.name}</span>
                <span className="display shrink-0 rounded-full border-2 border-ink px-2.5 py-0.5 text-[12px] lowercase tabular" style={{ background: profile.color }}>
                  {mileLabel(est)}
                </span>
                <span aria-hidden className="display text-[18px] transition-transform group-hover:translate-x-1">
                  →
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-[12px] leading-[1.55] lowercase">running with friends? add their bib and their star shows up on this map.</p>
      )}
    </div>
  );
}

const contents = [
  { href: "/stand", title: "where to stand", body: "spots, trains, arrival windows", tone: "#ffffff" },
  { href: "/crew", title: "claim a mile", body: "pick a spot on the course", tone: "#ffa6ec" },
  { href: "/spotted", title: "spotted", body: "post a sighting, update the map", tone: "#c8efff" },
    { href: "/sign", title: "make a sign", body: "pick a line, add names, print", tone: "#ffa6ec" },
  { href: "/friends", title: "friends", body: "follow everyone else running", tone: "#c8efff" },
];

export default function Home() {
  const now = useNow(1000);
  const router = useRouter();
  const { rows: sightings } = useCollection("sightings");
  const { rows: claims } = useCollection("claims", CREW_KEY);
  const { rows: friends } = useCollection("friends");
  const friendProfiles = useMemo(() => friends.map(friendProfile), [friends]);
  const friendLive = useLiveSplits(friendProfiles, now);
  const friendRows = useMemo(
    () =>
      friendProfiles.map((fp) => {
        const profile = withLiveStart(fp, friendLive[fp.slug]);
        const anchors = [...toAnchors(sightingsFor(sightings, profile.slug)), ...(friendLive[fp.slug]?.anchors ?? [])];
        return { profile, est: now ? estimate(now, profile, anchors) : null };
      }),
    [friendProfiles, friendLive, sightings, now],
  );
  const friendMarkers: MapRunner[] = friendRows
    .filter(({ est }) => est)
    .map(({ profile: p, est }) => ({ id: p.slug, name: p.name, color: p.color, mile: est!.status === "pre" ? 0 : est!.mile }));
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
            where to stand, when to get there, and roughly where {duo} are on the course.
          </p>
          <SpinBadge text="★ two sisters ★ five boroughs ★ 26.2 " size={92} className="-mb-1" />
        </div>
      </header>

      <div className="mt-8">
        <Bib tilt={-1.6} />
      </div>

      <div className="mt-9">
        {started ? (
          <div className="stamp mx-5 rounded-[24px] border-[2.5px] border-ink bg-ink px-5 py-4 text-sun" style={{ ["--r" as string]: "-1deg" }}>
            <p className="display text-[13px] text-pink lowercase">they&apos;re off</p>
            <p className="display mt-1 text-[22px] leading-[1.08] lowercase">
              {new Set(sisters.map((s) => +startTime(toProfile(s)))).size === 1
                ? `${duo} crossed the start at ${fmtClock(startTime(toProfile(sisters[0])))}.`
                : `${sisters.map((s) => `${s.name} crossed the start at ${fmtClock(startTime(toProfile(s)))}`).join(", ")}.`}
            </p>
          </div>
        ) : (
          <Countdown now={now} />
        )}
      </div>

      <div className="mt-8">
        <BigButtons />
      </div>

      <div className="mt-12">
        <SectionHead no="i." title="whereabouts" aside={<Pill tone="muted">live-ish</Pill>} />
        <RunnerLive runners={mains} sightings={sightings} now={now} spotBadges={badges} onSpotClick={(id) => router.push(`/crew?spot=${id}`)} extraMapRunners={friendMarkers} />
        <YourFriends rows={friendRows} />
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
        <SectionHead no="iii." title="the archive" aside={<Pill tone="muted">swipe →</Pill>} />
        <Throwback />
      </div>

      <div className="mt-12">
        <SectionHead no="iv." title="the goods" />
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
          <p className="tag">fundraising</p>
          <p className="display mt-2 text-[36px] leading-[0.95] lowercase">{site.donateCause || "donate"}.</p>
          <p className="mt-3 text-[13px] leading-relaxed lowercase">
            {duo} are running this one as fundraisers.
          </p>
          <p className="display mt-4 inline-block rounded-full bg-ink px-4 py-2 text-[15px] text-sun">donate →</p>
        </a>
      )}

      <footer className="mx-5 mt-12 rounded-[28px] border-[2.5px] border-ink bg-paper p-5">
        <p className="display flex items-center gap-2 text-[18px] lowercase">
          <Sparkle size={16} /> a note on accuracy
        </p>
        <p className="mt-2 text-[12px] leading-[1.65] lowercase">
          official times come from the nyrr timing mats (start, every mile and 5k, the half, the finish), checked every minute while this page is open. between mats, and whenever the feed is down, star positions are estimated from projected splits ({sisters.map((x) => `${x.name} ${fmtPace(x.pace.goal)}, finishing about ${fmtClock(projectedFinish(toProfile(x)))}`).join("; ")})
          and sightings posted here.
        </p>
        <a href={site.trackingUrl} target="_blank" rel="noreferrer" className="press display mt-4 inline-block rounded-full border-2 border-ink bg-sun px-4 py-1.5 text-[14px] lowercase">
          official tracking →
        </a>
      </footer>
    </main>
  );
}
