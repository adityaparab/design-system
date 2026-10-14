import { Button as PrimeButton } from 'primereact/button';
import type { MouseEvent, ReactNode } from 'react';
import { cx } from '../../utils/cx';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

export interface ButtonProps {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: 'sm' | 'md';
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  /** Shows a spinner, disables the button and sets aria-busy. */
  loading?: boolean;
  /** Decorative leading icon. */
  icon?: ReactNode;
  /** Keyboard shortcut announced to assistive tech, e.g. "Control+Enter". */
  keyShortcut?: string;
  onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
  /** Required when the visible label is not descriptive enough. */
  'aria-label'?: string;
  className?: string;
}

export function Button({
  children,
  variant = 'secondary',
  size = 'md',
  type = 'button',
  disabled = false,
  loading = false,
  icon,
  keyShortcut,
  onClick,
  'aria-label': ariaLabel,
  className,
}: ButtonProps) {
  return (
    <PrimeButton
      unstyled
      type={type}
      disabled={disabled || loading}
      loading={loading}
      onClick={onClick}
      aria-label={ariaLabel}
      aria-busy={loading || undefined}
      aria-keyshortcuts={keyShortcut}
      pt={{
        root: { className: cx('vds-button', `vds-button--${variant}`, `vds-button--${size}`, className) },
        loadingIcon: { className: 'vds-button__spinner', 'aria-hidden': true },
      }}
    >
      {icon && !loading ? (
        <span className="vds-button__icon" aria-hidden="true">
          {icon}
        </span>
      ) : null}
      <span className="vds-button__label">{children}</span>
    </PrimeButton>
  );
}
