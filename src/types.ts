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
  videoOffsetY?: number; // push the shot down to make room for the board above the players
  durationInSeconds: number;
  title: string;
  captions?: Word[];
  captionY?: number; // centre line of the captions; move them off faces for low-seated shots
  stamps?: Stamp[];
};
