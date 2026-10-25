import { chromium } from "playwright";
import path from "node:path";
import { pathToFileURL } from "node:url";

const workspace = "/Users/kxue971student.fuhsd.org/Desktop/workspace/NASA space APPS final prototype";
const source = path.join(workspace, "ExoPlain-A0-Professional-Poster.html");
const output = path.join(workspace, "output/pdf/ExoPlain_AIAS_2026_Professional_A0_Poster.pdf");

const browser = await chromium.launch({
  headless: true,
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
});
const page = await browser.newPage({ viewport: { width: 1587, height: 2246 }, deviceScaleFactor: 1 });
await page.goto(pathToFileURL(source).href, { waitUntil: "networkidle" });
await page.emulateMedia({ media: "print" });
await page.pdf({
  path: output,
  width: "841mm",
  height: "1189mm",
  printBackground: true,
  preferCSSPageSize: true,
  margin: { top: "0", right: "0", bottom: "0", left: "0" },
});
await browser.close();
