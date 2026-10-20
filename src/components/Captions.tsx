import { C, FONT } from "../theme";
import { useSeconds, easeOut } from "../time";
import type { Word } from "../types";

type Chunk = { words: Word[]; start: number; end: number };

const MAX_WORDS = 3;
const GAP = 0.35; // a pause this long starts a new chunk

export const chunkWords = (words: Word[]): Chunk[] => {
  const chunks: Chunk[] = [];
  let cur: Word[] = [];
  const flush = () => {
    if (cur.length) chunks.push({ words: cur, start: cur[0].start, end: cur[cur.length - 1].end });
    cur = [];
  };
  words.forEach((w, i) => {
    const prev = words[i - 1];
    if (cur.length && (cur.length >= MAX_WORDS || w.start - prev.end > GAP || /[.!?,]$/.test(prev.text))) flush();
    cur.push(w);
  });
  flush();
  // Hold each chunk briefly after the last word so it doesn't flicker off.
  chunks.forEach((c, i) => {
    const next = chunks[i + 1];
    c.end = Math.min(c.end + 0.4, next ? next.start : c.end + 0.4);
  });
  return chunks;
};

export const Captions: React.FC<{ words?: Word[]; y: number }> = ({ words, y }) => {
  const t = useSeconds();
  if (!words?.length) return null;
  const chunk = chunkWords(words).find((c) => t >= c.start && t < c.end);
  if (!chunk) return null;
  const k = easeOut((t - chunk.start) / 0.12);
  return (
    <div
      style={{
        position: "absolute", top: y, left: 60, right: 60, transform: `translateY(-50%) scale(${0.94 + 0.06 * k})`,
        opacity: k, textAlign: "center", fontFamily: FONT.display, fontWeight: 800, fontSize: 66, lineHeight: 1.15,
        color: "#fff", WebkitTextStroke: `12px ${C.ink}`, paintOrder: "stroke fill",
        textShadow: "0 6px 18px rgba(0,0,0,.35)",
      }}
    >
      {chunk.words.map((w, i) => (
        <span key={i} style={{ color: t >= w.start && t < w.end + 0.05 ? C.gold : "#fff" }}>
          {w.text.trim()}{" "}
        </span>
      ))}
    </div>
  );
};
