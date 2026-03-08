import type { OrientationData } from "../core/models";
import type { IOrientationProvider } from "../core/interfaces";
import { EventEmitter } from "../core/interfaces";

export class MouseOrientationProvider implements IOrientationProvider {
  readonly providerName = "Mouse Orbit (Desktop Fallback)";
  readonly isAvailable = true;
  readonly requiresPermission = false;

  private orientationEmitter = new EventEmitter<OrientationData>();
  private isDragging = false;
  private alpha = 0; // horizontal rotation
  private beta = 45; // vertical angle
  private targetElement: HTMLElement | null = null;
  private sensitivity = 0.3;
  private boundMouseDown: ((e: MouseEvent) => void) | null = null;
  private boundMouseMove: ((e: MouseEvent) => void) | null = null;
  private boundMouseUp: (() => void) | null = null;
  private boundTouchStart: ((e: TouchEvent) => void) | null = null;
  private boundTouchMove: ((e: TouchEvent) => void) | null = null;
  private boundTouchEnd: (() => void) | null = null;
  private lastTouchX = 0;
  private lastTouchY = 0;

  async requestPermission(): Promise<boolean> {
    return true;
  }

  start(): void {
    this.targetElement = document.getElementById("renderer-container") ?? document.body;

    this.boundMouseDown = (e: MouseEvent) => {
      if (e.button === 0) this.isDragging = true;
    };
    this.boundMouseMove = (e: MouseEvent) => {
      if (!this.isDragging) return;
      this.alpha = (this.alpha + e.movementX * this.sensitivity) % 360;
      this.beta = Math.max(-89, Math.min(89, this.beta - e.movementY * this.sensitivity));
      this.emitOrientation();
    };
    this.boundMouseUp = () => {
      this.isDragging = false;
    };

    this.boundTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        this.isDragging = true;
        this.lastTouchX = e.touches[0].clientX;
        this.lastTouchY = e.touches[0].clientY;
      }
    };
    this.boundTouchMove = (e: TouchEvent) => {
      if (!this.isDragging || e.touches.length !== 1) return;
      const dx = e.touches[0].clientX - this.lastTouchX;
      const dy = e.touches[0].clientY - this.lastTouchY;
      this.lastTouchX = e.touches[0].clientX;
      this.lastTouchY = e.touches[0].clientY;
      this.alpha = (this.alpha + dx * this.sensitivity) % 360;
      this.beta = Math.max(-89, Math.min(89, this.beta - dy * this.sensitivity));
      this.emitOrientation();
    };
    this.boundTouchEnd = () => {
      this.isDragging = false;
    };

    this.targetElement.addEventListener("mousedown", this.boundMouseDown);
    window.addEventListener("mousemove", this.boundMouseMove);
    window.addEventListener("mouseup", this.boundMouseUp);
    this.targetElement.addEventListener("touchstart", this.boundTouchStart, { passive: true });
    window.addEventListener("touchmove", this.boundTouchMove, { passive: true });
    window.addEventListener("touchend", this.boundTouchEnd);

    // Emit initial orientation
    this.emitOrientation();
  }

  stop(): void {
    if (this.targetElement && this.boundMouseDown) {
      this.targetElement.removeEventListener("mousedown", this.boundMouseDown);
    }
    if (this.boundMouseMove) window.removeEventListener("mousemove", this.boundMouseMove);
    if (this.boundMouseUp) window.removeEventListener("mouseup", this.boundMouseUp);
    if (this.targetElement && this.boundTouchStart) {
      this.targetElement.removeEventListener("touchstart", this.boundTouchStart);
    }
    if (this.boundTouchMove) window.removeEventListener("touchmove", this.boundTouchMove);
    if (this.boundTouchEnd) window.removeEventListener("touchend", this.boundTouchEnd);
  }

  onOrientationChange(callback: (data: OrientationData) => void): void {
    this.orientationEmitter.on(callback);
  }

  private emitOrientation(): void {
    const data: OrientationData = {
      alpha: ((this.alpha % 360) + 360) % 360,
      beta: this.beta,
      gamma: 0,
      absolute: false,
      timestamp: Date.now(),
    };
    this.orientationEmitter.emit(data);
  }
}
