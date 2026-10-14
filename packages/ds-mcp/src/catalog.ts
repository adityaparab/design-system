import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export interface PropDoc {
  type: string;
  description: string;
  required?: boolean;
  default?: string;
}

export interface ComponentDoc {
  name: string;
  category: string;
  description: string;
  wraps?: string;
  props: Record<string, PropDoc>;
  accessibility: string[];
  do: string[];
  dont: string[];
  example: string;
}

export interface Manifest {
  package: string;
  version: string;
  importFrom: string;
  stylesheet: string;
  rules: string[];
  components: ComponentDoc[];
}

export interface TokenDoc {
  name: string;
  cssVar: string;
  type?: string;
  description?: string;
  aliasOf?: string;
  valueByTenant: Record<string, string>;
}

export interface TokenCatalogue {
  tenants: Array<{ id: string; name: string }>;
  tokens: TokenDoc[];
}

const readJson = <T>(specifier: string): T => JSON.parse(readFileSync(fileURLToPath(import.meta.resolve(specifier)), 'utf8')) as T;

/** Reads the artefacts the design-system build publishes, so the server never drifts from the package. */
export function loadCatalog(): { manifest: Manifest; tokens: TokenCatalogue } {
  return {
    manifest: readJson<Manifest>('@verity/design-system/manifest.json'),
    tokens: readJson<TokenCatalogue>('@verity/design-system/tokens.json'),
  };
}

export function findComponent(manifest: Manifest, name: string): ComponentDoc | undefined {
  return manifest.components.find((c) => c.name.toLowerCase() === name.trim().toLowerCase());
}

export function componentMarkdown(manifest: Manifest, c: ComponentDoc): string {
  const props = Object.entries(c.props)
    .map(([prop, d]) => `| \`${prop}\`${d.required ? ' *' : ''} | \`${d.type.replaceAll('|', '\\|')}\` | ${d.default ?? ''} | ${d.description} |`)
    .join('\n');
  return [
    `# ${c.name} (${c.category})`,
    c.description,
    c.wraps ? `Wraps \`${c.wraps}\`; do not use PrimeReact directly.` : 'Own component (no PrimeReact dependency).',
    `\`\`\`tsx\nimport { ${c.name} } from '${manifest.importFrom}';\n\n${c.example}\n\`\`\``,
    `## Props (* required)\n| Prop | Type | Default | Description |\n| --- | --- | --- | --- |\n${props}`,
    `## Accessibility\n${c.accessibility.map((a) => `- ${a}`).join('\n')}`,
    `## Do\n${c.do.map((a) => `- ${a}`).join('\n')}`,
    `## Don't\n${c.dont.map((a) => `- ${a}`).join('\n')}`,
  ].join('\n\n');
}

export function searchTokens(catalogue: TokenCatalogue, query = '', type?: string): TokenDoc[] {
  const q = query.trim().toLowerCase();
  return catalogue.tokens.filter(
    (t) =>
      (!type || t.type === type) &&
      (!q || t.name.toLowerCase().includes(q) || t.cssVar.includes(q) || (t.description ?? '').toLowerCase().includes(q)),
  );
}

export interface Finding {
  rule: string;
  severity: 'error' | 'warning';
  message: string;
  line: number;
}

const lineOf = (code: string, index: number) => code.slice(0, index).split('\n').length;

/**
 * Fast, dependency-free review of generated code against design-system rules.
 * It is a guardrail for agents, not a replacement for ESLint/axe in CI.
 */
export function reviewSnippet(manifest: Manifest, code: string): Finding[] {
  const findings: Finding[] = [];
  const add = (rule: string, severity: Finding['severity'], message: string, index: number) =>
    findings.push({ rule, severity, message, line: lineOf(code, index) });

  for (const m of code.matchAll(/from\s+['"](primereact(?:\/[^'"]*)?)['"]/g)) {
    add('no-primereact', 'error', `Import from "${manifest.importFrom}" instead of "${m[1]}".`, m.index);
  }
  for (const m of code.matchAll(/#[0-9a-fA-F]{3,8}\b|\brgba?\(|\bhsla?\(/g)) {
    add('use-color-tokens', 'error', `Hard-coded colour "${m[0]}". Use a semantic token such as var(--vds-color-text-default).`, m.index);
  }
  for (const m of code.matchAll(/\b(margin|padding|gap)\w*\s*:\s*['"]?\d+px/g)) {
    add('use-space-tokens', 'warning', `Hard-coded spacing "${m[0]}". Use Stack gap/padding or var(--vds-space-N).`, m.index);
  }

  const known = new Set(manifest.components.map((c) => c.name));
  const dsImport = new RegExp(`import\\s*\\{([^}]*)\\}\\s*from\\s*['"]${manifest.importFrom.replace('/', '\\/')}['"]`, 'g');
  for (const m of code.matchAll(dsImport)) {
    for (const raw of m[1]!.split(',')) {
      const name = raw.replace(/\btype\b/, '').split(' as ')[0]!.trim();
      if (/^[A-Z]/.test(name) && !known.has(name) && !name.endsWith('Icon') && !/Props$|^[A-Z][a-zA-Z]*(Sort|Column|Option|Token|Tone|Id|Variant)$/.test(name) && name !== 'TENANTS') {
        add('unknown-component', 'error', `"${name}" is not exported by ${manifest.importFrom}. Known: ${[...known].join(', ')}.`, m.index);
      }
    }
  }

  for (const m of code.matchAll(/<DataGrid\b(?![^>]*aria-label)[^>]*>/g)) {
    add('grid-needs-label', 'error', 'DataGrid requires an aria-label.', m.index);
  }
  for (const m of code.matchAll(/<(div|span)\b[^>]*\bonClick=/g)) {
    add('no-click-on-div', 'error', `onClick on <${m[1]}> is not keyboard accessible. Use <Button> or row activation.`, m.index);
  }
  for (const m of code.matchAll(/<img\b(?![^>]*\balt=)[^>]*>/g)) {
    add('img-alt', 'error', '<img> needs an alt attribute.', m.index);
  }
  for (const m of code.matchAll(/onKeyDown[\s\S]{0,200}?key\s*===\s*['"]\w['"]/g)) {
    if (!/isTyping|INPUT|TEXTAREA|isContentEditable/.test(m[0])) {
      add('char-key-shortcut', 'warning', 'Single-character shortcuts must be ignored while typing (WCAG 2.1.4).', m.index);
    }
  }
  return findings.sort((a, b) => a.line - b.line);
}
