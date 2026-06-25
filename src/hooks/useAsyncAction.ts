import { useState, useCallback, type FormEvent } from "react";
import { getErrorMessage } from "../utils/getErrorMessage";

type AsyncActionOptions = {
  onSuccess?: () => void;
};

type AsyncActionState = {
  submitting: boolean;
  error: string;
  setError: (error: string) => void;
};

type AsyncActionResult = AsyncActionState & {
  run: (action: () => Promise<void>, fallbackError?: string) => Promise<void>;
  handleSubmit: (
    action: () => Promise<void>,
    fallbackError?: string
  ) => (event: FormEvent) => void;
};

export function useAsyncAction(options?: AsyncActionOptions): AsyncActionResult {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const run = useCallback(
    async (action: () => Promise<void>, fallbackError = "An error occurred.") => {
      setSubmitting(true);
      setError("");
      try {
        await action();
        options?.onSuccess?.();
      } catch (err) {
        setError(getErrorMessage(err, fallbackError));
      } finally {
        setSubmitting(false);
      }
    },
    [options]
  );

  const handleSubmit = useCallback(
    (action: () => Promise<void>, fallbackError?: string) =>
      (event: FormEvent) => {
        event.preventDefault();
        void run(action, fallbackError);
      },
    [run]
  );

  return { submitting, error, setError, run, handleSubmit };
}
