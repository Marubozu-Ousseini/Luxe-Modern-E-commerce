// CommonJS wrapper for headless QA (Puppeteer)
// Usage: npm run dev (server + client) then:
// node scripts/headless_qa_mobile_checks.cjs --url=http://localhost:3000

const puppeteer = require('puppeteer');
const argv = require('minimist')(process.argv.slice(2));
const URL = argv.url || process.env.FRONTEND_URL || 'http://localhost:3000';

(async () => {
  console.log('Running headless QA against', URL);
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox','--disable-setuid-sandbox'] });
  const page = await browser.newPage();

  // Emulate mobile viewport (iPhone X-like)
  await page.setViewport({ width: 375, height: 812, isMobile: true, hasTouch: true });
  await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15A372 Safari/604.1');

  try {
    await page.goto(URL, { waitUntil: 'networkidle2', timeout: 30000 });

    // Wait for bottom nav search button
    const searchBtnSelector = 'nav.fixed button[aria-label="Rechercher"]';
    await page.waitForSelector(searchBtnSelector, { timeout: 8000 });
    console.log('Found mobile search button, clicking via page.evaluate...');
    await page.evaluate((sel) => {
      const el = document.querySelector(sel);
      if (!el) throw new Error('element-not-found');
      // Try native click in page context to avoid Puppeteer "not clickable" issues
      el.click();
    }, searchBtnSelector);

    // Wait until the search input is focused
    const focused = await page.waitForFunction(() => {
      const el = document.querySelector('input[placeholder="Rechercher des produits"]');
      return el === document.activeElement;
    }, { timeout: 5000 }).then(()=>true).catch(()=>false);

    if (!focused) throw new Error('Search input did not receive focus after clicking search button');
    console.log('Search input focused as expected');

    // Type a query and wait for suggestion list
    await page.type('input[placeholder="Rechercher des produits"]', 'man', { delay: 100 });
    const suggestionSelector = 'ul[role="listbox"] li';
    const suggestionAppeared = await page.waitForSelector(suggestionSelector, { timeout: 4000 }).then(()=>true).catch(()=>false);
    if (!suggestionAppeared) throw new Error('Search suggestions did not appear after typing');
    console.log('Search suggestions appeared');

    // Click first product in the catalogue (PLP)
    // Ensure catalogue is loaded
    await page.waitForSelector('#catalogue img', { timeout: 8000 });
    console.log('Clicking first product image to open PDP (via page.evaluate)...');
    await page.evaluate((sel) => {
      const el = document.querySelector(sel);
      if (!el) throw new Error('product-image-not-found');
      el.click();
    }, '#catalogue img');

    // Wait for PDP content to render (h1)
    await page.waitForSelector('main h1', { timeout: 5000 });
    console.log('PDP rendered (h1 found)');

    // Check for mobile sticky CTA presence and text 'Ajouter'
    const stickyFound = await page.evaluate(() => {
      const divs = Array.from(document.querySelectorAll('div'));
      return divs.some(d => {
        const cls = d.className || '';
        if (!cls.includes('md:hidden') || !cls.includes('fixed')) return false;
        return /Ajouter|Ajouter au panier|Ajouter/i.test(d.innerText || '');
      });
    });

    if (!stickyFound) throw new Error('Mobile sticky CTA not found on PDP');
    console.log('Mobile sticky CTA found');

    console.log('\nHEADLESS QA: SUCCESS — search focus, suggestions and sticky CTA verified');
    await browser.close();
    process.exit(0);
  } catch (err) {
    console.error('\nHEADLESS QA: FAILED —', err.message);
    await browser.close();
    process.exit(2);
  }
})();
