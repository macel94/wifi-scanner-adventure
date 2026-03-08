import type { WifiScanResult, WifiAccessPoint } from "../core/models";
import { ProviderType } from "../core/models";
import type { IWifiScanProvider } from "../core/interfaces";
import { EventEmitter } from "../core/interfaces";

/**
 * Bridge provider that receives Wi-Fi scan data from a native host (e.g., MAUI WebView).
 * The native app posts messages to window with scan results in a known format.
 */
export class NativeBridgeProvider implements IWifiScanProvider {
  readonly providerName = "Native Bridge Provider";
  private _isAvailable = false;
  private scanResultEmitter = new EventEmitter<WifiScanResult>();
  private errorEmitter = new EventEmitter<Error>();
  private boundHandler: ((event: MessageEvent) => void) | null = null;

  get isAvailable(): boolean {
    return this._isAvailable;
  }

  constructor() {
    this._isAvailable = this.detectNativeBridge();
  }

  start(_intervalMs: number): void {
    if (this.boundHandler) return;

    this.boundHandler = (event: MessageEvent) => {
      this.handleNativeMessage(event);
    };
    window.addEventListener("message", this.boundHandler);

    // Signal the native host to start scanning
    this.postToNative({ type: "startScan", intervalMs: _intervalMs });
  }

  stop(): void {
    if (this.boundHandler) {
      window.removeEventListener("message", this.boundHandler);
      this.boundHandler = null;
    }
    this.postToNative({ type: "stopScan" });
  }

  onScanResult(callback: (result: WifiScanResult) => void): void {
    this.scanResultEmitter.on(callback);
  }

  onError(callback: (error: Error) => void): void {
    this.errorEmitter.on(callback);
  }

  private detectNativeBridge(): boolean {
    // Check for the presence of a native bridge object
    return typeof (window as unknown as Record<string, unknown>)["wifiScannerBridge"] !== "undefined";
  }

  private postToNative(message: Record<string, unknown>): void {
    try {
      const bridge = (window as unknown as Record<string, unknown>)["wifiScannerBridge"];
      if (bridge && typeof (bridge as Record<string, unknown>)["postMessage"] === "function") {
        (bridge as { postMessage: (msg: string) => void }).postMessage(JSON.stringify(message));
      }
    } catch (e) {
      console.warn("Native bridge communication failed:", e);
    }
  }

  private handleNativeMessage(event: MessageEvent): void {
    try {
      const data = typeof event.data === "string" ? JSON.parse(event.data) : event.data;
      if (data?.type !== "wifiScanResult") return;

      const accessPoints: WifiAccessPoint[] = (data.accessPoints || []).map(
        (ap: Record<string, unknown>) => ({
          ssid: String(ap["ssid"] ?? "<Hidden>"),
          bssid: String(ap["bssid"] ?? "00:00:00:00:00:00"),
          rssi: Number(ap["rssi"] ?? -100),
          frequency: Number(ap["frequency"] ?? 0),
          channel: Number(ap["channel"] ?? 0),
          band: String(ap["band"] ?? "unknown"),
          security: String(ap["security"] ?? "Unknown"),
          timestamp: Number(ap["timestamp"] ?? Date.now()),
        })
      );

      const result: WifiScanResult = {
        accessPoints,
        timestamp: Date.now(),
        providerType: ProviderType.Bridge,
        scanDurationMs: Number(data["scanDurationMs"] ?? 0),
      };

      this.scanResultEmitter.emit(result);
    } catch (e) {
      this.errorEmitter.emit(new Error(`Bridge message parse error: ${e}`));
    }
  }
}
