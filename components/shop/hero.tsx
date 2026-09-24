"use client";
import { useEffect, useRef, useState } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import { ArrowUpRight, ArrowDown, Pause, Play } from "lucide-react";
import Link from "next/link";
import type { Settings } from "@/lib/settings";
export function Hero({ settings: s }: { settings: Settings }) {
  const root = useRef<HTMLElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const pausedByUser = useRef(false);
  const reduced = useReducedMotion();
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState(false);
  const { scrollYProgress } = useScroll({
    target: root,
    offset: ["start start", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [0, 100]);
  useEffect(() => {
    const el = video.current;
    if (!el) return;
    setPlaying(!el.paused);
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !pausedByUser.current)
          el.play()
            .then(() => setPlaying(true))
            .catch(() => setPlaying(false));
        else el.pause();
      },
      { threshold: 0.15 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [s.heroUrl, s.heroType]);
  return (
    <section
      ref={root}
      className="hero hero-editorial"
      aria-label="Neue Kollektion"
    >
      <motion.div className="hero-visual" style={{ y: reduced ? 0 : y }}>
        {s.heroType === "video" && !failed ? (
          <video
            key={s.heroUrl}
            ref={video}
            className="hero-media"
            src={s.heroUrl}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            poster={s.heroPoster || undefined}
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onError={() => setFailed(true)}
          />
        ) : (s.heroType === "video" ? s.heroPoster : s.heroUrl) ? (
          <img
            className="hero-media"
            src={s.heroType === "video" ? s.heroPoster : s.heroUrl}
            alt="BigMamaReps Kollektion"
          />
        ) : (
          <div className="hero-media hero-empty" />
        )}
      </motion.div>
      <div className="hero-shade" />
      <div className="hero-topline">
        <span>INDEPENDENT STYLE. EVERY DAY.</span>
        <span>VOL. 01 — THE EVERYDAY EDIT</span>
      </div>
      <div className="hero-copy">
        <motion.div
          className="hero-kicker"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduced ? 0 : 0.6 }}
        >
          <span /> DEIN NÄCHSTES LIEBLINGSSTÜCK
        </motion.div>
        <h1>
          {s.heroTitle.split("\n").map((line, i) => (
            <span className="hero-line" key={i}>
              <motion.span
                initial={{ y: "110%" }}
                animate={{ y: 0 }}
                transition={{
                  duration: reduced ? 0 : 0.95,
                  delay: reduced ? 0 : 0.1 + i * 0.12,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                {line}
              </motion.span>
            </span>
          ))}
        </h1>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduced ? 0 : 0.7, delay: reduced ? 0 : 0.5 }}
        >
          <p>{s.heroSubtitle}</p>
          <div className="hero-cta-row">
            <Link href={s.heroLink} className="btn light">
              {s.heroCta}
              <ArrowUpRight size={21} />
            </Link>
            <a className="hero-explore" href="#kollektionen">
              Deinen Look finden
              <ArrowDown size={17} />
            </a>
          </div>
        </motion.div>
      </div>
      <div className="hero-film-label">
        <span className="film-dot" /> BMR STUDIO<span>STYLE IN MOTION</span>
      </div>
      <div className="hero-bottom">
        <a href="#home-edit">
          <ArrowDown size={16} /> SCROLL TO EXPLORE
        </a>
        <span>WENIGER REGELN. MEHR DU.</span>
        {s.heroType === "video" && !failed && (
          <button
            className="video-control"
            aria-label={
              playing ? "Hero-Video pausieren" : "Hero-Video abspielen"
            }
            onClick={() => {
              const el = video.current;
              if (!el) return;
              pausedByUser.current = !el.paused;
              if (el.paused) el.play().catch(() => setPlaying(false));
              else el.pause();
            }}
          >
            {playing ? <Pause size={15} /> : <Play size={15} />}
            <span>{playing ? "Pause" : "Abspielen"}</span>
          </button>
        )}
      </div>
    </section>
  );
}
