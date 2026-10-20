import { C, FONT } from "../theme";
import { useSeconds, easeOut, clamp01 } from "../time";
import type { Stamp } from "../types";

const TONE = { gold: C.gold, red: C.bad, green: C.good };

// Pop-up words like "TENABLE!", "STEAL!" or "200 POINTS!" over the board.
export const Stamps: React.FC<{ stamps?: Stamp[]; y: number }> = ({ stamps, y }) => {
  const t = useSeconds();
  const s = stamps?.find((s) => t >= s.at && t < s.at + (s.duration ?? 1.6));
  if (!s) return null;
  const dur = s.duration ?? 1.6;
  const k = easeOut((t - s.at) / 0.22);
  const out = clamp01((s.at + dur - t) / 0.25);
  return (
    <div
      style={{
        position: "absolute", top: y, width: "100%", textAlign: "center", zIndex: 20,
        transform: `translateY(-50%) rotate(-4deg) scale(${0.7 + 0.3 * k})`, opacity: Math.min(k, out),
        fontFamily: FONT.display, fontWeight: 900, fontSize: 120, letterSpacing: 2, textTransform: "uppercase",
        color: TONE[s.tone ?? "gold"], WebkitTextStroke: `16px ${C.ink}`, paintOrder: "stroke fill",
        textShadow: "0 10px 30px rgba(0,0,0,.45)",
      }}
    >
      {s.text}
    </div>
  );
};
