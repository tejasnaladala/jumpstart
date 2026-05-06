import { Logo } from "@/components/Logo";
import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-svh bg-bg flex flex-col">
      <header className="border-b border-border">
        <div className="container-wide py-4">
          <Logo />
        </div>
      </header>
      <div className="flex-1 flex items-center justify-center px-5 py-12">
        <div className="text-center max-w-md">
          <p className="text-xxs uppercase tracking-wider text-accent font-semibold">404</p>
          <h1 className="text-3xl font-semibold tracking-tight mt-2">Not in the cohort</h1>
          <p className="text-muted mt-3">
            That page either does not exist or you do not have access. Head back to the Drop.
          </p>
          <Link
            href="/drop"
            className="inline-flex items-center justify-center h-11 px-5 mt-6 rounded-md bg-ink text-white font-medium hover:bg-black transition-all"
          >
            Go to Drop
          </Link>
        </div>
      </div>
    </main>
  );
}
