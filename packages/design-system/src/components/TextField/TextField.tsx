import { InputText } from 'primereact/inputtext';
import { useId, type ReactNode, type Ref } from 'react';
import { cx } from '../../utils/cx';

export interface TextFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  /** Visually hide the label (it stays available to assistive tech). */
  hideLabel?: boolean;
  type?: 'text' | 'search';
  placeholder?: string;
  /** Decorative leading icon. */
  icon?: ReactNode;
  /** Shortcut that focuses this field, exposed via aria-keyshortcuts. */
  keyShortcut?: string;
  inputRef?: Ref<HTMLInputElement>;
}

export function TextField({
  label,
  value,
  onChange,
  hideLabel = false,
  type = 'text',
  placeholder,
  icon,
  keyShortcut,
  inputRef,
}: TextFieldProps) {
  const id = useId();
  return (
    <div className="vds-field">
      <label htmlFor={id} className={cx('vds-field__label', hideLabel && 'vds-visually-hidden')}>
        {label}
      </label>
      <div className={cx('vds-input-wrap', icon !== undefined && 'vds-input-wrap--icon')}>
        {icon ? (
          <span className="vds-input-wrap__icon" aria-hidden="true">
            {icon}
          </span>
        ) : null}
        <InputText
          unstyled
          ref={inputRef}
          id={id}
          type={type}
          value={value}
          placeholder={placeholder}
          aria-keyshortcuts={keyShortcut}
          onChange={(event) => onChange(event.target.value)}
          pt={{ root: { className: 'vds-input' } }}
        />
      </div>
    </div>
  );
}
