import { SelectButton } from 'primereact/selectbutton';

export interface SegmentOption<V extends string> {
  value: V;
  label: string;
  /** Optional count shown after the label, e.g. number of documents. */
  count?: number;
}

export interface SegmentedControlProps<V extends string> {
  /** Accessible name for the group. */
  label: string;
  options: ReadonlyArray<SegmentOption<V>>;
  value: V;
  onChange: (value: V) => void;
  size?: 'sm' | 'md';
}

/** Switches between 2–5 views or filters. One Tab stop; arrow keys move between segments. */
export function SegmentedControl<V extends string>({ label, options, value, onChange, size = 'md' }: SegmentedControlProps<V>) {
  return (
    <SelectButton
      unstyled
      value={value}
      options={options as SegmentOption<V>[]}
      optionLabel="label"
      optionValue="value"
      allowEmpty={false}
      onChange={(event) => {
        if (event.value != null) onChange(event.value as V);
      }}
      itemTemplate={(option: SegmentOption<V>) => (
        <>
          <span>{option.label}</span>
          {option.count !== undefined ? <span className="vds-segmented__count">{option.count.toLocaleString()}</span> : null}
        </>
      )}
      pt={{
        root: { className: `vds-segmented vds-segmented--${size}`, 'aria-label': label },
        button: ({ context }: { context: { selected: boolean } }) => ({
          className: context.selected ? 'vds-segmented__item vds-segmented__item--selected' : 'vds-segmented__item',
        }),
      }}
    />
  );
}
