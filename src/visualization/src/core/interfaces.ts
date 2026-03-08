import type {
  WifiScanResult,
  OrientationData,
  SignalSnapshot,
  ScanState,
  SensorState,
} from "./models";

export interface IWifiScanProvider {
  readonly providerName: string;
  readonly isAvailable: boolean;
  start(intervalMs: number): void;
  stop(): void;
  onScanResult(callback: (result: WifiScanResult) => void): void;
  onError(callback: (error: Error) => void): void;
}

export interface IOrientationProvider {
  readonly providerName: string;
  readonly isAvailable: boolean;
  readonly requiresPermission: boolean;
  requestPermission(): Promise<boolean>;
  start(): void;
  stop(): void;
  onOrientationChange(callback: (data: OrientationData) => void): void;
}

export interface IScanManager {
  readonly state: ScanState;
  readonly currentSnapshot: SignalSnapshot;
  readonly activeProvider: IWifiScanProvider | null;
  setProvider(provider: IWifiScanProvider): void;
  start(): void;
  stop(): void;
  onSnapshotUpdate(callback: (snapshot: SignalSnapshot) => void): void;
  onStateChange(callback: (state: ScanState) => void): void;
}

export interface ISensorManager {
  readonly orientationState: SensorState;
  readonly currentOrientation: OrientationData;
  readonly activeProvider: IOrientationProvider | null;
  initialize(): Promise<void>;
  onOrientationUpdate(callback: (data: OrientationData) => void): void;
}

export interface IVisualizationEngine {
  initialize(container: HTMLElement): void;
  updateSignals(snapshot: SignalSnapshot): void;
  updateOrientation(data: OrientationData): void;
  setAnimating(active: boolean): void;
  dispose(): void;
}

export type EventCallback<T> = (data: T) => void;

export class EventEmitter<T> {
  private listeners: EventCallback<T>[] = [];

  on(callback: EventCallback<T>): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== callback);
    };
  }

  emit(data: T): void {
    for (const listener of this.listeners) {
      try {
        listener(data);
      } catch (e) {
        console.error("Event listener error:", e);
      }
    }
  }

  clear(): void {
    this.listeners = [];
  }
}
