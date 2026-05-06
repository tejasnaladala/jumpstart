"use client";
import { Avatar } from "@/components/primitive/Avatar";
import { Pill } from "@/components/primitive/Pill";
import type { FounderCard as Card } from "@/lib/types";
import { cn } from "@/lib/utils";

type Props = {
  card: Card;
  variant?: "compact" | "full" | "row";
  href?: string;
  className?: string;
};

export function FounderCardView({ card, variant = "full", className }: Props) {
  if (variant === "row") {
    return (
      <div className={cn("flex items-start gap-3 py-3", className)}>
        <Avatar name={card.name} size={40} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-ink">{card.name}</p>
          <p className="text-xs text-muted">{card.location}</p>
          <p className="text-sm text-ink/80 mt-1 line-clamp-2">{card.building_summary}</p>
          <div className="flex flex-wrap gap-1 mt-1.5">
            {card.tags.slice(0, 3).map((t) => (
              <Pill key={t} size="sm">{t}</Pill>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <div className={cn("surface p-4 hover:shadow-hover transition-shadow", className)}>
        <div className="flex items-start gap-3">
          <Avatar name={card.name} size={44} />
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2">
              <h3 className="text-sm font-semibold text-ink truncate">{card.name}</h3>
              <span className="text-xxs text-muted">{card.location}</span>
            </div>
            <p className="text-sm text-ink/80 mt-1 line-clamp-2">{card.building_summary}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-1 mt-3">
          {card.tags.slice(0, 4).map((t) => (
            <Pill key={t} size="sm">{t}</Pill>
          ))}
        </div>
      </div>
    );
  }

  // full
  return (
    <div className={cn("surface p-5", className)}>
      <div className="flex items-start gap-4">
        <Avatar name={card.name} size={56} />
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-ink">{card.name}</h3>
          <p className="text-sm text-muted">{card.location}</p>
        </div>
      </div>
      <Section label="Building">
        <p className="text-sm text-ink leading-relaxed">{card.building_summary}</p>
      </Section>
      <Section label="Looking for">
        <p className="text-sm text-ink leading-relaxed">{card.looking_for}</p>
      </Section>
      <Section label="Can help with">
        <p className="text-sm text-ink leading-relaxed">{card.can_help_with}</p>
      </Section>
      <Section label="Talk to me if">
        <p className="text-sm text-ink leading-relaxed italic">{card.talk_to_me_if}</p>
      </Section>
      <div className="flex flex-wrap gap-1.5 mt-4 pt-4 border-t border-border">
        {card.tags.map((t) => (
          <Pill key={t} size="sm">{t}</Pill>
        ))}
      </div>
    </div>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mt-4 pt-4 border-t border-border first:mt-5 first:pt-0 first:border-t-0">
      <p className="text-xxs uppercase tracking-wider text-muted font-semibold mb-1.5">
        {label}
      </p>
      {children}
    </div>
  );
}
