"use client";
import { cn } from "@/lib/utils";

type Props = {
  children: React.ReactNode;
  active?: boolean;
  accent?: boolean;
  onClick?: () => void;
  className?: string;
  size?: "sm" | "md";
};

export function Pill({
  children,
  active,
  accent,
  onClick,
  className,
  size = "md",
}: Props) {
  const interactive = typeof onClick === "function";
  const Component = interactive ? "button" : "span";
  return (
    <Component
      type={interactive ? "button" : undefined}
      onClick={onClick}
      className={cn(
        "pill transition-colors duration-150",
        size === "sm" ? "text-xxs px-2 py-1" : "text-xs px-2.5 py-1",
        active && "pill-on",
        accent && !active && "pill-accent",
        interactive && "cursor-pointer hover:border-ink/40 tap-44",
        className
      )}
    >
      {children}
    </Component>
  );
}
