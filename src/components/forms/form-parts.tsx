import { cn } from "@/lib/utils";

/** Id of the error element for a form control. Stable, so aria-describedby can point at it. */
export function errorId(controlId: string): string {
  return `${controlId}-error`;
}

/** Builds an aria-describedby value from the ids that currently exist; undefined when there are none. */
export function describedBy(...ids: Array<string | false | null | undefined>): string | undefined {
  const present = ids.filter(Boolean);
  return present.length > 0 ? present.join(" ") : undefined;
}

export function FieldError({
  controlId,
  message,
  className,
}: {
  controlId: string;
  message?: string | null;
  className?: string;
}) {
  if (!message) return null;
  return (
    <p id={errorId(controlId)} className={cn("text-sm text-destructive", className)}>
      {message}
    </p>
  );
}

export interface SummaryField {
  key: string;
  /** Visible name of the field, e.g. "Full Name". */
  label: string;
  /** Id of the control to move focus to. Fields without one are listed with their message instead. */
  controlId?: string;
  message: string;
}

/**
 * Catch-all at the top of a form: names every field that has an error so none can be missed,
 * including ones that have no input of their own. It is an alert, so it is announced.
 */
export function ErrorSummary({
  heading,
  fields,
  className,
}: {
  heading: string;
  fields: SummaryField[];
  className?: string;
}) {
  if (fields.length === 0) return null;
  return (
    <div
      role="alert"
      data-error-summary=""
      className={cn(
        "rounded-card border border-destructive/40 bg-destructive/10 p-4 text-sm text-foreground",
        className,
      )}
    >
      <p className="text-destructive">{heading}</p>
      <ul className="mt-2 list-disc space-y-1 pl-5">
        {fields.map((field) => (
          <li key={field.key}>
            {field.controlId ? (
              <button
                type="button"
                className="text-left underline underline-offset-4"
                onClick={() => document.getElementById(field.controlId as string)?.focus()}
              >
                {field.label}
              </button>
            ) : (
              <span>
                {field.label}: {field.message}
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
