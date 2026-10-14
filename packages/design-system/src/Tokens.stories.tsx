import type { Meta, StoryObj } from '@storybook/react-vite';
import catalogue from './generated/tokens.json';

const meta = { title: 'Foundations/Tokens', parameters: { a11y: { test: 'off' } } } satisfies Meta;
export default meta;

/** Semantic tokens with their resolved value per tenant. Switch the tenant in the toolbar to see the live theme. */
export const SemanticTokens: StoryObj = {
  render: () => (
    <table style={{ borderCollapse: 'collapse', fontSize: 13, width: '100%' }}>
      <caption style={{ textAlign: 'left', fontWeight: 600, marginBottom: 8 }}>Semantic tokens by tenant</caption>
      <thead>
        <tr>
          <th style={{ textAlign: 'left' }}>Token</th>
          <th style={{ textAlign: 'left' }}>Live</th>
          {catalogue.tenants.map((t) => (
            <th key={t.id} style={{ textAlign: 'left' }}>{t.name}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {catalogue.tokens.map((token) => (
          <tr key={token.name} style={{ borderTop: '1px solid var(--vds-color-border-default)' }}>
            <td style={{ padding: '6px 8px 6px 0' }}>
              <code>{token.cssVar}</code>
            </td>
            <td style={{ padding: 6 }}>
              {token.type === 'color' ? (
                <span style={{ display: 'inline-block', width: 28, height: 18, borderRadius: 4, background: `var(${token.cssVar})`, border: '1px solid var(--vds-color-border-default)' }} />
              ) : null}
            </td>
            {catalogue.tenants.map((t) => (
              <td key={t.id} style={{ padding: 6, fontFamily: 'var(--vds-font-family-mono)' }}>
                {(token.valueByTenant as Record<string, string>)[t.id]}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  ),
};
