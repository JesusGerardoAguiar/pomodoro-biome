import { describe, it, expect } from "vitest";
import { getStageInfo, STAGE_INFO } from "./biome-visuals";

describe("getStageInfo", () => {
  it("has exactly 7 stages", () => {
    expect(STAGE_INFO).toHaveLength(7);
  });

  it("returns the seed stage for 0", () => {
    expect(getStageInfo(0).name).toBe("Seed");
  });

  it("returns the thriving ecosystem stage for 6", () => {
    expect(getStageInfo(6).name).toBe("Thriving Ecosystem");
  });

  it("clamps out-of-range stages to the last stage", () => {
    expect(getStageInfo(99).name).toBe("Thriving Ecosystem");
  });
});
