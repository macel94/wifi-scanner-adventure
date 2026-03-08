import type { SceneManager } from "./scene-manager";
import type { SignalVisualizer } from "./signal-visualizer";
import type { CameraController } from "./camera-controller";

export class AnimationLoop {
  private sceneManager: SceneManager;
  private signalVisualizer: SignalVisualizer;
  private cameraController: CameraController;
  private animationFrameId: number | null = null;
  private lastFrameTime = 0;
  private _isRunning = false;
  private _fps = 0;
  private frameCount = 0;
  private fpsUpdateTime = 0;

  get isRunning(): boolean {
    return this._isRunning;
  }

  get fps(): number {
    return this._fps;
  }

  constructor(
    sceneManager: SceneManager,
    signalVisualizer: SignalVisualizer,
    cameraController: CameraController
  ) {
    this.sceneManager = sceneManager;
    this.signalVisualizer = signalVisualizer;
    this.cameraController = cameraController;
  }

  start(): void {
    if (this._isRunning) return;
    this._isRunning = true;
    this.lastFrameTime = performance.now();
    this.fpsUpdateTime = this.lastFrameTime;
    this.tick();
  }

  stop(): void {
    this._isRunning = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  private tick = (): void => {
    if (!this._isRunning) return;

    const now = performance.now();
    const deltaTime = Math.min((now - this.lastFrameTime) / 1000, 0.1); // cap at 100ms
    this.lastFrameTime = now;

    // FPS calculation
    this.frameCount++;
    if (now - this.fpsUpdateTime >= 1000) {
      this._fps = this.frameCount;
      this.frameCount = 0;
      this.fpsUpdateTime = now;
    }

    // Update systems
    this.cameraController.update(deltaTime);
    this.signalVisualizer.animate(deltaTime);

    // Render
    this.sceneManager.render();

    this.animationFrameId = requestAnimationFrame(this.tick);
  };
}
