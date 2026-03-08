import { SceneManager } from "./renderer/scene-manager";
import { SignalVisualizer } from "./renderer/signal-visualizer";
import { CameraController } from "./renderer/camera-controller";
import { AnimationLoop } from "./renderer/animation-loop";
import { ScanManager } from "./acquisition/scan-manager";
import { MockWifiProvider } from "./acquisition/mock-provider";
import { NativeBridgeProvider } from "./acquisition/bridge-provider";
import { SensorManager } from "./sensors/sensor-manager";
import { ControlsPanel } from "./ui/controls-panel";
import { MetricsPanel } from "./ui/metrics-panel";
import { DebugOverlay } from "./ui/debug-overlay";

class WifiScannerApp {
  private sceneManager!: SceneManager;
  private signalVisualizer!: SignalVisualizer;
  private cameraController!: CameraController;
  private animationLoop!: AnimationLoop;
  private scanManager!: ScanManager;
  private sensorManager!: SensorManager;
  private mockProvider!: MockWifiProvider;
  private bridgeProvider!: NativeBridgeProvider;

  async initialize(): Promise<void> {
    console.info("🛜 Wi-Fi Scanner Adventure — Initializing...");

    // Create renderer container
    const rendererContainer = document.getElementById("renderer-container");
    if (!rendererContainer) {
      throw new Error("Renderer container not found");
    }

    // Initialize acquisition
    this.mockProvider = new MockWifiProvider();
    this.bridgeProvider = new NativeBridgeProvider();
    this.scanManager = new ScanManager();
    this.scanManager.setProvider(this.mockProvider);

    // Initialize sensors
    this.sensorManager = new SensorManager();
    await this.sensorManager.initialize();

    // Initialize 3D renderer
    this.sceneManager = new SceneManager(rendererContainer);
    this.signalVisualizer = new SignalVisualizer(this.sceneManager.scene);
    this.cameraController = new CameraController(this.sceneManager.camera);
    this.animationLoop = new AnimationLoop(
      this.sceneManager,
      this.signalVisualizer,
      this.cameraController
    );

    // Wire data flow: scan -> visualization
    this.scanManager.onSnapshotUpdate((snapshot) => {
      this.signalVisualizer.updateSignals(snapshot);
    });

    // Wire sensor -> camera
    this.sensorManager.onOrientationUpdate((data) => {
      this.cameraController.updateFromOrientation(data);
    });

    // Initialize UI
    this.initializeUI();

    // Start render loop
    this.animationLoop.start();

    // Auto-start scanning with mock data
    this.scanManager.start();

    console.info("✅ Wi-Fi Scanner Adventure — Ready");
    console.info(`📡 Scan provider: ${this.scanManager.activeProvider?.providerName}`);
    console.info(`🧭 Sensor provider: ${this.sensorManager.activeProvider?.providerName}`);
  }

  private initializeUI(): void {
    const uiLayer = document.getElementById("ui-layer");
    if (!uiLayer) return;

    // Controls panel
    const controls = new ControlsPanel(
      this.scanManager,
      this.mockProvider,
      this.bridgeProvider
    );
    uiLayer.appendChild(controls.getElement());

    // Metrics panel
    const metrics = new MetricsPanel(this.scanManager);
    uiLayer.appendChild(metrics.getElement());

    // Debug overlay
    const debug = new DebugOverlay(
      this.sensorManager,
      this.animationLoop,
      this.signalVisualizer
    );
    uiLayer.appendChild(debug.getElement());

    // Debug toggle keyboard shortcut
    document.addEventListener("keydown", (e) => {
      if (e.key === "d" && e.ctrlKey) {
        e.preventDefault();
        debug.toggle();
      }
    });

    // Title bar
    const title = document.createElement("div");
    title.id = "app-title";
    title.innerHTML = `
      <h1>🛜 Wi-Fi Scanner</h1>
      <span class="subtitle">Immersive 3D Signal Radar</span>
      <span class="hint">Ctrl+D for debug overlay</span>
    `;
    uiLayer.appendChild(title);
  }
}

// Boot
const app = new WifiScannerApp();
app.initialize().catch((err) => {
  console.error("Failed to initialize Wi-Fi Scanner:", err);
  document.body.innerHTML = `
    <div style="color: #ff4444; padding: 2rem; font-family: monospace;">
      <h2>Initialization Error</h2>
      <p>${err instanceof Error ? err.message : String(err)}</p>
      <p>Please ensure WebGL is supported in your browser.</p>
    </div>
  `;
});
