import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition, openBrowser } from "@remotion/renderer";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const bundled = await bundle({
  entryPoint: path.resolve(__dirname, "../src/index.ts"),
  webpackOverride: (c) => c,
});

const browser = await openBrowser("chrome", {
  browserExecutable: process.env.PUPPETEER_EXECUTABLE_PATH ?? "/bin/chromium",
  chromiumOptions: { args: ["--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage"] },
  chromeMode: "chrome-for-testing",
});

const id = process.argv[2] ?? "main-vertical";
const frame = Number(process.argv[3] ?? 60);
const output = process.argv[4] ?? `/tmp/${id}-${frame}.png`;

const composition = await selectComposition({ serveUrl: bundled, id, puppeteerInstance: browser });
await renderStill({
  composition,
  serveUrl: bundled,
  output,
  puppeteerInstance: browser,
  frame,
});

await browser.close({ silent: false });
console.log("still saved to", output);
