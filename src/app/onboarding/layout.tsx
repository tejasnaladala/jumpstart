import { Logo } from "@/components/Logo";

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-svh bg-bg flex flex-col">
      <header className="border-b border-border bg-bg/85 backdrop-blur-md sticky top-0 z-20">
        <div className="container-wide py-3 flex items-center justify-between">
          <Logo />
          <span className="text-xs text-muted">Founder onboarding</span>
        </div>
      </header>
      <div className="flex-1 flex flex-col">{children}</div>
    </main>
  );
}
