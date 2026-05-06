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
        "pill",
        size === "sm" ? "text-xxs px-2 py-px" : "text-xs px-2.5 py-0.5",
        active && "pill-on",
        accent && !active && "pill-accent",
        interactive && "cursor-pointer hover:border-ink/40",
        className
      )}
    >
      {children}
    </Component>
  );
}
