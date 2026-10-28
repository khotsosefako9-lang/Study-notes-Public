import { AbsoluteFill } from "remotion";
import { Footage, BoardShade } from "../components/Footage";
import { Captions } from "../components/Captions";
import { TitleBar } from "../components/TitleBar";
import { Stamps } from "../components/Stamps";
import { Panel } from "../components/Panel";
import { BOARD, C, FONT, H } from "../theme";
import { useSeconds, since, easeOut, clamp01 } from "../time";
import type { Common } from "../types";

type Answer = { a: string; pts: number; at?: number; counts?: boolean }; // counts:false = revealed after the round

type Round = {
  round?: string; // e.g. "Round 1"
  question: string;
  players?: [string, string]; // who's up for each team this round
  answers: Answer[];
  strikes?: number[]; // times a strike is given
  awards?: { at: number; team: 0 | 1 }[]; // bank goes to a team
};

export type ChurchFeudProps = Common & Round & {
  teams: [string, string];
  rounds?: (Round & { at: number })[]; // several rounds in one reel; team scores carry over
  intro?: string; // banner text before the first round, e.g. the hook
  rules?: { at: number; until: number; lines: string[] }; // how-to-play card shown in the board's place
  scoreBy?: "points" | "rounds"; // rounds: each award counts as one round won
  layout?: "split" | "insert"; // split: board always under the footage. insert: full-screen board cut-ins
  boardShots?: { from: number; to: number }[];
  boardTop?: number; // split layout: e.g. move the board up onto the wall above the players
  boardScale?: number;
};

const scores = (p: ChurchFeudProps, t: number) => {
  const team = [0, 0];
  let bank = 0;
  const events = [
    ...p.answers.filter((a) => a.at !== undefined && a.counts !== false).map((a) => ({ at: a.at!, add: a.pts, team: -1 })),
    ...(p.awards ?? []).map((w) => ({ at: w.at, add: 0, team: w.team })),
  ].sort((x, y) => x.at - y.at);
  for (const e of events) {
    if (e.at > t) break;
    if (e.team < 0) bank += e.add;
    else { team[e.team] += bank; bank = 0; }
  }
  return { team, bank };
};

const Slot: React.FC<{ t: number; n: number; a: Answer }> = ({ t, n, a }) => {
  const k = since(t, a.at, 0.35);
  const rest = a.counts === false;
  return (
    <div style={{ height: 78, perspective: 600 }}>
      {k === 0 ? (
        <div style={{ height: "100%", borderRadius: 14, background: C.slot, border: "2px solid rgba(245,179,53,.3)", display: "grid", placeItems: "center" }}>
          <div style={{ width: 52, height: 52, borderRadius: 99, border: `3px solid ${C.gold}`, display: "grid", placeItems: "center", fontFamily: FONT.display, fontWeight: 800, fontSize: 30, color: C.gold }}>
            {n}
          </div>
        </div>
      ) : (
        <div
          style={{
            height: "100%", borderRadius: 14, display: "flex", alignItems: "center", overflow: "hidden",
            background: rest ? "#5A4636" : C.grad, transform: `rotateX(${(1 - k) * -90}deg)`,
          }}
        >
          <span style={{ flex: 1, minWidth: 0, padding: "0 16px", fontFamily: FONT.display, fontWeight: 700, fontSize: a.a.length > 16 ? 26 : 32, color: rest ? C.cream : C.ink, lineHeight: 1.05 }}>
            {a.a}
          </span>
          <span style={{ width: 74, height: "100%", display: "grid", placeItems: "center", background: "rgba(43,29,16,.85)", fontFamily: FONT.display, fontWeight: 800, fontSize: 34, color: rest ? C.muted : C.gold }}>
            {a.pts}
          </span>
        </div>
      )}
    </div>
  );
};

const roundsWon = (p: ChurchFeudProps, t: number) =>
  [0, 1].map((i) => (p.awards ?? []).filter((w) => w.at <= t && w.team === i).length);

