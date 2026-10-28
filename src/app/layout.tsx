import type { Metadata, Viewport } from "next";
import { M_PLUS_Rounded_1c, Martian_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import "maplibre-gl/dist/maplibre-gl.css";
import { duo, race } from "@/config/runner";
import { TabBar } from "@/components/TabBar";
import { Marquee } from "@/components/Marquee";
import { Star } from "@/components/Stickers";

const round = M_PLUS_Rounded_1c({ variable: "--font-round", subsets: ["latin"], weight: ["500", "800", "900"] });
const mono = Martian_Mono({ variable: "--font-mono", subsets: ["latin"], axes: ["wdth"] });

export const metadata: Metadata = {
  title: race.appName,
  description: `Where to stand, when to get there, and where ${duo} are right now at the ${race.shortName}.`,
  robots: { index: false, follow: false },
  appleWebApp: { capable: true, title: race.appName, statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: "#fff200",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${round.variable} ${mono.variable} antialiased`}>
        <div aria-hidden className="no-print pointer-events-none fixed inset-0 hidden overflow-hidden lg:block">
          <Star size={220} fill="#ff3ec8" className="float absolute top-[14%] left-[calc(50%-560px)]" style={{ ["--r" as string]: "-14deg" }} />
          <Star size={130} fill="#22b5ff" className="float absolute top-[58%] left-[calc(50%-470px)]" style={{ ["--r" as string]: "10deg", animationDelay: "-1.4s" }} />
          <Star size={170} fill="#fff" className="float absolute top-[30%] right-[calc(50%-540px)]" style={{ ["--r" as string]: "18deg", animationDelay: "-2.2s" }} />
          <Star size={110} fill="#3ee04f" className="float absolute top-[72%] right-[calc(50%-460px)]" style={{ ["--r" as string]: "-8deg", animationDelay: "-0.6s" }} />
        </div>
        <Marquee />
        <div className="relative mx-auto min-h-dvh max-w-xl pb-32">
          {children}
          <p className="no-print mt-10 text-center">
            <Link href="/how" className="tag !text-[10.5px] text-ink/60 underline underline-offset-4 hover:text-ink">
              how this works
            </Link>
          </p>
        </div>
        <TabBar />
      </body>
    </html>
  );
}
