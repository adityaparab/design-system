import axe from 'axe-core';
import { expect } from 'vitest';

/**
 * Runs axe against a rendered container. Colour contrast is checked separately
 * (tokens.test.ts) because jsdom does not compute styles.
 */
export async function expectNoA11yViolations(container: Element) {
  const results = await axe.run(container, {
    rules: { 'color-contrast': { enabled: false }, region: { enabled: false } },
  });
  const summary = results.violations.map(
    (v) => `${v.id}: ${v.help} (${v.nodes.map((n) => n.target.join(' ')).join(', ')})`,
  );
  expect(summary).toEqual([]);
}
