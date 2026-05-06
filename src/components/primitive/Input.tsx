"use client";
import { cn } from "@/lib/utils";
import { forwardRef } from "react";

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  hint?: string;
  error?: string;
  // When set, renders a "X / max" character counter to the right of the
  // hint row in mono caps. Counter turns accent at >=80% and error at
  // >=100%. Pair with the native maxLength attribute to also block input.
  showCounter?: boolean;
};

// Char counter helper: shared by Input and Textarea. Returns null when
// no maxLength (or showCounter not requested).
function CharCounter({ value, max }: { value: number; max: number | undefined }) {
  if (!max) return null;
  const ratio = value / max;
  const tone =
    ratio >= 1
      ? "text-error"
      : ratio >= 0.8
      ? "text-accent"
      : "text-muted/70";
  return (
    <span
      className={cn(
        "font-mono text-[10px] uppercase tracking-[0.16em] tabular-nums shrink-0 ml-auto",
        tone
      )}
      aria-live="polite"
      aria-atomic="true"
    >
      {value}
      <span className="opacity-50"> / {max}</span>
    </span>
  );
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hint, error, className, id, showCounter, value, maxLength, ...rest },
  ref
) {
  const inputId =
    id || (typeof label === "string" ? `f-${label.replace(/\s+/g, "-").toLowerCase()}` : undefined);
  const currentLength = typeof value === "string" ? value.length : 0;
  const showFooter = Boolean(error || hint || (showCounter && maxLength));
  return (
    <div className="flex flex-col gap-1.5">
      {label ? (
        <label htmlFor={inputId} className="text-xs font-medium text-muted uppercase tracking-wider">
          {label}
        </label>
      ) : null}
      <input
        ref={ref}
        id={inputId}
        value={value}
        maxLength={maxLength}
        className={cn(
          "h-11 rounded-md border border-border bg-surface px-3 text-sm text-ink",
          "placeholder:text-muted/70 focus:border-ink/30 transition-colors",
          error && "border-error focus:border-error",
          className
        )}
        {...rest}
      />
      {showFooter ? (
        <div className="flex items-baseline gap-3">
          {error ? (
            <span className="text-xs text-error">{error}</span>
          ) : hint ? (
            <span className="text-xs text-muted">{hint}</span>
          ) : null}
          {showCounter ? <CharCounter value={currentLength} max={maxLength} /> : null}
        </div>
      ) : null}
    </div>
  );
});

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
  hint?: string;
  error?: string;
  showCounter?: boolean;
};

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, hint, error, className, id, rows = 4, showCounter, value, maxLength, ...rest },
  ref
) {
  const inputId = id || (typeof label === "string" ? `t-${label.replace(/\s+/g, "-").toLowerCase()}` : undefined);
  const currentLength = typeof value === "string" ? value.length : 0;
  const showFooter = Boolean(error || hint || (showCounter && maxLength));
  return (
    <div className="flex flex-col gap-1.5">
      {label ? (
        <label htmlFor={inputId} className="text-xs font-medium text-muted uppercase tracking-wider">
          {label}
        </label>
      ) : null}
      <textarea
        ref={ref}
        id={inputId}
        rows={rows}
        value={value}
        maxLength={maxLength}
        className={cn(
          "rounded-md border border-border bg-surface px-3 py-2.5 text-sm text-ink resize-none",
          "placeholder:text-muted/70 focus:border-ink/30 transition-colors",
          error && "border-error focus:border-error",
          className
        )}
        {...rest}
      />
      {showFooter ? (
        <div className="flex items-baseline gap-3">
          {error ? (
            <span className="text-xs text-error">{error}</span>
          ) : hint ? (
            <span className="text-xs text-muted">{hint}</span>
          ) : null}
          {showCounter ? <CharCounter value={currentLength} max={maxLength} /> : null}
        </div>
      ) : null}
    </div>
  );
});
