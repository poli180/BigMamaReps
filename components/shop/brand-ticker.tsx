"use client";
import { useState } from "react";
import { Pause, Play } from "lucide-react";
export function BrandTicker() {
  const [paused, setPaused] = useState(false);
  return (
    <section
      className={`brand-ticker ${paused ? "is-paused" : ""}`}
      aria-label="Wear it your way"
    >
      <div aria-hidden="true">
        {Array.from({ length: 4 }, (_, i) => (
          <span key={i}>
            EVERYDAY IS YOUR RUNWAY <span className="ticker-star">✳</span> WEAR
            IT YOUR WAY <span className="ticker-star">✳</span>
          </span>
        ))}
      </div>
      <button
        className="ticker-control"
        aria-label={paused ? "Laufbanner abspielen" : "Laufbanner pausieren"}
        onClick={() => setPaused(!paused)}
      >
        {paused ? <Play size={14} /> : <Pause size={14} />}
      </button>
    </section>
  );
}
