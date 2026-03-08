import * as THREE from "three";
import type { SignalSnapshot, WifiAccessPoint, VisualNode } from "../core/models";
import { normalizeRssi, WifiBand } from "../core/models";

const POSITION_SMOOTHING = 0.05;
const SCALE_SMOOTHING = 0.08;
const MAX_VISUAL_DISTANCE = 75;
const MIN_VISUAL_DISTANCE = 8;
const NODE_FADE_DURATION = 2000;

// Signal strength to orbital distance: stronger = closer
function rssiToDistance(rssi: number): number {
  const normalized = normalizeRssi(rssi);
  return MIN_VISUAL_DISTANCE + (1 - normalized) * (MAX_VISUAL_DISTANCE - MIN_VISUAL_DISTANCE);
}

// Deterministic angle from BSSID hash — stable position for each AP
function bssidToAngle(bssid: string): number {
  let hash = 0;
  for (let i = 0; i < bssid.length; i++) {
    hash = (hash << 5) - hash + bssid.charCodeAt(i);
    hash = hash & hash;
  }
  return ((hash % 360) + 360) % 360;
}

// Vertical offset based on frequency band
function bandToHeight(band: WifiBand): number {
  switch (band) {
    case WifiBand.Band2_4GHz: return 0;
    case WifiBand.Band5GHz: return 3;
    case WifiBand.Band6GHz: return 6;
    default: return 1;
  }
}

// Signal quality to color
function signalToColor(normalized: number): THREE.Color {
  // Green (strong) -> Yellow -> Orange -> Red (weak)
  const r = normalized < 0.5 ? 1.0 : 2.0 * (1.0 - normalized);
  const g = normalized > 0.5 ? 1.0 : 2.0 * normalized;
  return new THREE.Color(r, g, 0.1);
}

export class SignalVisualizer {
  private parentScene: THREE.Scene;
  private signalGroup: THREE.Group;
  private nodes = new Map<string, NodeVisual>();
  private time = 0;

  constructor(scene: THREE.Scene) {
    this.parentScene = scene;
    this.signalGroup = new THREE.Group();
    this.signalGroup.name = "signal-nodes";
    this.parentScene.add(this.signalGroup);
  }

  updateSignals(snapshot: SignalSnapshot): void {
    const activeBssids = new Set<string>();

    for (const [bssid, ap] of snapshot.accessPoints) {
      activeBssids.add(bssid);

      let nodeVisual = this.nodes.get(bssid);
      if (!nodeVisual) {
        nodeVisual = this.createNodeVisual(ap);
        this.nodes.set(bssid, nodeVisual);
        this.signalGroup.add(nodeVisual.group);
      }

      this.updateNodeTarget(nodeVisual, ap);
    }

    // Mark disappeared nodes for fade-out
    for (const [bssid, nodeVisual] of this.nodes) {
      if (!activeBssids.has(bssid)) {
        nodeVisual.fadeStartTime = nodeVisual.fadeStartTime || Date.now();
        const fadeAge = Date.now() - nodeVisual.fadeStartTime;
        if (fadeAge > NODE_FADE_DURATION) {
          this.signalGroup.remove(nodeVisual.group);
          this.disposeNodeVisual(nodeVisual);
          this.nodes.delete(bssid);
        }
      } else {
        nodeVisual.fadeStartTime = null;
      }
    }
  }

  animate(deltaTime: number): void {
    this.time += deltaTime;

    for (const [, nodeVisual] of this.nodes) {
      this.animateNode(nodeVisual, deltaTime);
    }
  }

  dispose(): void {
    for (const [, nodeVisual] of this.nodes) {
      this.disposeNodeVisual(nodeVisual);
    }
    this.nodes.clear();
    this.parentScene.remove(this.signalGroup);
  }

  get nodeCount(): number {
    return this.nodes.size;
  }

