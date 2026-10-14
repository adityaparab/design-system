export interface MeterProps {
  /** Accessible name, e.g. "AI relevance". */
  label: string;
  /** Value between 0 and 1. */
  value: number;
  /** Show the label above the bar instead of only to assistive tech. */
  showLabel?: boolean;
  /** Override the announced value, e.g. "High (0.87)". */
  valueText?: string;
}

/** Bounded measurement such as model confidence. Uses role="meter", not progressbar. */
export function Meter({ label, value, showLabel = false, valueText }: MeterProps) {
  const clamped = Math.min(1, Math.max(0, value));
  const percent = Math.round(clamped * 100);
  const band = clamped >= 0.7 ? 'high' : clamped >= 0.4 ? 'medium' : 'low';
  return (
    <div className="vds-meter">
      {showLabel ? <span className="vds-meter__label">{label}</span> : null}
      <div className="vds-meter__row">
        <div
          className={`vds-meter__track vds-meter--${band}`}
          role="meter"
          aria-label={label}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent}
          aria-valuetext={valueText ?? `${percent}%`}
        >
          <div className="vds-meter__fill" style={{ width: `${percent}%` }} />
        </div>
        <span className="vds-meter__value" aria-hidden="true">
          {percent}
        </span>
      </div>
    </div>
  );
}
