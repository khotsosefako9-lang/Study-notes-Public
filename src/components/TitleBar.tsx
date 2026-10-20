import { Img, staticFile } from "remotion";
import { C, FONT } from "../theme";

export const TitleBar: React.FC<{ title: string; top?: number }> = ({ title, top = 150 }) => (
  <div style={{ position: "absolute", top, width: "100%", display: "flex", justifyContent: "center" }}>
    <div
      style={{
        display: "flex", alignItems: "center", gap: 18, padding: "14px 34px 14px 22px", borderRadius: 999,
        background: "rgba(22,16,10,.72)", border: `3px solid ${C.gold}`, boxShadow: "0 10px 30px rgba(0,0,0,.35)",
      }}
    >
      <Img src={staticFile("brand/mark.png")} style={{ height: 62 }} />
      <span style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 52, color: C.cream, letterSpacing: 0.5 }}>
        {title}
      </span>
    </div>
  </div>
);
