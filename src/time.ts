import { useCurrentFrame, useVideoConfig } from "remotion";

export const useSeconds = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return frame / fps;
};

export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

// Gentle ease-out for reveals: the house style is clean, not bouncy.
export const easeOut = (x: number) => 1 - Math.pow(1 - clamp01(x), 3);

export const since = (t: number, at: number | undefined, dur: number) =>
  at === undefined || t < at ? 0 : easeOut((t - at) / dur);
