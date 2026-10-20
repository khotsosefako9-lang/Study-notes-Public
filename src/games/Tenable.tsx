import { AbsoluteFill, Img, staticFile } from "remotion";
import { Footage, BoardShade } from "../components/Footage";
import { Captions } from "../components/Captions";
import { TitleBar } from "../components/TitleBar";
import { Stamps } from "../components/Stamps";
import { Heart } from "../components/Panel";
import { BOARD, C, FONT } from "../theme";
import { useSeconds, since, clamp01 } from "../time";
import type { Common } from "../types";

type Answer = { a: string; extra?: string; at?: number; missed?: boolean }; // missed: shown at the end, not scored

export type TenableProps = Common & {
  category: string;
  reference?: string; // e.g. "Exodus 7–12"
  player: string;
  playerImage?: string; // optional headshot inside public/
  lives?: number;
  answers: Answer[]; // the ten, in list order
  wrongs?: number[]; // times a life is lost
};

const PYR = { w: 720, h: 560, topW: 0.4, cap: 92 };

const Pyramid: React.FC<{ p: TenableProps; t: number; flash: number }> = ({ p, t, flash }) => {
  const rowsH = PYR.h - PYR.cap - 12;
  const rowH = rowsH / p.answers.length;
  const widthAt = (y: number) => PYR.w * (PYR.topW + (1 - PYR.topW) * (y / PYR.h));
  const inset = (1 - PYR.topW) * 50;
  return (
    <div style={{ position: "relative", width: PYR.w, height: PYR.h, filter: "drop-shadow(0 18px 40px rgba(0,0,0,.5))" }}>
      <div style={{ position: "absolute", inset: 0, clipPath: `polygon(${inset}% 0, ${100 - inset}% 0, 100% 100%, 0 100%)`, background: C.gold }} />
      <div style={{ position: "absolute", inset: 6, clipPath: `polygon(${inset}% 0, ${100 - inset}% 0, 100% 100%, 0 100%)`, background: `linear-gradient(180deg, ${C.panel2}, ${C.panel})` }}>
        <div style={{ height: PYR.cap, display: "grid", placeItems: "center" }}>
          <Img src={staticFile("brand/mark.png")} style={{ height: 70 }} />
        </div>
        {p.answers.map((a, i) => {
          const k = since(t, a.at, 0.3);
          const mid = PYR.cap + (i + 0.5) * rowH;
          const avail = widthAt(mid) - 40;
          const label = a.extra ? `${a.a} · ${a.extra}` : a.a;
          const size = Math.min(30, avail / (label.length * 0.62));
          return (
            <div key={i} style={{ height: rowH, padding: "2px 0", boxSizing: "border-box" }}>
              <div style={{ position: "relative", height: "100%", background: C.slot, display: "grid", placeItems: "center", overflow: "hidden" }}>
                <span style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 24, color: "rgba(194,169,140,.55)" }}>{i + 1}</span>
                {k > 0 && (
                  <div style={{ position: "absolute", inset: 0, background: a.missed ? "#5A4636" : C.grad, clipPath: `inset(0 ${50 * (1 - k)}% 0 ${50 * (1 - k)}%)`, display: "grid", placeItems: "center" }}>
                    <span style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: size, color: a.missed ? C.cream : C.ink, whiteSpace: "nowrap" }}>{label}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {flash > 0 && (
        <div style={{ position: "absolute", inset: 0, clipPath: `polygon(${inset}% 0, ${100 - inset}% 0, 100% 100%, 0 100%)`, background: C.bad, opacity: 0.6 * flash, mixBlendMode: "hard-light" }} />
      )}
    </div>
  );
};

export const Tenable: React.FC<TenableProps> = (p) => {
  const t = useSeconds();
  const total = p.lives ?? 3;
  const wrongs = p.wrongs ?? [];
  const lost = wrongs.filter((w) => w <= t).length;
  const last = [...wrongs].reverse().find((w) => w <= t);
  const flash = last === undefined ? 0 : clamp01(1 - (t - last) / 0.8);
  const got = p.answers.filter((a) => !a.missed && a.at !== undefined && a.at <= t).length;
  const top = BOARD.top - 30;

  return (
    <AbsoluteFill style={{ background: C.night }}>
      <Footage video={p.video} position={p.videoPosition} />
      <BoardShade />
      <TitleBar title={p.title} />
      <Captions words={p.captions} y={top - 70} />

      <div style={{ position: "absolute", top, left: (1080 - PYR.w) / 2 }}>
        <Pyramid p={p} t={t} flash={flash} />
      </div>

      <div style={{ position: "absolute", top: top + 10, left: 40, display: "flex", flexDirection: "column", gap: 6 }}>
        <span style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 32, color: C.cream }}>Lives</span>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {Array.from({ length: total }, (_, i) => <Heart key={i} on={i < total - lost} />)}
        </div>
      </div>

      <div style={{ position: "absolute", top: top + 10, right: 40, display: "flex", flexDirection: "column", alignItems: "center", gap: 8, width: 150 }}>
        {p.playerImage ? (
          <Img src={staticFile(p.playerImage)} style={{ width: 120, height: 120, borderRadius: 99, objectFit: "cover", border: `4px solid ${C.gold}` }} />
        ) : (
          <div style={{ width: 120, height: 120, borderRadius: 99, border: `4px solid ${C.gold}`, background: C.panel, display: "grid", placeItems: "center", fontFamily: FONT.display, fontWeight: 900, fontSize: 54, color: C.gold }}>
            {p.player.slice(0, 1)}
          </div>
        )}
        <span style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 28, color: C.cream, textAlign: "center", lineHeight: 1.1 }}>{p.player}</span>
        <span style={{ fontFamily: FONT.display, fontWeight: 900, fontSize: 44, color: C.gold }}>{got}/10</span>
      </div>

      <div style={{ position: "absolute", top: top + PYR.h + 14, left: 70, right: 70, borderRadius: 18, background: C.grad, padding: "10px 24px", textAlign: "center", border: `3px solid ${C.ink}` }}>
        <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 34, color: C.ink, lineHeight: 1.15 }}>{p.category}</div>
        {p.reference && <div style={{ fontFamily: FONT.body, fontWeight: 800, fontSize: 22, color: C.ink, opacity: 0.75 }}>{p.reference}</div>}
      </div>

      <Stamps stamps={p.stamps} y={top + PYR.h / 2} />
    </AbsoluteFill>
  );
};
