import { RadioButton } from 'primereact/radiobutton';
import { useId } from 'react';
import { Kbd } from '../Kbd/Kbd';

export interface RadioOption<V extends string> {
  value: V;
  label: string;
  /** Single-key shortcut shown next to the option. The consumer wires the key handler. */
  shortcut?: string;
}

export interface RadioGroupProps<V extends string> {
  /** Group label, rendered as the fieldset legend. */
  label: string;
  options: ReadonlyArray<RadioOption<V>>;
  value: V | null;
  onChange: (value: V) => void;
  /** Native radio group name; defaults to a generated id. */
  name?: string;
  disabled?: boolean;
  orientation?: 'vertical' | 'horizontal';
}

/** Single choice from a short list. Native radios inside a fieldset give arrow-key navigation for free. */
export function RadioGroup<V extends string>({
  label,
  options,
  value,
  onChange,
  name,
  disabled = false,
  orientation = 'vertical',
}: RadioGroupProps<V>) {
  const generatedName = useId();
  const groupName = name ?? generatedName;
  return (
    <fieldset className={`vds-choice-group vds-choice-group--${orientation}`} disabled={disabled}>
      <legend className="vds-choice-group__legend">{label}</legend>
      {options.map((option) => {
        const inputId = `${groupName}-${option.value}`;
        return (
          <div key={option.value} className="vds-choice">
            <RadioButton
              unstyled
              inputId={inputId}
              name={groupName}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              pt={{
                root: { className: 'vds-choice__control vds-choice__control--radio' },
                input: { className: 'vds-choice__input', 'aria-keyshortcuts': option.shortcut },
                box: { className: 'vds-choice__box' },
                icon: { className: 'vds-choice__dot' },
              }}
            />
            <label htmlFor={inputId} className="vds-choice__label">
              {option.label}
            </label>
            {option.shortcut ? <Kbd>{option.shortcut}</Kbd> : null}
          </div>
        );
      })}
    </fieldset>
  );
}
