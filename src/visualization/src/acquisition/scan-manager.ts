import type {
  WifiScanResult,
  SignalSnapshot,
  WifiAccessPoint,
} from "../core/models";
import { ScanState } from "../core/models";
import type { IWifiScanProvider, IScanManager } from "../core/interfaces";
import { EventEmitter } from "../core/interfaces";
import { normalizeRssi } from "../core/models";

const DEFAULT_SCAN_INTERVAL_MS = 3000;
const SIGNAL_EXPIRY_MS = 15000;
const RSSI_SMOOTHING_FACTOR = 0.3;

export class ScanManager implements IScanManager {
  private _state: ScanState = ScanState.Idle;
  private _provider: IWifiScanProvider | null = null;
  private _snapshot: SignalSnapshot = {
    accessPoints: new Map(),
    timestamp: Date.now(),
    count: 0,
  };
  private smoothedRssi = new Map<string, number>();
  private snapshotEmitter = new EventEmitter<SignalSnapshot>();
  private stateEmitter = new EventEmitter<ScanState>();
  private cleanupInterval: ReturnType<typeof setInterval> | null = null;

  get state(): ScanState {
    return this._state;
  }

  get currentSnapshot(): SignalSnapshot {
    return this._snapshot;
  }

  get activeProvider(): IWifiScanProvider | null {
    return this._provider;
  }

  setProvider(provider: IWifiScanProvider): void {
    const wasScanning = this._state === ScanState.Scanning;
    if (wasScanning) this.stop();

    this._provider = provider;
    provider.onScanResult((result) => this.handleScanResult(result));
    provider.onError((error) => this.handleError(error));

    if (wasScanning) this.start();
  }

  start(): void {
    if (!this._provider) {
      console.error("No scan provider set");
      return;
    }
    this._provider.start(DEFAULT_SCAN_INTERVAL_MS);
    this.cleanupInterval = setInterval(
      () => this.purgeExpiredSignals(),
      SIGNAL_EXPIRY_MS
    );
    this.setState(ScanState.Scanning);
  }

  stop(): void {
    this._provider?.stop();
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.setState(ScanState.Idle);
  }

  onSnapshotUpdate(callback: (snapshot: SignalSnapshot) => void): void {
    this.snapshotEmitter.on(callback);
  }

  onStateChange(callback: (state: ScanState) => void): void {
    this.stateEmitter.on(callback);
  }

  private handleScanResult(result: WifiScanResult): void {
    const updatedMap = new Map(this._snapshot.accessPoints);

    for (const ap of result.accessPoints) {
      const smoothed = this.smoothRssi(ap.bssid, ap.rssi);
      updatedMap.set(ap.bssid, { ...ap, rssi: smoothed });
    }

    this._snapshot = {
      accessPoints: updatedMap,
      timestamp: Date.now(),
      count: updatedMap.size,
    };

    this.snapshotEmitter.emit(this._snapshot);
  }

  private smoothRssi(bssid: string, newRssi: number): number {
    const previous = this.smoothedRssi.get(bssid);
    if (previous === undefined) {
      this.smoothedRssi.set(bssid, newRssi);
      return newRssi;
    }
    const smoothed =
      previous * (1 - RSSI_SMOOTHING_FACTOR) + newRssi * RSSI_SMOOTHING_FACTOR;
    this.smoothedRssi.set(bssid, smoothed);
    return Math.round(smoothed);
  }

  private purgeExpiredSignals(): void {
    const now = Date.now();
    const updatedMap = new Map<string, WifiAccessPoint>();

    for (const [bssid, ap] of this._snapshot.accessPoints) {
      if (now - ap.timestamp < SIGNAL_EXPIRY_MS) {
        updatedMap.set(bssid, ap);
      } else {
        this.smoothedRssi.delete(bssid);
      }
    }

    if (updatedMap.size !== this._snapshot.accessPoints.size) {
      this._snapshot = {
        accessPoints: updatedMap,
        timestamp: now,
        count: updatedMap.size,
      };
      this.snapshotEmitter.emit(this._snapshot);
    }
  }

  private handleError(error: Error): void {
    console.error("Scan error:", error);
    this.setState(ScanState.Error);
  }

  private setState(state: ScanState): void {
    this._state = state;
    this.stateEmitter.emit(state);
  }
}
