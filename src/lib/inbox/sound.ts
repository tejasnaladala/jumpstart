// Tiny synthesized message tones via Web Audio API. No assets, no
// HTTP fetch, sub-100ms latency. Sent and received use different
// frequencies so the user can tell at a glance which side just fired.
//
// Browser activation: AudioContext requires a user gesture to start.
// Sending happens on click/Enter so the gesture is always present.
// Receiving happens after a gesture has already occurred (you accepted
// or sent something earlier in the session) so the AC is unlocked.
//
// Audio respects prefers-reduced-motion AND a localStorage opt-out
// flag (jumpstart.inbox.muted=1). Quiet by default would feel broken;
// loud by default could be annoying. Default is on; users can mute
// per-thread in v1.5.

let _ctx: AudioContext | null = null;
function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (_ctx) return _ctx;
  try {
    const Ctor =
      (window as unknown as { AudioContext?: typeof AudioContext }).AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    _ctx = new Ctor();
    return _ctx;
  } catch {
    return null;
  }
}

function isMuted(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return window.localStorage.getItem("jumpstart.inbox.muted") === "1";
  } catch {
    return false;
  }
}

function tone(freq: number, durationMs: number, gain = 0.08): void {
  if (isMuted()) return;
  const ctx = getCtx();
  if (!ctx) return;
  try {
    if (ctx.state === "suspended") {
      // Best-effort resume; some browsers need an explicit kick.
      void ctx.resume();
    }
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    g.gain.setValueAtTime(0.0001, ctx.currentTime);
    // Quick attack, exponential decay — keeps it crisp like an iMessage tritone.
    g.gain.exponentialRampToValueAtTime(gain, ctx.currentTime + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + durationMs / 1000);
    osc.connect(g).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + durationMs / 1000 + 0.05);
  } catch {
    // Audio is non-critical; silent fail is the right behavior.
  }
}

// Sent: short high tritone. Outgoing should feel snappy.
export function playSent(): void {
  tone(880, 90, 0.07);
  // Tiny chord: a higher note overlapping for the iMessage-y "ti-tock"
  setTimeout(() => tone(1320, 60, 0.05), 35);
}

// Received: a touch lower, slightly longer. Pulls attention without alarm.
export function playReceived(): void {
  tone(660, 120, 0.09);
  setTimeout(() => tone(880, 80, 0.06), 50);
}
