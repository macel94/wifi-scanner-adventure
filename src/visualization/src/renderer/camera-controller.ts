import * as THREE from "three";
import type { OrientationData } from "../core/models";

const DEG_TO_RAD = Math.PI / 180;
const SMOOTHING = 0.08;

export class CameraController {
  private camera: THREE.PerspectiveCamera;
  private targetQuaternion = new THREE.Quaternion();
  private currentQuaternion = new THREE.Quaternion();
  private euler = new THREE.Euler(0, 0, 0, "YXZ");
  private orbitRadius = 0;
  private cameraHeight = 5;

  constructor(camera: THREE.PerspectiveCamera) {
    this.camera = camera;
    this.targetQuaternion.copy(camera.quaternion);
    this.currentQuaternion.copy(camera.quaternion);
  }

  updateFromOrientation(data: OrientationData): void {
    // Convert device orientation to camera rotation
    // alpha = compass heading (Y-axis rotation)
    // beta = front-back tilt (X-axis rotation)
    // gamma = left-right tilt (Z-axis rotation)
    const alpha = data.alpha * DEG_TO_RAD;
    const beta = data.beta * DEG_TO_RAD;
    const gamma = data.gamma * DEG_TO_RAD;

    // Set euler angles — YXZ order for natural FPS-like rotation
    this.euler.set(
      -beta,     // pitch (look up/down)
      -alpha,    // yaw (look left/right)
      gamma,     // roll
      "YXZ"
    );

    this.targetQuaternion.setFromEuler(this.euler);
  }

  update(deltaTime: number): void {
    // Smooth interpolation toward target orientation
    const t = 1.0 - Math.pow(1.0 - SMOOTHING, deltaTime * 60);
    this.currentQuaternion.slerp(this.targetQuaternion, t);
    this.camera.quaternion.copy(this.currentQuaternion);

    // Keep camera at origin (user is at center of the radar)
    this.camera.position.set(0, this.cameraHeight, this.orbitRadius);
  }
}
