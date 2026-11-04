import { AbsoluteFill } from "remotion";
import { Footage } from "../components/Footage";
import { Captions } from "../components/Captions";
import { TitleBar } from "../components/TitleBar";
import { Stamps } from "../components/Stamps";
import { Panel } from "../components/Panel";
import { BOARD, C, FONT } from "../theme";
import { useSeconds, since, easeOut, clamp01 } from "../time";
import type { Common } from "../types";

// "Who Said It?": a famous line, four Bible names, one Lady vs one Gent per matchup.

type Pick = { team: 0 | 1; option: number; at: number }; // a player locks in an option

type Matchup = {
  at: number;
  players: [string, string]; // [lady, gent]
  quote: string;
  quoteAt?: number; // when the host reads it; defaults to at
  options: string[];
  optionsAt?: number;
  answer: number; // index of the correct option
  ref: string;
  note?: string;
  picks: Pick[];
  revealAt: number;
  noScore?: boolean; // e.g. a question both got right before a tiebreaker
  label?: string; // banner text instead of "Matchup n"
};

export type WhoSaidItProps = Common & {
  teams: [string, string];
  intro?: string;
  rules?: { at: number; until: number; lines: string[] };
  matchups: Matchup[];
  boardTop?: number;
  boardScale?: number;
};

const TEAM_COLOUR = [C.gold, C.orange];
const LETTERS = ["A", "B", "C", "D"];

// A matchup is won by whoever picked the right answer; if both did, both score.
const won = (m: Matchup, t: number) =>
  m.noScore || t < m.revealAt ? [0, 0] : [0, 1].map((team) => (m.picks.some((p) => p.team === team && p.option === m.answer) ? 1 : 0));

