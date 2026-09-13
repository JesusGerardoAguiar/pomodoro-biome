import { describe, it, expect } from "vitest";
import { formatTime, secondsUntil } from "./time";

describe("formatTime", () => {
  it("formats zero as 00:00", () => {
    expect(formatTime(0)).toBe("00:00");
  });

  it("formats seconds under a minute", () => {
    expect(formatTime(45)).toBe("00:45");
  });

  it("formats exactly one minute", () => {
    expect(formatTime(60)).toBe("01:00");
  });

  it("formats 25 minutes", () => {
    expect(formatTime(25 * 60)).toBe("25:00");
  });

  it("pads single-digit seconds", () => {
    expect(formatTime(65)).toBe("01:05");
  });
});

describe("secondsUntil", () => {
  it("returns 0 when the end timestamp is now", () => {
    expect(secondsUntil(1000, 1000)).toBe(0);
  });

  it("returns 0 (never negative) when the end timestamp is in the past", () => {
    expect(secondsUntil(1000, 5000)).toBe(0);
  });

  it("computes whole seconds remaining from milliseconds", () => {
    expect(secondsUntil(10_000, 0)).toBe(10);
  });

  it("self-corrects after a long gap between ticks (simulating a throttled/backgrounded window)", () => {
    // Timer started with 25 minutes left; window is minimized for 19
    // real minutes before the next tick fires. The correct remaining
    // time is 6 minutes, not "however many ticks actually fired".
    const start = 0;
    const endTimestamp = start + 25 * 60 * 1000;
    const nowAfterBeingBackgrounded = start + 19 * 60 * 1000;
    expect(secondsUntil(endTimestamp, nowAfterBeingBackgrounded)).toBe(6 * 60);
  });
});
