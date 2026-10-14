import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { beforeAll, describe, expect, it } from 'vitest';
import { loadCatalog, reviewSnippet } from './catalog.js';
import { createServer } from './server.js';

const textOf = (result: unknown) => ((result as { content: Array<{ text: string }> }).content[0]?.text ?? '');

describe('design-system MCP server', () => {
  let client: Client;

  beforeAll(async () => {
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    await createServer().connect(serverTransport);
    client = new Client({ name: 'test', version: '1.0.0' });
    await client.connect(clientTransport);
  });

  it('advertises its tools, resources and prompt', async () => {
    const { tools } = await client.listTools();
    expect(tools.map((t) => t.name).sort()).toEqual(['get_component', 'list_components', 'review_snippet', 'search_tokens']);
    const { resources } = await client.listResources();
    expect(resources.map((r) => r.uri)).toContain('verity-ds://components/DataGrid');
    const { prompts } = await client.listPrompts();
    expect(prompts.map((p) => p.name)).toEqual(['build_screen']);
  });

  it('documents a component with its real props', async () => {
    const result = await client.callTool({ name: 'get_component', arguments: { name: 'datagrid' } });
    const doc = textOf(result);
    expect(doc).toContain('# DataGrid');
    expect(doc).toContain('`onVisibleRangeChange`');
    expect(doc).toContain('aria-rowcount');
  });

  it('returns token values per tenant', async () => {
    const doc = textOf(await client.callTool({ name: 'search_tokens', arguments: { query: 'accent.default' } }));
    expect(doc).toContain('var(--vds-color-accent-default)');
    expect(doc).toContain('#3d46b8');
    expect(doc).toContain('#0f7366');
  });

  it('flags off-system code', async () => {
    const doc = textOf(
      await client.callTool({
        name: 'review_snippet',
        arguments: { code: `import { Button } from 'primereact/button';\nconst x = <div onClick={go} style={{ color: '#ff0000' }} />;` },
      }),
    );
    expect(doc).toContain('no-primereact');
    expect(doc).toContain('use-color-tokens');
    expect(doc).toContain('no-click-on-div');
  });
});

describe('reviewSnippet', () => {
  const { manifest } = loadCatalog();

  it('passes idiomatic design-system code', () => {
    const code = `import { DataGrid, Panel, SearchIcon, type DataGridColumn } from '@verity/design-system';\n<Panel title="Docs"><DataGrid aria-label="Documents" rows={rows} rowKey="id" columns={cols} /></Panel>`;
    expect(reviewSnippet(manifest, code)).toEqual([]);
  });

  it('catches unknown components and unlabeled grids', () => {
    const findings = reviewSnippet(manifest, `import { Tooltip } from '@verity/design-system';\n<DataGrid rows={rows} />`);
    expect(findings.map((f) => f.rule)).toEqual(['unknown-component', 'grid-needs-label']);
  });
});
