import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition, openBrowser } from "@remotion/renderer";
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

const render = async (id, output) => {
  const composition = await selectComposition({ serveUrl: bundled, id, puppeteerInstance: browser });
  await renderMedia({
    composition,
    serveUrl: bundled,
    codec: "h264",
    outputLocation: output,
    puppeteerInstance: browser,
    muted: true,
    concurrency: 1,
  });
  console.log("rendered", output);
};

await render("main-vertical", process.argv[2] ?? "/mnt/documents/ancestrale-pos-motion-vertical.mp4");
await render("main-horizontal", process.argv[3] ?? "/mnt/documents/ancestrale-pos-motion-horizontal.mp4");

await browser.close({ silent: false });
console.log("done");
