import * as THREE from "three";

export class SceneManager {
  readonly scene: THREE.Scene;
  readonly camera: THREE.PerspectiveCamera;
  readonly renderer: THREE.WebGLRenderer;

  private container: HTMLElement;
  private resizeObserver: ResizeObserver;

  constructor(container: HTMLElement) {
    this.container = container;

    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x050510);
    this.scene.fog = new THREE.FogExp2(0x050510, 0.008);

    // Camera
    const aspect = container.clientWidth / container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 500);
    this.camera.position.set(0, 5, 0);
    this.camera.lookAt(0, 0, -10);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: "high-performance",
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.shadowMap.enabled = false;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    container.appendChild(this.renderer.domElement);

    // Ambient environment
    this.createEnvironment();

    // Resize handling
    this.resizeObserver = new ResizeObserver(() => this.onResize());
    this.resizeObserver.observe(container);
  }

  render(): void {
    this.renderer.render(this.scene, this.camera);
  }

  dispose(): void {
    this.resizeObserver.disconnect();
    this.renderer.dispose();
    this.container.removeChild(this.renderer.domElement);
  }

  private createEnvironment(): void {
    // Ambient light
    const ambient = new THREE.AmbientLight(0x222244, 0.5);
    this.scene.add(ambient);

    // Subtle point light at center
    const centerLight = new THREE.PointLight(0x4466ff, 0.8, 100);
    centerLight.position.set(0, 2, 0);
    this.scene.add(centerLight);

    // Grid helper — acts as ground reference
    const grid = new THREE.GridHelper(200, 80, 0x112244, 0x0a0a2a);
    grid.position.y = -2;
    (grid.material as THREE.Material).transparent = true;
    (grid.material as THREE.Material).opacity = 0.4;
    this.scene.add(grid);

    // Orbital ring guides
    this.createOrbitalRings();

    // Starfield particles for depth
    this.createStarfield();
  }

  private createOrbitalRings(): void {
    const ringDistances = [15, 30, 50, 75];
    const ringLabels = ["Strong", "Good", "Fair", "Weak"];

    ringDistances.forEach((radius, i) => {
      const geometry = new THREE.RingGeometry(radius - 0.1, radius + 0.1, 64);
      const material = new THREE.MeshBasicMaterial({
        color: 0x1a2a5a,
        transparent: true,
        opacity: 0.2 - i * 0.03,
        side: THREE.DoubleSide,
      });
      const ring = new THREE.Mesh(geometry, material);
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = -1.9;
      ring.userData["label"] = ringLabels[i];
      this.scene.add(ring);
    });
  }

  private createStarfield(): void {
    const starCount = 500;
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i++) {
      const r = 100 + Math.random() * 200;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;

      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.cos(phi);
      positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);

      const brightness = 0.3 + Math.random() * 0.7;
      colors[i * 3] = brightness * 0.6;
      colors[i * 3 + 1] = brightness * 0.7;
      colors[i * 3 + 2] = brightness;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 0.5,
      vertexColors: true,
      transparent: true,
      opacity: 0.6,
      sizeAttenuation: true,
    });

    const stars = new THREE.Points(geometry, material);
    this.scene.add(stars);
  }

  private onResize(): void {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }
}