  private createNodeVisual(ap: WifiAccessPoint): NodeVisual {
    const group = new THREE.Group();
    const normalized = normalizeRssi(ap.rssi);
    const color = signalToColor(normalized);

    // Core sphere — represents the access point
    const coreGeometry = new THREE.SphereGeometry(0.5, 16, 16);
    const coreMaterial = new THREE.MeshPhongMaterial({
      color,
      emissive: color,
      emissiveIntensity: 0.6 + normalized * 0.4,
      transparent: true,
      opacity: 0.9,
    });
    const core = new THREE.Mesh(coreGeometry, coreMaterial);
    group.add(core);

    // Glow sphere — soft outer glow
    const glowGeometry = new THREE.SphereGeometry(1.2, 16, 16);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.15 + normalized * 0.15,
      side: THREE.BackSide,
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    group.add(glow);

    // Signal rings — pulsing emission indicator
    const ringGeometry = new THREE.RingGeometry(1.5, 1.7, 32);
    const ringMaterial = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide,
    });
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.rotation.x = -Math.PI / 2;
    group.add(ring);

    // Point light for local illumination
    const light = new THREE.PointLight(color, normalized * 2, 15);
    light.position.set(0, 0, 0);
    group.add(light);

    // Label sprite
    const label = this.createLabelSprite(ap.ssid || ap.bssid, color);
    label.position.set(0, 2, 0);
    group.add(label);

    group.userData["bssid"] = ap.bssid;

    return {
      group,
      core,
      glow,
      ring,
      light,
      label,
      targetPosition: new THREE.Vector3(),
      targetScale: 1,
      currentScale: 0.01, // start small for entrance animation
      normalizedSignal: normalized,
      fadeStartTime: null,
      pulsePhase: Math.random() * Math.PI * 2,
    };
  }

  private createLabelSprite(text: string, color: THREE.Color): THREE.Sprite {
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext("2d")!;

    ctx.fillStyle = "transparent";
    ctx.fillRect(0, 0, 256, 64);

    ctx.font = "bold 20px monospace";
    ctx.fillStyle = `rgb(${Math.floor(color.r * 255)}, ${Math.floor(color.g * 255)}, ${Math.floor(color.b * 255)})`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const displayText = text.length > 18 ? text.substring(0, 15) + "..." : text;
    ctx.fillText(displayText, 128, 32);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;

    const material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      opacity: 0.8,
      depthWrite: false,
    });

    const sprite = new THREE.Sprite(material);
    sprite.scale.set(4, 1, 1);
    return sprite;
  }

  private updateNodeTarget(nodeVisual: NodeVisual, ap: WifiAccessPoint): void {
    const normalized = normalizeRssi(ap.rssi);
    const distance = rssiToDistance(ap.rssi);
    const angle = bssidToAngle(ap.bssid) * (Math.PI / 180);
    const height = bandToHeight(ap.band);

    nodeVisual.targetPosition.set(
      Math.cos(angle) * distance,
      height,
      Math.sin(angle) * distance
    );

    nodeVisual.targetScale = 0.5 + normalized * 1.5;
    nodeVisual.normalizedSignal = normalized;

    // Update colors
    const color = signalToColor(normalized);
    (nodeVisual.core.material as THREE.MeshPhongMaterial).color.copy(color);
    (nodeVisual.core.material as THREE.MeshPhongMaterial).emissive.copy(color);
    (nodeVisual.core.material as THREE.MeshPhongMaterial).emissiveIntensity = 0.6 + normalized * 0.4;
    (nodeVisual.glow.material as THREE.MeshBasicMaterial).color.copy(color);
    (nodeVisual.ring.material as THREE.MeshBasicMaterial).color.copy(color);
    nodeVisual.light.color.copy(color);
    nodeVisual.light.intensity = normalized * 2;
  }

  private animateNode(nodeVisual: NodeVisual, deltaTime: number): void {
    const t = 1.0 - Math.pow(1.0 - POSITION_SMOOTHING, deltaTime * 60);
    const scaleT = 1.0 - Math.pow(1.0 - SCALE_SMOOTHING, deltaTime * 60);

    // Smooth position
    nodeVisual.group.position.lerp(nodeVisual.targetPosition, t);

    // Smooth scale
    nodeVisual.currentScale += (nodeVisual.targetScale - nodeVisual.currentScale) * scaleT;
    const scale = nodeVisual.currentScale;
    nodeVisual.core.scale.setScalar(scale);
    nodeVisual.glow.scale.setScalar(scale);

    // Pulse animation
    nodeVisual.pulsePhase += deltaTime * 2;
    const pulse = 0.9 + 0.1 * Math.sin(nodeVisual.pulsePhase);
    nodeVisual.ring.scale.setScalar(scale * pulse * 1.5);

    // Ring expansion animation
    const ringPulse = (this.time * 0.5 + nodeVisual.pulsePhase) % (Math.PI * 2);
    const ringExpand = 1.0 + Math.sin(ringPulse) * 0.3;
    nodeVisual.ring.scale.x = scale * ringExpand;
    nodeVisual.ring.scale.y = scale * ringExpand;
    (nodeVisual.ring.material as THREE.MeshBasicMaterial).opacity =
      0.3 * (1.0 - Math.abs(Math.sin(ringPulse)) * 0.5);

    // Fade out if disappearing
    if (nodeVisual.fadeStartTime !== null) {
      const fadeProgress = Math.min(1, (Date.now() - nodeVisual.fadeStartTime) / NODE_FADE_DURATION);
      const fadeOpacity = 1 - fadeProgress;
      (nodeVisual.core.material as THREE.MeshPhongMaterial).opacity = fadeOpacity * 0.9;
      (nodeVisual.glow.material as THREE.MeshBasicMaterial).opacity = fadeOpacity * 0.3;
      (nodeVisual.ring.material as THREE.MeshBasicMaterial).opacity = fadeOpacity * 0.3;
      nodeVisual.label.material.opacity = fadeOpacity * 0.8;
    }

    // Labels always face camera (sprites do this automatically)
  }

  private disposeNodeVisual(nodeVisual: NodeVisual): void {
    nodeVisual.core.geometry.dispose();
    (nodeVisual.core.material as THREE.Material).dispose();
    nodeVisual.glow.geometry.dispose();
    (nodeVisual.glow.material as THREE.Material).dispose();
    nodeVisual.ring.geometry.dispose();
    (nodeVisual.ring.material as THREE.Material).dispose();
    nodeVisual.label.material.dispose();
    if (nodeVisual.label.material.map) {
      nodeVisual.label.material.map.dispose();
    }
  }
}

interface NodeVisual {
  group: THREE.Group;
  core: THREE.Mesh;
  glow: THREE.Mesh;
  ring: THREE.Mesh;
  light: THREE.PointLight;
  label: THREE.Sprite;
  targetPosition: THREE.Vector3;
  targetScale: number;
  currentScale: number;
  normalizedSignal: number;
  fadeStartTime: number | null;
  pulsePhase: number;
}
