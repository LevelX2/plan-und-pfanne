"use client";

import { addDays, isIsoDate } from "@/lib/date";
import styles from "./date-stepper.module.css";

type DateStepperProps = {
  id: string;
  label: string;
  min?: string;
  name?: string;
  onChange: (value: string) => void;
  required?: boolean;
  value: string;
};

export function DateStepper({ id, label, min, name, onChange, required, value }: DateStepperProps) {
  function shiftDate(amount: number) {
    if (!isIsoDate(value)) {
      return;
    }

    const nextValue = addDays(value, amount);

    if (min && nextValue < min) {
      return;
    }

    onChange(nextValue);
  }

  const hasValidValue = isIsoDate(value);
  const previousValue = hasValidValue ? addDays(value, -1) : "";
  const previousDisabled = !hasValidValue || Boolean(min && previousValue < min);

  return (
    <div className={styles.field}>
      <label htmlFor={id}>{label}</label>
      <span className={styles.stepper}>
        <button
          aria-label={`${label} einen Tag früher`}
          className={styles.stepButton}
          disabled={previousDisabled}
          onClick={() => shiftDate(-1)}
          type="button"
        >
          -
        </button>
        <input
          id={id}
          min={min}
          name={name}
          onChange={(event) => onChange(event.currentTarget.value)}
          required={required}
          type="date"
          value={value}
        />
        <button
          aria-label={`${label} einen Tag später`}
          className={styles.stepButton}
          disabled={!hasValidValue}
          onClick={() => shiftDate(1)}
          type="button"
        >
          +
        </button>
      </span>
    </div>
  );
}
