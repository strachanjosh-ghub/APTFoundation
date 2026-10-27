import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import fs from 'node:fs';

const pages = fs.readdirSync('content/pages').map((f) => JSON.parse(fs.readFileSync(`content/pages/${f}`, 'utf8')).path as string);
const causes = fs.readdirSync('content/causes').map((f) => JSON.parse(fs.readFileSync(`content/causes/${f}`, 'utf8')).path as string);
const articles = fs.readdirSync('content/articles').map((f) => JSON.parse(fs.readFileSync(`content/articles/${f}`, 'utf8')).path as string);

test.describe('core routes', () => {
  for (const path of [...pages, ...causes, ...articles]) {
    test(`renders ${path}`, async ({ page }) => {
      const res = await page.goto(path);
      expect(res?.status()).toBe(200);
      await expect(page.locator('h1').first()).toBeVisible();
      await expect(page.locator('main')).not.toBeEmpty();
    });
  }

  test('legacy URL variants redirect', async ({ request }) => {
    for (const [from, to] of [['/contact', '/Contact'], ['/privacypolicy', '/PrivacyPolicy'], ['/blog', '/news'], ['/t/rainforest-4-foundation', '/causes']]) {
      const r = await request.get(from, { maxRedirects: 0 });
      expect([301, 307, 308]).toContain(r.status());
      expect(r.headers()['location']).toContain(to);
    }
  });

  test('unknown routes return the 404 page', async ({ page }) => {
    const res = await page.goto('/this-does-not-exist');
    expect(res?.status()).toBe(404);
    await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible();
  });

  test('sitemap and robots are served', async ({ request }) => {
    const sm = await request.get('/sitemap.xml');
    expect(sm.ok()).toBeTruthy();
    expect(await sm.text()).toContain('/t/rural-aid');
    expect((await request.get('/robots.txt')).ok()).toBeTruthy();
  });
});