const Board: React.FC<{ p: ChurchFeudProps; t: number; carried: number[]; style: React.CSSProperties }> = ({ p, t, carried, style }) => {
  const { team: own, bank } = scores(p, t);
  const byRounds = p.scoreBy === "rounds";
  const team = (byRounds ? roundsWon(p, t) : own).map((v, i) => v + carried[i]);
  const strikes = (p.strikes ?? []).filter((s) => s <= t).length;
  const rows = Math.ceil(p.answers.length / 2);
  return (
    <Panel style={style}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        {[0, 1].map((i) => (
          <div key={i} style={{ order: i === 0 ? 0 : 2, display: "flex", flexDirection: "column", alignItems: i === 0 ? "flex-start" : "flex-end", width: 280 }}>
            <span style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 28, color: C.gold }}>{p.teams[i]}{byRounds && <span style={{ fontFamily: FONT.body, fontSize: 20, color: C.muted }}> · rounds</span>}</span>
            <span style={{ fontFamily: FONT.display, fontWeight: 900, fontSize: 44, color: C.cream, lineHeight: 1 }}>{team[i]}</span>
          </div>
        ))}
        <div style={{ order: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ minWidth: 140, padding: "4px 22px", borderRadius: 14, background: C.night, border: `3px solid ${C.gold}`, textAlign: "center", fontFamily: FONT.display, fontWeight: 900, fontSize: 52, color: C.gold }}>
            {bank}
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            {[0, 1, 2].map((i) => (
              <div key={i} style={{ width: 36, height: 36, borderRadius: 8, display: "grid", placeItems: "center", fontFamily: FONT.display, fontWeight: 900, fontSize: 26, background: i < strikes ? C.bad : "transparent", border: `2px solid ${i < strikes ? C.bad : "rgba(194,169,140,.4)"}`, color: i < strikes ? "#fff" : "rgba(194,169,140,.4)" }}>
                ✕
              </div>
            ))}
          </div>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gridTemplateRows: `repeat(${rows}, auto)`, gridAutoFlow: "column", gap: 10 }}>
        {p.answers.map((a, i) => <Slot key={i} t={t} n={i + 1} a={a} />)}
      </div>
    </Panel>
  );
};

// Big red X(s) over the screen when a strike lands, like the show.
const StrikeFlash: React.FC<{ p: ChurchFeudProps; t: number; y?: number }> = ({ p, t, y }) => {
  const list = p.strikes ?? [];
  const idx = list.findIndex((s) => t >= s && t < s + 1);
  if (idx < 0) return null;
  const k = easeOut((t - list[idx]) / 0.15), out = clamp01((list[idx] + 1 - t) / 0.2);
  return (
    <AbsoluteFill style={{ display: "flex", flexDirection: "row", justifyContent: "center", alignItems: y === undefined ? "center" : "flex-start", paddingTop: y ?? 0, gap: 20, opacity: Math.min(k, out), zIndex: 30 }}>
      {Array.from({ length: idx + 1 }, (_, i) => (
        <div key={i} style={{ width: 230, height: 270, borderRadius: 26, background: "rgba(22,16,10,.85)", border: `6px solid ${C.bad}`, display: "grid", placeItems: "center", transform: `scale(${0.8 + 0.2 * k})`, fontFamily: FONT.display, fontWeight: 900, fontSize: 220, color: C.bad, lineHeight: 1 }}>
          ✕
        </div>
      ))}
    </AbsoluteFill>
  );
};

