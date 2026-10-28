<!-- NOTE: This was built without engineering review. Consult engineering before deploying to production. -->

# Find Isabel & Olivia

A marathon-day companion so friends can find a runner on the course: live pace-based position estimate, where to stand (with arrival windows and trains), claim-a-mile coverage, photo sightings that correct the estimate, a finish-time pool, a sign generator, and a Friends page to follow other runners on the same map.

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000. Add `?at=2026-11-01T11:05:00-05:00` to any page to preview race-day state.

## Make it yours

Everything runner-specific is in `src/config/runner.ts`: each sister's name, bib, wave, corral, gun time, pace range, map colour and (after the race) `finishTimeSec`, plus the donation link. Cheer spots are in `src/data/spots.ts`.

The course is the public `datanews/ny-marathon` trace with the 2026 Bronx reroute patched in by `scripts/build-course.py`, scaled to 26.2188 mi. Check it against the official 2026 course map before race day.

## Shared data (optional)

Without configuration, claims, sightings, guesses and friends are stored only in each visitor's browser (a "Demo mode" note is shown).

To share them:

1. Create a free Supabase project.
2. Run `supabase/schema.sql` in its SQL editor.
3. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local` (and in your host's env settings).

The anon key is public by design and ends up in the browser bundle. The schema lets anyone with the link read and add rows and upload photos, so treat everything posted as public, and don't put anything private in this app.

## Deploy

Push this folder to a GitHub repo, import it in Vercel, add the two env vars above, and deploy.
