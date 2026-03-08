import type { ScanManager } from "../acquisition/scan-manager";
import type { SignalSnapshot } from "../core/models";
import { normalizeRssi, rssiToQuality } from "../core/models";

export class MetricsPanel {
  private container: HTMLElement;
  private scanManager: ScanManager;

  constructor(scanManager: ScanManager) {
    this.scanManager = scanManager;
    this.container = this.createPanel();
    this.bindEvents();
  }

  getElement(): HTMLElement {
    return this.container;
  }

  private createPanel(): HTMLElement {
    const panel = document.createElement("div");
    panel.id = "metrics-panel";
    panel.innerHTML = `
      <div class="panel-section">
        <h3 class="panel-title">📊 Live Metrics</h3>
        <div class="metrics-grid">
          <div class="metric">
            <span class="metric-label">Networks</span>
            <span class="metric-value" id="metric-count">0</span>
          </div>
          <div class="metric">
            <span class="metric-label">Strongest</span>
            <span class="metric-value" id="metric-strongest">—</span>
          </div>
          <div class="metric">
            <span class="metric-label">Best RSSI</span>
            <span class="metric-value" id="metric-best-rssi">—</span>
          </div>
          <div class="metric">
            <span class="metric-label">2.4 GHz</span>
            <span class="metric-value" id="metric-2g">0</span>
          </div>
          <div class="metric">
            <span class="metric-label">5 GHz</span>
            <span class="metric-value" id="metric-5g">0</span>
          </div>
          <div class="metric">
            <span class="metric-label">Quality</span>
            <span class="metric-value" id="metric-quality">—</span>
          </div>
        </div>
        <div class="signal-bars" id="signal-bars"></div>
      </div>
    `;
    return panel;
  }

  private bindEvents(): void {
    this.scanManager.onSnapshotUpdate((snapshot) => this.updateMetrics(snapshot));
  }

  private updateMetrics(snapshot: SignalSnapshot): void {
    const count = snapshot.accessPoints.size;
    const aps = Array.from(snapshot.accessPoints.values());

    this.setText("metric-count", String(count));

    if (count > 0) {
      const sorted = [...aps].sort((a, b) => b.rssi - a.rssi);
      const strongest = sorted[0];

      this.setText("metric-strongest", strongest.ssid || strongest.bssid.substring(0, 8));
      this.setText("metric-best-rssi", `${strongest.rssi} dBm`);
      this.setText("metric-quality", rssiToQuality(strongest.rssi));

      const band2g = aps.filter((ap) => ap.frequency < 3000).length;
      const band5g = aps.filter((ap) => ap.frequency >= 5000 && ap.frequency < 6000).length;
      this.setText("metric-2g", String(band2g));
      this.setText("metric-5g", String(band5g));

      this.updateSignalBars(sorted.slice(0, 8));
    } else {
      this.setText("metric-strongest", "—");
      this.setText("metric-best-rssi", "—");
      this.setText("metric-quality", "—");
      this.setText("metric-2g", "0");
      this.setText("metric-5g", "0");
    }
  }

  private updateSignalBars(
    topAps: Array<{ ssid: string; rssi: number; bssid: string }>
  ): void {
    const container = this.container.querySelector("#signal-bars")!;
    container.innerHTML = topAps
      .map((ap) => {
        const norm = normalizeRssi(ap.rssi);
        const width = Math.max(5, norm * 100);
        const hue = norm * 120; // 0=red, 120=green
        const name = ap.ssid || ap.bssid.substring(0, 8);
        return `
          <div class="signal-bar-row">
            <span class="signal-bar-name">${this.escapeHtml(name)}</span>
            <div class="signal-bar-track">
              <div class="signal-bar-fill" style="width:${width}%;background:hsl(${hue},80%,50%)"></div>
            </div>
            <span class="signal-bar-rssi">${ap.rssi}</span>
          </div>
        `;
      })
      .join("");
  }

  private setText(id: string, value: string): void {
    const el = this.container.querySelector(`#${id}`);
    if (el) el.textContent = value;
  }

  private escapeHtml(text: string): string {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }
}
