import { Config } from "@remotion/cli/config";
import fs from "node:fs";

// The cloud sandbox can't download Remotion's Chrome, but ships a Playwright one.
const sandboxChrome = "/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell";
if (fs.existsSync(sandboxChrome)) Config.setBrowserExecutable(sandboxChrome);

Config.setVideoImageFormat("jpeg");
Config.setJpegQuality(92);
Config.setCodec("h264");
Config.setCrf(18);
