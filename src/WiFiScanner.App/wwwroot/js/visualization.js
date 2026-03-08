// Babylon.js 3D Visualization Engine for Wi-Fi Signals
window.WiFiVisualization = {
    engine: null,
    scene: null,
    camera: null,
    signalMeshes: {},
    particleSystems: {},

    initialize: function (canvasId) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) {
            console.error('Canvas not found:', canvasId);
            return false;
        }

        try {
            this.engine = new BABYLON.Engine(canvas, true, {
                preserveDrawingBuffer: true,
                stencil: true
            });

            this.scene = new BABYLON.Scene(this.engine);
            this.scene.clearColor = new BABYLON.Color4(0.04, 0.05, 0.15, 1);

            // Create camera
            this.camera = new BABYLON.ArcRotateCamera(
                "camera",
                0,
                Math.PI / 3,
                20,
                BABYLON.Vector3.Zero(),
                this.scene
            );
            this.camera.attachControl(canvas, true);
            this.camera.lowerRadiusLimit = 5;
            this.camera.upperRadiusLimit = 50;
            this.camera.wheelPrecision = 50;

            // Create hemisphere light
            const light = new BABYLON.HemisphericLight(
                "light",
                new BABYLON.Vector3(0, 1, 0),
                this.scene
            );
            light.intensity = 0.6;

            // Create point light at origin
            const pointLight = new BABYLON.PointLight(
                "pointLight",
                new BABYLON.Vector3(0, 5, 0),
                this.scene
            );
            pointLight.intensity = 0.4;

            // Create ground plane with grid
            this.createGroundPlane();

            // Create central marker (user position)
            this.createCentralMarker();

            // Start render loop
            this.engine.runRenderLoop(() => {
                this.scene.render();
            });

            // Handle resize
            window.addEventListener('resize', () => {
                this.engine.resize();
            });

            console.log('Babylon.js visualization initialized');
            return true;
        } catch (error) {
            console.error('Failed to initialize visualization:', error);
            return false;
        }
    },

    createGroundPlane: function () {
        const ground = BABYLON.MeshBuilder.CreateGround(
            "ground",
            { width: 50, height: 50, subdivisions: 20 },
            this.scene
        );

        const groundMaterial = new BABYLON.StandardMaterial("groundMat", this.scene);
        groundMaterial.diffuseColor = new BABYLON.Color3(0.1, 0.15, 0.3);
        groundMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
        groundMaterial.alpha = 0.3;
        groundMaterial.wireframe = true;
        ground.material = groundMaterial;
        ground.position.y = -0.1;
    },

    createCentralMarker: function () {
        const marker = BABYLON.MeshBuilder.CreateCylinder(
            "userMarker",
            { height: 2, diameter: 0.5 },
            this.scene
        );
        marker.position.y = 1;

        const markerMaterial = new BABYLON.StandardMaterial("markerMat", this.scene);
        markerMaterial.emissiveColor = new BABYLON.Color3(0.3, 0.7, 1);
        marker.material = markerMaterial;

        // Add pulsing animation
        const animation = new BABYLON.Animation(
            "markerPulse",
            "scaling.y",
            30,
            BABYLON.Animation.ANIMATIONTYPE_FLOAT,
            BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
        );

        const keys = [
            { frame: 0, value: 1 },
            { frame: 30, value: 1.2 },
            { frame: 60, value: 1 }
        ];

        animation.setKeys(keys);
        marker.animations.push(animation);
        this.scene.beginAnimation(marker, 0, 60, true);
    },

    updateSignals: function (signalsJson) {
        try {
            const signals = JSON.parse(signalsJson);
            console.log('Updating signals:', signals.length);

            const activeBssids = new Set();

            signals.forEach((signal, index) => {
                activeBssids.add(signal.bssid);
                this.updateSignalMesh(signal, index, signals.length);
            });

            // Remove old signals that are no longer present
            Object.keys(this.signalMeshes).forEach(bssid => {
                if (!activeBssids.has(bssid)) {
                    this.removeSignalMesh(bssid);
                }
            });

        } catch (error) {
            console.error('Error updating signals:', error);
        }
    },

    updateSignalMesh: function (signal, index, totalCount) {
        const bssid = signal.bssid;
        let mesh = this.signalMeshes[bssid];

        if (!mesh) {
            // Create new signal visualization
            mesh = this.createSignalMesh(signal, index, totalCount);
            this.signalMeshes[bssid] = mesh;
        }

        // Update signal appearance based on strength
        this.updateSignalAppearance(mesh, signal);
    },

    createSignalMesh: function (signal, index, totalCount) {
        const angle = (index / totalCount) * Math.PI * 2;
        const distance = 10 + Math.random() * 8;

        const x = Math.cos(angle) * distance;
        const z = Math.sin(angle) * distance;
        const y = (Math.random() - 0.5) * 3;

        // Create main sphere
        const sphere = BABYLON.MeshBuilder.CreateSphere(
            `signal_${signal.bssid}`,
            { diameter: 1.5, segments: 16 },
            this.scene
        );
        sphere.position = new BABYLON.Vector3(x, y, z);

        const material = new BABYLON.StandardMaterial(`mat_${signal.bssid}`, this.scene);
        material.diffuseColor = new BABYLON.Color3(0.3, 0.7, 1);
        material.emissiveColor = new BABYLON.Color3(0.2, 0.5, 0.8);
        material.alpha = 0.8;
        sphere.material = material;

        // Create particle system for signal
        const particleSystem = new BABYLON.ParticleSystem(
            `particles_${signal.bssid}`,
            1000,
            this.scene
        );

        particleSystem.particleTexture = new BABYLON.Texture(
            "https://raw.githubusercontent.com/BabylonJS/Babylon.js/master/packages/tools/playground/public/textures/flare.png",
            this.scene
        );

        particleSystem.emitter = sphere;
        particleSystem.minEmitBox = new BABYLON.Vector3(-0.5, -0.5, -0.5);
        particleSystem.maxEmitBox = new BABYLON.Vector3(0.5, 0.5, 0.5);

        particleSystem.color1 = new BABYLON.Color4(0.3, 0.7, 1, 1);
        particleSystem.color2 = new BABYLON.Color4(0.2, 0.5, 0.8, 1);
        particleSystem.colorDead = new BABYLON.Color4(0, 0, 0.2, 0);

        particleSystem.minSize = 0.1;
        particleSystem.maxSize = 0.3;
        particleSystem.minLifeTime = 0.5;
        particleSystem.maxLifeTime = 1.5;

        particleSystem.emitRate = 50;
        particleSystem.blendMode = BABYLON.ParticleSystem.BLENDMODE_ADD;

        particleSystem.gravity = new BABYLON.Vector3(0, 0, 0);
        particleSystem.direction1 = new BABYLON.Vector3(-1, 1, -1);
        particleSystem.direction2 = new BABYLON.Vector3(1, 1, 1);

        particleSystem.minAngularSpeed = 0;
        particleSystem.maxAngularSpeed = Math.PI;

        particleSystem.minEmitPower = 0.5;
        particleSystem.maxEmitPower = 1;
        particleSystem.updateSpeed = 0.01;

        particleSystem.start();

        this.particleSystems[signal.bssid] = particleSystem;

        // Add slow floating animation
        const animation = new BABYLON.Animation(
            `anim_${signal.bssid}`,
            "position.y",
            30,
            BABYLON.Animation.ANIMATIONTYPE_FLOAT,
            BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
        );

        const keys = [
            { frame: 0, value: y },
            { frame: 60, value: y + 0.5 },
            { frame: 120, value: y }
        ];

        animation.setKeys(keys);
        sphere.animations.push(animation);
        this.scene.beginAnimation(sphere, 0, 120, true);

        return sphere;
    },

    updateSignalAppearance: function (mesh, signal) {
        const material = mesh.material;
        const strength = signal.signalStrength;

        // Update color based on signal strength
        // Green = strong, Yellow = medium, Red = weak
        if (strength > 0.7) {
            material.diffuseColor = new BABYLON.Color3(0.3, 1, 0.3);
            material.emissiveColor = new BABYLON.Color3(0.2, 0.8, 0.2);
        } else if (strength > 0.4) {
            material.diffuseColor = new BABYLON.Color3(1, 1, 0.3);
            material.emissiveColor = new BABYLON.Color3(0.8, 0.8, 0.2);
        } else {
            material.diffuseColor = new BABYLON.Color3(1, 0.3, 0.3);
            material.emissiveColor = new BABYLON.Color3(0.8, 0.2, 0.2);
        }

        // Update scale based on signal strength
        const targetScale = 0.5 + strength * 1.5;
        mesh.scaling = BABYLON.Vector3.Lerp(
            mesh.scaling,
            new BABYLON.Vector3(targetScale, targetScale, targetScale),
            0.1
        );

        // Update particle emission rate
        const particleSystem = this.particleSystems[signal.bssid];
        if (particleSystem) {
            particleSystem.emitRate = 20 + strength * 80;
        }
    },

    removeSignalMesh: function (bssid) {
        const mesh = this.signalMeshes[bssid];
        if (mesh) {
            mesh.dispose();
            delete this.signalMeshes[bssid];
        }

        const particleSystem = this.particleSystems[bssid];
        if (particleSystem) {
            particleSystem.dispose();
            delete this.particleSystems[bssid];
        }
    },

    updateOrientation: function (heading, pitch, roll) {
        if (!this.camera) return;

        // Update camera rotation based on device orientation
        const alpha = this.camera.alpha;
        const targetAlpha = (heading * Math.PI / 180);

        this.camera.alpha = BABYLON.Scalar.Lerp(alpha, targetAlpha, 0.1);
    },

    dispose: function () {
        if (this.engine) {
            this.engine.stopRenderLoop();
            this.engine.dispose();
        }
    }
};