test.describe('journeys', () => {
  test('navigate from home to a cause via the Causes menu', async ({ page, isMobile }) => {
    await page.goto('/');
    if (isMobile) await page.getByRole('button', { name: 'Open menu' }).click();
    await page.getByRole('button', { name: 'Causes' }).click();
    await page.getByRole('link', { name: 'Rural Aid' }).first().click();
    await expect(page).toHaveURL(/\/t\/rural-aid$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Rural Aid' })).toBeVisible();
  });

  test('dropdown menus are keyboard accessible and close on Escape', async ({ page, isMobile }) => {
    test.skip(isMobile, 'desktop navigation');
    await page.goto('/');
    const btn = page.getByRole('button', { name: 'About Us' });
    await btn.focus();
    await page.keyboard.press('Enter');
    await expect(btn).toHaveAttribute('aria-expanded', 'true');
    await page.keyboard.press('Escape');
    await expect(btn).toHaveAttribute('aria-expanded', 'false');
  });

  test('news listing paginates', async ({ page }) => {
    await page.goto('/news');
    await expect(page.getByText(/You are currently on page 1 of \d+/)).toBeVisible();
    await page.getByRole('button', { name: 'Next page' }).click();
    await expect(page.getByText(/You are currently on page 2 of/)).toBeVisible();
  });

  test('FAQ answers expand', async ({ page }) => {
    await page.goto('/faqs');
    const q = page.getByText('Is my donation tax-deductible?');
    await q.click();
    await expect(page.getByText(/eligible as tax-deductible gifts/)).toBeVisible();
  });

  test('contact form validates required fields', async ({ page }) => {
    await page.goto('/Contact');
    await page.getByRole('button', { name: 'Send' }).click();
    await expect(page.getByText('This field is required.')).toBeVisible();
    await page.getByLabel('Your Full Name (required)').fill('Test Person');
    await page.getByLabel('Your Email (required)').fill('not-an-email');
    await page.getByRole('button', { name: 'Send' }).click();
    await expect(page.getByText('Please enter a valid email address.')).toBeVisible();
  });

  test('contact form shows an error state when delivery fails', async ({ page }) => {
    await page.route('**/api/contact', (r) => r.fulfill({ status: 503, contentType: 'application/json', body: '{"error":"The contact form is not configured yet. Please email us directly."}' }));
    await page.goto('/Contact');
    await page.getByLabel('Your Full Name (required)').fill('Test Person');
    await page.getByRole('button', { name: 'Send' }).click();
    await expect(page.locator('.notice--error')).toContainText('not configured');
  });

  test('contact form shows the success state', async ({ page }) => {
    await page.route('**/api/contact', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' }));
    await page.goto('/Contact');
    await page.getByLabel('Your Full Name (required)').fill('Test Person');
    await page.getByRole('button', { name: 'Send' }).click();
    await expect(page.getByRole('status')).toBeVisible();
  });

  test('cause impact amounts are one-tap choices and hand off with the amount', async ({ page }) => {
    await page.route('https://one-tomorrow.raiselysite.com/**', (r) => r.fulfill({ status: 200, body: 'handoff' }));
    await page.goto('/t/thin-green-line');
    const panel = page.locator('#donate');
    await panel.getByText('can provide an essential first aid kit.').click();
    await expect(panel.getByText(/your \$35 becomes/)).toBeVisible();
    await panel.getByRole('button', { name: 'Donate $35' }).click();
    await page.waitForURL(/raiselysite\.com\/t\/thin-green-line\?amount=35/);
  });

  test('monthly gifts hand off with frequency=MONTH', async ({ page }) => {
    await page.route('https://one-tomorrow.raiselysite.com/**', (r) => r.fulfill({ status: 200, body: 'handoff' }));
    await page.goto('/t/rural-aid');
    const panel = page.locator('#donate');
    await panel.getByRole('button', { name: 'Monthly' }).click();
    await panel.getByPlaceholder('Enter custom amount').fill('40');
    await panel.getByRole('button', { name: 'Donate $40 monthly' }).click();
    await page.waitForURL(/\/t\/rural-aid\?amount=40&frequency=MONTH/);
  });

  test('donate page lets donors choose a cause', async ({ page }) => {
    await page.route('https://one-tomorrow.raiselysite.com/**', (r) => r.fulfill({ status: 200, body: 'handoff' }));
    await page.goto('/donate');
    await page.getByLabel('I’d like to support').selectOption('rural-aid');
    await page.getByText('buys a large 400kg bale of hay.').click();
    await page.getByRole('button', { name: 'Donate $100' }).click();
    await page.waitForURL(/\/t\/rural-aid\?amount=100/);
  });

  test('header Donate goes to the cause chooser', async ({ page, isMobile }) => {
    await page.goto('/about-us');
    if (isMobile) await page.getByRole('button', { name: 'Open menu' }).click();
    await page.locator('.site-header').getByRole('link', { name: 'Donate Now' }).click();
    await expect(page).toHaveURL(/\/donate$/);
  });

  test('donation form rejects amounts under $2', async ({ page }) => {
    await page.goto('/t/donate-to-one-tomorrow');
    await page.locator('#donate').getByPlaceholder('Enter custom amount').fill('1');
    await page.locator('#donate').getByRole('button', { name: 'Continue to donate' }).click();
    await expect(page.locator('.field__error')).toContainText('$2 or more');
  });
});

test.describe('accessibility (WCAG 2.2 AA, axe)', () => {
  for (const path of ['/', '/about-us', '/causes', '/t/rural-aid', '/t/thin-green-line', '/news', articles[0], '/faqs', '/Contact', '/donate', '/PrivacyPolicy']) {
    test(`no critical/serious violations on ${path}`, async ({ page }) => {
      await page.goto(path);
      const r = await new AxeBuilder({ page } as unknown as ConstructorParameters<typeof AxeBuilder>[0]).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).exclude('iframe').analyze();
      const bad = r.violations.filter((v) => v.impact === 'critical' || v.impact === 'serious');
      expect(bad.map((v) => `${v.id}: ${v.nodes.length} (${v.nodes[0]?.target})`)).toEqual([]);
    });
  }
});
