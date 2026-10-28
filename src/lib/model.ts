import { MARATHON_MILES } from "@/lib/geo";
import type { Spot } from "@/data/spots";
import { PLAN_MILES, type SplitPlan } from "@/data/splits";

export type Pace = { fast: number; goal: number; slow: number };

export type RunnerProfile = {
  slug: string;
  name: string;
  bib?: string;
  gunTime: string;
  corralDelayMin: number;
  pace: Pace;
  color: string;
  plan?: SplitPlan;
};

export type Anchor = { mile: number; seenAt: string };

export type Estimate =
  | { status: "pre"; startsAt: Date }
  | { status: "running" | "finished"; mile: number; lo: number; hi: number; anchor: Anchor | null };

export const startTime = (r: RunnerProfile) => new Date(new Date(r.gunTime).getTime() + r.corralDelayMin * 60_000);

const clampMile = (m: number) => Math.min(Math.max(m, 0), MARATHON_MILES);

export function latestAnchor(now: Date, r: RunnerProfile, sightings: Anchor[]): Anchor | null {
  const start = startTime(r).getTime();
  return (
    sightings
      .filter((s) => {
        const t = new Date(s.seenAt).getTime();
        return t > start && t <= now.getTime();
      })
      .sort((a, b) => new Date(b.seenAt).getTime() - new Date(a.seenAt).getTime())[0] ?? null
  );
}

// Split-plan model: interpolate the projected splits, rescaled by how the latest sighting compares to plan.
const GRID = [0, ...PLAN_MILES.slice(0, -1), MARATHON_MILES];

function interp(xs: number[], ys: number[], x: number) {
  if (x <= xs[0]) return ys[0];
  for (let i = 1; i < xs.length; i++) {
    if (x <= xs[i]) return ys[i - 1] + ((ys[i] - ys[i - 1]) * (x - xs[i - 1])) / (xs[i] - xs[i - 1]);
  }
  const n = xs.length - 1;
  return ys[n] + ((ys[n] - ys[n - 1]) * (x - xs[n])) / (xs[n] - xs[n - 1]);
}

const elapsedAt = (t: number[], mile: number) => interp(GRID, [0, ...t], mile);
const mileAt = (t: number[], sec: number) => clampMile(interp([0, ...t], GRID, sec));

function planScale(t: number[], anchorMile: number, anchorSec: number) {
  const projected = elapsedAt(t, anchorMile);
  if (projected <= 0 || anchorSec <= 0) return 1;
  const raw = anchorSec / projected;
  return anchorMile < 6.214 ? 0.7 * raw + 0.3 : raw;
}

function planMile(t: number[], nowSec: number, anchor: { mile: number; sec: number } | null) {
  if (!anchor) return mileAt(t, nowSec);
  const k = planScale(t, anchor.mile, anchor.sec);
  return mileAt(t, elapsedAt(t, anchor.mile) + (nowSec - anchor.sec) / k);
}

function planArrival(t: number[], mile: number, anchor: { mile: number; sec: number } | null) {
  if (!anchor || mile <= anchor.mile) return elapsedAt(t, mile);
  const k = planScale(t, anchor.mile, anchor.sec);
  return anchor.sec + (elapsedAt(t, mile) - elapsedAt(t, anchor.mile)) * k;
}

// Dead reckoning from the latest sighting (or the start mat), with a fast/slow band around goal pace.
export function estimate(now: Date, r: RunnerProfile, sightings: Anchor[] = []): Estimate {
  const start = startTime(r);
  if (now < start) return { status: "pre", startsAt: start };
  const anchor = latestAnchor(now, r, sightings);
  if (r.plan) {
    const nowSec = (now.getTime() - start.getTime()) / 1000;
    const a = anchor ? { mile: anchor.mile, sec: (new Date(anchor.seenAt).getTime() - start.getTime()) / 1000 } : null;
    const mile = planMile(r.plan.expected, nowSec, a);
    return {
      status: mile >= MARATHON_MILES ? "finished" : "running",
      mile,
      lo: Math.min(mile, planMile(r.plan.tough, nowSec, a)),
      hi: Math.max(mile, planMile(r.plan.strong, nowSec, a)),
      anchor,
    };
  }
  const baseMile = anchor ? anchor.mile : 0;
  const baseTime = anchor ? new Date(anchor.seenAt).getTime() : start.getTime();
  const elapsed = Math.max(0, (now.getTime() - baseTime) / 1000);
  const mile = clampMile(baseMile + elapsed / r.pace.goal);
  return {
    status: mile >= MARATHON_MILES ? "finished" : "running",
    mile,
    lo: clampMile(baseMile + elapsed / r.pace.slow),
    hi: clampMile(baseMile + elapsed / r.pace.fast),
    anchor,
  };
}

// When to be at a spot: earliest assumes the gun and fast pace, latest assumes the corral delay and slow pace.
export function spotWindow(r: RunnerProfile, spot: Pick<Spot, "mileFrom" | "mileTo">, now = new Date(), sightings: Anchor[] = []) {
  const anchor = latestAnchor(now, r, sightings);
  if (r.plan) {
    const s0 = startTime(r).getTime();
    const a = anchor ? { mile: anchor.mile, sec: (new Date(anchor.seenAt).getTime() - s0) / 1000 } : null;
    const base = a ? s0 : new Date(r.gunTime).getTime();
    return {
      earliest: new Date(base + planArrival(r.plan.strong, spot.mileFrom, a) * 1000),
      latest: new Date(s0 + planArrival(r.plan.tough, spot.mileTo, a) * 1000),
    };
  }
  if (anchor && anchor.mile < spot.mileFrom) {
    const t = new Date(anchor.seenAt).getTime();
    return {
      earliest: new Date(t + (spot.mileFrom - anchor.mile) * r.pace.fast * 1000),
      latest: new Date(t + (spot.mileTo - anchor.mile) * r.pace.slow * 1000),
    };
  }
  const gun = new Date(r.gunTime).getTime();
  return {
    earliest: new Date(gun + spot.mileFrom * r.pace.fast * 1000),
    latest: new Date(startTime(r).getTime() + spot.mileTo * r.pace.slow * 1000),
  };
}

export const projectedFinish = (r: RunnerProfile) =>
  new Date(startTime(r).getTime() + (r.plan ? r.plan.expected[r.plan.expected.length - 1] : MARATHON_MILES * r.pace.goal) * 1000);

const TZ = "America/New_York";

export const fmtClock = (d: Date) =>
  d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: TZ }).replace(" AM", " a.m.").replace(" PM", " p.m.");

export const fmtPace = (sec: number) => `${Math.floor(sec / 60)}:${String(Math.round(sec % 60)).padStart(2, "0")}`;

export const fmtDuration = (sec: number) => {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
};

export function parseDuration(input: string): number | null {
  const digits = input.replace(/\D/g, "");
  if (digits.length < 3 || digits.length > 5) return null;
  const padded = digits.padStart(5, "0");
  const h = Number(padded.slice(0, 1));
  const m = Number(padded.slice(1, 3));
  const s = Number(padded.slice(3, 5));
  if (m > 59 || s > 59) return null;
  return h * 3600 + m * 60 + s;
}

export function parsePace(input: string): number | null {
  const m = input.trim().match(/^(\d{1,2}):([0-5]\d)$/);
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
}
