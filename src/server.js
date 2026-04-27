import express from "express";
import { Builder, By, until } from "selenium-webdriver";
import chrome from "selenium-webdriver/chrome.js";
import { execSync } from "child_process";

const app = express();
let driver = null;

async function getDriver() {
  if (driver) return driver;
  const options = new chrome.Options();
  options.addArguments(
    "--headless",
    "--no-sandbox",
    "--disable-dev-shm-usage",
    "--disable-gpu",
    "--disable-blink-features=AutomationControlled",
    "--window-size=1920,1080",
  );
  options.addArguments(
    "--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  );
  options.excludeSwitches(["enable-automation"]);

  if (process.env.CHROME_PATH) {
    options.setChromeBinaryPath(process.env.CHROME_PATH);
  }
  options.excludeSwitches(["enable-automation"]);
  driver = await new Builder()
    .forBrowser("chrome")
    .setChromeOptions(options)
    .build();
  return driver;
}

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.get("/chrome-path", (req, res) => {
  try {
    const path = execSync(
      "which chromium || which chromium-browser || which google-chrome || which google-chrome-stable",
    )
      .toString()
      .trim();
    res.json({ path });
  } catch (err) {
    res.json({ error: "Chrome not found", msg: err.message });
  }
});
async function scrape() {
    const d = await getDriver();
    console.log("Browser launched");
    await d.get("https://in.investing.com/commodities/metals");
    console.log("Page loaded");
    await d.wait(until.elementLocated(By.css("table tbody tr")), 15000);
    console.log("Table found");
    await d.sleep(1000);

  const data = await d.executeScript(() => {
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

  return data;
}

app.get("/prices", async (req, res) => {
  try {
    const data = await scrape();
    res.json({ data, fetchedAt: new Date().toISOString() });
  } catch (err) {
    driver = null;
    res.status(500).json({ error: err.message });
  }
});

app.listen(process.env.PORT || 3000, () => console.log("Running on port 3000"));
