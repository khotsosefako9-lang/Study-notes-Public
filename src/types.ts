// All times are seconds on the edited (rough-cut) timeline.

export type Word = { text: string; start: number; end: number };

export type Stamp = {
  at: number;
  text: string;
  tone?: "gold" | "red" | "green";
  duration?: number;
};

export type Common = {
  video?: string; // path inside public/, e.g. "footage/tenable-roughcut.mp4"
  videoPosition?: string; // CSS object-position, e.g. "50% 30%"
  durationInSeconds: number;
  title: string;
  captions?: Word[];
  stamps?: Stamp[];
};
