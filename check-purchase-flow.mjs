import { chromium } from "playwright-extra";
import stealthPlugin from "puppeteer-extra-plugin-stealth";
import fs from "fs";
import path from "path";

const stealth = stealthPlugin();
chromium.use(stealth);

const RESET = "\x1b[0m";
const GREEN = "\x1b[32m";
const RED = "\x1b[31m";
const BOLD = "\x1b[1m";

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
    `❌${RED} ${BOLD} Error: Invalid context "${targetContext}". Allowed contexts are: ${ALLOWED_CONTEXTS.join(", ")}${RESET}`,
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

const DIR = "./status-data";

// --- UPPTIME STATUS ARTIFACTS MANAGEMENT ---
function setStatusUp(contextName) {
  if (!fs.existsSync(DIR)) fs.mkdirSync(DIR, { recursive: true });

  // 1. Create the health file so Upptime receives a 200 OK HTTP status code
  fs.writeFileSync(path.join(DIR, `${contextName}-health.txt`), "OK");
  console.log(`${GREEN}🟢 Status UP saved for Upptime: ${contextName}${RESET}`);

  // 2. Clean up old error logs and screenshots if they exist
  const errorLogPath = path.join(DIR, `${contextName}-error.json`);
  if (fs.existsSync(errorLogPath)) fs.unlinkSync(errorLogPath);

  const oldScreenshotPath = path.join(DIR, `${contextName}-screenshot.png`);
  if (fs.existsSync(oldScreenshotPath)) fs.unlinkSync(oldScreenshotPath);
}

function setStatusDown(contextName, errorMessage) {
  if (!fs.existsSync(DIR)) fs.mkdirSync(DIR, { recursive: true });

  // 1. Remove the health file so Upptime receives a 404 Not Found error and triggers an alert
  const healthPath = path.join(DIR, `${contextName}-health.txt`);
  if (fs.existsSync(healthPath)) fs.unlinkSync(healthPath);

  // 2. Generate the JSON error artifact with incident details
  const errorData = {
    flow: contextName,
    status: "FAILURE",
    error: errorMessage,
    timestamp: new Date().toISOString(),
    screenshotUrl: `./${contextName}-screenshot.png`,
  };
  fs.writeFileSync(
    path.join(DIR, `${contextName}-error.json`),
    JSON.stringify(errorData, null, 2),
  );
  console.log(`${RED}🔴 Status DOWN saved for Upptime: ${contextName}${RESET}`);
}
// --------------------------------------------

async function handleItemsAndAccounts(page, targetContext) {
  const keyWord = targetContext === "accounts" ? "account" : "item";
  await page.waitForSelector(".items-container", { timeout: 10000 });

  const cards = page.locator(".items-container .card-test-error");
  const cardsCount = await cards.count();
  console.log(`Found rendered ${keyWord}(s): ${cardsCount}`);

  if (cardsCount === 0) {
    throw new Error(`The ${keyWord} list (cards) is empty after API load.`);
  }

  console.log('2. Clicking the first "Buy now" button...');
  const buyNowButton = page
    .locator(".card-details .svt-btn", { hasText: "Buy now" })
    .first();
  await buyNowButton.waitFor({ state: "visible", timeout: 5000 });
  await buyNowButton.click();
}

async function handleProGames(page) {
  await page.waitForSelector(".items-container", { timeout: 10000 });

  const cards = page.locator(".items-container .pro-games-card");
  const cardsCount = await cards.count();
  console.log(`Found rendered pro games profiles: ${cardsCount}`);

  if (cardsCount === 0) {
    throw new Error("The profile list (cards) is empty after API load.");
  }

  console.log('2. Clicking the first "Play with Pro" button...');
  const playWithProButton = page
    .locator(".price-sticky-wrapper .price-box .svt-btn", {
      hasText: "Play with Pro",
    })
    .first();
  await playWithProButton.waitFor({ state: "visible", timeout: 5000 });
  await playWithProButton.click();
}

async function handleGGirls(page) {
  await page.waitForSelector(".items-container", { timeout: 10000 });

  const cards = page.locator(".items-container .pro-games-card");
  const cardsCount = await cards.count();
  console.log(`Found rendered ggirls profiles: ${cardsCount}`);

  if (cardsCount === 0) {
    throw new Error("The ggirls profile list (cards) is empty after API load.");
  }

  console.log('2. Clicking the first "Play with GGirl" button...');
  const playWithGGirlButton = page
    .locator(".price-sticky-wrapper .price-box .svt-btn", {
      hasText: "Play with GGirl",
    })
    .first();
  await playWithGGirlButton.waitFor({ state: "visible", timeout: 5000 });
  await playWithGGirlButton.click();
}

