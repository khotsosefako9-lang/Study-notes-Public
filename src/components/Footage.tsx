import { AbsoluteFill, OffthreadVideo, staticFile } from "remotion";
import { C, FONT } from "../theme";

export const Footage: React.FC<{ video?: string; position?: string }> = ({ video, position }) => {
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
  return (
    <AbsoluteFill>
      <OffthreadVideo
        src={staticFile(video)}
        style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: position ?? "50% 30%" }}
      />
    </AbsoluteFill>
  );
};

// Darkens the lower half so the board reads cleanly over any footage.
export const BoardShade: React.FC<{ top?: number }> = ({ top = 960 }) => (
  <AbsoluteFill
    style={{ background: `linear-gradient(180deg, rgba(22,16,10,0) ${top - 230}px, rgba(22,16,10,.55) ${top}px, rgba(22,16,10,.8) 100%)` }}
  />
);
