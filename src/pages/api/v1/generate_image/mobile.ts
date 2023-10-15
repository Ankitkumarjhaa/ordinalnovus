import { NextApiRequest, NextApiResponse } from "next";
import { chromium, BrowserContext } from "playwright";
import pLimit from "p-limit";

let browserContext: BrowserContext | undefined;
const concurrencyLimit = 2;
const limit = pLimit(concurrencyLimit);

async function getBrowserContext() {
  if (!browserContext) {
    console.log("generating new browser context");
    const browser = await chromium.launch({ headless: true });
    browserContext = await browser.newContext({
      viewport: { width: 500, height: 400 },
    });
  }
  return browserContext;
}

async function takeScreenshot(url: string) {
  const context = await getBrowserContext();
  const page = await context.newPage();
  await page.goto(url, { waitUntil: "networkidle" });

  const screenshotBuffer = await page.screenshot({ fullPage: false });
  await page.close();

  return screenshotBuffer;
}

async function ss(req: NextApiRequest, res: NextApiResponse) {
  console.log("***** IMAGE GENERATE MOBILE API CALLED *****");

  const { query } = req;
  const { url } = query;

  if (typeof url !== "string") {
    res.status(400).send("URL must be a string");
    return;
  }

  try {
    console.log(req.headers["user-agent"], "ORIGIN");
    const screenshotBuffer = await limit(() => takeScreenshot(url));

    res.setHeader("Content-Type", "image/png");
    res.setHeader(
      "Cache-Control",
      "public, immutable, no-transform, s-maxage=31536000, max-age=31536000"
    );
    res.status(200).send(screenshotBuffer);
  } catch (error) {
    console.error(error);
    res.status(500).end();
  }
}

export default ss;
