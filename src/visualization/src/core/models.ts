export interface WifiAccessPoint {
  readonly ssid: string;
  readonly bssid: string;
  readonly rssi: number; // dBm, typically -30 to -100
  readonly frequency: number; // MHz
  readonly channel: number;
  readonly band: WifiBand;
  readonly security: string;
  readonly timestamp: number; // Unix ms
}

export interface WifiScanResult {
  readonly accessPoints: ReadonlyArray<WifiAccessPoint>;
  readonly timestamp: number;
  readonly providerType: ProviderType;
  readonly scanDurationMs: number;
}

export interface SignalSnapshot {
  readonly accessPoints: Map<string, WifiAccessPoint>; // keyed by BSSID
  readonly timestamp: number;
  readonly count: number;
}

export interface OrientationData {
  readonly alpha: number; // compass heading (0-360)
  readonly beta: number; // front-back tilt (-180 to 180)
  readonly gamma: number; // left-right tilt (-90 to 90)
  readonly absolute: boolean;
  readonly timestamp: number;
}

export interface VisualNode {
  readonly id: string;
  readonly accessPoint: WifiAccessPoint;
  targetPosition: { x: number; y: number; z: number };
  currentPosition: { x: number; y: number; z: number };
  normalizedSignal: number; // 0.0 to 1.0
  age: number; // ms since last seen
  visible: boolean;
}

export enum WifiBand {
  Band2_4GHz = "2.4GHz",
  Band5GHz = "5GHz",
  Band6GHz = "6GHz",
  Unknown = "unknown",
}

export enum ProviderType {
  Mock = "mock",
  Native = "native",
  Bridge = "bridge",
}

export enum ScanState {
  Idle = "idle",
  Scanning = "scanning",
  Paused = "paused",
  Error = "error",
}

export enum SensorState {
  Unavailable = "unavailable",
  PermissionRequired = "permission_required",
  Active = "active",
  Fallback = "fallback",
}

export function frequencyToBand(frequencyMhz: number): WifiBand {
  if (frequencyMhz >= 2400 && frequencyMhz <= 2500) return WifiBand.Band2_4GHz;
  if (frequencyMhz >= 5150 && frequencyMhz <= 5875) return WifiBand.Band5GHz;
  if (frequencyMhz >= 5925 && frequencyMhz <= 7125) return WifiBand.Band6GHz;
  return WifiBand.Unknown;
}

export function frequencyToChannel(frequencyMhz: number): number {
  if (frequencyMhz >= 2412 && frequencyMhz <= 2484) {
    if (frequencyMhz === 2484) return 14;
    return Math.round((frequencyMhz - 2407) / 5);
  }
  if (frequencyMhz >= 5170 && frequencyMhz <= 5825) {
    return Math.round((frequencyMhz - 5000) / 5);
  }
  return 0;
}

export function normalizeRssi(rssi: number): number {
  const MIN_RSSI = -100;
  const MAX_RSSI = -30;
  return Math.max(0, Math.min(1, (rssi - MIN_RSSI) / (MAX_RSSI - MIN_RSSI)));
}

export function rssiToQuality(rssi: number): string {
  if (rssi >= -50) return "Excellent";
  if (rssi >= -60) return "Good";
  if (rssi >= -70) return "Fair";
  if (rssi >= -80) return "Weak";
  return "Very Weak";
}
