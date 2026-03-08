import type { OrientationData } from "../core/models";
import { SensorState } from "../core/models";
import type { ISensorManager, IOrientationProvider } from "../core/interfaces";
import { EventEmitter } from "../core/interfaces";
import { DeviceOrientationProvider } from "./orientation-provider";
import { MouseOrientationProvider } from "./mouse-provider";

export class SensorManager implements ISensorManager {
  private _orientationState: SensorState = SensorState.Unavailable;
  private _currentOrientation: OrientationData = {
    alpha: 0,
    beta: 45,
    gamma: 0,
    absolute: false,
    timestamp: Date.now(),
  };
  private _activeProvider: IOrientationProvider | null = null;
  private orientationEmitter = new EventEmitter<OrientationData>();
  private deviceProvider: DeviceOrientationProvider;
  private mouseProvider: MouseOrientationProvider;

  get orientationState(): SensorState {
    return this._orientationState;
  }

  get currentOrientation(): OrientationData {
    return this._currentOrientation;
  }

  get activeProvider(): IOrientationProvider | null {
    return this._activeProvider;
  }

  constructor() {
    this.deviceProvider = new DeviceOrientationProvider();
    this.mouseProvider = new MouseOrientationProvider();
  }

  async initialize(): Promise<void> {
    // Try device orientation first (mobile)
    if (this.deviceProvider.isAvailable) {
      if (this.deviceProvider.requiresPermission) {
        this._orientationState = SensorState.PermissionRequired;
        const granted = await this.deviceProvider.requestPermission();
        if (granted) {
          this.activateProvider(this.deviceProvider);
          return;
        }
      } else {
        // Test if we actually get events (some desktops report available but never fire)
        const hasRealOrientation = await this.testOrientationEvents();
        if (hasRealOrientation) {
          this.activateProvider(this.deviceProvider);
          return;
        }
      }
    }

    // Fall back to mouse control
    this.activateProvider(this.mouseProvider);
    this._orientationState = SensorState.Fallback;
    console.info("Using mouse orientation fallback");
  }

  onOrientationUpdate(callback: (data: OrientationData) => void): void {
    this.orientationEmitter.on(callback);
  }

  private activateProvider(provider: IOrientationProvider): void {
    this._activeProvider?.stop();
    this._activeProvider = provider;
    provider.onOrientationChange((data) => {
      this._currentOrientation = data;
      this.orientationEmitter.emit(data);
    });
    provider.start();
    this._orientationState = provider === this.mouseProvider ? SensorState.Fallback : SensorState.Active;
  }

  private testOrientationEvents(): Promise<boolean> {
    return new Promise((resolve) => {
      let received = false;
      const handler = (event: DeviceOrientationEvent) => {
        if (event.alpha !== null || event.beta !== null || event.gamma !== null) {
          received = true;
        }
      };
      window.addEventListener("deviceorientation", handler, true);
      setTimeout(() => {
        window.removeEventListener("deviceorientation", handler, true);
        resolve(received);
      }, 500);
    });
  }
}
