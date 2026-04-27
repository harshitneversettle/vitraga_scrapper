import express from "express";
import chromium from "chrome-aws-lambda";
import puppeteer from "puppeteer-core";

const app = express();
let cache = null;
let browser = null;

async function getBrowser() {
  if (browser) return browser;
  browser = await puppeteer.launch({
    args: chromium.args,
    executablePath: await chromium.executablePath,
    headless: chromium.headless,
  });
  return browser;
}

async function scrape() {
  const b = await getBrowser();
  const page = await b.newPage();
  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/123.0.0.0 Safari/537.36",
  );
  await page.goto("https://in.investing.com/commodities/metals", {
    waitUntil: "networkidle2",
  });
  await page.waitForSelector("table tbody tr");

  const data = await page.evaluate(() => {
    const rows = document.querySelectorAll("table tbody tr");
    const results = [];
    rows.forEach((row) => {
      const cells = row.querySelectorAll("td");
      const name = cells[1]?.innerText?.trim();
      if (!name || cells.length < 7) return;
      results.push({
        name,
        month: cells[2]?.innerText?.trim() || null,
        last: cells[3]?.innerText?.trim(),
        high: cells[4]?.innerText?.trim(),
        low: cells[5]?.innerText?.trim(),
        change: cells[6]?.innerText?.trim(),
        changePct: cells[7]?.innerText?.trim(),
      });
    });
    return results;
  });

  await page.close();
  cache = { data, updatedAt: new Date().toISOString() };
  console.log("Updated at", cache.updatedAt);
}

scrape();
setInterval(scrape, 5 * 60 * 1000);

app.get("/prices", (req, res) => {
  if (!cache)
    return res
      .status(503)
      .json({ error: "Not ready yet, retry in few seconds" });
  res.json(cache);
});

app.listen(3000, () => console.log("Running on http://localhost:3000/prices"));
