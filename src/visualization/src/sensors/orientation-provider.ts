import type { OrientationData } from "../core/models";
import type { IOrientationProvider } from "../core/interfaces";
import { EventEmitter } from "../core/interfaces";

export class DeviceOrientationProvider implements IOrientationProvider {
  readonly providerName = "Device Orientation (Gyroscope)";
  private _isAvailable = false;
  private _requiresPermission = false;
  private orientationEmitter = new EventEmitter<OrientationData>();
  private boundHandler: ((event: DeviceOrientationEvent) => void) | null = null;

  get isAvailable(): boolean {
    return this._isAvailable;
  }

  get requiresPermission(): boolean {
    return this._requiresPermission;
  }

  constructor() {
    this._isAvailable = typeof DeviceOrientationEvent !== "undefined";
    // iOS 13+ requires permission request
    this._requiresPermission =
      typeof (DeviceOrientationEvent as unknown as Record<string, unknown>)[
        "requestPermission"
      ] === "function";
  }

  async requestPermission(): Promise<boolean> {
    if (!this._requiresPermission) return true;

    try {
      const requestFn = (
        DeviceOrientationEvent as unknown as {
          requestPermission: () => Promise<string>;
        }
      ).requestPermission;
      const result = await requestFn();
      return result === "granted";
    } catch (e) {
      console.warn("DeviceOrientation permission denied:", e);
      return false;
    }
  }

  start(): void {
    if (this.boundHandler) return;

    this.boundHandler = (event: DeviceOrientationEvent) => {
      const data: OrientationData = {
        alpha: event.alpha ?? 0,
        beta: event.beta ?? 0,
        gamma: event.gamma ?? 0,
        absolute: event.absolute,
        timestamp: Date.now(),
      };
      this.orientationEmitter.emit(data);
    };

    window.addEventListener("deviceorientation", this.boundHandler, true);
  }

  stop(): void {
    if (this.boundHandler) {
      window.removeEventListener("deviceorientation", this.boundHandler, true);
      this.boundHandler = null;
    }
  }

  onOrientationChange(callback: (data: OrientationData) => void): void {
    this.orientationEmitter.on(callback);
  }
}
