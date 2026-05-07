"use client";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/primitive/Button";
import { Input } from "@/components/primitive/Input";
import { useToast } from "@/components/primitive/Toast";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const toast = useToast();

  // Demo-mode wipe. Per founder direction (May 7 2026): every visit to
  // the signup surface is treated as a brand-new attempt for testing,
  // so a friend / the founder can demo the full flow without seeing
  // their own old onboarding bleed through. Wipes every jumpstart.*
  // localStorage key on mount. During real beta this gets replaced
  // with proper auth where the user explicitly opts out via "Sign out"
  // on /you. Until then, refresh = reset.
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < window.localStorage.length; i++) {
        const k = window.localStorage.key(i);
        if (k && k.startsWith("jumpstart.")) keysToRemove.push(k);
      }
      for (const k of keysToRemove) window.localStorage.removeItem(k);
    } catch {
      // privacy mode / quota — non-fatal, friend just sees stale state
    }
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.includes("@")) {
      toast.push("Enter a valid email", "error");
      return;
    }
    setLoading(true);
    // Mock magic link - just navigate to onboarding
    await new Promise((r) => setTimeout(r, 600));
    if (typeof window !== "undefined") {
      window.localStorage.setItem("jumpstart.signup", JSON.stringify({ email, linkedin }));
    }
    toast.push("Magic link sent. Continuing in dev mode.", "info");
    router.push("/onboarding/identity");
  }

  return (
    <main className="min-h-svh bg-bg flex flex-col">
      <header className="border-b border-border">
        <div className="container-wide py-4">
          <Logo />
        </div>
      </header>
      <div className="flex-1 flex items-center justify-center px-5 py-12">
        <div className="w-full max-w-md surface p-8 sm:p-10 rounded-2xl">
          <h1 className="font-display text-3xl text-ink leading-tight">Get your Founder Drop</h1>
          <p className="text-sm text-muted mt-2">
            Email and LinkedIn to verify you. Takes ten seconds.
          </p>
          <form onSubmit={onSubmit} className="flex flex-col gap-4 mt-6">
            <Input
              label="Email"
              type="email"
              placeholder="you@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              maxLength={120}
              showCounter
            />
            <Input
              label="LinkedIn URL"
              type="url"
              placeholder="https://linkedin.com/in/..."
              value={linkedin}
              onChange={(e) => setLinkedin(e.target.value)}
              hint="Used as a soft verification signal alongside your acceptance email."
              maxLength={200}
              showCounter
            />
            <Button type="submit" size="lg" loading={loading} block>
              Send magic link
            </Button>
          </form>
          <p className="text-xs text-muted text-center mt-4">
            By continuing, you confirm you are an accepted SS 2026 attendee.
          </p>
        </div>
      </div>
    </main>
  );
}