export const ChurchFeud: React.FC<ChurchFeudProps> = (all) => {
  const t = useSeconds();
  // With rounds, show the latest one that has started; earlier rounds' awards carry into the team scores.
  const started = all.rounds?.filter((r) => r.at <= t) ?? [];
  const current = started[started.length - 1];
  const p: ChurchFeudProps = current ? { ...all, ...current } : all;
  const carried = [0, 1].map((i) =>
    started.slice(0, -1).reduce((sum, r) => sum + (all.scoreBy === "rounds" ? roundsWon({ ...all, ...r }, t) : scores({ ...all, ...r }, t).team)[i], 0));
  const rules = all.rules && t >= all.rules.at && t < all.rules.until ? all.rules : undefined;
  const rulesK = rules ? Math.min(easeOut((t - rules.at) / 0.3), clamp01((rules.until - t) / 0.25)) : 0;
  const showBoard = !all.rounds || !!current;
  const insert = p.layout === "insert";
  const shot = p.boardShots?.find((s) => t >= s.from && t < s.to);
  const shotK = shot ? Math.min(easeOut((t - shot.from) / 0.25), clamp01((shot.to - t) / 0.2)) : 0;
  const boardH = 140 + Math.ceil(p.answers.length / 2) * 88;
  const top = p.boardTop ?? BOARD.top;
  const scale = p.boardScale ?? 1;

  return (
    <AbsoluteFill style={{ background: C.night }}>
      <Footage video={p.video} position={p.videoPosition} offsetY={p.videoOffsetY} />
      {!insert && top > H / 2 && <BoardShade top={top} />}
      {insert && shotK > 0 && (
        <AbsoluteFill style={{ background: `rgba(22,16,10,${0.75 * shotK})` }}>
          <Board p={p} t={t} carried={carried} style={{ top: (H - boardH) / 2 + 80, left: BOARD.left, width: BOARD.width, opacity: shotK, transform: `scale(${0.94 + 0.06 * shotK})` }} />
        </AbsoluteFill>
      )}
      <TitleBar title={p.title} />
      <div style={{ position: "absolute", top: 262, left: 70, right: 70, display: "flex", justifyContent: "center" }}>
        <div style={{ background: C.cream, borderRadius: 22, padding: "16px 30px", textAlign: "center", boxShadow: "0 10px 30px rgba(0,0,0,.35)" }}>
          {showBoard ? (
            <>
              {p.round && <div style={{ fontFamily: FONT.body, fontWeight: 800, fontSize: 26, color: C.ember, letterSpacing: 3, textTransform: "uppercase" }}>{p.round}{p.players && ` · ${p.players[0]} vs ${p.players[1]}`}</div>}
              <div style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 42, color: C.ink, lineHeight: 1.15 }}>{p.question}</div>
            </>
          ) : (
            <div style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 42, color: C.ink, lineHeight: 1.15 }}>{all.intro}</div>
          )}
        </div>
      </div>

      {insert ? (
        <Captions words={shot ? undefined : p.captions} y={1180} />
      ) : (
        <>
          <Captions words={p.captions} y={p.captionY ?? top - 90} />
          {showBoard && <Board p={p} t={t} carried={carried} style={{ top, left: BOARD.left, width: BOARD.width, transform: `scale(${scale})`, transformOrigin: "top center" }} />}
        </>
      )}

      {rules && (
        <Panel style={{ top, left: BOARD.left, width: BOARD.width, opacity: rulesK, transform: `scale(${scale * (0.96 + 0.04 * rulesK)})`, transformOrigin: "top center" }}>
          <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 40, color: C.gold, marginBottom: 14 }}>How it works</div>
          {rules.lines.map((l, i) => (
            <div key={i} style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 38, color: C.cream, lineHeight: 1.3, marginBottom: 8, opacity: since(t, rules.at + 0.3 + i * 0.35, 0.3) }}>
              {l}
            </div>
          ))}
        </Panel>
      )}
      {showBoard && <StrikeFlash p={p} t={t} y={!insert && top < H / 2 ? top + 60 * scale : undefined} />}
      <Stamps stamps={all.stamps} y={insert ? 960 : top + 300 * scale} />
    </AbsoluteFill>
  );
};
