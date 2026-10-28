import { sisters, type Sister } from "@/config/runner";
import type { RunnerProfile } from "@/lib/model";
import type { FriendRunner, Sighting } from "@/lib/store";

// Claims are shared: one friend at a spot cheers for both sisters.
export const CREW_KEY = "sisters";

export const toProfile = (s: Sister): RunnerProfile => ({
  slug: s.slug,
  name: s.name,
  bib: s.bib,
  gunTime: s.gunTime,
  corralDelayMin: s.corralDelayMin,
  pace: s.pace,
  color: s.color,
  plan: s.plan,
});

export const mains: RunnerProfile[] = sisters.map(toProfile);
export const isMain = (slug: string) => sisters.some((s) => s.slug === slug);
export const sisterBySlug = (slug: string) => sisters.find((s) => s.slug === slug);

export const friendProfile = (f: FriendRunner): RunnerProfile => ({
  slug: f.slug,
  name: f.name,
  bib: f.bib ?? undefined,
  gunTime: f.gun_time,
  corralDelayMin: f.corral_delay_min,
  pace: { fast: f.pace_fast, goal: f.pace_goal, slow: f.pace_slow },
  color: f.color,
});

export const toAnchors = (sightings: Sighting[]) => sightings.map((s) => ({ mile: Number(s.mile), seenAt: s.seen_at }));
export const sightingsFor = (all: Sighting[], slug: string) => all.filter((s) => s.runner === slug);
