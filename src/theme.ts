import "@fontsource/poppins/600.css";
import "@fontsource/poppins/700.css";
import "@fontsource/poppins/800.css";
import "@fontsource/poppins/900.css";
import "@fontsource/mulish/700.css";
import "@fontsource/mulish/800.css";

// REACH Summerstrand palette, taken from the Bible study games site.
export const C = {
  cream: "#FBF5EA",
  ink: "#2B1D10",
  night: "#16100A",
  panel: "#22180F",
  panel2: "#2B2016",
  slot: "#3A2A1B",
  orange: "#EE7A1E",
  gold: "#F5B335",
  ember: "#C9500F",
  good: "#3CCB7F",
  bad: "#E5484D",
  muted: "#C2A98C",
  grad: "linear-gradient(120deg,#F7B733 0%,#F08A24 45%,#DF5B14 100%)",
};

export const FONT = {
  display: "Poppins, sans-serif",
  body: "Mulish, sans-serif",
};

export const W = 1080;
export const H = 1920;
export const FPS = 30;

// Board panel sits in the lower half, clear of Instagram's caption and buttons.
export const BOARD = { top: 1000, left: 48, width: W - 96, height: 620 };
