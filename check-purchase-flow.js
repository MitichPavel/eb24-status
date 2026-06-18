import { chromium } from 'playwright-extra';
import stealthPlugin from 'puppeteer-extra-plugin-stealth';

const stealth = stealthPlugin();
chromium.use(stealth);

const RESET = "\x1b[0m";
const GREEN = "\x1b[32m";
const RED = "\x1b[31m";
const BOLD = "\x1b[1m";

const guestEmail = process.argv[3];
if (!guestEmail) {
  console.error(`❌${RED} ${BOLD} Błąd: Brak podanego adresu e-mail jako trzeciego argumentu!${RESET}`);
  process.exit(1);
}

const ALLOWED_CONTEXTS = ['boosting', 'coaching', 'accounts', 'items', 'ggirls', 'progames'];
const targetContext = process.argv[2] || 'accounts';
const shouldBuy = process.argv[4] === 'true';

if (!ALLOWED_CONTEXTS.includes(targetContext)) {
  console.error(`❌${RED} ${BOLD} Błąd: Nieprawidłowy kontekst "${targetContext}". Dozwolone to: ${ALLOWED_CONTEXTS.join(', ')}${RESET}`);
  process.exit(1);
}


const urlMap = {
  boosting: 'https://eloboost24.eu/boosting/swift-pass',
  coaching: 'https://eloboost24.eu/coaching/league-of-legends',
  accounts: 'https://eloboost24.eu/marketplace/accounts/league-of-legends',
  items:    'https://eloboost24.eu/marketplace/items/league-of-legends',
  ggirls:   'https://eloboost24.eu/ggirls/league-of-legends',
  progames: 'https://eloboost24.eu/pro-games/arc-raiders'
};
const finalUrl = urlMap[targetContext];

async function handleItemsAndAccounts(page, targetContext) {
  // Czekamy na kontener z kartami
  const keyWord = targetContext === 'accounts' ? 'account' : 'item';
  await page.waitForSelector('.items-container', { timeout: 10000 });

  // Sprawdzamy czy wyrenderowały się karty (konta)
  const cards = page.locator('.items-container .card');
  const cardsCount = await cards.count();
  console.log(`Znaleziono wyrenderowanych ${keyWord}(s): ${cardsCount}`);

  if (cardsCount === 0) {
    throw new Error(`Lista ${keyWord} (kart) jest pusta po załadowaniu API.`);
  }

  console.log('2. Klikanie w pierwszy przycisk "Buy now"...');
  // Łapiemy pierwszy dostępny przycisk "Buy now" wewnątrz szczegółów karty
  const buyNowButton = page.locator('.card-details .svt-btn', { hasText: 'Buy now' }).first();
  await buyNowButton.waitFor({ state: 'visible', timeout: 5000 });
  await buyNowButton.click();
}

async function handleProGames(page) {
  // Czekamy na kontener z kartami
  await page.waitForSelector('.items-container', { timeout: 10000 });

  // Sprawdzamy czy wyrenderowały się karty (konta)
  const cards = page.locator('.items-container .pro-games-card');
  const cardsCount = await cards.count();
  console.log(`Znaleziono wyrenderowanych pro games profili: ${cardsCount}`);

  if (cardsCount === 0) {
    throw new Error('Lista profili (kart) jest pusta po załadowaniu API.');
  }

  console.log('2. Klikanie w pierwszy przycisk "Play with Pro"...');
  // Łapiemy pierwszy dostępny przycisk "Play with Pro" wewnątrz szczegółów karty
  const playWithProButton = page.locator('.price-sticky-wrapper .price-box .svt-btn', { hasText: 'Play with Pro' }).first();
  await playWithProButton.waitFor({ state: 'visible', timeout: 5000 });
  await playWithProButton.click();
}

async function handleGGirls(page) {
  // Czekamy na kontener z kartami
  await page.waitForSelector('.items-container', { timeout: 10000 });

  // Sprawdzamy czy wyrenderowały się karty (konta)
  const cards = page.locator('.items-container .pro-games-card');
  const cardsCount = await cards.count();
  console.log(`Znaleziono wyrenderowanych ggirls profili: ${cardsCount}`);

  if (cardsCount === 0) {
    throw new Error('Lista ggirls profili (kart) jest pusta po załadowaniu API.');
  }

  console.log('2. Klikanie w pierwszy przycisk "Play with GGirl"...');
  // Łapiemy pierwszy dostępny przycisk "Play with GGirl" wewnątrz szczegółów karty
  const playWithGGirlButton = page.locator('.price-sticky-wrapper .price-box .svt-btn', { hasText: 'Play with GGirl' }).first();
  await playWithGGirlButton.waitFor({ state: 'visible', timeout: 5000 });
  await playWithGGirlButton.click();
}

async function handleCoaching(page) {
  // Czekamy na kontener z kartami
  await page.waitForSelector('.items-container', { timeout: 10000 });

  // Sprawdzamy czy wyrenderowały się karty (konta)
  const cards = page.locator('.items-container .card');
  const cardsCount = await cards.count();
  console.log(`Znaleziono wyrenderowanych coaching profili: ${cardsCount}`);

  if (cardsCount === 0) {
    throw new Error('Lista coaching profili (kart) jest pusta po załadowaniu API.');
  }

  console.log('2. Klikanie w pierwszy przycisk "Book now"...');
  // Łapiemy pierwszy dostępny przycisk "Book now" wewnątrz szczegółów karty
  const bookNowButton = page.locator('.card-details .svt-btn', { hasText: 'Book now' }).first();
  await bookNowButton.waitFor({ state: 'visible', timeout: 5000 });
  await bookNowButton.click();

  console.log('Oczekiwanie na przekierowanie do coaching profilu...');
  await page.waitForURL(/.*\/coaching\/.*/, { timeout: 15000 });
  const coachingUrl = page.url();
  console.log(`Przekierowano pomyślnie do: ${coachingUrl}`);

  console.log('3. Klikanie w przycisk "Purchase Coaching" na profilu coach\'a ...');
  // Łapiemy pierwszy dostępny przycisk "Book now" wewnątrz szczegółów karty
  const purchaseCoachingButton = page.locator('.price-sticky-wrapper .price-box .svt-btn', { hasText: 'Purchase Coaching' }).first();
  await purchaseCoachingButton.waitFor({ state: 'visible', timeout: 5000 });
  await purchaseCoachingButton.click();
}

