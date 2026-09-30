import { useState, useRef } from "react";
import { motion } from "framer-motion";

/* ─────────────────────────────────────────────────────
   2024 Porsche 992 GT3 R — Sketchfab direct embed
   Model: https://sketchfab.com/3d-models/b76c9b2ae2d548c3869426eac4ab8a19
   Using direct iframe src (most reliable, no API script needed)
───────────────────────────────────────────────────── */

const MODEL_UID = "b76c9b2ae2d548c3869426eac4ab8a19";

const EMBED_URL =
  `https://sketchfab.com/models/${MODEL_UID}/embed` +
  `?autostart=1` +
  `&preload=1` +
  `&ui_infos=0` +
  `&ui_controls=0` +
  `&ui_stop=0` +
  `&ui_watermark=0` +
  `&ui_watermark_link=0` +
  `&ui_ar=0` +
  `&ui_help=0` +
  `&ui_settings=0` +
  `&ui_vr=0` +
  `&ui_fullscreen=0` +
  `&ui_animations=0` +
  `&ui_annotations=0` +
  `&ui_inspector=0` +
  `&ui_hint=0` +
  `&autospin=0.4` +
  `&camera=0` +
  `&transparent=0` +
  `&double_click=0` +
  `&scrollwheel=0`;

interface Props {
  className?: string;
}

export default function SketchfabViewer({ className = "" }: Props) {
  const [loaded, setLoaded] = useState(false);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /* Simulate progress bar while the iframe loads */
  function handleStart() {
    setProgress(5);
    timerRef.current = setInterval(() => {
      setProgress((p) => {
        if (p >= 88) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 88;
        }
        return p + Math.random() * 6;
      });
    }, 400);
  }

  function handleLoad() {
    if (timerRef.current) clearInterval(timerRef.current);
    setProgress(100);
    /* Brief delay so progress hits 100% visually before fading out */
    setTimeout(() => setLoaded(true), 600);
  }

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{ background: "#0D0F14" }}
    >
      {/* ── Loading overlay ── */}
      {!loaded && (
        <motion.div
          key="loading"
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-6"
          style={{
            background:
              "linear-gradient(135deg, #0D0F14 0%, #141720 50%, #0D0F14 100%)",
          }}
        >
          {/* Porsche silhouette SVG */}
          <motion.svg
            width="180"
            height="72"
            viewBox="0 0 180 72"
            fill="none"
            animate={{ opacity: [0.4, 0.9, 0.4] }}
            transition={{ repeat: Infinity, duration: 2.4, ease: "easeInOut" }}
          >
            {/* Body */}
            <path
              d="M14 46 Q16 32 30 26 L56 16 Q74 10 90 10 Q108 10 126 14 L152 26 Q164 32 166 46 L168 52 Q168 56 164 56 L148 56 Q147 46 134 46 Q121 46 120 56 L60 56 Q59 46 46 46 Q33 46 32 56 L16 56 Q12 56 12 52 Z"
              fill="#F97316"
              fillOpacity="0.15"
              stroke="#F97316"
              strokeWidth="1.5"
            />
            {/* Roof */}
            <path
              d="M56 26 L72 14 L110 14 L128 26 Z"
              fill="#F97316"
              fillOpacity="0.1"
              stroke="#F97316"
              strokeWidth="1"
              strokeLinejoin="round"
            />
            {/* Rear wing */}
            <path
              d="M150 20 L168 20 L168 24 L150 24 Z"
              fill="#F97316"
              fillOpacity="0.2"
            />
            <path d="M158 24 L158 28" stroke="#F97316" strokeWidth="1.5" />
            {/* Wheels */}
            <circle cx="46" cy="56" r="10" fill="#141720" stroke="#F97316" strokeWidth="1.5" />
            <circle cx="46" cy="56" r="5" fill="#F97316" fillOpacity="0.3" />
            <circle cx="134" cy="56" r="10" fill="#141720" stroke="#F97316" strokeWidth="1.5" />
            <circle cx="134" cy="56" r="5" fill="#F97316" fillOpacity="0.3" />
            {/* Headlights */}
            <path d="M14 40 L20 36" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" />
            <path d="M14 44 L20 44" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" />
            {/* Tail lights */}
            <path d="M166 40 L160 38" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
          </motion.svg>

          <div className="flex flex-col items-center gap-3">
            <p
              className="text-sm font-black uppercase tracking-[0.2em]"
              style={{ color: "#F97316" }}
            >
              2024 Porsche 992 GT3 R
            </p>
            <p className="text-xs uppercase tracking-widest" style={{ color: "#5A6175" }}>
              Loading 3D Model…
            </p>

            {/* Progress bar */}
            <div
              className="w-52 h-[3px] rounded-full overflow-hidden"
              style={{ background: "rgba(255,255,255,0.06)" }}
            >
              <motion.div
                className="h-full rounded-full"
                style={{
                  width: `${progress}%`,
                  background: "linear-gradient(90deg, #F97316, #FBBF24)",
                  boxShadow: "0 0 10px rgba(249,115,22,0.7)",
                }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <p className="text-[11px] font-mono" style={{ color: "#F97316", opacity: 0.5 }}>
              {Math.round(progress)}%
            </p>
          </div>
        </motion.div>
      )}

      {/* ── Sketchfab iframe ── */}
      <iframe
        title="2024 Porsche 992 GT3 R"
        src={EMBED_URL}
        allow="autoplay; fullscreen; xr-spatial-tracking"
        allowFullScreen
        onLoad={handleLoad}
        /* We can't fire onLoad BEFORE the iframe starts loading from src,
           so we start the fake progress bar in onLoad of the iframe shell */
        ref={(el) => { if (el && !loaded) handleStart(); }}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          border: "none",
          display: "block",
          opacity: loaded ? 1 : 0,
          transition: "opacity 0.9s ease",
        }}
      />

      {/* Edge gradients to blend into the page */}
      <div
        className="absolute bottom-0 left-0 right-0 pointer-events-none z-10"
        style={{
          height: 120,
          background: "linear-gradient(to top, #0D0F14 0%, transparent 100%)",
        }}
      />
      <div
        className="absolute top-0 left-0 right-0 pointer-events-none z-10"
        style={{
          height: 80,
          background: "linear-gradient(to bottom, #0D0F14 0%, transparent 100%)",
        }}
      />
    </div>
  );
}
