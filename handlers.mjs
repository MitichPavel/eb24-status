export async function handleItemsAndAccounts(
  page,
  targetContext,
  selectors,
  commonSelectors,
) {
  const keyWord = targetContext === "accounts" ? "account" : "item";
  await page.waitForSelector(commonSelectors.itemsContainer, {
    timeout: 10000,
  });

  const cards = page.locator(selectors.card);
  const cardsCount = await cards.count();
  console.log(`Found rendered ${keyWord}(s): ${cardsCount}`);

  if (cardsCount === 0)
    throw new Error(`The ${keyWord} list (cards) is empty after API load.`);

  console.log('2. Clicking the first "Buy now" button...');
  const buyNowButton = page
    .locator(selectors.buyNowButton, { hasText: "Buy now" })
    .first();
  await buyNowButton.waitFor({ state: "visible", timeout: 5000 });
  await buyNowButton.click();
}

export async function handleProGames(page, selectors, commonSelectors) {
  await page.waitForSelector(commonSelectors.itemsContainer, {
    timeout: 10000,
  });

  const cards = page.locator(selectors.card);
  const cardsCount = await cards.count();
  console.log(`Found rendered pro games profiles: ${cardsCount}`);

  if (cardsCount === 0)
    throw new Error("The profile list (cards) is empty after API load.");

  console.log('2. Clicking the first "Play with Pro" button...');
  const playWithProButton = page
    .locator(selectors.playWithProButton, { hasText: "Play with Pro" })
    .first();
  await playWithProButton.waitFor({ state: "visible", timeout: 5000 });
  await playWithProButton.click();
}

export async function handleGGirls(page, selectors, commonSelectors) {
  await page.waitForSelector(commonSelectors.itemsContainer, {
    timeout: 10000,
  });

  const cards = page.locator(selectors.card);
  const cardsCount = await cards.count();
  console.log(`Found rendered ggirls profiles: ${cardsCount}`);

  if (cardsCount === 0)
    throw new Error("The ggirls profile list (cards) is empty after API load.");

  console.log('2. Clicking the first "Play with GGirl" button...');
  const playWithGGirlButton = page
    .locator(selectors.playWithGGirlButton, { hasText: "Play with GGirl" })
    .first();
  await playWithGGirlButton.waitFor({ state: "visible", timeout: 5000 });
  await playWithGGirlButton.click();
}

export async function handleCoaching(page, selectors, commonSelectors) {
  await page.waitForSelector(commonSelectors.itemsContainer, {
    timeout: 10000,
  });

  const cards = page.locator(selectors.card);
  const cardsCount = await cards.count();
  console.log(`Found rendered coaching profiles: ${cardsCount}`);

  if (cardsCount === 0)
    throw new Error(
      "The coaching profile list (cards) is empty after API load.",
    );

  console.log('2. Clicking the first "Book now" button...');
  const bookNowButton = page
    .locator(selectors.bookNowButton, { hasText: "Book now" })
    .first();
  await bookNowButton.waitFor({ state: "visible", timeout: 5000 });
  await bookNowButton.click();

  console.log("Waiting for redirection to the coaching profile...");
  await page.waitForURL(/.*\/coaching\/.*/, { timeout: 15000 });
  console.log(`Successfully redirected to: ${page.url()}`);

  console.log(
    '3. Clicking the "Purchase Coaching" button on the coach profile...',
  );
  const purchaseCoachingButton = page
    .locator(selectors.purchaseCoachingButton, { hasText: "Purchase Coaching" })
    .first();
  await purchaseCoachingButton.waitFor({ state: "visible", timeout: 5000 });
  await purchaseCoachingButton.click();
}

export async function handleBoosting(page, selectors) {
  await page.waitForSelector(selectors.purchaseButton, { timeout: 10000 });

  console.log('2. Clicking the "Purchase" button on the boosting page...');
  const purchaseBoostingButton = page
    .locator(selectors.purchaseButton, { hasText: "Purchase" })
    .first();
  await purchaseBoostingButton.waitFor({ state: "visible", timeout: 5000 });
  await purchaseBoostingButton.click();
}
