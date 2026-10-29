import { Composition, CalculateMetadataFunction } from "remotion";
import { FastMoney, FastMoneyProps } from "./games/FastMoney";
import { ChurchFeud, ChurchFeudProps } from "./games/ChurchFeud";
import { Tenable, TenableProps } from "./games/Tenable";
import { Highlights, HighlightsProps } from "./Highlights";
import { EventReel, EventReelProps } from "./event/EventReel";
import { FPS, W, H } from "./theme";
import type { Common } from "./types";
import fastMoney from "../projects/examples/fast-money.json";
import churchFeud from "../projects/examples/church-feud.json";
import tenable from "../projects/examples/tenable.json";
import highlights from "../projects/examples/highlights.json";
import fllDemo from "../projects/fll-2026/demo-vertical.json";

// Length comes from the props file, so each reel sets its own duration.
const byProps: CalculateMetadataFunction<Common> = ({ props }) => ({
  durationInFrames: Math.round(props.durationInSeconds * FPS),
});

export const Root: React.FC = () => (
  <>
    <Composition id="FastMoney" component={FastMoney} width={W} height={H} fps={FPS} durationInFrames={1}
      defaultProps={fastMoney as FastMoneyProps} calculateMetadata={byProps as any} />
    <Composition id="ChurchFeud" component={ChurchFeud} width={W} height={H} fps={FPS} durationInFrames={1}
      defaultProps={churchFeud as ChurchFeudProps} calculateMetadata={byProps as any} />
    <Composition id="Tenable" component={Tenable} width={W} height={H} fps={FPS} durationInFrames={1}
      defaultProps={tenable as TenableProps} calculateMetadata={byProps as any} />
    <Composition id="Highlights" component={Highlights} width={W} height={H} fps={FPS} durationInFrames={1}
      defaultProps={highlights as HighlightsProps} calculateMetadata={byProps as any} />
    <Composition id="EventReel" component={EventReel} width={W} height={H} fps={FPS} durationInFrames={1}
      defaultProps={fllDemo as EventReelProps} calculateMetadata={byProps as any} />
    <Composition id="EventReelWide" component={EventReel} width={1920} height={1080} fps={FPS} durationInFrames={1}
      defaultProps={fllDemo as EventReelProps} calculateMetadata={byProps as any} />
  </>
);
