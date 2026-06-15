import type { Metadata } from "next";
import { BottomNav } from "@/components/BottomNav";
import { RouteTransition } from "@/components/RouteTransition";
import { EluIdentify } from "@/components/EluIdentify";
import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";

// Authed surfaces are personal: never indexed, never cached by search
// engines. Public surfaces (/, /signup, /pass/[id]) opt in separately.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function AppShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Gate every authenticated app surface (Drop, Browse, Match, You) on a
  // real session. In stub mode this returns the dev user, so local dev is
  // unchanged. In production this bounces unauthenticated users to /signup.
  // This closes the gap where the mock cohort shipped to the client without auth.
  const session = await getSession();
  if (!session) {
    redirect("/signup");
  }

  // BottomNav is the only nav (May 7 update): the floating pill stays at
  // every breakpoint per founder direction. pb-28 clears the pill on
  // every page so content never hides behind it.
  return (
    <div className="min-h-svh bg-bg pb-28">
      {/* ELU Analytics: attach the signed-in user's email to their session so
          product analytics can attribute behavior to a real person instead of
          an anonymous device. Optional - safe to remove if you don't want to
          share email with analytics. See https://elu.dev for docs. */}
      <EluIdentify email={session.email || null} />
      <main id="main">
        <RouteTransition>{children}</RouteTransition>
      </main>
      <BottomNav />
    </div>
  );
}
