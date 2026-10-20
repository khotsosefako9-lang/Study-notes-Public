import { C } from "../theme";

export const Panel: React.FC<{ style?: React.CSSProperties; children: React.ReactNode }> = ({ style, children }) => (
  <div
    style={{
      position: "absolute", background: `linear-gradient(180deg, ${C.panel2}, ${C.panel})`,
      border: `4px solid ${C.gold}`, borderRadius: 30, padding: 22, boxSizing: "border-box",
      boxShadow: "0 24px 60px rgba(0,0,0,.5), inset 0 0 0 2px rgba(245,179,53,.15)",
      ...style,
    }}
  >
    {children}
  </div>
);

// Countdown ring for timed turns (Fast Money: 20s and 25s).
export const Timer: React.FC<{ t: number; start: number; seconds: number; size?: number }> = ({ t, start, seconds, size = 120 }) => {
  if (t < start || t > start + seconds + 0.6) return null;
  const left = Math.max(0, start + seconds - t);
  const r = size / 2 - 9, circ = 2 * Math.PI * r;
  const color = left <= 5 ? C.bad : C.gold;
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill={C.night} stroke="rgba(255,255,255,.15)" strokeWidth={10} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={10} strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={circ * (1 - left / seconds)} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", fontFamily: "Poppins", fontWeight: 800, fontSize: size * 0.4, color: "#fff" }}>
        {Math.ceil(left)}
      </div>
    </div>
  );
};

export const Heart: React.FC<{ on: boolean; size?: number }> = ({ on, size = 56 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={{ opacity: on ? 1 : 0.35 }}>
    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
      fill={on ? C.bad : "none"} stroke={on ? C.ink : C.muted} strokeWidth={1.4} />
  </svg>
);
