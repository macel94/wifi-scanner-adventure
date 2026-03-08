import { describe, it, expect } from "vitest";
import {
  normalizeRssi,
  rssiToQuality,
  frequencyToBand,
  frequencyToChannel,
  WifiBand,
} from "./models";

describe("normalizeRssi", () => {
  it("returns 1.0 for strong signals", () => {
    expect(normalizeRssi(-30)).toBe(1.0);
    expect(normalizeRssi(-20)).toBe(1.0);
  });

  it("returns 0.0 for very weak signals", () => {
    expect(normalizeRssi(-100)).toBe(0.0);
    expect(normalizeRssi(-110)).toBe(0.0);
  });

  it("returns 0.5 for mid-range signal", () => {
    expect(normalizeRssi(-65)).toBeCloseTo(0.5, 1);
  });

  it("clamps values to 0-1 range", () => {
    expect(normalizeRssi(-10)).toBe(1.0);
    expect(normalizeRssi(-150)).toBe(0.0);
  });
});

describe("rssiToQuality", () => {
  it("maps signal strength to quality labels", () => {
    expect(rssiToQuality(-40)).toBe("Excellent");
    expect(rssiToQuality(-55)).toBe("Good");
    expect(rssiToQuality(-65)).toBe("Fair");
    expect(rssiToQuality(-75)).toBe("Weak");
    expect(rssiToQuality(-90)).toBe("Very Weak");
  });
});

describe("frequencyToBand", () => {
  it("identifies 2.4 GHz band", () => {
    expect(frequencyToBand(2412)).toBe(WifiBand.Band2_4GHz);
    expect(frequencyToBand(2437)).toBe(WifiBand.Band2_4GHz);
    expect(frequencyToBand(2462)).toBe(WifiBand.Band2_4GHz);
  });

  it("identifies 5 GHz band", () => {
    expect(frequencyToBand(5180)).toBe(WifiBand.Band5GHz);
    expect(frequencyToBand(5240)).toBe(WifiBand.Band5GHz);
    expect(frequencyToBand(5745)).toBe(WifiBand.Band5GHz);
  });

  it("identifies 6 GHz band", () => {
    expect(frequencyToBand(5925)).toBe(WifiBand.Band6GHz);
    expect(frequencyToBand(6500)).toBe(WifiBand.Band6GHz);
  });

  it("returns unknown for out-of-range frequencies", () => {
    expect(frequencyToBand(900)).toBe(WifiBand.Unknown);
    expect(frequencyToBand(0)).toBe(WifiBand.Unknown);
  });
});

describe("frequencyToChannel", () => {
  it("converts 2.4 GHz frequencies to channels", () => {
    expect(frequencyToChannel(2412)).toBe(1);
    expect(frequencyToChannel(2437)).toBe(6);
    expect(frequencyToChannel(2462)).toBe(11);
    expect(frequencyToChannel(2484)).toBe(14);
  });

  it("converts 5 GHz frequencies to channels", () => {
    expect(frequencyToChannel(5180)).toBe(36);
    expect(frequencyToChannel(5240)).toBe(48);
    expect(frequencyToChannel(5745)).toBe(149);
  });
});
