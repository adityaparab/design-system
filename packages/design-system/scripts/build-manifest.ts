/**
 * Writes dist/manifest.json (components, props, a11y notes, examples) and
 * dist/tokens.json. The MCP server and docs read these instead of parsing source.
 */
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { componentMetas } from '../src/meta.index.ts';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')) as { name: string; version: string };

mkdirSync(join(root, 'dist'), { recursive: true });
writeFileSync(
  join(root, 'dist/manifest.json'),
  JSON.stringify(
    {
      package: pkg.name,
      version: pkg.version,
      importFrom: pkg.name,
      stylesheet: `${pkg.name}/styles.css`,
      rules: [
        `Import components from "${pkg.name}"; never import from "primereact" in product code.`,
        'Use semantic tokens (var(--vds-color-*), var(--vds-space-*)); never hard-code colours or spacing.',
        'Lay out screens with Stack and Panel instead of writing CSS.',
        'Every interactive element needs an accessible name; every shortcut needs aria-keyshortcuts and a visible Kbd hint.',
      ],
      components: componentMetas,
    },
    null,
    2,
  ),
);
copyFileSync(join(root, 'src/generated/tokens.json'), join(root, 'dist/tokens.json'));
console.log(`manifest: ${componentMetas.length} components -> dist/manifest.json`);
