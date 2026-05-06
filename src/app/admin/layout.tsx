import { Logo } from "@/components/Logo";
import Link from "next/link";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-svh bg-bg">
      <header className="border-b border-border bg-bg/85 backdrop-blur-md sticky top-0 z-20">
        <div className="container-wide py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Logo />
            <span className="text-xxs uppercase tracking-wider text-accent font-semibold border-l border-border pl-4">
              admin
            </span>
          </div>
          <nav className="flex items-center gap-1 text-sm">
            <AdminLink href="/admin/moderation" label="Moderation" />
            <AdminLink href="/admin/logs" label="Logs" />
            <AdminLink href="/admin/cohort" label="Cohort" />
          </nav>
        </div>
      </header>
      <div className="py-6">{children}</div>
    </main>
  );
}

function AdminLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="px-3 h-9 inline-flex items-center rounded-md text-sm text-muted hover:bg-border/50 hover:text-ink transition-colors"
    >
      {label}
    </Link>
  );
}
