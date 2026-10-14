import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import catalogue from './generated/tokens.json';

type Tenant = (typeof catalogue.tenants)[number]['id'];

const value = (name: string, tenant: Tenant): string => {
  const token = catalogue.tokens.find((t) => t.name === name);
  if (!token) throw new Error(`Unknown token ${name}`);
  return (token.valueByTenant as Record<string, string>)[tenant]!;
};

function luminance(hex: string): number {
  const channels = hex
    .replace('#', '')
    .match(/.{2}/g)!
    .map((h) => Number.parseInt(h, 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * channels[0]! + 0.7152 * channels[1]! + 0.0722 * channels[2]!;
}

export function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

// [foreground, background, minimum ratio, WCAG criterion]
const pairs: Array<[string, string, number, string]> = [
  ['color.text.default', 'color.bg.surface', 4.5, '1.4.3'],
  ['color.text.default', 'color.bg.selected', 4.5, '1.4.3'],
  ['color.text.default', 'color.highlight.bg', 4.5, '1.4.3'],
  ['color.text.default', 'color.highlight.active-bg', 4.5, '1.4.3'],
  ['color.text.muted', 'color.bg.surface', 4.5, '1.4.3'],
  ['color.text.muted', 'color.bg.subtle', 4.5, '1.4.3'],
  ['color.text.muted', 'color.bg.hover', 4.5, '1.4.3'],
  ['color.text.accent', 'color.bg.surface', 4.5, '1.4.3'],
  ['color.text.accent', 'color.bg.subtle', 4.5, '1.4.3'],
  ['color.text.on-accent', 'color.accent.default', 4.5, '1.4.3'],
  ['color.text.on-accent', 'color.accent.hover', 4.5, '1.4.3'],
  ['color.text.on-accent', 'color.status.danger-solid', 4.5, '1.4.3'],
  ['color.text.inverse', 'color.bg.inverse', 4.5, '1.4.3'],
  ['color.status.success-fg', 'color.status.success-bg', 4.5, '1.4.3'],
  ['color.status.warning-fg', 'color.status.warning-bg', 4.5, '1.4.3'],
  ['color.status.danger-fg', 'color.status.danger-bg', 4.5, '1.4.3'],
  ['color.status.info-fg', 'color.status.info-bg', 4.5, '1.4.3'],
  ['color.status.privileged-fg', 'color.status.privileged-bg', 4.5, '1.4.3'],
  ['color.focus.ring', 'color.bg.surface', 3, '1.4.11'],
  ['color.focus.ring', 'color.bg.canvas', 3, '1.4.11'],
  ['color.border.strong', 'color.bg.surface', 3, '1.4.11'],
  ['color.accent.default', 'color.bg.surface', 3, '1.4.11'],
];

describe.each(catalogue.tenants.map((t) => t.id))('tenant %s colour contrast', (tenant) => {
  it.each(pairs)('%s on %s >= %d:1 (WCAG %s)', (fg, bg, min) => {
    expect(contrast(value(fg, tenant), value(bg, tenant))).toBeGreaterThanOrEqual(min);
  });
});

describe('governance', () => {
  const componentsDir = join(import.meta.dirname, 'components');
  const cssFiles = readdirSync(componentsDir, { recursive: true, encoding: 'utf8' }).filter((f) => f.endsWith('.css'));

  it.each(cssFiles)('%s uses tokens instead of raw colours', (file) => {
    const css = readFileSync(join(componentsDir, file), 'utf8');
    const rawColours = css.match(/#[0-9a-f]{3,8}\b|\brgba?\(|\bhsla?\(/gi) ?? [];
    expect(rawColours).toEqual([]);
  });

  it.each(cssFiles)('%s only uses vds- prefixed class selectors', (file) => {
    const css = readFileSync(join(componentsDir, file), 'utf8');
    const classes = css.match(/\.[a-z][\w-]*/gi) ?? [];
    expect(classes.filter((c) => !c.startsWith('.vds-'))).toEqual([]);
  });
});
