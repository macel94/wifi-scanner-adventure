import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { MockWifiProvider } from "./mock-provider";
import type { WifiScanResult } from "../core/models";
import { ProviderType } from "../core/models";

describe("MockWifiProvider", () => {
  let provider: MockWifiProvider;

  beforeEach(() => {
    vi.useFakeTimers();
    provider = new MockWifiProvider();
  });

  afterEach(() => {
    provider.stop();
    vi.useRealTimers();
  });

  it("is always available", () => {
    expect(provider.isAvailable).toBe(true);
    expect(provider.providerName).toBe("Mock Wi-Fi Provider");
  });

  it("emits scan results on start", () => {
    const results: WifiScanResult[] = [];
    provider.onScanResult((r) => results.push(r));

    provider.start(3000);

    // First result is emitted immediately
    expect(results.length).toBe(1);
    expect(results[0].providerType).toBe(ProviderType.Mock);
    expect(results[0].accessPoints.length).toBeGreaterThan(0);
  });

  it("emits periodic results at the specified interval", () => {
    const results: WifiScanResult[] = [];
    provider.onScanResult((r) => results.push(r));

    provider.start(1000);
    expect(results.length).toBe(1);

    vi.advanceTimersByTime(1000);
    expect(results.length).toBe(2);

    vi.advanceTimersByTime(1000);
    expect(results.length).toBe(3);
  });

  it("stops emitting after stop", () => {
    const results: WifiScanResult[] = [];
    provider.onScanResult((r) => results.push(r));

    provider.start(1000);
    expect(results.length).toBe(1);

    provider.stop();
    vi.advanceTimersByTime(5000);
    expect(results.length).toBe(1);
  });

  it("produces valid access point data", () => {
    const results: WifiScanResult[] = [];
    provider.onScanResult((r) => results.push(r));

    provider.start(1000);

    const ap = results[0].accessPoints[0];
    expect(ap.bssid).toMatch(/^[0-9A-Fa-f]{2}(:[0-9A-Fa-f]{2}){5}$/);
    expect(ap.rssi).toBeGreaterThanOrEqual(-100);
    expect(ap.rssi).toBeLessThanOrEqual(-20);
    expect(ap.frequency).toBeGreaterThan(0);
    expect(ap.channel).toBeGreaterThan(0);
    expect(ap.timestamp).toBeGreaterThan(0);
  });
});
