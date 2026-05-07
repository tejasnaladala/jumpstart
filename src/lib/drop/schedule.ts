// Drop scheduling. The product ships one curated match three times a week
// at Monday / Wednesday / Friday 21:00 PT (9pm Pacific). When a user
// finishes onboarding, we compute the next drop they're eligible for:
//
//   - If onboarding completes BEFORE 15:00 PT on a drop day, they get
//     that day's 21:00 PT drop (6 hours of lead time).
//   - If onboarding completes AT/AFTER 15:00 PT on a drop day, they're
//     pushed to the next drop day. (Otherwise, attendees onboarding at
//     8:55pm hit a "drop in 5 min" sprint that breaks the matchmaker
//     curation budget.)
//
// All times computed in America/Los_Angeles. Hardcoded PDT offset for the
// May 2026 -> November 2026 launch window. Production needs full DST
// handling but the closed-beta-of-10 ships entirely inside PDT.

export const DROP_DAYS_PT = ["Mon", "Wed", "Fri"] as const;
export const DROP_HOUR_PT = 21; // 21:00 PT == 9pm PT
export const CUTOFF_HOUR_PT = 15; // 15:00 PT == 3pm PT (6 hours before drop)

// PDT during May-Nov 2026 == UTC-7. The launch window (closed beta May
// through SS event July 25-26) is fully inside PDT, so this constant is
// safe. If we ship past November 2026 add proper DST handling.
const PT_OFFSET = "-07:00";

// Get day-of-week shorthand ("Mon", "Tue", ...) for a Date as observed
// in America/Los_Angeles.
function ptWeekday(d: Date): string {
  return d.toLocaleString("en-US", {
    timeZone: "America/Los_Angeles",
    weekday: "short",
  });
}

// Get YYYY-MM-DD in America/Los_Angeles for a Date.
function ptDateString(d: Date): string {
  // en-CA gives ISO-shape YYYY-MM-DD
  return d.toLocaleDateString("en-CA", {
    timeZone: "America/Los_Angeles",
  });
}

// Get hour-of-day (0-23) in America/Los_Angeles for a Date.
function ptHour(d: Date): number {
  const hourStr = d.toLocaleString("en-US", {
    timeZone: "America/Los_Angeles",
    hour: "2-digit",
    hour12: false,
  });
  // en-US sometimes returns "24" instead of "00" depending on locale data.
  const n = Number.parseInt(hourStr, 10);
  return Number.isFinite(n) ? n % 24 : 0;
}

function makeDropAt(yyyymmdd: string, hour = DROP_HOUR_PT): Date {
  // Construct a UTC Date that represents `hour:00 PT` on the given PT date.
  return new Date(`${yyyymmdd}T${String(hour).padStart(2, "0")}:00:00${PT_OFFSET}`);
}

// Walk forward day by day to find the next Mon/Wed/Fri at 21:00 PT
// strictly AFTER `from`. Bounded to 14 days for safety.
export function nextDropAfter(from: Date = new Date()): Date {
  for (let i = 0; i < 14; i++) {
    const candidate = new Date(from.getTime() + i * 24 * 3600 * 1000);
    const wd = ptWeekday(candidate);
    if (!DROP_DAYS_PT.includes(wd as (typeof DROP_DAYS_PT)[number])) continue;
    const ptDay = ptDateString(candidate);
    const dropAt = makeDropAt(ptDay);
    if (dropAt > from) return dropAt;
  }
  // Fallback that should never fire: 7 days out at 21:00 PT roughly.
  return new Date(from.getTime() + 7 * 24 * 3600 * 1000);
}

// Compute the drop the user is eligible for, given when they finished
// onboarding. The 6-hour cutoff rule: if it's already past 15:00 PT on
// a drop day, push to the NEXT drop day. Otherwise, that day's 21:00 PT
// drop is theirs.
export function eligibleDropFor(onboardedAt: Date = new Date()): Date {
  const wd = ptWeekday(onboardedAt);
  const isDropDay = DROP_DAYS_PT.includes(wd as (typeof DROP_DAYS_PT)[number]);
  const hour = ptHour(onboardedAt);
  const isPastCutoff = hour >= CUTOFF_HOUR_PT;

  if (isDropDay && !isPastCutoff) {
    // Today's drop is still within the lead window.
    return makeDropAt(ptDateString(onboardedAt));
  }
  // Either not a drop day, or past the 15:00 PT cutoff on a drop day.
  // Use nextDropAfter, but ensure the search starts AFTER today's
  // potential drop time so we don't accidentally re-pick today.
  const ptDay = ptDateString(onboardedAt);
  const todayDrop = makeDropAt(ptDay);
  const startFrom = onboardedAt > todayDrop ? onboardedAt : new Date(todayDrop.getTime() + 60_000);
  return nextDropAfter(startFrom);
}

// Pretty-print a drop time as "Mon · 9:00 PM PT" or similar. Used in
// the countdown header so the user sees which day they're waiting for.
export function formatDropLabel(dropAt: Date): string {
  const wd = dropAt.toLocaleString("en-US", {
    timeZone: "America/Los_Angeles",
    weekday: "long",
  });
  const date = dropAt.toLocaleString("en-US", {
    timeZone: "America/Los_Angeles",
    month: "short",
    day: "numeric",
  });
  return `${wd}, ${date} at 9:00 PM PT`;
}

export type Countdown = {
  done: boolean;
  ms: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

export function countdownTo(target: Date, now: Date = new Date()): Countdown {
  const ms = target.getTime() - now.getTime();
  if (ms <= 0) {
    return { done: true, ms: 0, days: 0, hours: 0, minutes: 0, seconds: 0 };
  }
  const seconds = Math.floor(ms / 1000) % 60;
  const minutes = Math.floor(ms / 60_000) % 60;
  const hours = Math.floor(ms / 3_600_000) % 24;
  const days = Math.floor(ms / 86_400_000);
  return { done: false, ms, days, hours, minutes, seconds };
}
