"use client";

import { useState } from "react";
import * as localStore from "@/lib/local-store";

type RegenerateWeekFormProps = {
  buttonClassName: string;
  errorMessageClassName: string;
  idleLabel: string;
  layoutClassName?: string;
  onSuccess?: () => Promise<void> | void;
  pendingLabel: string;
  successMessageClassName: string;
};

type RegenerateWeekFormState = {
  status: "idle" | "success" | "error";
  message: string;
};

const initialRegenerateWeekFormState: RegenerateWeekFormState = {
  status: "idle",
  message: "",
};

function resolveLocalStoreFunction<TArgs extends unknown[], TResult>(names: string[]) {
  const record = localStore as Record<string, unknown>;

  for (const name of names) {
    const candidate = record[name];
    if (typeof candidate === "function") {
      return candidate as (...args: TArgs) => Promise<TResult>;
    }
  }

  throw new Error(`Der App-Speicher unterstützt ${names.join(" / ")} noch nicht.`);
}

function ensureLocalAppData() {
  return resolveLocalStoreFunction<[], unknown>(["ensureLocalAppData", "initLocalAppData"])();
}

function regenerateCurrentLocalWeekPlan() {
  return resolveLocalStoreFunction<[], unknown>([
    "regenerateCurrentLocalWeekPlan",
    "regenerateLocalWeekPlan",
  ])();
}

function successMessageFromResult(result: unknown) {
  if (typeof result === "string" && result.trim()) {
    return result;
  }

  if (typeof result === "object" && result !== null) {
    const record = result as Record<string, unknown>;
    const directMessage = record.message ?? record.statusMessage ?? record.summary;
    if (typeof directMessage === "string" && directMessage.trim()) {
      return directMessage;
    }
  }

  return "Der aktuelle Plan wurde neu geplant.";
}

function errorMessageFromError(error: unknown) {
  return error instanceof Error ? error.message : "Der Plan konnte nicht neu geplant werden.";
}

export function RegenerateWeekForm({
  buttonClassName,
  errorMessageClassName,
  idleLabel,
  layoutClassName,
  onSuccess,
  pendingLabel,
  successMessageClassName,
}: RegenerateWeekFormProps) {
  const [state, setState] = useState(initialRegenerateWeekFormState);
  const [isPending, setIsPending] = useState(false);

  const feedbackClassName =
    state.status === "success"
      ? successMessageClassName
      : state.status === "error"
        ? errorMessageClassName
        : null;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsPending(true);
    setState(initialRegenerateWeekFormState);

    try {
      await ensureLocalAppData();
      const result = await regenerateCurrentLocalWeekPlan();
      await onSuccess?.();
      setState({
        status: "success",
        message: successMessageFromResult(result),
      });
    } catch (error) {
      setState({
        status: "error",
        message: errorMessageFromError(error),
      });
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className={layoutClassName}>
      <form onSubmit={handleSubmit}>
        <button className={buttonClassName} disabled={isPending} type="submit">
          {isPending ? pendingLabel : idleLabel}
        </button>
      </form>

      {!isPending && state.status !== "idle" && feedbackClassName ? (
        <p aria-live="polite" className={feedbackClassName}>
          {state.message}
        </p>
      ) : null}
    </div>
  );
}
