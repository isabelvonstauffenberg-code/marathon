// Everything personal lives here. Edit this file to make the app yours.
import { isabelPlan, type SplitPlan } from "@/data/splits";
export type Sister = {
  slug: string;
  name: string;
  pronouns: { subject: string; object: string; possessive: string };
  bib: string;
  wave: number;
  startColor: "orange" | "blue" | "green" | "pink";
  corral: string;
  // Gun time for the wave, with the race-day UTC offset (clocks fall back Nov 1, so EST).
  gunTime: string;
  // Minutes between the gun and actually crossing the start mat.
  corralDelayMin: number;
  // Seconds per mile.
  pace: { fast: number; goal: number; slow: number };
  // Map/accent colour for this runner.
  color: string;
  // Projected splits; Olivia runs the same plan as Isabel.
  plan?: SplitPlan;
  // Fill in after the race to crown the pool winner, e.g. 3 * 3600 + 41 * 60 + 7.
  finishTimeSec: number | null;
};

const she = { subject: "she", object: "her", possessive: "her" };

export const sisters: Sister[] = [
  {
    slug: "isabel",
    name: "Isabel",
    pronouns: she,
    bib: "60026",
    wave: 5,
    startColor: "pink",
    corral: "B",
    gunTime: "2026-11-01T11:30:00-05:00",
    corralDelayMin: 7,
    pace: { fast: 10 * 60 + 44, goal: 11 * 60 + 15, slow: 11 * 60 + 48 },
    plan: isabelPlan,
    color: "#ff3ec8",
    finishTimeSec: null,
  },
  {
    slug: "olivia",
    name: "Olivia",
    pronouns: she,
    bib: "26858",
    wave: 5,
    startColor: "pink",
    corral: "B",
    // Assigned blue Wave 2 (9:45 a.m.), but she starts with Isabel, so Isabel's wave, corral and start time apply.
    gunTime: "2026-11-01T11:30:00-05:00",
    corralDelayMin: 7,
    pace: { fast: 10 * 60 + 44, goal: 11 * 60 + 15, slow: 11 * 60 + 48 },
    plan: isabelPlan,
    color: "#22b5ff",
    finishTimeSec: null,
  },
];

export const site = {
  donateUrl: "https://donations.nyrr.org/donations/new?fundraiser=30014e38e1c39b802b72",
  donateCause: "NYRR Team for Kids",
  trackingUrl: "https://liveresults.nyrr.org/e/NYRR-NY2026",
  photos: [] as { src: string; caption: string }[],
};

export const duo = sisters.map((s) => s.name).join(" & ");

export const race = {
  name: "TCS New York City Marathon",
  shortName: "NYC Marathon",
  date: "2026-11-01",
  appName: `Find ${duo}`,
};
