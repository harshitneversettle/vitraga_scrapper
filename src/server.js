import express from "express";
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";

puppeteer.use(StealthPlugin());

const app = express();
let browser = null;

async function getBrowser() {
  if (browser) return browser;
  browser = await puppeteer.launch({
    headless: true,
    executablePath: process.env.CHROME_PATH || null,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
    ],
  });
  return browser;
}

async function scrape() {
  const b = await getBrowser();
  const page = await b.newPage();
  await page.goto("https://in.investing.com/commodities/metals", {
    waitUntil: "networkidle2",
    timeout: 30000,
  });
  await page.waitForSelector("table tbody tr", { timeout: 15000 });

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
  return data;
}

app.get("/prices", async (req, res) => {
  try {
    const data = await scrape();
    res.json({ data, fetchedAt: new Date().toISOString() });
  } catch (err) {
    browser = null;
    res.status(500).json({ error: err.message });
  }
});

app.listen(process.env.PORT || 3000, () => console.log("Running on port 3000"));
