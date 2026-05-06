import { BottomNav } from "@/components/BottomNav";
import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";

export default async function AppShellLayout({ children }: { children: React.ReactNode }) {
  // Gate every authenticated app surface (Drop, Browse, Match, You) on a
  // real session. In stub mode this returns the dev user, so local dev is
  // unchanged. In production this bounces unauthenticated users to /signup.
  // Closes Codex P1 #3 (mock cohort shipped to client without auth).
  const session = await getSession();
  if (!session) {
    redirect("/signup");
  }

  return (
    <div className="min-h-svh bg-bg pb-24">
      {children}
      <BottomNav />
    </div>
  );
}
