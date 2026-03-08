import type { SensorManager } from "../sensors/sensor-manager";
import type { AnimationLoop } from "../renderer/animation-loop";
import type { SignalVisualizer } from "../renderer/signal-visualizer";

export class DebugOverlay {
  private container: HTMLElement;
  private sensorManager: SensorManager;
  private animationLoop: AnimationLoop;
  private signalVisualizer: SignalVisualizer;
  private visible = false;
  private updateInterval: ReturnType<typeof setInterval> | null = null;

  constructor(
    sensorManager: SensorManager,
    animationLoop: AnimationLoop,
    signalVisualizer: SignalVisualizer
  ) {
    this.sensorManager = sensorManager;
    this.animationLoop = animationLoop;
    this.signalVisualizer = signalVisualizer;
    this.container = this.createOverlay();
  }

  getElement(): HTMLElement {
    return this.container;
  }

  toggle(): void {
    this.visible = !this.visible;
    this.container.style.display = this.visible ? "block" : "none";
    if (this.visible) {
      this.startUpdating();
    } else {
      this.stopUpdating();
    }
  }

  private createOverlay(): HTMLElement {
    const overlay = document.createElement("div");
    overlay.id = "debug-overlay";
    overlay.style.display = "none";
    overlay.innerHTML = `
      <div class="debug-content">
        <h4>🔧 Debug</h4>
        <div id="debug-fps">FPS: —</div>
        <div id="debug-nodes">Nodes: —</div>
        <div id="debug-sensor-state">Sensor: —</div>
        <div id="debug-alpha">α: —</div>
        <div id="debug-beta">β: —</div>
        <div id="debug-gamma">γ: —</div>
        <div id="debug-provider">Provider: —</div>
      </div>
    `;
    return overlay;
  }

  private startUpdating(): void {
    this.updateInterval = setInterval(() => this.update(), 200);
  }

  private stopUpdating(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  private update(): void {
    const orientation = this.sensorManager.currentOrientation;
    this.setText("debug-fps", `FPS: ${this.animationLoop.fps}`);
    this.setText("debug-nodes", `Nodes: ${this.signalVisualizer.nodeCount}`);
    this.setText("debug-sensor-state", `Sensor: ${this.sensorManager.orientationState}`);
    this.setText("debug-alpha", `α: ${orientation.alpha.toFixed(1)}°`);
    this.setText("debug-beta", `β: ${orientation.beta.toFixed(1)}°`);
    this.setText("debug-gamma", `γ: ${orientation.gamma.toFixed(1)}°`);
    this.setText(
      "debug-provider",
      `Provider: ${this.sensorManager.activeProvider?.providerName ?? "none"}`
    );
  }

  private setText(id: string, value: string): void {
    const el = this.container.querySelector(`#${id}`);
    if (el) el.textContent = value;
  }
}
