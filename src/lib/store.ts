"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { useCallback, useEffect, useState } from "react";

export type Claim = { id: string; runner: string; spot_id: string; name: string; outfit: string | null; created_at: string };
export type Sighting = { id: string; runner: string; spot_id: string; mile: number; seen_at: string; name: string; photo_url: string | null; created_at: string };
export type Guess = { id: string; runner: string; name: string; seconds: number; created_at: string };
export type FriendRunner = {
  id: string;
  runner: string;
  slug: string;
  name: string;
  bib: string | null;
  gun_time: string;
  corral_delay_min: number;
  pace_fast: number;
  pace_goal: number;
  pace_slow: number;
  color: string;
  added_by: string | null;
  created_at: string;
};

type Tables = { claims: Claim; sightings: Sighting; guesses: Guess; friends: FriendRunner };
export type TableName = keyof Tables;
type NewRow<T extends TableName> = Omit<Tables[T], "id" | "created_at">;

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let client: SupabaseClient | null = null;
function supabase() {
  if (!url || !anonKey) return null;
  client ??= createClient(url, anonKey, { auth: { persistSession: false } });
  return client;
}

export const isShared = () => Boolean(url && anonKey);

const LOCAL_PREFIX = "marathon-tracker:";
const CHANGE_EVENT = "marathon-tracker:change";

function readLocal<T extends TableName>(table: T): Tables[T][] {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_PREFIX + table) ?? "[]");
  } catch {
    return [];
  }
}

export async function list<T extends TableName>(table: T, runner?: string): Promise<Tables[T][]> {
  const sb = supabase();
  if (sb) {
    let q = sb.from(table).select("*").order("created_at", { ascending: false }).limit(500);
    if (runner) q = q.eq("runner", runner);
    const { data, error } = await q;
    if (error) throw error;
    return data as Tables[T][];
  }
  const rows = readLocal(table);
  return (runner ? rows.filter((r) => r.runner === runner) : rows).sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export async function insert<T extends TableName>(table: T, row: NewRow<T>): Promise<Tables[T]> {
  const sb = supabase();
  if (sb) {
    const { data, error } = await sb.from(table).insert(row as never).select().single();
    if (error) throw error;
    window.dispatchEvent(new Event(CHANGE_EVENT));
    return data as Tables[T];
  }
  const full = { ...row, id: crypto.randomUUID(), created_at: new Date().toISOString() } as Tables[T];
  localStorage.setItem(LOCAL_PREFIX + table, JSON.stringify([full, ...readLocal(table)]));
  window.dispatchEvent(new Event(CHANGE_EVENT));
  return full;
}

async function compress(file: File, maxSide = 1280): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const ratio = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * ratio);
  canvas.height = Math.round(bitmap.height * ratio);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Could not read photo"))), "image/jpeg", 0.8));
}

export async function uploadPhoto(file: File): Promise<string> {
  const blob = await compress(file, isShared() ? 1280 : 640);
  const sb = supabase();
  if (sb) {
    const path = `${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.jpg`;
    const { error } = await sb.storage.from("sightings").upload(path, blob, { contentType: "image/jpeg" });
    if (error) throw error;
    return sb.storage.from("sightings").getPublicUrl(path).data.publicUrl;
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export function useCollection<T extends TableName>(table: T, runner?: string, pollMs = 20_000) {
  const [rows, setRows] = useState<Tables[T][]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setRows(await list(table, runner));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load");
    } finally {
      setLoading(false);
    }
  }, [table, runner]);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, pollMs);
    const onChange = () => refresh();
    window.addEventListener(CHANGE_EVENT, onChange);
    window.addEventListener("storage", onChange);
    window.addEventListener("focus", onChange);
    return () => {
      clearInterval(id);
      window.removeEventListener(CHANGE_EVENT, onChange);
      window.removeEventListener("storage", onChange);
      window.removeEventListener("focus", onChange);
    };
  }, [refresh, pollMs]);

  return { rows, loading, error, refresh };
}

// `?at=<ISO time>` shifts the app clock so race day can be previewed.
export function currentTime() {
  if (typeof window === "undefined") return new Date();
  const simulated = new URLSearchParams(window.location.search).get("at");
  const offset = simulated ? new Date(simulated).getTime() - Date.now() : 0;
  return new Date(Date.now() + (Number.isFinite(offset) ? offset : 0));
}

export function useNow(intervalMs = 15_000) {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    const tick = () => setNow(currentTime());
    tick();
    const id = setInterval(tick, intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

const NAME_KEY = LOCAL_PREFIX + "my-name";
export const rememberedName = () => (typeof window === "undefined" ? "" : localStorage.getItem(NAME_KEY) ?? "");
export const rememberName = (name: string) => localStorage.setItem(NAME_KEY, name);
