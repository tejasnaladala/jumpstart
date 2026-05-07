import { BottomNav } from "@/components/BottomNav";
import { SideNav } from "@/components/SideNav";
import { RouteTransition } from "@/components/RouteTransition";
import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";

export default async function AppShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Gate every authenticated app surface (Drop, Browse, Match, You) on a
  // real session. In stub mode this returns the dev user, so local dev is
  // unchanged. In production this bounces unauthenticated users to /signup.
  // Closes Codex P1 #3 (mock cohort shipped to client without auth).
  const session = await getSession();
  if (!session) {
    redirect("/signup");
  }

  return (
    <div className="min-h-svh bg-bg pb-24 lg:pb-6 lg:pl-[200px]">
      {/* SideNav (lg+) and BottomNav (sm-) are mutually exclusive via
          tailwind breakpoints; each component hides itself on the
          opposite breakpoint. Founder direction (May 7): laptop is the
          primary surface; phone is a follow-up scale-down. */}
      <SideNav />
      <RouteTransition>{children}</RouteTransition>
      <BottomNav />
    </div>
  );
}
