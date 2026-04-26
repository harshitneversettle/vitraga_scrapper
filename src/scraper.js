import { Builder, By, until } from "selenium-webdriver";
import chrome from "selenium-webdriver/chrome.js";

export async function scrapeMetalPrices() {
  const options = new chrome.Options();

  options.addArguments(
    "--headless=new",
    "--no-sandbox",
    "--disable-dev-shm-usage",
    "--disable-gpu",
    "--window-size=1920,1080",
    "--disable-blink-features=AutomationControlled",
    "--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
  );

  options.setUserPreferences({
    "profile.default_content_setting_values.images": 2,
    "profile.managed_default_content_settings.javascript": 1,
  });

  options.excludeSwitches(["enable-automation"]);
  options.addArguments("--disable-extensions");

  const driver = await new Builder()
    .forBrowser("chrome")
    .setChromeOptions(options)
    .build();

  try {
    await driver.executeScript(
      "Object.defineProperty(navigator, 'webdriver', {get: () => undefined})",
    );

    await driver.get("https://in.investing.com/commodities/metals");

    const tableSelector = "table tbody tr";
    await driver.wait(until.elementLocated(By.css(tableSelector)), 15000);

    await driver.sleep(3000);

    const prices = await driver.executeScript(() => {
      const rows = document.querySelectorAll("table tbody tr");
      const results = [];

      rows.forEach((row) => {
        const cells = row.querySelectorAll("td");
        if (cells.length < 7) return;

        const nameEl = row.querySelector("td a");
        const name = nameEl?.innerText?.trim();
        if (!name) return;

        const month = cells[1]?.innerText?.trim() || null;
        const last = cells[2]?.innerText?.trim();
        const high = cells[3]?.innerText?.trim();
        const low = cells[4]?.innerText?.trim();
        const change = cells[5]?.innerText?.trim();
        const changePct = cells[6]?.innerText?.trim();
        const time = cells[7]?.innerText?.trim() || null;

        if (last) {
          results.push({
            name,
            month,
            last,
            high,
            low,
            change,
            changePct,
            time,
          });
        }
      });

      return results;
    });

    return prices;
  } finally {
    await driver.quit();
  }
}
