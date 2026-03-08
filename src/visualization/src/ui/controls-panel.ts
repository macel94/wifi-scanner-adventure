import type { ScanManager } from "../acquisition/scan-manager";
import type { MockWifiProvider } from "../acquisition/mock-provider";
import type { NativeBridgeProvider } from "../acquisition/bridge-provider";
import { ScanState } from "../core/models";

export class ControlsPanel {
  private container: HTMLElement;
  private scanManager: ScanManager;
  private mockProvider: MockWifiProvider;
  private bridgeProvider: NativeBridgeProvider;
  private scanButton!: HTMLButtonElement;
  private providerToggle!: HTMLButtonElement;
  private statusIndicator!: HTMLElement;
  private usingMock = true;

  constructor(
    scanManager: ScanManager,
    mockProvider: MockWifiProvider,
    bridgeProvider: NativeBridgeProvider
  ) {
    this.scanManager = scanManager;
    this.mockProvider = mockProvider;
    this.bridgeProvider = bridgeProvider;
    this.container = this.createPanel();
    this.bindEvents();
  }

  getElement(): HTMLElement {
    return this.container;
  }

  private createPanel(): HTMLElement {
    const panel = document.createElement("div");
    panel.id = "controls-panel";
    panel.innerHTML = `
      <div class="panel-section">
        <div class="status-row">
          <span class="status-dot" id="scan-status-dot"></span>
          <span class="status-text" id="scan-status-text">Idle</span>
        </div>
        <div class="button-row">
          <button class="ctrl-btn primary" id="scan-toggle-btn">
            <span class="btn-icon">▶</span> Start Scan
          </button>
          <button class="ctrl-btn secondary" id="provider-toggle-btn">
            📡 Mock Data
          </button>
        </div>
      </div>
    `;

    this.scanButton = panel.querySelector("#scan-toggle-btn")!;
    this.providerToggle = panel.querySelector("#provider-toggle-btn")!;
    this.statusIndicator = panel.querySelector("#scan-status-dot")!;

    return panel;
  }

  private bindEvents(): void {
    this.scanButton.addEventListener("click", () => this.toggleScan());
    this.providerToggle.addEventListener("click", () => this.toggleProvider());

    this.scanManager.onStateChange((state) => this.updateState(state));
  }

  private toggleScan(): void {
    if (this.scanManager.state === ScanState.Scanning) {
      this.scanManager.stop();
      this.scanButton.innerHTML = '<span class="btn-icon">▶</span> Start Scan';
      this.scanButton.classList.remove("active");
    } else {
      if (!this.scanManager.activeProvider) {
        this.scanManager.setProvider(this.mockProvider);
      }
      this.scanManager.start();
      this.scanButton.innerHTML = '<span class="btn-icon">⏸</span> Stop Scan';
      this.scanButton.classList.add("active");
    }
  }

  private toggleProvider(): void {
    const wasScanning = this.scanManager.state === ScanState.Scanning;
    if (wasScanning) this.scanManager.stop();

    this.usingMock = !this.usingMock;

    if (this.usingMock) {
      this.scanManager.setProvider(this.mockProvider);
      this.providerToggle.textContent = "📡 Mock Data";
      this.providerToggle.classList.remove("native");
    } else {
      if (this.bridgeProvider.isAvailable) {
        this.scanManager.setProvider(this.bridgeProvider);
        this.providerToggle.textContent = "📶 Native Data";
        this.providerToggle.classList.add("native");
      } else {
        this.usingMock = true;
        this.providerToggle.textContent = "📡 Mock (Native N/A)";
        console.warn("Native bridge not available, staying on mock");
      }
    }

    if (wasScanning) this.scanManager.start();
  }

  private updateState(state: ScanState): void {
    const dot = this.statusIndicator;
    const text = this.container.querySelector("#scan-status-text")!;

    switch (state) {
      case ScanState.Scanning:
        dot.className = "status-dot active";
        text.textContent = "Scanning";
        break;
      case ScanState.Idle:
        dot.className = "status-dot idle";
        text.textContent = "Idle";
        break;
      case ScanState.Error:
        dot.className = "status-dot error";
        text.textContent = "Error";
        break;
      case ScanState.Paused:
        dot.className = "status-dot paused";
        text.textContent = "Paused";
        break;
    }
  }
}
