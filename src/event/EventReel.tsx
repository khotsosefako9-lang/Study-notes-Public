import "@fontsource/inter/500.css";
import "@fontsource/inter/700.css";
import "@fontsource/inter/800.css";
import "@fontsource/inter/900.css";
import { AbsoluteFill, Audio, Img, OffthreadVideo, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";

// Professional event recap: beat-synced cuts, whip and punch transitions, kinetic
// titles, light grade and grain. Separate from the church templates on purpose.

const F = { font: "Inter, sans-serif", red: "#ED1C24", blue: "#0066B3", ink: "#0B0D12", paper: "#FFFFFF" };

type Shot = {
  src: string; // inside public/
  from: number; // source seconds
  beats: number;
  x?: number; // focal point 0..1 across the frame (vertical crops of landscape footage)
  y?: number;
  rate?: number; // playback speed, e.g. 0.5 for slow motion
  push?: [number, number]; // scale at start and end of the shot
  in?: "cut" | "whip" | "punch" | "flash";
};

type Title = {
  beat: number;
  beats: number;
  lines: string[];
  kind: "hero" | "stack" | "tag";
  y?: number; // 0..1 down the frame
};

export type EventReelProps = {
  bpm: number;
  music?: { src: string; from: number; volume?: number };
  durationInSeconds: number;
  shots: Shot[];
  titles?: Title[];
  endCard?: { beat: number; logo: string; lines: string[] };
  grade?: boolean;
};

const clamp = (v: number) => Math.min(1, Math.max(0, v));
const ease = (v: number) => 1 - Math.pow(1 - clamp(v), 3);

const ShotLayer: React.FC<{ s: Shot; len: number; next?: Shot }> = ({ s, len, next }) => {
  const f = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const [p0, p1] = s.push ?? [1.04, 1.12];
  let scale = p0 + (p1 - p0) * (f / len);
  let tx = 0;
  let blur = 0;
  if (s.in === "whip" && f < 5) { tx = (1 - ease(f / 5)) * width * 0.35; blur = (1 - f / 5) * 18; }
  if (s.in === "punch" && f < 7) scale *= 1 + 0.14 * (1 - ease(f / 7));
  if (next?.in === "whip" && f > len - 4) { tx = -ease((f - (len - 4)) / 4) * width * 0.35; blur = ((f - (len - 4)) / 4) * 18; }
  return (
    <AbsoluteFill style={{ overflow: "hidden", background: F.ink }}>
      <OffthreadVideo
        src={staticFile(s.src)}
        startFrom={Math.round(s.from * 30)}
        playbackRate={s.rate ?? 1}
        muted
        style={{
          width, height, objectFit: "cover", objectPosition: `${(s.x ?? 0.5) * 100}% ${(s.y ?? 0.5) * 100}%`,
          transform: `translateX(${tx}px) scale(${scale})`, filter: blur ? `blur(${blur}px)` : undefined,
        }}
      />
    </AbsoluteFill>
  );
};

const Flash: React.FC = () => {
  const f = useCurrentFrame();
  return <AbsoluteFill style={{ background: "#fff", opacity: clamp(1 - f / 6) * 0.85 }} />;
};

const TitleLayer: React.FC<{ t: Title; len: number }> = ({ t, len }) => {
  const f = useCurrentFrame();
  const { width } = useVideoConfig();
  const out = clamp((len - f) / 5);
  const vertical = width < 1200;
  if (t.kind === "tag") {
    const k = ease(f / 8);
    return (
      <div style={{ position: "absolute", left: 60, top: `${(t.y ?? 0.78) * 100}%`, opacity: Math.min(k, out), transform: `translateX(${(1 - k) * -40}px)` }}>
        <div style={{ display: "flex", alignItems: "stretch", gap: 0 }}>
          <div style={{ width: vertical ? 14 : 10, background: F.red }} />
          <div style={{ background: "rgba(255,255,255,.96)", padding: vertical ? "20px 34px" : "14px 26px" }}>
            {t.lines.map((l, i) => (
              <div key={i} style={{ fontFamily: F.font, fontWeight: i === 0 ? 800 : 600, fontSize: (i === 0 ? 40 : 26) * (vertical ? 1.45 : 1), color: i === 0 ? F.ink : "#4A4F5C", letterSpacing: i === 0 ? 0.5 : 2, textTransform: i === 0 ? "none" : "uppercase" }}>{l}</div>
            ))}
          </div>
        </div>
      </div>
    );
  }
  // hero / stack: words rise out of a mask one after another
  const size = t.kind === "hero" ? (vertical ? 132 : 150) : vertical ? 210 : 190;
  const fit = (text: string, max: number) => Math.min(max, (width - 100) / (text.length * 0.66));
  // hero: every line but the last is headline-sized; the last is a spaced subtitle
  const big = (i: number) => t.kind === "stack" || i < t.lines.length - 1;
  return (
    <>
    {t.kind === "hero" && <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(11,13,18,0) 20%, rgba(11,13,18,.55) 50%, rgba(11,13,18,0) 80%)", opacity: Math.min(ease(f / 6), out) }} />}
    <div style={{ position: "absolute", left: 0, right: 0, top: `${(t.y ?? 0.42) * 100}%`, transform: "translateY(-50%)", textAlign: "center", opacity: out }}>
      {t.lines.map((l, i) => {
        const k = ease((f - i * 4) / 9);
        return (
          <div key={i} style={{ overflow: "hidden", lineHeight: 0.98, padding: "0 40px" }}>
            <div
              style={{
                fontFamily: F.font, fontWeight: 900, fontSize: big(i) ? fit(l, size) : size * 0.36, letterSpacing: big(i) ? -2 : 6, marginTop: big(i) ? 0 : 14,
                color: "#fff", textTransform: "uppercase",
                transform: `translateY(${(1 - k) * 110}%)`, textShadow: "0 8px 40px rgba(0,0,0,.45)",
              }}
            >
              {t.kind === "stack" && l.endsWith(".") ? <>{l.slice(0, -1)}<span style={{ color: F.red }}>.</span></> : l}
            </div>
          </div>
        );
      })}
    </div>
    </>
  );
};

const EndCard: React.FC<{ logo: string; lines: string[] }> = ({ logo, lines }) => {
  const f = useCurrentFrame();
  const { width } = useVideoConfig();
  const k = ease(f / 10);
  return (
    <AbsoluteFill style={{ background: F.paper, alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 40, opacity: k }}>
      <Img src={staticFile(logo)} style={{ width: Math.min(width * 0.72, 900), transform: `scale(${0.94 + 0.06 * ease(f / 18)})` }} />
      <div style={{ display: "flex", gap: 0, width: Math.min(width * 0.72, 900), height: 8 }}>
        <div style={{ flex: ease((f - 6) / 12), background: F.red }} />
        <div style={{ flex: ease((f - 9) / 12), background: F.blue }} />
      </div>
      {lines.map((l, i) => {
        const li = ease((f - 10 - i * 4) / 10);
        return (
          <div key={i} style={{ fontFamily: F.font, fontWeight: i === 0 ? 800 : 600, fontSize: i === 0 ? 60 : 36, letterSpacing: i === 0 ? 0 : 3, textTransform: i === 0 ? "none" : "uppercase", color: i === 0 ? F.ink : "#4A4F5C", opacity: li, transform: `translateY(${(1 - li) * 20}px)`, textAlign: "center", padding: "0 60px" }}>
            {l}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

// Film grain and vignette, so mixed footage reads as one piece.
const Finish: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at center, rgba(0,0,0,0) 55%, rgba(0,0,0,.38) 100%)" }} />
      <svg width="100%" height="100%" style={{ position: "absolute", opacity: 0.07, mixBlendMode: "overlay" }}>
        <filter id="g"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={f % 12} /></filter>
        <rect width="100%" height="100%" filter="url(#g)" />
      </svg>
    </AbsoluteFill>
  );
};

export const EventReel: React.FC<EventReelProps> = (p) => {
  const { fps } = useVideoConfig();
  const beat = (60 / p.bpm) * fps;
  const at = (b: number) => Math.round(b * beat);
  let b = 0;
  const placed = p.shots.map((s) => { const start = b; b += s.beats; return { s, start }; });
  return (
    <AbsoluteFill style={{ background: F.ink }}>
      {p.music && <Audio src={staticFile(p.music.src)} startFrom={Math.round(p.music.from * fps)} volume={(fr) => (p.music!.volume ?? 1) * clamp((p.durationInSeconds * fps - fr) / (fps * 1.2))} />}
      <AbsoluteFill style={{ filter: p.grade === false ? undefined : "contrast(1.08) saturate(1.12) brightness(1.02)" }}>
        {placed.map(({ s, start }, i) => {
          const len = at(start + s.beats) - at(start);
          return (
            <Sequence key={i} from={at(start)} durationInFrames={len}>
              <ShotLayer s={s} len={len} next={placed[i + 1]?.s} />
              {s.in === "flash" && <Flash />}
            </Sequence>
          );
        })}
      </AbsoluteFill>
      <Finish />
      {p.titles?.map((t, i) => (
        <Sequence key={i} from={at(t.beat)} durationInFrames={at(t.beat + t.beats) - at(t.beat)}>
          <TitleLayer t={t} len={at(t.beat + t.beats) - at(t.beat)} />
        </Sequence>
      ))}
      {p.endCard && (
        <Sequence from={at(p.endCard.beat)}>
          <EndCard logo={p.endCard.logo} lines={p.endCard.lines} />
        </Sequence>
      )}
    </AbsoluteFill>
  );
};
