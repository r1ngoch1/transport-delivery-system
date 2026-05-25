import { toDisplayError } from "../errors/apiError";

interface ApiErrorMessageProps {
  error: unknown;
  fallback: string;
  className?: string;
}

export function ApiErrorMessage({ error, fallback, className = "form-error" }: ApiErrorMessageProps) {
  return (
    <div className={className} role="alert">
      {toDisplayError(error, fallback)}
    </div>
  );
}
