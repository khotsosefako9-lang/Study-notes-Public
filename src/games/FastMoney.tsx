import { AbsoluteFill } from "remotion";
import { Footage, BoardShade } from "../components/Footage";
import { Captions } from "../components/Captions";
import { TitleBar } from "../components/TitleBar";
import { Stamps } from "../components/Stamps";
import { Panel, Timer } from "../components/Panel";
import { BOARD, C, FONT } from "../theme";
import { useSeconds, since } from "../time";
import type { Common } from "../types";

type Answer = { a: string; pts: number; at: number; ptsAt: number };

export type FastMoneyProps = Common & {
  names: [string, string];
  subtitle?: string; // e.g. "(Player 2 can't hear)"
  goal: number;
  rows: { p1?: Answer; p2?: Answer }[]; // five questions
  coverP1?: [number, number]; // optional: hide Player 1's answers while Player 2 plays, like the show
  timers?: { start: number; seconds: number; until?: number }[]; // until: hide early if they finish before time runs out
};

const counted = (t: number, a?: Answer) => (a ? a.pts * since(t, a.ptsAt, 0.5) : 0);

const Cell: React.FC<{ t: number; a?: Answer; covered: boolean }> = ({ t, a, covered }) => {
  const shown = since(t, a?.at, 0.25);
  const pts = since(t, a?.ptsAt, 0.3);
  return (
    <div style={{ display: "flex", gap: 8, flex: 1, minWidth: 0 }}>
      <div
        style={{
          flex: 1, minWidth: 0, height: 70, borderRadius: 14, background: C.slot, display: "flex", alignItems: "center",
          padding: "0 18px", position: "relative", overflow: "hidden", border: "2px solid rgba(245,179,53,.25)",
        }}
      >
        <span
          style={{
            fontFamily: FONT.display, fontWeight: 700, fontSize: 34, color: C.cream, whiteSpace: "nowrap",
            overflow: "hidden", textOverflow: "ellipsis", opacity: shown, transform: `translateX(${(1 - shown) * -20}px)`,
          }}
        >
          {a?.a}
        </span>
        {covered && <div style={{ position: "absolute", inset: 0, background: C.grad }} />}
      </div>
      <div
        style={{
          width: 86, height: 70, borderRadius: 14, display: "grid", placeItems: "center",
          background: pts > 0 ? C.grad : C.slot, border: "2px solid rgba(245,179,53,.25)",
          fontFamily: FONT.display, fontWeight: 800, fontSize: 36, color: C.ink,
        }}
      >
        {!covered && pts > 0 ? Math.round(a!.pts * pts) : ""}
      </div>
    </div>
  );
};

export const FastMoney: React.FC<FastMoneyProps> = (p) => {
  const t = useSeconds();
  const covered = !!p.coverP1 && t >= p.coverP1[0] && t < p.coverP1[1];
  const s1 = Math.round(p.rows.reduce((s, r) => s + counted(t, r.p1), 0));
  const s2 = Math.round(p.rows.reduce((s, r) => s + counted(t, r.p2), 0));
  const total = s1 + s2;
  const reached = total >= p.goal;
  const timer = p.timers?.find((x) => t >= x.start && t <= (x.until ?? x.start + x.seconds + 0.6));

  return (
    <AbsoluteFill style={{ background: C.night }}>
      <Footage video={p.video} position={p.videoPosition} />
      <BoardShade />
      <TitleBar title={p.title} />

      <Captions words={p.captions} y={BOARD.top - 120} />

      {timer && (
        <div style={{ position: "absolute", top: BOARD.top - 150, right: 60 }}>
          <Timer t={t} start={timer.start} seconds={timer.seconds} />
        </div>
      )}

      <Panel style={{ top: BOARD.top, left: BOARD.left, width: BOARD.width, height: BOARD.height }}>
        <div style={{ display: "flex", gap: 16, marginBottom: 12 }}>
          {[p.names[0], p.names[1]].map((n, i) => (
            <div key={i} style={{ flex: 1, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 8px" }}>
              <span style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 34, color: C.gold }}>{n}</span>
              <span style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 40, color: C.cream }}>
                {i === 0 ? s1 : s2}
              </span>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {p.rows.map((r, i) => (
            <div key={i} style={{ display: "flex", gap: 16 }}>
              <Cell t={t} a={r.p1} covered={covered} />
              <Cell t={t} a={r.p2} covered={false} />
            </div>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 18, marginTop: 16 }}>
          <span style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 34, color: C.cream }}>Total</span>
          <div style={{ flex: 1, height: 26, borderRadius: 99, background: C.slot, overflow: "hidden", border: "2px solid rgba(245,179,53,.3)" }}>
            <div style={{ height: "100%", width: `${Math.min(100, (total / p.goal) * 100)}%`, background: reached ? C.good : C.grad }} />
          </div>
          <span style={{ fontFamily: FONT.display, fontWeight: 900, fontSize: 46, color: reached ? C.good : C.gold, minWidth: 90, textAlign: "right" }}>
            {total}
          </span>
          <span style={{ fontFamily: FONT.body, fontWeight: 800, fontSize: 26, color: C.muted }}>/ {p.goal}</span>
        </div>
      </Panel>

      {p.subtitle && (
        <div style={{ position: "absolute", top: BOARD.top - 46, width: "100%", textAlign: "center", fontFamily: FONT.body, fontWeight: 800, fontSize: 30, color: C.cream, textShadow: "0 2px 8px rgba(0,0,0,.6)" }}>
          {p.subtitle}
        </div>
      )}
      <Stamps stamps={p.stamps} y={BOARD.top + BOARD.height / 2} />
    </AbsoluteFill>
  );
};