async function handleCoaching(page) {
  await page.waitForSelector(".items-container", { timeout: 10000 });

  const cards = page.locator(".items-container .card");
  const cardsCount = await cards.count();
  console.log(`Found rendered coaching profiles: ${cardsCount}`);

  if (cardsCount === 0) {
    throw new Error(
      "The coaching profile list (cards) is empty after API load.",
    );
  }

  console.log('2. Clicking the first "Book now" button...');
  const bookNowButton = page
    .locator(".card-details .svt-btn", { hasText: "Book now" })
    .first();
  await bookNowButton.waitFor({ state: "visible", timeout: 5000 });
  await bookNowButton.click();

  console.log("Waiting for redirection to the coaching profile...");
  await page.waitForURL(/.*\/coaching\/.*/, { timeout: 15000 });
  const coachingUrl = page.url();
  console.log(`Successfully redirected to: ${coachingUrl}`);

  console.log(
    '3. Clicking the "Purchase Coaching" button on the coach profile...',
  );
  const purchaseCoachingButton = page
    .locator(".price-sticky-wrapper .price-box .svt-btn", {
      hasText: "Purchase Coaching",
    })
    .first();
  await purchaseCoachingButton.waitFor({ state: "visible", timeout: 5000 });
  await purchaseCoachingButton.click();
}

async function handleBoosting(page) {
  await page.waitForSelector(".price-sticky-bottom-wrapper .purchase-btn", {
    timeout: 10000,
  });

  console.log('2. Clicking the "Purchase" button on the boosting page...');
  const purchaseBoostingButton = page
    .locator(".price-sticky-bottom-wrapper .purchase-btn", {
      hasText: "Purchase",
    })
    .first();
  await purchaseBoostingButton.waitFor({ state: "visible", timeout: 5000 });
  await purchaseBoostingButton.click();
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    locale: "en-US",
  });
  const page = await context.newPage();

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
        await handleItemsAndAccounts(page, targetContext);
        break;
      case "progames":
        await handleProGames(page);
        break;
      case "ggirls":
        await handleGGirls(page);
        break;
      case "coaching":
        await handleCoaching(page);
        break;
      case "boosting":
        await handleBoosting(page);
        break;
      default:
        console.error(
          `❌${RED}${BOLD} Error: Invalid context "${targetContext}". Allowed contexts are: ${ALLOWED_CONTEXTS.join(", ")}${RESET}`,
        );
        process.exit(1);
    }

    console.log('3. Handling login popup: Clicking "Continue as a guest"...');
    const guestButton = page.locator(".guest-button-wrapper .svt-btn", {
      hasText: "Continue as a guest",
    });
    await guestButton.waitFor({ state: "visible", timeout: 5000 });
    await guestButton.click();

    console.log("4. Typing guest email address...");
    const emailInput = page.locator('input[placeholder="Email"]');
    await emailInput.waitFor({ state: "visible", timeout: 5000 });
    await emailInput.click();
    await emailInput.pressSequentially(guestEmail, { delay: 50 });
    await emailInput.evaluate((el) => {
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
    });

    console.log("5. Submitting step inside the popup...");
    await page.waitForTimeout(500);
    const continueButton = page.locator(".step-wrapper .svt-btn", {
      hasText: "Continue",
    });
    await continueButton.click();

    console.log(
      "6. Waiting for redirection to the Invoice page (ORDER_HASH)...",
    );
    await page.waitForURL(/.*\/invoice\/view\/.*/, { timeout: 15000 });
    const invoiceUrl = page.url();
    console.log(`   Successfully redirected to: ${invoiceUrl}`);

    console.log('7. Clicking "Proceed to payment" button...');
    const proceedButton = page.locator(
      ".summary-box .button-wrapper .svt-btn",
      { hasText: "Proceed to payment" },
    );
    await proceedButton.waitFor({ state: "visible", timeout: 5000 });
    await proceedButton.click();

    if (shouldBuy) {
      console.log("8. Waiting for redirection to Stripe checkout...");
      await page.waitForURL(/.*checkout\.stripe\.com.*/, { timeout: 15000 });
    }

    console.log(`\n${GREEN}${BOLD}✔ Success!${RESET}`);

    if (shouldBuy) {
      console.log(
        `${GREEN}${BOLD} Purchase process and Stripe integration are working properly.${RESET}`,
      );
    }

    // SUCCESS DEPLOYMENT FOR UPPTIME (Generates health-txt)
    setStatusUp(targetContext);

    await browser.close();
    process.exit(0);
  } catch (error) {
    console.error(
      `${RED}${BOLD}❌ Test aborted with error:${RESET}`,
      error.message,
    );

    // FAILURE DEPLOYMENT FOR UPPTIME (Removes health.txt, generates error.json)
    setStatusDown(targetContext, error.message);

    // Capture and save failure screenshot directly inside status-data directory
    try {
      if (!fs.existsSync(DIR)) fs.mkdirSync(DIR, { recursive: true });
      await page.screenshot({
        path: path.join(DIR, `${targetContext}-screenshot.png`),
        fullPage: true,
      });
      console.log(
        `Saved failure screenshot to: ${DIR}/${targetContext}-screenshot.png`,
      );
    } catch (e) {
      console.error(
        `❌${RED}${BOLD} Failed to capture screenshot:${RESET}`,
        e.message,
      );
    }

    if (process.env.GITHUB_ENV) {
      import("fs").then((fs) => {
        fs.appendFileSync(
          process.env.GITHUB_ENV,
          `FAILED_FLOW=${targetContext.toUpperCase()}\n`,
        );
      });
    }

    await browser.close();
    process.exit(1);
  }
})();
