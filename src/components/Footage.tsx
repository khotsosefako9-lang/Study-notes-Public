import { AbsoluteFill, OffthreadVideo, staticFile } from "remotion";
import { C, FONT } from "../theme";

export const Footage: React.FC<{ video?: string; position?: string; offsetY?: number }> = ({ video, position, offsetY = 0 }) => {
  if (!video) {
    // Placeholder so templates can be previewed before the shoot.
    return (
      <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 28%, #6b4a2e 0%, ${C.night} 70%)` }}>
        <div
          style={{
            position: "absolute", top: 520, width: "100%", textAlign: "center",
            fontFamily: FONT.body, fontWeight: 800, fontSize: 40, color: "rgba(252,241,226,.35)",
            letterSpacing: 6, textTransform: "uppercase",
          }}
        >
          Footage goes here
        </div>
      </AbsoluteFill>
    );
  }
  const fit: React.CSSProperties = { width: "100%", height: "100%", objectFit: "cover", objectPosition: position ?? "50% 30%" };
  if (!offsetY) {
    return (
      <AbsoluteFill>
        <OffthreadVideo src={staticFile(video)} style={fit} />
      </AbsoluteFill>
    );
  }
  // Lower the shot to free space above the players; a blurred copy fills the gap with soft wall.
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <OffthreadVideo muted src={staticFile(video)} style={{ ...fit, filter: "blur(40px)", transform: "scale(1.15)" }} />
      <OffthreadVideo
        src={staticFile(video)}
        style={{
          ...fit, position: "absolute", top: offsetY,
          WebkitMaskImage: "linear-gradient(180deg, transparent 0px, #000 140px)",
        }}
      />
    </AbsoluteFill>
  );
};

// Darkens the lower half so a bottom board reads cleanly over any footage.
export const BoardShade: React.FC<{ top?: number }> = ({ top = 960 }) => (
  <AbsoluteFill
    style={{ background: `linear-gradient(180deg, rgba(22,16,10,0) ${top - 230}px, rgba(22,16,10,.55) ${top}px, rgba(22,16,10,.8) 100%)` }}
  />
);
