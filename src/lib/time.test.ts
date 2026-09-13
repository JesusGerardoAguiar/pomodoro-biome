import { describe, it, expect } from "vitest";
import { formatTime } from "./time";

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
