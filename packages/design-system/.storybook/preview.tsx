import type { Preview } from '@storybook/react-vite';
import '../src/styles/index.css';
import { TENANTS, ThemeScope, type TenantId } from '../src/theme';

const preview: Preview = {
  globalTypes: {
    tenant: {
      description: 'Tenant theme (design tokens)',
      toolbar: {
        title: 'Tenant',
        icon: 'paintbrush',
        items: TENANTS.map((t) => ({ value: t.id, title: t.name })),
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: { tenant: 'acme' },
  decorators: [
    (Story, context) => {
      const tenant = (context.globals.tenant ?? 'acme') as TenantId;
      // Portaled overlays (Dialog) render under <body>, so theme the document too.
      document.documentElement.dataset.tenant = tenant;
      return (
        <ThemeScope tenant={tenant} className="sb-scope">
          <div style={{ padding: 24, minHeight: '100%' }}>
            <Story />
          </div>
        </ThemeScope>
      );
    },
  ],
  parameters: {
    layout: 'fullscreen',
    a11y: { test: 'error' },
    controls: { expanded: true },
  },
};

export default preview;
