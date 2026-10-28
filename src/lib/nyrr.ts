"use client";

import { useEffect, useMemo, useState } from "react";
import type { Anchor, RunnerProfile } from "@/lib/model";
import { MARATHON_MILES } from "@/lib/geo";
import { site } from "@/config/runner";

// liveresults.nyrr.org is an RTRT.me tracker. Its API answers simple CORS POSTs from any origin.
// APPID is the public web-tracker id shipped in every tracker page; the token is a random client id.
const API = "https://api.rtrt.me";
const APPID = "52139b797871851e0800638e";
const POLL_MS = 60_000;
const WINDOW_BEFORE_MS = 30 * 60_000;
const WINDOW_AFTER_MS = 8 * 3600_000;
const KM_TO_MI = 0.621371192;

export type LiveSplits = { anchors: Anchor[]; startedAt: string | null; finished: boolean; fetchedAt: string };
type RtrtSplit = { point: string; epochTime: string };
type RtrtProfile = { pid: string; bib: string };

function clientToken() {
  const key = "rtrt-token";
  let t = localStorage.getItem(key);
  if (!t) {
    t = Array.from(crypto.getRandomValues(new Uint8Array(10)), (b) => b.toString(16).padStart(2, "0")).join("").toUpperCase();
    localStorage.setItem(key, t);
  }
  return t;
}

async function rtrt<T>(path: string, params: Record<string, string>): Promise<T[]> {
  const body = new URLSearchParams({ appid: APPID, token: clientToken(), source: "webtracker", ...params });
  const res = await fetch(`${API}${path}`, { method: "POST", body, cache: "no-store" });
  if (!res.ok) throw new Error(`rtrt ${res.status}`);
  const json = await res.json();
  if (json.error) {
    if (json.error.type === "no_results") return [];
    throw new Error(json.error.msg ?? "rtrt error");
  }
  return json.list ?? [];
}

// Mat names: START, 3M, 5K, HALF, 14MAID, 25.2MILE, FINISH.
export function matMile(point: string): number | null {
  if (point === "START") return 0;
  if (point === "HALF") return 13.1094;
  if (point === "FINISH") return MARATHON_MILES;
  const km = point.match(/^(\d+(?:\.\d+)?)K$/);
  if (km) return Number(km[1]) * KM_TO_MI;
  const mi = point.match(/^(\d+(?:\.\d+)?)(M|MILE)$/);
  return mi ? Number(mi[1]) : null;
}

async function pidFor(event: string, bib: string) {
  const key = `rtrt-pid:${event}:${bib}`;
  const cached = localStorage.getItem(key);
  if (cached) return cached;
  const list = await rtrt<RtrtProfile>(`/events/${event}/profiles`, { search: bib, max: "5" });
  const pid = list.find((p) => p.bib === bib)?.pid ?? null;
  if (pid) localStorage.setItem(key, pid);
  return pid;
}

export async function fetchLiveSplits(event: string, bib: string): Promise<LiveSplits | null> {
  const pid = await pidFor(event, bib);
  if (!pid) return null;
  const splits = await rtrt<RtrtSplit>(`/events/${event}/profiles/${pid}/splits`, { max: "100" });
  // epochTime is the real crossing time; RTRT's `timestamp` field is local wall-clock mislabelled as UTC.
  const crossings = splits
    .map((s) => ({ point: s.point, mile: matMile(s.point), seenAt: new Date(Number(s.epochTime) * 1000).toISOString() }))
    .filter((s): s is { point: string; mile: number; seenAt: string } => s.mile !== null && Number.isFinite(Date.parse(s.seenAt)));
  return {
    anchors: crossings.filter((c) => c.mile > 0).map(({ mile, seenAt }) => ({ mile, seenAt })),
    startedAt: crossings.find((c) => c.point === "START")?.seenAt ?? null,
    finished: crossings.some((c) => c.point === "FINISH"),
    fetchedAt: new Date().toISOString(),
  };
}

// The start mat time replaces the guessed corral delay.
export function withLiveStart(r: RunnerProfile, live?: LiveSplits | null): RunnerProfile {
  return live?.startedAt ? { ...r, gunTime: live.startedAt, corralDelayMin: 0 } : r;
}

// Polls RTRT around race time; returns {} (pace model only) when the feed is off, empty or down.
// `?feed=<eventId>` overrides the event, e.g. `?feed=NYRR-NY2025&at=2025-11-02T16:00:00Z` to replay last year.
export function useLiveSplits(runners: RunnerProfile[], now: Date | null) {
  const [live, setLive] = useState<Record<string, LiveSplits>>({});
  const key = runners.map((r) => `${r.slug}:${r.bib ?? ""}`).join(",");
  const targets = useMemo(() => runners.filter((r) => r.bib), [key]); // eslint-disable-line react-hooks/exhaustive-deps
  const event = typeof window === "undefined" ? site.liveEvent : new URLSearchParams(window.location.search).get("feed") ?? site.liveEvent;
  const firstGun = Math.min(...targets.map((r) => Date.parse(r.gunTime)));
  const overridden = event !== site.liveEvent;
  const inWindow = !!now && (overridden || (now.getTime() > firstGun - WINDOW_BEFORE_MS && now.getTime() < firstGun + WINDOW_AFTER_MS));
  const allDone = targets.length > 0 && targets.every((r) => live[r.slug]?.finished);

  useEffect(() => {
    if (!event || !inWindow || allDone || targets.length === 0) return;
    let cancelled = false;
    const poll = async () => {
      if (document.visibilityState === "hidden") return;
      const results = await Promise.allSettled(targets.map((r) => fetchLiveSplits(event, r.bib!)));
      if (cancelled) return;
      setLive((prev) => {
        const next = { ...prev };
        results.forEach((res, i) => {
          if (res.status === "fulfilled" && res.value) next[targets[i].slug] = res.value;
        });
        return next;
      });
    };
    poll();
    const id = setInterval(poll, POLL_MS);
    const onVisible = () => document.visibilityState === "visible" && poll();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [event, inWindow, allDone, targets]);

  return live;
}
