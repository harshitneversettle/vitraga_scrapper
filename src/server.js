import express from "express";
import { Builder, By, until } from "selenium-webdriver";
import chrome from "selenium-webdriver/chrome.js";

const app = express();

async function scrape() {
  const options = new chrome.Options();
  options.addArguments(
    "--headless",
    "--no-sandbox",
    "--disable-dev-shm-usage",
    "--disable-gpu",
    "--remote-debugging-port=9222",
    "--disable-software-rasterizer",
    "--disable-extensions",
  );
  options.addArguments(
    "--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/123.0.0.0 Safari/537.36",
  );

  if (process.env.CHROME_PATH) {
    options.setChromeBinaryPath(process.env.CHROME_PATH);
  }

  const driver = await new Builder()
    .forBrowser("chrome")
    .setChromeOptions(options)
    .build();

  try {
    await driver.get("https://in.investing.com/commodities/metals");
    await driver.wait(until.elementLocated(By.css("table tbody tr")), 15000);

    const data = await driver.executeScript(() => {
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
  } finally {
    await driver.quit();
  }
}

app.get("/prices", async (req, res) => {
  try {
    const data = await scrape();
    res.json({ data, fetchedAt: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(process.env.PORT || 3000, () => console.log("Running on port 3000"));
