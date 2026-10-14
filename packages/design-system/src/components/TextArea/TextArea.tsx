import { InputTextarea } from 'primereact/inputtextarea';
import { useId } from 'react';

export interface TextAreaProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  placeholder?: string;
  /** Helper text linked via aria-describedby. */
  hint?: string;
  maxLength?: number;
}

export function TextArea({ label, value, onChange, rows = 3, placeholder, hint, maxLength }: TextAreaProps) {
  const id = useId();
  const hintId = `${id}-hint`;
  return (
    <div className="vds-field">
      <label htmlFor={id} className="vds-field__label">
        {label}
      </label>
      <InputTextarea
        unstyled
        id={id}
        value={value}
        rows={rows}
        placeholder={placeholder}
        maxLength={maxLength}
        aria-describedby={hint ? hintId : undefined}
        onChange={(event) => onChange(event.target.value)}
        pt={{ root: { className: 'vds-input vds-input--textarea' } }}
      />
      {hint ? (
        <span id={hintId} className="vds-field__hint">
          {hint}
        </span>
      ) : null}
    </div>
  );
}
