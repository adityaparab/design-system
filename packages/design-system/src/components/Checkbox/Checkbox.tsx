import { Checkbox as PrimeCheckbox } from 'primereact/checkbox';
import { useId } from 'react';
import { Kbd } from '../Kbd/Kbd';

export interface CheckboxProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  /** Single-key shortcut shown next to the label. The consumer wires the key handler. */
  shortcut?: string;
  id?: string;
}

export function Checkbox({ label, checked, onChange, disabled = false, shortcut, id }: CheckboxProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  return (
    <div className="vds-choice">
      <PrimeCheckbox
        unstyled
        inputId={inputId}
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(Boolean(event.checked))}
        pt={{
          root: { className: 'vds-choice__control vds-choice__control--checkbox' },
          input: { className: 'vds-choice__input', 'aria-keyshortcuts': shortcut },
          box: { className: 'vds-choice__box' },
          icon: { className: 'vds-choice__check' },
        }}
      />
      <label htmlFor={inputId} className="vds-choice__label">
        {label}
      </label>
      {shortcut ? <Kbd>{shortcut}</Kbd> : null}
    </div>
  );
}
