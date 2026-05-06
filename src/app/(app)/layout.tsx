import { BottomNav } from "@/components/BottomNav";

export default function AppShellLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-svh bg-bg pb-24">
      {children}
      <BottomNav />
    </div>
  );
}
