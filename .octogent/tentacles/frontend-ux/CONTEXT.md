# Tentacle: frontend-ux

## Scope
The visible product. Pages, components, design system, microinteractions, copy quality, accessibility.

## Files owned
- src/app/** (excluding api/)
- src/components/**
- src/lib/utils.ts
- src/app/globals.css
- tailwind.config.ts

## What good looks like
- Every screen loads in under 200ms on cold dev server.
- Zero layout shifts after content loads.
- Every interactive element has focus styles.
- Voice rules followed in every visible string (no em dashes, no AI vocabulary).
- Mobile-first, 320px viewport works without horizontal scroll.

## Boundaries
- This tentacle does not write API handlers. It calls them.
- This tentacle does not change agent prompts. The agent system has its own tentacle.
- Schema changes go through the data tentacle.

## Done state for v1
- Landing, signup, 4-step onboarding, drop, match detail, browse, you are all built and clickable in stub mode.
- Toast, Sheet, BottomNav, TopBar, Avatar, Pill, Button, Input, Textarea, ProgressBar, FilterPanel, FounderCardView, MatchCard primitives all exist.
- Loading states and empty states defined.

## Open todos
See todo.md.
