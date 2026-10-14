import { Button, Dialog, Kbd } from '@verity/design-system';

const SHORTCUTS: Array<[keys: string[], description: string]> = [
  [['↑', '↓'], 'Move between documents in the list'],
  [['Enter'], 'Open the focused document'],
  [['/'], 'Search documents'],
  [['1', '2', '3'], 'Responsive / Not responsive / Needs further review'],
  [['P'], 'Toggle privileged'],
  [['A'], 'Apply the AI suggestion'],
  [['Ctrl', 'S'], 'Save'],
  [['Ctrl', 'Enter'], 'Save and open the next document'],
  [['?'], 'Show this list'],
];

export function ShortcutsDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Dialog
      title="Keyboard shortcuts"
      open={open}
      onClose={onClose}
      footer={
        <Button variant="primary" onClick={onClose}>
          Done
        </Button>
      }
    >
      <table className="shell-table">
        <caption className="vds-visually-hidden">Keyboard shortcuts</caption>
        <tbody>
          {SHORTCUTS.map(([keys, description]) => (
            <tr key={description}>
              <th scope="row">
                {keys.map((k, i) => (
                  <span key={k}>
                    {i > 0 ? ' ' : null}
                    <Kbd>{k}</Kbd>
                  </span>
                ))}
              </th>
              <td>{description}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p>Single-key shortcuts are ignored while you type in a text field.</p>
    </Dialog>
  );
}
