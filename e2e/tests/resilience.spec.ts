import { expect, listSlot, test, viewerSlot } from './fixtures';

test.describe('a failing micro frontend never takes down the shell', () => {
  test('render crash in the viewer is contained by its error boundary', async ({ signedIn: page }) => {
    await page.goto('/review/VRT-0000004?simulate=viewer-crash');
    await expect(viewerSlot(page).getByRole('alert')).toContainText('Document viewer crashed');
    // The list is still fully usable.
    await listSlot(page).getByRole('searchbox', { name: 'Search documents' }).fill('Northgate');
    await expect(listSlot(page).getByRole('row').nth(1)).toContainText('Northgate');
  });

  test('an unreachable remoteEntry shows a retryable fallback', async ({ signedIn: page }) => {
    await page.goto('/review/VRT-0000004?simulate=remote-offline');
    const alert = viewerSlot(page).getByRole('alert');
    await expect(alert).toContainText('Document viewer is unavailable');
    await expect(alert.getByRole('button', { name: 'Retry' })).toBeVisible();
    await expect(listSlot(page).getByRole('row').nth(1)).toContainText('VRT-');
  });

  test('a remote built against an incompatible contract is refused before mounting', async ({ signedIn: page }) => {
    await page.goto('/review/VRT-0000004?simulate=contract-mismatch');
    await expect(viewerSlot(page)).toContainText('Document viewer needs an update');
    await page.getByRole('link', { name: 'Platform' }).click();
    await expect(page.getByRole('region', { name: 'Micro frontends' }).getByRole('row', { name: /docViewer/ })).toContainText('incompatible');
  });
});

test('platform inspector shows both date-fns majors side by side in the share scope', async ({ signedIn: page }) => {
  await page.goto('/review/VRT-0000004');
  await expect(viewerSlot(page).getByRole('article', { name: 'Document text' })).toBeVisible();
  await page.getByRole('link', { name: 'Platform' }).click();
  await page.getByRole('button', { name: 'Load all and refresh' }).click();
  const shared = page.getByRole('region', { name: /Shared dependencies/ });
  await expect(shared.getByRole('row', { name: /date-fns 3\./ })).toBeVisible();
  await expect(shared.getByRole('row', { name: /date-fns 4\./ })).toBeVisible();
  await expect(shared.getByRole('row', { name: /^react 19/ })).toContainText('shell');
});
