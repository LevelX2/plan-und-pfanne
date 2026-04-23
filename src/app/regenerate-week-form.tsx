"use client";

import { useActionState } from "react";
import { regenerateCurrentWeekAction, type RegenerateWeekFormState } from "@/app/actions";

type RegenerateWeekFormProps = {
  buttonClassName: string;
  errorMessageClassName: string;
  idleLabel: string;
  layoutClassName?: string;
  pendingLabel: string;
  successMessageClassName: string;
};

const initialRegenerateWeekFormState: RegenerateWeekFormState = {
  status: "idle",
  message: "",
};

export function RegenerateWeekForm({
  buttonClassName,
  errorMessageClassName,
  idleLabel,
  layoutClassName,
  pendingLabel,
  successMessageClassName,
}: RegenerateWeekFormProps) {
  const [state, formAction, pending] = useActionState(
    regenerateCurrentWeekAction,
    initialRegenerateWeekFormState,
  );

  const feedbackClassName =
    state.status === "success"
      ? successMessageClassName
      : state.status === "error"
        ? errorMessageClassName
        : null;

  return (
    <div className={layoutClassName}>
      <form action={formAction}>
        <button className={buttonClassName} disabled={pending} type="submit">
          {pending ? pendingLabel : idleLabel}
        </button>
      </form>

      {!pending && state.status !== "idle" && feedbackClassName ? (
        <p aria-live="polite" className={feedbackClassName}>
          {state.message}
        </p>
      ) : null}
    </div>
  );
}
