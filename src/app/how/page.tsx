import { PageHeader } from "@/components/ui";

const sections: { title: string; body: React.ReactNode }[] = [
  {
    title: "Where the stars come from",
    body: (
      <p>
        Each star is an estimate of where Isabel and Olivia are right now. It&apos;s driven by Isabel&apos;s projected splits: cumulative elapsed time at every mile for a strong, expected and
        tough day, built from her Strava averages and used for both of them. The page interpolates linearly between mile marks to turn time since the start mat into a position on the course. The
        star follows the expected plan, and the shaded band runs from tough to strong.
      </p>
    ),
  },
  {
    title: "Start time",
    body: (
      <p>
        Both start in Pink Wave 5, Corral B, with an 11:30 a.m. gun. Until they cross the start mat, the page assumes a 7-minute delay. Once the official start time comes in, it replaces that guess.
      </p>
    ),
  },
  {
    title: "Official times",
    body: (
      <>
        <p>NYRR&apos;s live tracker is run by RTRT.me, and the page reads the same data straight from the browser, with no backend:</p>
        <ul className="mt-3 list-disc space-y-2 pl-5">
          <li>It looks up each bib on RTRT&apos;s API to get a runner ID, then fetches that runner&apos;s splits.</li>
          <li>Each split gives a timing point (START, 5K, 13M, HALF, FINISH and so on) and the exact time they crossed it. The point name is converted to a course mile.</li>
          <li>The 2026 course has 37 timing mats: one at every mile, every 5K, the half and the finish.</li>
          <li>
            The page polls every 60 seconds, from 30 minutes before the gun until 8 hours after. It pauses while the tab is in the background and stops once everyone has finished. In last
            year&apos;s data, splits showed up about 10 seconds after the runner crossed the mat.
          </li>
        </ul>
      </>
    ),
  },
  {
    title: "Re-projection",
    body: (
      <p>
        The latest mat crossing (or friend sighting) becomes an anchor. The page compares their actual elapsed time at that mile with the plan, and scales the rest of the plan by that ratio. Before
        the 10K, that ratio is blended 70/30 with the original plan, so one crowded early mile doesn&apos;t throw off the whole race.
      </p>
    ),
  },
  {
    title: "Friends",
    body: <p>Runners you add are modeled at an even pace from their goal finish time, with a ±4% band, and get the same official splits if you enter a bib.</p>,
  },
  {
    title: "Stack",
    body: <p>Next.js on Vercel, MapLibre with OpenFreeMap tiles for the map, and Supabase for shared sightings and photos.</p>,
  },
  {
    title: "Caveats",
    body: (
      <p>
        RTRT&apos;s API is undocumented and unofficial, and this site isn&apos;t affiliated with NYRR. If the feed goes down, the stars fall back to the plan and sightings. Anything posted here is
        visible to anyone with the link.
      </p>
    ),
  },
];

export default function HowPage() {
  return (
    <main>
      <PageHeader back="/" title="how this works" />
      <p className="display mx-5 -mt-3 mb-6 inline-block rounded-full border-2 border-ink bg-ink px-3.5 py-1 text-[13px] text-sun">Created with Devin</p>
      <div className="mx-5 space-y-4">
        {sections.map((s) => (
          <section key={s.title} className="rounded-[24px] border-[2.5px] border-ink bg-paper p-5">
            <h2 className="display text-[19px] leading-tight">{s.title}</h2>
            <div className="mt-2 text-[13px] leading-[1.65]">{s.body}</div>
          </section>
        ))}
      </div>
    </main>
  );
}
