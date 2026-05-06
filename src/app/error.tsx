"use client";
import { Logo } from "@/components/Logo";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="min-h-svh bg-bg flex flex-col">
      <header className="border-b border-border">
        <div className="container-wide py-4">
          <Logo />
        </div>
      </header>
      <div className="flex-1 flex items-center justify-center px-5 py-12">
        <div className="text-center max-w-md">
          <p className="text-xxs uppercase tracking-wider text-error font-semibold">
            Something went wrong
          </p>
          <h1 className="font-display text-3xl text-ink leading-tight mt-2">
            Hit a rough edge.
          </h1>
          <p className="text-muted mt-3 leading-relaxed">
            Not your fault. The system caught the error and is keeping the rest of the cohort
            running. Try again, or jump back to the Drop.
          </p>
          {error.digest ? (
            <p className="text-xs text-muted mt-4 font-mono">trace: {error.digest}</p>
          ) : null}
          <div className="flex items-center justify-center gap-2 mt-6">
            <button
              onClick={() => reset()}
              className="inline-flex items-center justify-center h-11 px-5 rounded-md bg-ink text-white font-medium hover:bg-black"
            >
              Try again
            </button>
            <Link
              href="/drop"
              className="inline-flex items-center justify-center h-11 px-5 rounded-md border border-border bg-surface text-ink font-medium hover:border-ink/40"
            >
              Back to Drop
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
