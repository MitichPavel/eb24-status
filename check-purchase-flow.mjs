import { chromium } from "playwright-extra";
import stealthPlugin from "puppeteer-extra-plugin-stealth";
import fs from "fs";
import path from "path";

import { SELECTORS } from "./selectors.mjs";
import {
  initLogger,
  setStatusUp,
  setStatusDown,
  DIR,
  RESET,
  GREEN,
  RED,
  BOLD,
} from "./logger.mjs";
import * as handlers from "./handlers.mjs";

const stealth = stealthPlugin();
chromium.use(stealth);

const guestEmail = process.argv[3];
if (!guestEmail) {
  console.error(
    `❌${RED} ${BOLD} Error: No email address provided as the third argument!${RESET}`,
  );
  process.exit(1);
}

const ALLOWED_CONTEXTS = [
  "boosting",
  "coaching",
  "accounts",
  "items",
  "ggirls",
  "progames",
];
const targetContext = process.argv[2] || "accounts";
const shouldBuy = process.argv[4] === "true";

if (!ALLOWED_CONTEXTS.includes(targetContext)) {
  console.error(
    `❌${RED} ${BOLD} Error: Invalid context "${targetContext}".${RESET}`,
  );
  process.exit(1);
}

const urlMap = {
  boosting: "https://eloboost24.eu/boosting/swift-pass",
  coaching: "https://eloboost24.eu/coaching/league-of-legends",
  accounts: "https://eloboost24.eu/marketplace/accounts/league-of-legends",
  items: "https://eloboost24.eu/marketplace/items/league-of-legends",
  ggirls: "https://eloboost24.eu/ggirls/league-of-legends",
  progames: "https://eloboost24.eu/pro-games/arc-raiders",
};
const finalUrl = urlMap[targetContext];

// Initialize the system stream logger
initLogger(targetContext);

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    locale: "en-US",
  });
  // Start tracing before actions (it gathers screenshots, snapshots and network)
  await context.tracing.start({
    screenshots: true,
    snapshots: true,
    snapshots: true,
  });
  const page = await context.newPage();

  page.on("console", (msg) => {
    if (
      msg.type().toUpperCase() === "ERROR" ||
      msg.type().toUpperCase() === "WARNING"
    ) {
      console.log(`[Browser ${msg.type().toUpperCase()}] ${msg.text()}`);
    }
  });

  page.on("pageerror", (exception) => {
    console.error(`[Browser CRITICAL] ${exception.message}`);
  });

  try {
    console.log(
      `${GREEN}${BOLD}🚀 Launching test for context:${RESET} ${BOLD}${targetContext.toUpperCase()}${RESET}\n`,
    );

    if (targetContext === "boosting") {
      console.log("1. Opening boosting page and fetching price from API...");
      await page.goto(finalUrl, { waitUntil: "domcontentloaded" });
    } else {
      console.log("1. Opening page and waiting for API to load...");
      await page.goto(finalUrl, { waitUntil: "networkidle" });
    }

    switch (targetContext) {
      case "accounts":
      case "items":
        await handlers.handleItemsAndAccounts(
          page,
          targetContext,
          SELECTORS.itemsAndAccounts,
          SELECTORS.common,
        );
        break;
      case "progames":
        await handlers.handleProGames(
          page,
          SELECTORS.progames,
          SELECTORS.common,
        );
        break;
      case "ggirls":
        await handlers.handleGGirls(page, SELECTORS.ggirls, SELECTORS.common);
        break;
      case "coaching":
        await handlers.handleCoaching(
          page,
          SELECTORS.coaching,
          SELECTORS.common,
        );
        break;
      case "boosting":
        await handlers.handleBoosting(page, SELECTORS.boosting);
        break;
    }

    console.log('3. Handling login popup: Clicking "Continue as a guest"...');
    const guestButton = page.locator(SELECTORS.common.guestButton, {
      hasText: "Continue as a guest",
    });
    await guestButton.waitFor({ state: "visible", timeout: 5000 });
    await guestButton.click();

    console.log("4. Typing guest email address...");
    const emailInput = page.locator(SELECTORS.common.emailInput);
    await emailInput.waitFor({ state: "visible", timeout: 5000 });
    await emailInput.click();
    await emailInput.pressSequentially(guestEmail, { delay: 50 });
    await emailInput.evaluate((el) => {
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
    });

    console.log("5. Submitting step inside the popup...");
    await page.waitForTimeout(500);
    const continueButton = page.locator(SELECTORS.common.continueButton, {
      hasText: "Continue",
    });
    await continueButton.click();

    console.log(
      "6. Waiting for redirection to the Invoice page (ORDER_HASH)...",
    );
    await page.waitForURL(/.*\/invoice\/view\/.*/, { timeout: 15000 });
    console.log(`   Successfully redirected to: ${page.url()}`);

    console.log('7. Clicking "Proceed to payment" button...');
    const proceedButton = page.locator(SELECTORS.common.proceedButton, {
      hasText: "Proceed to payment",
    });
    await proceedButton.waitFor({ state: "visible", timeout: 5000 });
    await proceedButton.click();

    if (shouldBuy) {
      console.log("8. Waiting for redirection to Stripe checkout...");
      await page.waitForURL(/.*checkout\.stripe\.com.*/, { timeout: 15000 });
    }

    console.log(`\n${GREEN}${BOLD}✔ Success!${RESET}`);

    setStatusUp(targetContext);
    await context.tracing.stop();
    await browser.close();
    process.exit(0);
  } catch (error) {
    console.error(
      `❌${RED}${BOLD} Test aborted with error:${RESET} ${error.message}`,
    );

    let screenshotCaptured = false;
    try {
      await page.screenshot({
        path: path.join(DIR, `${targetContext}-screenshot.png`),
        fullPage: true,
      });
      screenshotCaptured = true;
    } catch (e) {
      console.error(`❌ Failed to capture screenshot:`, e.message);
    }

    setStatusDown(targetContext, error.message, screenshotCaptured);

    try {
      // Stop tracing and export the full Playwright Trace Report zip
      await context.tracing.stop({
        path: path.join(DIR, `${targetContext}-playwright-trace.zip`),
      });
      console.log(
        `Saved full Playwright trace report to: ${DIR}/${targetContext}-playwright-trace.zip`,
      );
    } catch (traceError) {
      console.error(`❌ Failed to save Playwright trace:`, traceError.message);
    }

    if (process.env.GITHUB_ENV) {
      fs.appendFileSync(
        process.env.GITHUB_ENV,
        `FAILED_FLOW=${targetContext.toUpperCase()}\n`,
      );
    }

    await browser.close();
    process.exit(1);
  }
})();
