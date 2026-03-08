import type { WifiAccessPoint, WifiScanResult } from "../core/models";
import {
  WifiBand,
  ProviderType,
  frequencyToBand,
  frequencyToChannel,
} from "../core/models";
import type { IWifiScanProvider } from "../core/interfaces";
import { EventEmitter } from "../core/interfaces";

const MOCK_NETWORKS: Array<{
  ssid: string;
  bssid: string;
  baseRssi: number;
  frequency: number;
  security: string;
}> = [
  { ssid: "HomeNetwork-5G", bssid: "AA:BB:CC:DD:EE:01", baseRssi: -35, frequency: 5180, security: "WPA3" },
  { ssid: "HomeNetwork", bssid: "AA:BB:CC:DD:EE:02", baseRssi: -42, frequency: 2437, security: "WPA2" },
  { ssid: "Neighbor_WiFi", bssid: "11:22:33:44:55:01", baseRssi: -58, frequency: 2462, security: "WPA2" },
  { ssid: "CoffeeShop_Free", bssid: "11:22:33:44:55:02", baseRssi: -65, frequency: 2412, security: "Open" },
  { ssid: "Office-5GHz", bssid: "AA:CC:DD:EE:FF:01", baseRssi: -48, frequency: 5240, security: "WPA2-Enterprise" },
  { ssid: "IoT-Sensors", bssid: "AA:CC:DD:EE:FF:02", baseRssi: -72, frequency: 2422, security: "WPA2" },
  { ssid: "Guest-Network", bssid: "BB:CC:DD:EE:FF:03", baseRssi: -55, frequency: 5745, security: "WPA2" },
  { ssid: "SmartHome-Hub", bssid: "CC:DD:EE:FF:00:04", baseRssi: -61, frequency: 2447, security: "WPA3" },
  { ssid: "", bssid: "DD:EE:FF:00:11:05", baseRssi: -78, frequency: 2432, security: "WPA2" },
  { ssid: "DIRECT-printer", bssid: "EE:FF:00:11:22:06", baseRssi: -82, frequency: 2417, security: "WPA2" },
  { ssid: "Mesh-Node-2", bssid: "FF:00:11:22:33:07", baseRssi: -44, frequency: 5200, security: "WPA3" },
  { ssid: "Apt-304-WiFi", bssid: "00:11:22:33:44:08", baseRssi: -70, frequency: 2452, security: "WPA2" },
  { ssid: "FibreConnect", bssid: "11:33:55:77:99:09", baseRssi: -50, frequency: 5500, security: "WPA2" },
  { ssid: "Garage-AP", bssid: "22:44:66:88:AA:10", baseRssi: -85, frequency: 2427, security: "WEP" },
  { ssid: "SecurityCam-Net", bssid: "33:55:77:99:BB:11", baseRssi: -68, frequency: 2442, security: "WPA2" },
];

export class MockWifiProvider implements IWifiScanProvider {
  readonly providerName = "Mock Wi-Fi Provider";
  readonly isAvailable = true;

  private scanInterval: ReturnType<typeof setInterval> | null = null;
  private scanResultEmitter = new EventEmitter<WifiScanResult>();
  private errorEmitter = new EventEmitter<Error>();
  private networkVolatility = 0.15; // chance of a network appearing/disappearing

  start(intervalMs: number): void {
    if (this.scanInterval) return;
    this.performScan();
    this.scanInterval = setInterval(() => this.performScan(), intervalMs);
  }

  stop(): void {
    if (this.scanInterval) {
      clearInterval(this.scanInterval);
      this.scanInterval = null;
    }
  }

  onScanResult(callback: (result: WifiScanResult) => void): void {
    this.scanResultEmitter.on(callback);
  }

  onError(callback: (error: Error) => void): void {
    this.errorEmitter.on(callback);
  }

  private performScan(): void {
    const startTime = performance.now();

    const accessPoints: WifiAccessPoint[] = MOCK_NETWORKS
      .filter(() => Math.random() > this.networkVolatility)
      .map((net) => this.createAccessPoint(net));

    const scanDurationMs = performance.now() - startTime + Math.random() * 200;

    const result: WifiScanResult = {
      accessPoints,
      timestamp: Date.now(),
      providerType: ProviderType.Mock,
      scanDurationMs: Math.round(scanDurationMs),
    };

    this.scanResultEmitter.emit(result);
  }

  private createAccessPoint(net: (typeof MOCK_NETWORKS)[number]): WifiAccessPoint {
    const rssiJitter = (Math.random() - 0.5) * 12;
    const rssi = Math.max(-100, Math.min(-20, net.baseRssi + rssiJitter));
    const frequency = net.frequency;

    return {
      ssid: net.ssid || "<Hidden>",
      bssid: net.bssid,
      rssi: Math.round(rssi),
      frequency,
      channel: frequencyToChannel(frequency),
      band: frequencyToBand(frequency),
      security: net.security,
      timestamp: Date.now(),
    };
  }
}
