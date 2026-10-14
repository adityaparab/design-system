import { expect, expectAccessible, listSlot, test, viewerSlot } from './fixtures';

test('sign in, then the shell composes both micro frontends', async ({ page }) => {
  await page.goto('/review');
  await expect(page).toHaveURL(/\/login/);
  await expectAccessible(page);
  await page.getByRole('radio', { name: 'Northwind LLP' }).check();
  await page.getByRole('button', { name: 'Continue' }).click();

  await expect(page).toHaveURL(/\/review/);
  await expect(listSlot(page).getByRole('table', { name: 'Documents' })).toBeVisible();
  await expect(listSlot(page).getByRole('row').nth(1)).toContainText('VRT-');
  await expect(page.getByText('Select a document')).toBeVisible();
});

test('keyboard-first review: open, code, save and advance', async ({ signedIn: page }) => {
  await page.goto('/review');
  const grid = listSlot(page).getByRole('table', { name: 'Documents' });
  const firstRow = grid.getByRole('row').nth(1);
  await expect(firstRow).toContainText('VRT-');
  const firstId = (await firstRow.getByRole('cell').first().textContent())!.trim();

  await firstRow.focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(new RegExp(`/review/${firstId}$`));
  await expect(viewerSlot(page).getByRole('article', { name: 'Document text' })).toBeVisible();

  await page.keyboard.press('1');
  await expect(viewerSlot(page).getByRole('radio', { name: 'Responsive', exact: true })).toBeChecked();
  await page.keyboard.press('Control+Enter');

  // The viewer emitted document.coded + review.advance; the list updated and opened the next row.
  await expect(page).not.toHaveURL(new RegExp(`/review/${firstId}$`));
  await expect(grid.getByRole('row', { name: new RegExp(firstId) })).toContainText('Responsive');
  await expect(viewerSlot(page).getByRole('status').filter({ hasText: `Saved ${firstId}` })).toHaveCount(1);
});

test('review page with a document open has no serious accessibility violations', async ({ signedIn: page }) => {
  await page.goto('/review/VRT-0000004');
  await expect(viewerSlot(page).getByRole('article', { name: 'Document text' })).toBeVisible();
  await expect(listSlot(page).getByRole('row').nth(1)).toContainText('VRT-');
  await expectAccessible(page);
});

test('AI citations jump to the evidence in the document', async ({ signedIn: page }) => {
  await page.goto('/review/VRT-0000004');
  const firstCitation = viewerSlot(page).getByRole('button', { name: /^Show evidence 1/ });
  await firstCitation.click();
  await expect(viewerSlot(page).locator('mark.vds-mark--active')).toBeInViewport();
});

test('tenant switch re-themes the whole page through tokens', async ({ signedIn: page }) => {
  await page.goto('/review');
  const accent = () =>
    page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--vds-color-accent-default').trim());
  // A component styled only with tokens: the shell logo uses color.accent.default.
  const logo = () => page.locator('.shell__logo').evaluate((el) => getComputedStyle(el).backgroundColor);
  await expect.poll(accent).toBe('#3d46b8');
  expect(await logo()).toBe('rgb(61, 70, 184)');

  await page.getByRole('group', { name: 'Tenant theme' }).getByRole('button', { name: 'Northwind LLP' }).click();
  await expect.poll(accent).toBe('#0f7366');
  expect(await logo()).toBe('rgb(15, 115, 102)');
});

test('shortcuts dialog is a focus-trapped modal', async ({ signedIn: page }) => {
  await page.goto('/review');
  await expect(listSlot(page).getByRole('row').nth(1)).toContainText('VRT-');
  await page.keyboard.press('Shift+?');
  const dialog = page.getByRole('dialog', { name: 'Keyboard shortcuts' });
  await expect(dialog).toBeVisible();
  await expectAccessible(page);
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
});