const Board: React.FC<{ m: Matchup; t: number; teams: [string, string]; score: number[] }> = ({ m, t, teams, score }) => {
  const qk = since(t, m.quoteAt ?? m.at, 0.4);
  const ok = since(t, m.optionsAt ?? m.quoteAt ?? m.at, 0.35);
  const rk = since(t, m.revealAt, 0.3);
  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        {[0, 1].map((i) => (
          <div key={i} style={{ order: i === 0 ? 0 : 2, display: "flex", flexDirection: "column", alignItems: i === 0 ? "flex-start" : "flex-end" }}>
            <span style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 28, color: TEAM_COLOUR[i] }}>{teams[i]}</span>
            <span style={{ fontFamily: FONT.display, fontWeight: 900, fontSize: 46, color: C.cream, lineHeight: 1 }}>{score[i]}</span>
          </div>
        ))}
        <div style={{ order: 1, fontFamily: FONT.display, fontWeight: 800, fontSize: 30, color: C.muted, letterSpacing: 3, textTransform: "uppercase" }}>Who said it?</div>
      </div>
      <div style={{ opacity: qk, transform: `translateY(${(1 - qk) * 14}px)`, background: C.cream, borderRadius: 20, padding: "22px 30px 22px 64px", marginBottom: 22, position: "relative" }}>
        <div style={{ position: "absolute", top: -18, left: 18, fontFamily: "Georgia, serif", fontSize: 110, lineHeight: 1, color: C.orange }}>“</div>
        <div style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: m.quote.length > 70 ? 36 : 44, color: C.ink, lineHeight: 1.2, textAlign: "center" }}>{m.quote}</div>
        {rk > 0 && (
          <div style={{ marginTop: 10, textAlign: "center", fontFamily: FONT.body, fontWeight: 800, fontSize: 28, color: C.ember, opacity: rk }}>
            {m.options[m.answer]} · {m.ref}
          </div>
        )}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: 12, opacity: ok }}>
        {m.options.map((o, i) => {
          const picks = m.picks.filter((p) => p.option === i && p.at <= t);
          const right = i === m.answer;
          const bg = rk > 0 && right ? C.good : rk > 0 && picks.length ? C.bad : picks.length ? "#5A4636" : C.slot;
          return (
            <div key={i} style={{ position: "relative", height: 84, borderRadius: 16, background: bg, border: `3px solid ${picks.length && rk === 0 ? TEAM_COLOUR[picks[0].team] : "rgba(245,179,53,.3)"}`, display: "flex", alignItems: "center", gap: 14, padding: "0 16px", transform: `scale(${rk > 0 && right ? 1 + 0.06 * Math.sin(Math.PI * clamp01((t - m.revealAt) / 0.4)) : 1})` }}>
              <span style={{ width: 46, height: 46, borderRadius: 99, display: "grid", placeItems: "center", background: "rgba(0,0,0,.25)", fontFamily: FONT.display, fontWeight: 800, fontSize: 26, color: C.gold, flexShrink: 0 }}>{LETTERS[i]}</span>
              <span style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: o.length > 16 ? 26 : 32, color: C.cream, lineHeight: 1.05, minWidth: 0 }}>{o}</span>
              <div style={{ position: "absolute", top: -18, right: 10, display: "flex", gap: 6 }}>
                {picks.map((p, k) => (
                  <span key={k} style={{ padding: "2px 12px", borderRadius: 99, background: TEAM_COLOUR[p.team], fontFamily: FONT.body, fontWeight: 800, fontSize: 24, color: C.ink, transform: `scale(${easeOut((t - p.at) / 0.2)})` }}>
                    {m.players[p.team]}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
};

export const WhoSaidIt: React.FC<WhoSaidItProps> = (p) => {
  const t = useSeconds();
  const top = p.boardTop ?? BOARD.top;
  const scale = p.boardScale ?? 1;
  const started = p.matchups.filter((m) => m.at <= t);
  const m = started[started.length - 1];
  const score = [0, 1].map((i) => started.reduce((s, x) => s + won(x, t)[i], 0));
  const rules = p.rules && t >= p.rules.at && t < p.rules.until ? p.rules : undefined;
  const rulesK = rules ? Math.min(easeOut((t - rules.at) / 0.3), clamp01((rules.until - t) / 0.25)) : 0;
  const idx = m ? p.matchups.indexOf(m) : -1;

  return (
    <AbsoluteFill style={{ background: C.night }}>
      <Footage video={p.video} position={p.videoPosition} offsetY={p.videoOffsetY} />
      <TitleBar title={p.title} />
      <div style={{ position: "absolute", top: 262, left: 70, right: 70, display: "flex", justifyContent: "center" }}>
        <div style={{ background: C.cream, borderRadius: 22, padding: "14px 30px", textAlign: "center", boxShadow: "0 10px 30px rgba(0,0,0,.35)" }}>
          {m ? (
            <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 36, color: C.ink }}>
              <span style={{ color: C.ember, letterSpacing: 2 }}>{(m.label ?? `Matchup ${idx + 1}`).toUpperCase()} · </span>
              {m.players[0]} vs {m.players[1]}
            </div>
          ) : (
            <div style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 40, color: C.ink }}>{p.intro}</div>
          )}
        </div>
      </div>
      {rules && (
        <Panel style={{ top, left: BOARD.left, width: BOARD.width, opacity: rulesK, transform: `scale(${scale})`, transformOrigin: "top center" }}>
          <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 40, color: C.gold, marginBottom: 14 }}>How it works</div>
          {rules.lines.map((l, i) => (
            <div key={i} style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 38, color: C.cream, lineHeight: 1.3, marginBottom: 8, opacity: since(t, rules.at + 0.3 + i * 0.35, 0.3) }}>{l}</div>
          ))}
        </Panel>
      )}
      {m && !rules && (
        <Panel style={{ top, left: BOARD.left, width: BOARD.width, transform: `scale(${scale})`, transformOrigin: "top center" }}>
          <Board m={m} t={t} teams={p.teams} score={score} />
        </Panel>
      )}
      <Captions words={p.captions} y={p.captionY ?? 1520} />
      <Stamps stamps={p.stamps} y={top + 330 * scale} />
    </AbsoluteFill>
  );
};
