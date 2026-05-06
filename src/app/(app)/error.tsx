"use client";
import { TopBar } from "@/components/TopBar";
import { Button } from "@/components/primitive/Button";
import Link from "next/link";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <>
      <TopBar back={{ href: "/drop" }} title="Hit a snag" />
      <section className="container-app pt-8 pb-10 text-center">
        <p className="text-xxs uppercase tracking-wider text-error font-semibold">Error</p>
        <h1 className="font-display text-2xl text-ink leading-tight mt-2">This screen failed to load.</h1>
        <p className="text-muted text-sm mt-3 leading-relaxed">
          The rest of the app is fine. Try again or head back to your Drop.
        </p>
        {error.digest ? (
          <p className="text-xs text-muted mt-3 font-mono">trace: {error.digest}</p>
        ) : null}
        <div className="flex items-center justify-center gap-2 mt-6">
          <Button onClick={() => reset()}>Try again</Button>
          <Link
            href="/drop"
            className="inline-flex items-center justify-center h-10 px-4 rounded-md border border-border bg-surface text-ink text-sm font-medium hover:border-ink/40"
          >
            Back to Drop
          </Link>
        </div>
      </section>
    </>
  );
}
