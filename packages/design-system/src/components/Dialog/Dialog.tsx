import { Dialog as PrimeDialog } from 'primereact/dialog';
import type { ReactNode } from 'react';

export interface DialogProps {
  title: string;
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  width?: 'sm' | 'md' | 'lg';
}

/** Modal dialog. PrimeReact provides the focus trap, Escape to close and focus return. */
export function Dialog({ title, open, onClose, children, footer, width = 'md' }: DialogProps) {
  return (
    <PrimeDialog
      unstyled
      visible={open}
      onHide={onClose}
      header={title}
      footer={footer}
      modal
      dismissableMask
      draggable={false}
      resizable={false}
      blockScroll
      closeOnEscape
      transitionOptions={{ timeout: 0 }}
      pt={{
        mask: { className: 'vds-dialog-mask' },
        root: { className: `vds-dialog vds-dialog--${width}` },
        header: { className: 'vds-dialog__header' },
        headerTitle: { className: 'vds-dialog__title' },
        headerIcons: { className: 'vds-dialog__header-icons' },
        closeButton: { className: 'vds-dialog__close' },
        closeButtonIcon: { className: 'vds-dialog__close-icon' },
        content: { className: 'vds-dialog__content' },
        footer: { className: 'vds-dialog__footer' },
      }}
    >
      {children}
    </PrimeDialog>
  );
}
