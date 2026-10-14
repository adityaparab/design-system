import AxeBuilder from '@axe-core/playwright';
import { expect, test as base, type Page } from '@playwright/test';

export const SESSION = {
  userId: 'amorgan',
  displayName: 'Alex Morgan',
  tenant: 'acme',
  accessToken: 'stub.amorgan.Alex%20Morgan',
  roles: ['reviewer'],
};

/** Signed-in page (the session stub lives in sessionStorage). */
export const test = base.extend<{ signedIn: Page }>({
  signedIn: async ({ page }, use) => {
    await page.addInitScript((session) => sessionStorage.setItem('verity.session', JSON.stringify(session)), SESSION);
    await use(page);
  },
});

export { expect };

/** Fails on serious or critical WCAG 2.2 A/AA violations. */
export async function expectAccessible(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
  const blocking = results.violations
    .filter((v) => v.impact === 'serious' || v.impact === 'critical')
    .map((v) => `${v.id} (${v.impact}): ${v.help} -> ${v.nodes.slice(0, 3).map((n) => n.target.join(' ')).join(' | ')}`);
  expect(blocking).toEqual([]);
}

export const listSlot = (page: Page) => page.locator('[data-remote="reviewList"]');
export const viewerSlot = (page: Page) => page.locator('[data-remote="docViewer"]');
