import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { componentMarkdown, findComponent, loadCatalog, reviewSnippet, searchTokens, type Manifest, type TokenCatalogue } from './catalog.js';

const text = (value: string) => ({ content: [{ type: 'text' as const, text: value }] });

export function createServer(catalog: { manifest: Manifest; tokens: TokenCatalogue } = loadCatalog()) {
  const { manifest, tokens } = catalog;
  const server = new McpServer({ name: 'verity-design-system', version: manifest.version });

  server.registerTool(
    'list_components',
    {
      title: 'List design-system components',
      description: `List the components exported by ${manifest.package} ${manifest.version}, optionally by category. Call this before writing UI for the Verity platform.`,
      inputSchema: { category: z.enum(['actions', 'data-display', 'forms', 'feedback', 'layout', 'overlay']).optional() },
      annotations: { readOnlyHint: true },
    },
    async ({ category }) => {
      const rows = manifest.components
        .filter((c) => !category || c.category === category)
        .map((c) => `- **${c.name}** (${c.category}${c.wraps ? `, wraps ${c.wraps}` : ''}): ${c.description}`);
      return text([`${manifest.package} ${manifest.version}. Import from "${manifest.importFrom}"; add "${manifest.stylesheet}" once per app.`, '', ...rows].join('\n'));
    },
  );

  server.registerTool(
    'get_component',
    {
      title: 'Get component API',
      description: 'Props, accessibility contract, do/don’t and an example for one component. Use the exact prop names returned here.',
      inputSchema: { name: z.string().describe('Component name, e.g. "DataGrid"') },
      annotations: { readOnlyHint: true },
    },
    async ({ name }) => {
      const component = findComponent(manifest, name);
      if (!component) {
        return { ...text(`No component "${name}". Available: ${manifest.components.map((c) => c.name).join(', ')}`), isError: true };
      }
      return text(componentMarkdown(manifest, component));
    },
  );

  server.registerTool(
    'search_tokens',
    {
      title: 'Search design tokens',
      description: 'Find semantic design tokens (CSS custom properties) by name or purpose, with values per tenant. Components must use these instead of raw values.',
      inputSchema: {
        query: z.string().optional().describe('e.g. "danger", "border", "space"'),
        type: z.enum(['color', 'dimension', 'fontFamily', 'fontWeight', 'shadow', 'duration']).optional(),
      },
      annotations: { readOnlyHint: true },
    },
    async ({ query, type }) => {
      const found = searchTokens(tokens, query, type);
      if (found.length === 0) return text(`No tokens match "${query ?? ''}".`);
      const header = `| CSS variable | ${tokens.tenants.map((t) => t.name).join(' | ')} | Purpose |\n| --- | ${tokens.tenants.map(() => '---').join(' | ')} | --- |`;
      const rows = found.map((t) => `| \`var(${t.cssVar})\` | ${tokens.tenants.map((tn) => `\`${t.valueByTenant[tn.id]}\``).join(' | ')} | ${t.description ?? ''} |`);
      return text([header, ...rows].join('\n'));
    },
  );

  server.registerTool(
    'review_snippet',
    {
      title: 'Review UI code against design-system rules',
      description:
        'Checks generated React/TSX for rule violations: direct PrimeReact imports, hard-coded colours/spacing, unknown components, unlabeled grids, click handlers on non-interactive elements, unsafe single-key shortcuts. Run it on code you write before returning it.',
      inputSchema: { code: z.string().describe('TSX source to review') },
      annotations: { readOnlyHint: true },
    },
    async ({ code }) => {
      const findings = reviewSnippet(manifest, code);
      if (findings.length === 0) return text('No design-system rule violations found. Still run ESLint, typecheck and axe in CI.');
      return text(findings.map((f) => `- line ${f.line} [${f.severity}] ${f.rule}: ${f.message}`).join('\n'));
    },
  );

  server.registerResource(
    'rules',
    'verity-ds://rules',
    { title: 'Design-system rules', description: 'Non-negotiable rules for product UI code', mimeType: 'text/markdown' },
    async (uri) => ({ contents: [{ uri: uri.href, mimeType: 'text/markdown', text: manifest.rules.map((r) => `- ${r}`).join('\n') }] }),
  );

  server.registerResource(
    'component',
    new ResourceTemplate('verity-ds://components/{name}', {
      list: async () => ({
        resources: manifest.components.map((c) => ({ uri: `verity-ds://components/${c.name}`, name: c.name, description: c.description, mimeType: 'text/markdown' })),
      }),
    }),
    { title: 'Component documentation', mimeType: 'text/markdown' },
    async (uri, { name }) => {
      const component = findComponent(manifest, String(name));
      if (!component) throw new Error(`Unknown component ${String(name)}`);
      return { contents: [{ uri: uri.href, mimeType: 'text/markdown', text: componentMarkdown(manifest, component) }] };
    },
  );

  server.registerPrompt(
    'build_screen',
    {
      title: 'Build a screen with the design system',
      description: 'Plan and write a Verity screen that follows the design system and accessibility rules.',
      argsSchema: { goal: z.string().describe('What the screen is for') },
    },
    ({ goal }) => ({
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: [
              `Build this screen for the Verity review platform: ${goal}`,
              '',
              'Process:',
              '1. Call list_components, then get_component for each component you plan to use.',
              '2. Use search_tokens for any colour, spacing or size; never hard-code values.',
              '3. Lay out with Panel, Stack and SplitLayout; do not write CSS files in micro frontends.',
              '4. Every control needs an accessible name; shortcuts need aria-keyshortcuts plus a visible Kbd.',
              '5. Run review_snippet on your code and fix every finding before answering.',
              '',
              'Rules:',
              ...manifest.rules.map((r) => `- ${r}`),
            ].join('\n'),
          },
        },
      ],
    }),
  );

  return server;
}
