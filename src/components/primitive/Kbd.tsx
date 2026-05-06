import { cn } from "@/lib/utils";

type Props = {
  children: React.ReactNode;
  className?: string;
  // Visual treatment. "raised" gets the inset light + drop shadow that
  // makes it look like a real keyboard cap. "flat" is the minimal mono pill.
  variant?: "raised" | "flat";
};

// Keyboard-cap pill. Pattern lifted from taste-skill: the inset top-light
// plus a 1px bottom shadow that creates the optical illusion of a 3D key.
// Use for shortcuts ("Press Enter", "Esc to dismiss") wherever the user
// can drive the UI from the keyboard. Technical-founder catnip.
//
// Render as <Kbd>↵</Kbd> or <Kbd variant="flat">Esc</Kbd>.
export function Kbd({ children, className, variant = "raised" }: Props) {
  return (
    <kbd
      className={cn(
        "inline-flex items-center justify-center min-w-[1.6em] h-[1.5em] px-1.5",
        "font-mono text-[10px] uppercase tracking-[0.06em] text-ink",
        "border border-border-strong bg-surface rounded-[5px]",
        "tabular-nums leading-none",
        variant === "raised" &&
          "shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_1px_0_rgba(31,26,17,0.18)]",
        className
      )}
    >
      {children}
    </kbd>
  );
}
