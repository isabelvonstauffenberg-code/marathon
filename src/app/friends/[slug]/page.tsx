"use client";

import { useParams } from "next/navigation";
import { useMemo } from "react";
import { friendProfile } from "@/lib/me";
import { useCollection, useNow } from "@/lib/store";
import { PageHeader, SectionHead } from "@/components/ui";
import { Hi } from "@/components/Stickers";
import { RunnerLive } from "@/components/RunnerLive";
import { SpotTimeline } from "@/components/SpotTimeline";
import { SpotForm } from "@/components/SpotForm";

export default function FriendPage() {
  const { slug } = useParams<{ slug: string }>();
  const now = useNow(5000);
  const { rows: friends, loading } = useCollection("friends");
  const { rows: sightings } = useCollection("sightings", slug);
  const friend = friends.find((f) => f.slug === slug);
  const profile = useMemo(() => (friend ? friendProfile(friend) : null), [friend]);

  if (!profile) {
    return (
      <main>
        <PageHeader back="/friends" title={loading ? "loading…" : "runner not found"} subtitle={loading ? undefined : "they may have been added on another device in preview mode."} />
      </main>
    );
  }

  return (
    <main>
      <PageHeader back="/friends" eyebrow={profile.bib ? `bib ${profile.bib}` : "a friend"} title={profile.name} />
      <RunnerLive runners={[profile]} sightings={sightings} now={now} />
      <div className="mt-12">
        <SectionHead no="i." title={
            <>
              where to catch <Hi tone="pink">{profile.name.split(" ")[0]}</Hi>
            </>
          } />
        <SpotTimeline runners={[profile]} now={now} sightings={sightings} />
      </div>
      <div className="mt-12">
        <SectionHead no="ii." title="just saw them?" />
        <div className="px-5">
          <SpotForm runners={[{ slug: profile.slug, name: profile.name.split(" ")[0] }]} withPhoto={false} />
        </div>
      </div>
    </main>
  );
}
