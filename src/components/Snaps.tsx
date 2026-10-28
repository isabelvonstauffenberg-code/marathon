"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Star } from "@/components/Stickers";

export type Pic = { src: string };

type Shape = "polaroid" | "circle" | "blob" | "ticket";

const SHAPE: Record<Shape, { frame: string; img: string }> = {
  polaroid: {
    frame: "rounded-[18px] bg-paper p-2 pb-9",
    img: "aspect-[4/5] rounded-[10px]",
  },
  circle: {
    frame: "rounded-full bg-pink p-2",
    img: "aspect-square rounded-full",
  },
  blob: {
    frame: "rounded-[46%_54%_38%_62%/55%_40%_60%_45%] bg-sky p-2",
    img: "aspect-square rounded-[46%_54%_38%_62%/55%_40%_60%_45%]",
  },
  ticket: {
    frame: "rounded-[22px] bg-lime p-2",
    img: "aspect-[5/4] rounded-[14px]",
  },
};

export function Snap({
  pic,
  shape = "polaroid",
  tilt = 0,
  star = "#fff200",
  className = "",
}: {
  pic: Pic;
  shape?: Shape;
  tilt?: number;
  star?: string;
  className?: string;
}) {
  const s = SHAPE[shape];
  return (
    <figure
      className={`relative ${className}`}
      style={{ transform: `rotate(${tilt}deg)` }}
    >
      <div
        className={`overflow-visible border-[2.5px] border-ink shadow-[4px_5px_0_#0b0b0b] ${s.frame}`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={pic.src}
          alt="isabel and olivia"
          loading="lazy"
          className={`block w-full border-2 border-ink object-cover ${s.img}`}
        />
      </div>
      <Star
        size={40}
        fill={star}
        strokeWidth={7}
        className="float absolute -top-4 -right-3"
        style={{ ["--r" as string]: `${tilt * -2}deg` }}
      />
    </figure>
  );
}

/** A tiny star that hides a photo. Tap to pop it out, tap anywhere to put it back. */
export function Egg({ pic, tone = "#22b5ff" }: { pic: Pic; tone?: string }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="psst, tap me"
        className="wiggle relative -my-2 shrink-0"
      >
        <Star
          size={36}
          fill={tone}
          strokeWidth={8}
          className="float"
          style={{ ["--r" as string]: "-12deg" }}
        />
        <span className="display pointer-events-none absolute inset-0 flex items-center justify-center pt-0.5 text-[13px]">
          ?
        </span>
      </button>
      {open &&
        createPortal(
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="close"
            className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/70 p-8 backdrop-blur-[2px]"
          >
            <div
              className="stamp w-full max-w-[300px]"
              style={{ ["--r" as string]: "-3deg" }}
            >
              <p className="display mb-4 text-center text-[28px] leading-none text-sun lowercase">
                you found one!
              </p>
              <Snap pic={pic} star={tone} />
              <p className="tag mt-5 text-center !text-[10.5px] text-paper/80">
                tap anywhere to put it back
              </p>
            </div>
          </button>,
          document.body,
        )}
    </>
  );
}

const ARCHIVE: { pic: Pic; shape: Shape; tilt: number; star: string }[] = [
  {
    pic: { src: "/pics/tiny-proof.jpg" },
    shape: "polaroid",
    tilt: -4,
    star: "#ff3ec8",
  },
  {
    pic: { src: "/pics/subway.jpg" },
    shape: "circle",
    tilt: 3,
    star: "#fff200",
  },
  {
    pic: {
      src: "/pics/tiny-uniforms.jpg",
    },
    shape: "ticket",
    tilt: 2,
    star: "#22b5ff",
  },
  {
    pic: {
      src: "/pics/beach-run.jpg",
    },
    shape: "blob",
    tilt: -3,
    star: "#3ee04f",
  },
  {
    pic: { src: "/pics/pajamas.jpg" },
    shape: "polaroid",
    tilt: 4,
    star: "#fff200",
  },
  {
    pic: { src: "/pics/dinner.jpg" },
    shape: "circle",
    tilt: -2,
    star: "#ff3ec8",
  },
];

export function Throwback() {
  return (
    <div className="no-scrollbar -my-4 flex snap-x snap-mandatory gap-6 overflow-x-auto px-7 py-6">
      {ARCHIVE.map((a) => (
        <Snap
          key={a.pic.src}
          {...a}
          className="w-[200px] shrink-0 snap-center"
        />
      ))}
    </div>
  );
}
