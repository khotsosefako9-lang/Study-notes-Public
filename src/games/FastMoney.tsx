import { AbsoluteFill } from "remotion";
import { Footage, BoardShade } from "../components/Footage";
import { Captions } from "../components/Captions";
import { TitleBar } from "../components/TitleBar";
import { Stamps } from "../components/Stamps";
import { Panel, Timer } from "../components/Panel";
import { BOARD, C, FONT, H } from "../theme";
import { useSeconds, since } from "../time";
import type { Common } from "../types";

type Answer = { a: string; pts: number; at: number; ptsAt: number }; // pts 0 = no match

export type FastMoneyProps = Common & {
  names: [string, string]; // players, or teams such as ["Ladies", "Guys"]
  subtitle?: string; // e.g. "(Headphones on)"
  subtitleUntil?: number; // hide the subtitle once viewers know the rules
  goal?: number; // set for the shared-goal version; leave out for team vs team
  rows: { q?: string; qAt?: number; p1?: Answer; p2?: Answer }[]; // five questions or matchups
  boardTop?: number; // e.g. move the board up onto the wall above the players
  boardScale?: number; // shrink the board, e.g. 0.85
  coverP1?: [number, number]; // optional: hide Player 1's answers while Player 2 plays, like the show
  timers?: { start: number; seconds: number; until?: number }[]; // until: hide early if they finish before time runs out
};

const counted = (t: number, a?: Answer) => (a ? a.pts * since(t, a.ptsAt, 0.5) : 0);

const Cell: React.FC<{ t: number; a?: Answer; covered: boolean }> = ({ t, a, covered }) => {
  const shown = since(t, a?.at, 0.25);
  const pts = since(t, a?.ptsAt, 0.3);
  const miss = pts > 0 && a!.pts === 0;
  return (
    <div style={{ display: "flex", gap: 8, flex: 1, minWidth: 0 }}>
      <div
        style={{
          flex: 1, minWidth: 0, height: 60, borderRadius: 14, background: C.slot, display: "flex", alignItems: "center",
          padding: "0 18px", position: "relative", overflow: "hidden", border: "2px solid rgba(245,179,53,.25)",
        }}
      >
        <span
          style={{
            fontFamily: FONT.display, fontWeight: 700, fontSize: 32, color: C.cream, whiteSpace: "nowrap",
            overflow: "hidden", textOverflow: "ellipsis", opacity: shown, transform: `translateX(${(1 - shown) * -20}px)`,
          }}
        >
          {a?.a}
        </span>
        {covered && <div style={{ position: "absolute", inset: 0, background: C.grad }} />}
      </div>
      <div
        style={{
          width: 86, height: 60, borderRadius: 14, display: "grid", placeItems: "center",
          background: miss ? C.bad : pts > 0 ? C.grad : C.slot, border: "2px solid rgba(245,179,53,.25)",
          fontFamily: FONT.display, fontWeight: 800, fontSize: 36, color: miss ? "#fff" : C.ink,
          transform: `scale(${pts > 0 ? 1 + 0.12 * Math.sin(Math.PI * Math.min(1, pts)) : 1})`,
        }}
      >
        {covered || pts === 0 ? "" : miss ? "✕" : Math.round(a!.pts * pts)}
      </div>
    </div>
  );
};

export const FastMoney: React.FC<FastMoneyProps> = (p) => {
  const t = useSeconds();
  const top = p.boardTop ?? BOARD.top;
  const scale = p.boardScale ?? 1;
  const boardBottom = top + 522 * scale; // natural board height is about 522px
  const below = top > H / 2; // board in the lower half: shade the footage behind it
  const covered = !!p.coverP1 && t >= p.coverP1[0] && t < p.coverP1[1];
  const s1 = Math.round(p.rows.reduce((s, r) => s + counted(t, r.p1), 0));
  const s2 = Math.round(p.rows.reduce((s, r) => s + counted(t, r.p2), 0));
  const total = s1 + s2;
  const reached = p.goal !== undefined && total >= p.goal;
  const qi = p.rows.reduce((cur, r, i) => (r.qAt !== undefined && r.qAt <= t ? i : cur), -1);
  const q = qi >= 0 ? p.rows[qi] : undefined;
  const qk = since(t, q?.qAt, 0.3);
  const timer = p.timers?.find((x) => t >= x.start && t <= (x.until ?? x.start + x.seconds + 0.6));

  return (
    <AbsoluteFill style={{ background: C.night }}>
      <Footage video={p.video} position={p.videoPosition} offsetY={p.videoOffsetY} />
      {below && <BoardShade top={top} />}
      <TitleBar title={p.title} />
      {q?.q && (
        <div style={{ position: "absolute", top: 262, left: 70, right: 70, display: "flex", justifyContent: "center", opacity: qk, transform: `translateY(${(1 - qk) * -16}px)` }}>
          <div style={{ background: C.cream, borderRadius: 22, padding: "16px 30px", textAlign: "center", boxShadow: "0 10px 30px rgba(0,0,0,.35)" }}>
            <div style={{ fontFamily: FONT.body, fontWeight: 800, fontSize: 26, color: C.ember, letterSpacing: 3, textTransform: "uppercase" }}>
              {p.goal === undefined ? "Matchup" : "Question"} {qi + 1} of {p.rows.length}
            </div>
            <div style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 42, color: C.ink, lineHeight: 1.15 }}>{q.q}</div>
          </div>
        </div>
      )}

      <Captions words={p.captions} y={p.captionY ?? top - 120} />

      {timer && (
        <div style={{ position: "absolute", top: top - 150, right: 60 }}>
          <Timer t={t} start={timer.start} seconds={timer.seconds} />
        </div>
      )}

      <Panel style={{ top, left: BOARD.left, width: BOARD.width, transform: `scale(${scale})`, transformOrigin: "top center" }}>
        <div style={{ display: "flex", gap: 16, marginBottom: 12 }}>
          {[p.names[0], p.names[1]].map((n, i) => (
            <div key={i} style={{ flex: 1, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 8px" }}>
              <span style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 34, color: C.gold }}>{n}</span>
              {p.goal !== undefined && (
                <span style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 40, color: C.cream }}>
                  {i === 0 ? s1 : s2}
                </span>
              )}
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
        {p.goal !== undefined ? (
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
        ) : (
          <div style={{ display: "flex", gap: 16, marginTop: 14 }}>
            {[s1, s2].map((v, i) => {
              const lead = v > [s1, s2][1 - i];
              return (
                <div key={i} style={{ flex: 1, height: 64, borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 22px", background: lead ? C.grad : C.slot, border: "2px solid rgba(245,179,53,.3)" }}>
                  <span style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 32, color: lead ? C.ink : C.cream }}>Total</span>
                  <span style={{ fontFamily: FONT.display, fontWeight: 900, fontSize: 46, color: lead ? C.ink : C.gold }}>{v}</span>
                </div>
              );
            })}
          </div>
        )}
      </Panel>

      {p.subtitle && t < (p.subtitleUntil ?? Infinity) && (
        <div style={{ position: "absolute", top: below ? top - 46 : boardBottom + 14, width: "100%", textAlign: "center", fontFamily: FONT.body, fontWeight: 800, fontSize: 30, color: C.cream, textShadow: "0 2px 8px rgba(0,0,0,.6)" }}>
          {p.subtitle}
        </div>
      )}
      <Stamps stamps={p.stamps} y={top + 240 * scale} />
    </AbsoluteFill>
  );
};
