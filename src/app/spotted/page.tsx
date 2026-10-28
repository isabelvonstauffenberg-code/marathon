"use client";

import { useEffect, useState } from "react";
import { duo, sisters } from "@/config/runner";
import { spotById } from "@/data/spots";
import { isMain, sisterBySlug } from "@/lib/me";
import { fmtClock } from "@/lib/model";
import { useCollection, useNow } from "@/lib/store";
import { LocalModeNote, PageHeader, SectionHead, timeAgo } from "@/components/ui";
import { Hi, Star } from "@/components/Stickers";
import { SpotForm } from "@/components/SpotForm";

export default function SpottedPage() {
  const now = useNow();
  const { rows: all, loading } = useCollection("sightings");
  const sightings = all.filter((s) => isMain(s.runner));
  const [photoFirst, setPhotoFirst] = useState(false);
  useEffect(() => setPhotoFirst(new URLSearchParams(window.location.search).get("photo") === "1"), []);

  return (
    <main>
      <PageHeader
        egg={{ src: "/pics/tie-dye.jpg" }}
        eyebrow="sightings"
        title={
          <>
            spotted <Hi tone="pink">{sisters[0].name}</Hi> or{" "}
            <Hi tone="sky" tilt={2}>
              {sisters[1].name}
            </Hi>
            ?
          </>
        }
        subtitle={`post it. your sighting moves their star on the map, so friends further up know who's coming.`}
      />
      <LocalModeNote />
      <div className="px-5">
        <SpotForm runners={sisters.map((s) => ({ slug: s.slug, name: s.name }))} photoFirst={photoFirst} />
      </div>

      <section className="mt-12">
        <SectionHead no="i." title="the feed" aside={<span className="display rounded-full border-2 border-ink bg-paper px-2.5 py-0.5 text-[12px] tabular">{sightings.length} posted</span>} />
        {loading ? null : sightings.length === 0 ? (
          <div className="mx-5 flex items-center gap-4 rounded-[28px] border-[2.5px] border-dashed border-ink bg-sun-soft p-5">
            <Star size={54} fill="#ffffff" strokeWidth={7} className="float shrink-0" style={{ ["--r" as string]: "-10deg" }} />
            <p className="display text-[20px] leading-[1.1] lowercase">no sightings yet.</p>
          </div>
        ) : (
          <ul className="rise mx-6 grid grid-cols-2 gap-x-5 gap-y-7">
            {sightings.map((s, i) => {
              const spot = spotById(s.spot_id);
              return (
                <li key={s.id} className={`sticker relative rounded-[22px] bg-paper p-2 pb-3 transition-transform duration-500 hover:rotate-0 ${i % 2 ? "rotate-[2deg]" : "-rotate-[2deg]"}`}>
                  <Star size={30} fill={sisterBySlug(s.runner)?.color ?? "#ff3ec8"} strokeWidth={8} className="absolute -top-3 -right-3 z-10 rotate-12" />
                  {s.photo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={s.photo_url} alt={`${sisterBySlug(s.runner)?.name} spotted by ${s.name}`} className="aspect-square w-full rounded-[14px] border-2 border-ink object-cover" />
                  ) : (
                    <div className="flex aspect-square w-full flex-col items-center justify-center rounded-[14px] border-2 border-ink" style={{ background: sisterBySlug(s.runner)?.color ?? "var(--pink)" }}>
                      <span className="tag !text-[10px]">mile</span>
                      <span className="display text-[52px] leading-none">{spot ? spot.mileFrom : s.mile}</span>
                    </div>
                  )}
                  <p className="display mt-2 line-clamp-2 px-1 text-[15px] leading-tight lowercase">
                    {sisterBySlug(s.runner)?.name} · {spot ? spot.name : `mile ${s.mile}`}
                  </p>
                  <p className="mt-0.5 truncate px-1 text-[10.5px] text-ink/70 lowercase">
                    {fmtClock(new Date(s.seen_at))}, by {s.name}
                  </p>
                  {now && <p className="tag mt-1 px-1 !text-[9.5px] text-pink">{timeAgo(s.seen_at, now)}</p>}
                </li>
              );
            })}
          </ul>
        )}
        <p className="mx-5 mt-8 text-center text-[11.5px] text-ink/70 lowercase">please keep photos to {duo}, not other runners.</p>
      </section>
    </main>
  );
}
