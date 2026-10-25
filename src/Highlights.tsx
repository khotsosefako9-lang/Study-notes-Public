import { AbsoluteFill, Audio, Img, OffthreadVideo, Sequence, staticFile, useVideoConfig } from "remotion";
import { Captions } from "./components/Captions";
import { C, FONT } from "./theme";
import { useSeconds, since, clamp01, easeOut } from "./time";
import type { Common } from "./types";

// A montage reel (a Sunday service, an event): one edited clip, an optional music or
// worship bed under it, timed text and a branded end card.

type Level = { from: number; to: number; volume: number }; // seconds on the edited clip

type Text = {
  at: number;
  until: number;
  text: string;
  sub?: string;
  style: "hook" | "label" | "name";
};

export type HighlightsProps = Common & {
  levels?: Level[]; // the clip's own sound; 1 outside these ranges
  // One source at a time keeps the mix clean: avoid overlapping songs, or singing under speech.
  music?: { src: string; at: number; startFrom?: number; until: number; volume: number; fadeIn?: number; fadeOut?: number }[];
  texts?: Text[];
  endCard?: { at: number; lines: string[] };
};

const RAMP = 0.25; // seconds, so level changes aren't audible jumps

const envelope = (t: number, from: number, to: number, fadeIn: number, fadeOut: number) =>
  Math.min(fadeIn > 0 ? clamp01((t - from) / fadeIn) : 1, fadeOut > 0 ? clamp01((to - t) / fadeOut) : 1);

const levelAt = (levels: Level[] | undefined, t: number, end: number) => {
  const l = levels?.find((x) => t >= x.from && t < x.to);
  if (!l) return 1;
  // No ramp where a range starts the reel or runs to its end.
  const k = envelope(t, l.from, l.to, l.from <= 0 ? 0 : RAMP, l.to >= end ? 0 : RAMP);
  return 1 + (l.volume - 1) * k;
};

const Hook: React.FC<{ t: number; x: Text }> = ({ t, x }) => {
  const k = Math.min(easeOut((t - x.at) / 0.35), clamp01((x.until - t) / 0.3));
  return (
    <div style={{ position: "absolute", top: 300, left: 60, right: 60, textAlign: "center", opacity: k, transform: `translateY(${(1 - k) * 24}px)` }}>
      <div style={{ fontFamily: FONT.display, fontWeight: 900, fontSize: 92, lineHeight: 1.02, color: "#fff", WebkitTextStroke: `14px ${C.ink}`, paintOrder: "stroke fill", textShadow: "0 10px 30px rgba(0,0,0,.4)" }}>
        {x.text}
      </div>
      {x.sub && (
        <div style={{ marginTop: 18, display: "inline-block", padding: "10px 26px", borderRadius: 999, background: C.grad, fontFamily: FONT.display, fontWeight: 800, fontSize: 40, color: C.ink }}>
          {x.sub}
        </div>
      )}
    </div>
  );
};

// Small pill for sections ("Worship") and name tags ("Pastor Dion").
const Tag: React.FC<{ t: number; x: Text }> = ({ t, x }) => {
  const k = Math.min(easeOut((t - x.at) / 0.3), clamp01((x.until - t) / 0.25));
  const name = x.style === "name";
  return (
    <div style={{ position: "absolute", top: name ? 1180 : 250, left: 60, opacity: k, transform: `translateX(${(1 - k) * -30}px)` }}>
      <div style={{ display: "inline-flex", alignItems: "center", gap: 14, padding: "12px 28px 12px 16px", borderRadius: 18, background: "rgba(22,16,10,.78)", borderLeft: `8px solid ${C.gold}` }}>
        <Img src={staticFile("brand/mark.png")} style={{ height: name ? 44 : 52 }} />
        <div>
          <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: name ? 40 : 46, color: C.cream, lineHeight: 1.1 }}>{x.text}</div>
          {x.sub && <div style={{ fontFamily: FONT.body, fontWeight: 800, fontSize: 26, color: C.gold, lineHeight: 1.2 }}>{x.sub}</div>}
        </div>
      </div>
    </div>
  );
};

const EndCard: React.FC<{ t: number; at: number; lines: string[] }> = ({ t, at, lines }) => {
  const k = since(t, at, 0.5);
  if (k === 0) return null;
  return (
    <AbsoluteFill style={{ background: `rgba(251,245,234,${0.94 * k})`, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 28 }}>
      <Img src={staticFile("brand/logo-full.png")} style={{ width: 520, opacity: k, transform: `scale(${0.92 + 0.08 * k})` }} />
      {lines.map((l, i) => {
        const li = since(t, at + 0.35 + i * 0.2, 0.4);
        return (
          <div key={i} style={{ opacity: li, transform: `translateY(${(1 - li) * 16}px)`, fontFamily: i === 0 ? FONT.display : FONT.body, fontWeight: i === 0 ? 800 : 700, fontSize: i === 0 ? 64 : 38, color: i === 0 ? C.ember : C.ink, textAlign: "center", padding: "0 60px" }}>
            {l}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

export const Highlights: React.FC<HighlightsProps> = (p) => {
  const t = useSeconds();
  const { fps, durationInFrames } = useVideoConfig();
  const end = durationInFrames / fps;
  const ending = p.endCard && t >= p.endCard.at;
  return (
    <AbsoluteFill style={{ background: C.night }}>
      {p.video && (
        <OffthreadVideo
          src={staticFile(p.video)}
          volume={(f) => levelAt(p.levels, f / fps, end)}
          style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: p.videoPosition ?? "50% 50%" }}
        />
      )}
      {p.music?.map((m, i) => (
        <Sequence key={i} from={Math.round(m.at * fps)} durationInFrames={Math.round((m.until - m.at) * fps)}>
          <Audio
            src={staticFile(m.src)}
            startFrom={Math.round((m.startFrom ?? 0) * fps)}
            volume={(f) => m.volume * envelope(f / fps, 0, m.until - m.at, m.fadeIn ?? 0.6, m.fadeOut ?? 0.6)}
          />
        </Sequence>
      ))}
      {p.texts?.map((x, i) =>
        t >= x.at && t < x.until ? (x.style === "hook" ? <Hook key={i} t={t} x={x} /> : <Tag key={i} t={t} x={x} />) : null,
      )}
      {!ending && <Captions words={p.captions} y={p.captionY ?? 1480} />}
      {p.endCard && <EndCard t={t} at={p.endCard.at} lines={p.endCard.lines} />}
    </AbsoluteFill>
  );
};
