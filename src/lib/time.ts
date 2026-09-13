export function formatTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

// Computes remaining seconds from a wall-clock end timestamp rather than
// decrementing a counter per tick. setInterval ticks aren't guaranteed to
// fire every 1000ms — they get throttled when the window is minimized or
// unfocused — so counting "one tick = one second" silently undercounts
// elapsed time. Recomputing from Date.now() each tick self-corrects
// regardless of how late or infrequent the ticks actually are.
export function secondsUntil(endTimestampMs: number, nowMs: number = Date.now()): number {
  return Math.max(0, Math.round((endTimestampMs - nowMs) / 1000));
}