async function handleBoosting(page) {
  // Czekamy na kontener z kartami
  await page.waitForSelector('.price-sticky-bottom-wrapper .purchase-btn', { timeout: 10000 });

  console.log('2. Klikanie w przycisk "Purchase" na stronie boosting\'u ...');
  const purchaseBoostingButton = page.locator('.price-sticky-bottom-wrapper .purchase-btn', { hasText: 'Purchase' }).first();
  await purchaseBoostingButton.waitFor({ state: 'visible', timeout: 5000 });
  await purchaseBoostingButton.click();
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    locale: 'en-US', // Często bezpieczniejsze pod zagraniczne bramki typu Stripe
  });
  const page = await context.newPage();

  try {
    console.log(`${GREEN} ${BOLD}🚀 Uruchamianie testu dla kontekstu:${RESET} ${BOLD}${targetContext.toUpperCase()}${RESET}\n`);

    if (targetContext === 'boosting') {
      console.log('1. Otwieranie strony boostingu i pobieranie ceny z API...');
      await page.goto(finalUrl, { waitUntil: 'domcontentloaded' });
    } else {
      console.log('1. Otwieranie strony i czekanie na załadowanie API...');
      await page.goto(finalUrl, { waitUntil: 'networkidle' });
    }

    // Krok 2 dla różnych kontekstów
    switch (targetContext) {
      case 'accounts':
      case 'items':
        await handleItemsAndAccounts(page, targetContext);
        break;
      case 'progames':
        await handleProGames(page);
        break;
      case 'ggirls':
        await handleGGirls(page);
        break;
      case 'coaching':
        await handleCoaching(page);
        break;
      case 'boosting':
        await handleBoosting(page);
        break;
      default:
        console.error(`❌${RED} ${BOLD} Błąd: Nieprawidłowy kontekst "${targetContext}". Dozwolone to: ${ALLOWED_CONTEXTS.join(', ')}${RESET}`);
        process.exit(1);
    }

    console.log('3. Obsługa popupa logowania: Klikanie "Continue as a guest"...');
    const guestButton = page.locator('.guest-button-wrapper .svt-btn', { hasText: 'Continue as a guest' });
    await guestButton.waitFor({ state: 'visible', timeout: 5000 });
    await guestButton.click();

    console.log('4. Wpisywanie adresu e-mail...');
    const emailInput = page.locator('input[placeholder="Email"]');
    await emailInput.waitFor({ state: 'visible', timeout: 5000 });
    await emailInput.click();
    await emailInput.pressSequentially(guestEmail, { delay: 50 });
    await emailInput.evaluate(el => {
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    });

    console.log('5. Zatwierdzanie kroku w popupie...');
    await page.waitForTimeout(500);
    const continueButton = page.locator('.step-wrapper .svt-btn', { hasText: 'Continue' });
    await continueButton.click();

    console.log('6. Oczekiwanie na przekierowanie do Invoice (ORDER_HASH)...');
    // Czekamy aż URL zmieni się na wzorzec z fakturą
    await page.waitForURL(/.*\/invoice\/view\/.*/, { timeout: 15000 });
    const invoiceUrl = page.url();
    console.log(`   Przekierowano pomyślnie do: ${invoiceUrl}`);

    console.log('7. Klikanie przycisku "Proceed to payment"...');
    const proceedButton = page.locator('.summary-box .button-wrapper .svt-btn', { hasText: 'Proceed to payment' });
    await proceedButton.waitFor({ state: 'visible', timeout: 5000 });
    await proceedButton.click();

    if (shouldBuy) {
      console.log('8. Oczekiwanie na przekierowanie do bramki Stripe...');
      // Czekamy na przekierowanie na zewnętrzną domenę Stripe
      await page.waitForURL(/.*checkout\.stripe\.com.*/, { timeout: 15000 });
    }

    console.log(`\n${GREEN} ${BOLD}✔ Sukces!${RESET}`);

    if (shouldBuy) {
      console.log(`${GREEN} ${BOLD} Proces zakupu i integracja ze Stripe działają poprawnie.`);
    }

    await browser.close();
    process.exit(0);

  } catch (error) {
    console.error(`${RED} ${BOLD} ❌ Test przerwany z błędem:${RESET}`, error.message);

    if (process.env.GITHUB_ENV) {
      import('fs').then(fs => {
        fs.appendFileSync(process.env.GITHUB_ENV, `FAILED_FLOW=${targetContext.toUpperCase()}\n`);
      });
    }

    // Opcjonalnie: Zrób zrzut ekranu w razie błędu, żeby zobaczyć co poszło nie tak w GitHub Actions
    try {
      await page.screenshot({ path: 'failure-screenshot.png', fullPage: true });
      console.log('Zapisano zrzut ekranu błędu jako: failure-screenshot.png');
    } catch (e) {
      console.error(`❌${RED} ${BOLD} Nie udało się zrobić zrzutu ekranu:${RESET}`, e.message);
    }

    await browser.close();
    process.exit(1);
  }
})();
