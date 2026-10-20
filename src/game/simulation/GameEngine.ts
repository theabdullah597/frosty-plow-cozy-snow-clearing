import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { GameState, Upgrades, TruckColor, GameTelemetry, FloatingText, WeatherType } from '../types';
import { sound } from '../audio/SynthAudio';
import { createSnowplowTruck } from '../graphics/models';
import { ParticleSystem } from '../graphics/ParticleSystem';
import { buildDistrictWorld, WorldData, DISTRICTS } from './WorldGenerator';
import { SnowField } from './SnowField';
import { CollectibleManager } from './Collectibles';

export interface GameEngineCallbacks {
  onTelemetry: (t: GameTelemetry) => void;
  onDistrictCleared: (districtId: number, stats: { score: number; coins: number; percent: number }) => void;
  onSpawnFloatingText: (text: FloatingText) => void;
}

export class GameEngine {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private pmremGenerator: THREE.PMREMGenerator;

  // World and actors
  private currentDistrictId: number = 1;
  private worldData: WorldData | null = null;
  private snowField: SnowField | null = null;
  private particles: ParticleSystem | null = null;
  private collectibles: CollectibleManager | null = null;
  private itemsFoundCount: number = 0;
  private blizzardPlowedCount: number = 0;

  // Truck
  private truckData: ReturnType<typeof createSnowplowTruck> | null = null;
  private truckPos = new THREE.Vector3(0, 0, 0);
  private truckVelocity = 0; // forward speed
  private truckHeading = 0;  // angle in radians
  private steerAngle = 0;
  private isDrifting = false;

  // Upgrades & Color
  private upgrades: Upgrades = {
    bladeWidth: 1,
    enginePower: 1,
    snowCapacity: 1,
    saltTurbo: 1,
    gripTires: 1,
  };
  private truckColor: TruckColor = 'orange';

  // Game telemetry & stats
  private state: GameState = 'TITLE';
  private score: number = 0;
  private coins: number = 0;
  private combo: number = 1.0;
  private comboTimer: number = 0;
  private maxCombo: number = 1.0;
  private boostEnergy: number = 100;
  private isBoosting: boolean = false;
  private hitstopTimer: number = 0;
  private cameraShake: number = 0;
  private floatingTextId: number = 1;

  // Dynamic Weather State
  private weather: WeatherType = 'light_snow';
  private weatherCycleDuration: number = 48; // seconds per weather phase
  private weatherTimeElapsed: number = 0;
  private autoWeatherCycle: boolean = true;
  private targetFogDensity: number = 0.016;
  private currentFogDensity: number = 0.016;
  private targetSkyColor = new THREE.Color(0xdce7f3);
  private currentSkyColor = new THREE.Color(0xdce7f3);
  private targetSunIntensity: number = 1.8;
  private currentSunIntensity: number = 1.8;
  private targetBeamOpacity: number = 0.18;
  private windGustTime: number = 0;
  private windSpeedKmH: number = 18;
  private tractionPercent: number = 85;

  // Lighting
  private keyLight: THREE.DirectionalLight | null = null;
  private hemiLight: THREE.HemisphereLight | null = null;

  // Animation frame
  private animFrameId: number | null = null;
  private lastTime: number = performance.now();
  private callbacks: GameEngineCallbacks;

  // Input state
  private keysHeld: Record<string, boolean> = {};
  private virtualJoystick = { x: 0, y: 0 };
  private virtualBoost = false;

  constructor(container: HTMLElement, callbacks: GameEngineCallbacks) {
    this.container = container;
    this.callbacks = callbacks;

    // 1. Scene setup
    this.scene = new THREE.Scene();
    this.scene.background = this.currentSkyColor;
    this.scene.fog = new THREE.FogExp2(this.currentSkyColor, this.currentFogDensity);

    // 2. Camera setup (Isometric perspective)
    const aspect = container.clientWidth / container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(38, aspect, 0.5, 200);
    this.camera.position.set(24, 28, 24);
    this.camera.lookAt(0, 0, 0);

    // 3. Renderer setup (Three.js r160+ directives)
    const isHeadless = navigator.webdriver || /HeadlessChrome/i.test(navigator.userAgent);
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(isHeadless ? 1 : Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.shadowMap.enabled = !isHeadless;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(this.renderer.domElement);

    // 4. Studio Environment Reflection
    this.pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = this.pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;

    // 5. Lighting rig
    this.setupLighting();

    // 6. Particles
    this.particles = new ParticleSystem(this.scene);

    // 7. Initialize world
    this.loadDistrict(this.currentDistrictId);

    // 8. Event listeners
    this.bindEvents();

    // 9. Pre-warm shaders
    this.renderer.compile(this.scene, this.camera);

    // 10. Start game loop
    this.startLoop();
  }

  private setupLighting() {
    this.hemiLight = new THREE.HemisphereLight(0xdbeafe, 0x64748b, 0.9);
    this.scene.add(this.hemiLight);

    this.keyLight = new THREE.DirectionalLight(0xffedd5, 1.8);
    this.keyLight.position.set(25, 42, 20);
    this.keyLight.castShadow = true;
    this.keyLight.shadow.mapSize.width = 2048;
    this.keyLight.shadow.mapSize.height = 2048;
    this.keyLight.shadow.camera.near = 5;
    this.keyLight.shadow.camera.far = 100;
    const d = 34;
    this.keyLight.shadow.camera.left = -d;
    this.keyLight.shadow.camera.right = d;
    this.keyLight.shadow.camera.top = d;
    this.keyLight.shadow.camera.bottom = -d;
    this.keyLight.shadow.bias = -0.0005;
    this.keyLight.shadow.normalBias = 0.02;
    this.scene.add(this.keyLight);
  }

  public loadDistrict(districtId: number) {
    this.currentDistrictId = districtId;

    if (this.worldData) {
      this.scene.remove(this.worldData.group);
    }
    if (this.snowField) {
      this.scene.remove(this.snowField.instancedMesh);
      this.snowField.dispose();
      this.snowField = null;
    }
    if (this.truckData) {
      this.scene.remove(this.truckData.group);
      this.truckData = null;
    }

    const distConfig = DISTRICTS.find((d) => d.id === districtId) || DISTRICTS[0];
    this.setWeather(distConfig.weather);

    if (this.collectibles) {
      this.collectibles.dispose();
      this.collectibles = null;
    }

    // Build world
    this.worldData = buildDistrictWorld(districtId);
    this.scene.add(this.worldData.group);

    // Build snow field
    this.snowField = new SnowField(this.scene, this.worldData.roadTiles);

    // Build buried collectibles
    this.collectibles = new CollectibleManager(this.scene, this.worldData.roadTiles);

    // Create truck
    this.truckData = createSnowplowTruck(this.truckColor);
    this.truckPos.copy(this.worldData.startPos);
    this.truckPos.y = 0;
    this.truckVelocity = 0;
    this.truckHeading = 0;
    this.steerAngle = 0;
    this.truckData.group.position.copy(this.truckPos);
    this.scene.add(this.truckData.group);

    // Apply upgrade scaling
    this.applyUpgradesToTruck();
  }

  public setWeather(newWeather: WeatherType) {
    this.weather = newWeather;
    this.weatherTimeElapsed = 0;

    if (newWeather === 'clear') {
      this.targetFogDensity = 0.008; // High visibility
      this.targetSkyColor.setHex(0x93c5fd); // Azure blue
      this.targetSunIntensity = 2.4;
      this.targetBeamOpacity = 0.08;
      this.windSpeedKmH = 8;
      this.tractionPercent = 100;
    } else if (newWeather === 'light_snow') {
      this.targetFogDensity = 0.016; // Cozy soft snow
      this.targetSkyColor.setHex(0xdce7f3);
      this.targetSunIntensity = 1.7;
      this.targetBeamOpacity = 0.18;
      this.windSpeedKmH = 22;
      this.tractionPercent = 85;
    } else {
      // blizzard
      this.targetFogDensity = 0.038; // Dense blizzard whiteout
      this.targetSkyColor.setHex(0x475569); // Dark storm gray
      this.targetSunIntensity = 0.65;
      this.targetBeamOpacity = 0.48; // Volumetric headlight beams glow brightly!
      this.windSpeedKmH = 68;
      this.tractionPercent = 52;
    }

    if (this.particles) {
      this.particles.setWeather(newWeather, this.windSpeedKmH / 30);
    }
  }

  public cycleWeather() {
    if (this.weather === 'clear') {
      this.setWeather('light_snow');
    } else if (this.weather === 'light_snow') {
      this.setWeather('blizzard');
    } else {
      this.setWeather('clear');
    }
  }

  public setUpgrades(upgrades: Upgrades) {
    this.upgrades = { ...upgrades };
    this.applyUpgradesToTruck();
  }

  public setTruckColor(color: TruckColor) {
    this.truckColor = color;
    if (this.truckData) {
      this.truckData.setColor(color);
    }
  }

  private applyUpgradesToTruck() {
    if (!this.truckData) return;
    const bladeScale = 1.0 + (this.upgrades.bladeWidth - 1) * 0.22;
    this.truckData.setBladeScale(bladeScale);
  }

  public setState(newState: GameState) {
    this.state = newState;
    if (newState === 'PLAYING') {
      sound.init();
      sound.resume();
    }
  }

  public getState(): GameState {
    return this.state;
  }

  public setVirtualInput(joystick: { x: number; y: number }, boost: boolean) {
    this.virtualJoystick = joystick;
    this.virtualBoost = boost;
  }

  private bindEvents() {
    const onKeyDown = (e: KeyboardEvent) => {
      this.keysHeld[e.code] = true;

      if (e.code === 'Space' && this.state === 'PLAYING') {
        e.preventDefault();
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      this.keysHeld[e.code] = false;
    };

    const onBlur = () => {
      this.keysHeld = {};
    };

    const onResize = () => {
      if (!this.container) return;
      const w = this.container.clientWidth;
      const h = this.container.clientHeight;
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h);
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);
    window.addEventListener('resize', onResize);
  }

  private startLoop() {
    const loop = (now: number) => {
      const rawDt = (now - this.lastTime) / 1000;
      this.lastTime = now;
      const dt = Math.min(rawDt, 0.05);

      this.update(dt);
      this.render();

      this.animFrameId = requestAnimationFrame(loop);
    };
    this.animFrameId = requestAnimationFrame(loop);
  }

  private update(dt: number) {
    if (!this.truckData || !this.worldData || !this.snowField || !this.particles) return;

    // 1. Dynamic Weather Lifecycle & Transitions
    this.windGustTime += dt;
    if (this.autoWeatherCycle && this.state === 'PLAYING') {
      this.weatherTimeElapsed += dt;
      if (this.weatherTimeElapsed >= this.weatherCycleDuration) {
        this.cycleWeather();
      }
    }

    // Smooth exponential damping of atmospheric visibility
    this.currentFogDensity = THREE.MathUtils.damp(this.currentFogDensity, this.targetFogDensity, 1.8, dt);
    this.currentSkyColor.lerp(this.targetSkyColor, dt * 1.8);
    this.currentSunIntensity = THREE.MathUtils.damp(this.currentSunIntensity, this.targetSunIntensity, 2.0, dt);

    // Apply to Three.js scene fog & sky
    this.scene.background = this.currentSkyColor;
    if (this.scene.fog instanceof THREE.FogExp2) {
      this.scene.fog.density = this.currentFogDensity;
      this.scene.fog.color = this.currentSkyColor;
    }
    if (this.keyLight) {
      this.keyLight.intensity = this.currentSunIntensity;
    }
    if (this.truckData?.beamMaterial) {
      this.truckData.beamMaterial.opacity = THREE.MathUtils.damp(
        this.truckData.beamMaterial.opacity,
        this.targetBeamOpacity,
        2.5,
        dt
      );
    }

    // Audio wind synthesis update
    const gustFactor = Math.sin(this.windGustTime * 0.8) * 0.5 + 0.5;
    sound.updateWeatherWind(this.weather, gustFactor);

    // Handle hitstop freeze frames on heavy impact
    if (this.hitstopTimer > 0) {
      this.hitstopTimer -= dt;
      return;
    }

    // Title Screen live camera pan
    if (this.state === 'TITLE') {
      const t = performance.now() * 0.0003;
      const camR = 34;
      this.camera.position.set(
        this.truckPos.x + Math.sin(t) * camR,
        22 + Math.cos(t * 0.7) * 4,
        this.truckPos.z + Math.cos(t) * camR
      );
      this.camera.lookAt(this.truckPos.x, 1.2, this.truckPos.z);
      this.particles.update(dt, this.camera.position);

      this.truckData.beaconBase.rotation.y += dt * 5.0;
      return;
    }

    if (this.state !== 'PLAYING') return;

    // 2. Input reading
    let throttle = 0;
    let steer = 0;

    if (this.keysHeld['KeyW'] || this.keysHeld['ArrowUp']) throttle += 1;
    if (this.keysHeld['KeyS'] || this.keysHeld['ArrowDown']) throttle -= 0.8;
    if (this.keysHeld['KeyA'] || this.keysHeld['ArrowLeft']) steer += 1;
    if (this.keysHeld['KeyD'] || this.keysHeld['ArrowRight']) steer -= 1;

    // Mobile / touch analog joystick override
    if (Math.abs(this.virtualJoystick.y) > 0.1) {
      throttle = -this.virtualJoystick.y;
    }
    if (Math.abs(this.virtualJoystick.x) > 0.1) {
      steer = -this.virtualJoystick.x;
    }

    // Turbo Boost logic
    const wantsBoost = this.keysHeld['Space'] || this.keysHeld['ShiftLeft'] || this.virtualBoost;
    if (wantsBoost && this.boostEnergy > 5 && Math.abs(this.truckVelocity) > 1.0) {
      if (!this.isBoosting) {
        sound.playTurboBoost();
      }
      this.isBoosting = true;
      this.boostEnergy = Math.max(0, this.boostEnergy - dt * 32);
    } else {
      this.isBoosting = false;
      const regenRate = 8 + (this.upgrades.saltTurbo - 1) * 3;
      this.boostEnergy = Math.min(100, this.boostEnergy + dt * regenRate);
    }

    // 3. Ice Detection & Weather Handling
    let onIce = false;
    for (const ice of this.worldData.iceZones) {
      const dx = this.truckPos.x - ice.x;
      const dz = this.truckPos.z - ice.z;
      if (dx * dx + dz * dz < ice.radius * ice.radius) {
        onIce = true;
        break;
      }
    }

    const isBlizzard = this.weather === 'blizzard';
    const isClear = this.weather === 'clear';

    // Weather impact on traction & handling
    const tireUpgradeBonus = (this.upgrades.gripTires - 1) * 0.12;
    const weatherTractionFactor = (isBlizzard ? 0.65 : isClear ? 1.15 : 1.0) + tireUpgradeBonus;
    this.isDrifting = (onIce || isBlizzard) && Math.abs(this.truckVelocity) > 4;

    // 4. Vehicle Kinematics
    const baseTopSpeed = (9.0 + (this.upgrades.enginePower - 1) * 2.2) * (isClear ? 1.12 : isBlizzard ? 0.9 : 1.0);
    const topSpeed = this.isBoosting ? baseTopSpeed * 1.55 : baseTopSpeed;
    const accel = (8.0 + (this.upgrades.enginePower - 1) * 2.0) * (this.isBoosting ? 1.6 : 1.0) * weatherTractionFactor;
    const naturalFriction = onIce ? 0.985 : isBlizzard ? 0.94 : 0.92;

    if (throttle > 0) {
      this.truckVelocity += accel * throttle * dt;
      if (this.truckVelocity > topSpeed) this.truckVelocity = topSpeed;
    } else if (throttle < 0) {
      this.truckVelocity += accel * throttle * dt;
      if (this.truckVelocity < -topSpeed * 0.5) this.truckVelocity = -topSpeed * 0.5;
    } else {
      this.truckVelocity *= Math.pow(naturalFriction, dt * 60);
      if (Math.abs(this.truckVelocity) < 0.05) this.truckVelocity = 0;
    }

    // Steering responsiveness modified by weather traction
    const targetSteerAngle = steer * (onIce ? 0.35 : isBlizzard ? 0.45 : 0.58);
    const steerResponsiveness = (onIce ? 2.5 : 7.0 + (this.upgrades.gripTires - 1) * 1.5) * weatherTractionFactor;
    this.steerAngle = THREE.MathUtils.damp(this.steerAngle, targetSteerAngle, steerResponsiveness, dt);

    // Front wheels visual steer
    this.truckData.frontWheelsGroup.rotation.y = this.steerAngle;

    // Rotate heading when moving
    if (Math.abs(this.truckVelocity) > 0.1) {
      const turnSpeed = this.steerAngle * (this.truckVelocity / 4.0) * (onIce ? 0.75 : 1.1);
      this.truckHeading += turnSpeed * dt;
    }

    // Wheel rolling rotation
    const wheelRotDelta = (this.truckVelocity / 0.42) * dt;
    this.truckData.frontWheelsGroup.children.forEach((w) => (w.rotation.x += wheelRotDelta));
    this.truckData.rearWheelsGroup.children.forEach((w) => (w.rotation.x += wheelRotDelta));

    // Spin rear salt spreader disc
    if (this.truckData.spinnerShaft) {
      this.truckData.spinnerShaft.rotation.y += dt * (this.isBoosting ? 26 : Math.abs(this.truckVelocity) * 5.5 + 1.0);
    }

    // Calculate forward & right movement vectors
    const forwardX = Math.sin(this.truckHeading);
    const forwardZ = Math.cos(this.truckHeading);

    // Next proposed position (with blizzard lateral wind drift)
    let nextX = this.truckPos.x + forwardX * this.truckVelocity * dt;
    let nextZ = this.truckPos.z + forwardZ * this.truckVelocity * dt;

    if (isBlizzard) {
      // Storm wind gently pushes vehicle
      const windPush = 1.2 * (1 - Math.min(0.6, (this.upgrades.gripTires - 1) * 0.15));
      nextX -= windPush * dt;
      nextZ -= windPush * 0.5 * dt;
    }

    // 5. Obstacle Collision & Interactive Snowmen
    let collisionOccurred = false;
    const truckRadius = 1.35;
    for (const obs of this.worldData.obstacles) {
      const dx = nextX - obs.x;
      const dz = nextZ - obs.z;
      const distSq = dx * dx + dz * dz;

      // Special Friendly Snowman Interaction!
      if (obs.type === 'snowman') {
        if (distSq < 3.2 * 3.2 && obs.mesh) {
          // Playful hop & wobble
          obs.mesh.position.y = Math.abs(Math.sin(performance.now() * 0.008)) * 0.35;
          obs.mesh.rotation.z = Math.sin(performance.now() * 0.012) * 0.18;

          if (!obs.mesh.userData.cheered) {
            obs.mesh.userData.cheered = true;
            sound.playSnowmanCheer();
            this.score += 150;
            this.coins += 25;
            this.callbacks.onSpawnFloatingText({
              id: this.floatingTextId++,
              text: '⛄ FROSTY FRIEND! +150',
              x: window.innerWidth / 2 + (Math.random() - 0.5) * 80,
              y: window.innerHeight / 2 - 70,
              color: '#38bdf8',
              scale: 1.3,
              opacity: 1,
            });
          }
        }
        continue; // Friendly snowmen do not crash the vehicle!
      }

      const minDist = truckRadius + obs.radius;
      if (distSq < minDist * minDist) {
        collisionOccurred = true;

        const dist = Math.sqrt(distSq) || 1;
        const pushX = (dx / dist) * 0.4;
        const pushZ = (dz / dist) * 0.4;
        this.truckPos.x += pushX;
        this.truckPos.z += pushZ;

        this.truckVelocity = -this.truckVelocity * 0.35;

        sound.playCollisionThud();
        this.hitstopTimer = 0.05;
        this.cameraShake = 0.45;

        if (this.combo > 1.2) {
          this.combo = 1.0;
          this.comboTimer = 0;
          this.callbacks.onSpawnFloatingText({
            id: this.floatingTextId++,
            text: 'COMBO LOST!',
            x: window.innerWidth / 2,
            y: window.innerHeight / 2 - 40,
            color: '#ef4444',
            scale: 1.1,
            opacity: 1,
          });
        }
        break;
      }
    }

    if (!collisionOccurred) {
      this.truckPos.x = nextX;
      this.truckPos.z = nextZ;
    }

    this.truckData.group.position.set(this.truckPos.x, 0, this.truckPos.z);
    this.truckData.group.rotation.y = this.truckHeading;

    // Rooftop beacon rotation
    this.truckData.beaconBase.rotation.y += dt * 6.5;

    // Engine audio
    const speedRatio = Math.min(1.0, Math.abs(this.truckVelocity) / baseTopSpeed);
    sound.updateEngine(speedRatio, this.isBoosting);

    // 6. Snow Plowing, Blade Clearing & Buried Items
    const bladeOffset = 1.95;
    const bladeWorldPos = new THREE.Vector3(
      this.truckPos.x + forwardX * bladeOffset,
      0.15,
      this.truckPos.z + forwardZ * bladeOffset
    );

    const bladeWidthMeters = 2.5 * (1.0 + (this.upgrades.bladeWidth - 1) * 0.22);
    const forwardVec = new THREE.Vector3(forwardX, 0, forwardZ);

    const isMovingForward = this.truckVelocity > 0.5;
    let clearedCount = 0;

    if (isMovingForward) {
      const result = this.snowField.plowAt(bladeWorldPos, bladeWidthMeters, forwardVec);
      clearedCount = result.clearedCount;

      // Reveal buried items
      if (this.collectibles && result.clearedCoords.length > 0) {
        this.collectibles.checkSnowCleared(result.clearedCoords);
      }
    }

    // Check truck pickup of revealed items
    if (this.collectibles) {
      this.collectibles.update(dt);
      const pickedUp = this.collectibles.checkTruckPickup(this.truckPos);
      for (const item of pickedUp) {
        this.itemsFoundCount++;
        sound.playItemPickup();
        if (item.type === 'cocoa') {
          this.boostEnergy = 100;
          this.isBoosting = true;
          this.callbacks.onSpawnFloatingText({
            id: this.floatingTextId++,
            text: '☕ HOT COCOA TURBO BLAST!',
            x: window.innerWidth / 2,
            y: window.innerHeight / 2 - 90,
            color: '#f97316',
            scale: 1.4,
            opacity: 1,
          });
        } else if (item.type === 'diamond') {
          this.coins += 150;
          this.score += 500;
          this.callbacks.onSpawnFloatingText({
            id: this.floatingTextId++,
            text: '💎 FROST DIAMOND! +150 COINS',
            x: window.innerWidth / 2,
            y: window.innerHeight / 2 - 90,
            color: '#38bdf8',
            scale: 1.4,
            opacity: 1,
          });
        } else if (item.type === 'shaker') {
          this.combo = Math.min(10.0, this.combo + 2.0);
          this.comboTimer = 1.0;
          this.callbacks.onSpawnFloatingText({
            id: this.floatingTextId++,
            text: '⚡ GOLDEN SALT SURGE +2.0x!',
            x: window.innerWidth / 2,
            y: window.innerHeight / 2 - 90,
            color: '#facc15',
            scale: 1.4,
            opacity: 1,
          });
        } else if (item.type === 'gift') {
          this.coins += 100;
          this.score += 1000;
          this.callbacks.onSpawnFloatingText({
            id: this.floatingTextId++,
            text: '🎁 HOLIDAY GIFT! +1,000 PTS',
            x: window.innerWidth / 2,
            y: window.innerHeight / 2 - 90,
            color: '#10b981',
            scale: 1.4,
            opacity: 1,
          });
        }
      }
    }

    if (clearedCount > 0) {
      sound.setSnowPlowing(true, 1.0 + clearedCount * 0.1);
      if (this.weather === 'blizzard') {
        this.blizzardPlowedCount += clearedCount;
      }

      this.particles.emitSnowSpray(bladeWorldPos, forwardVec, Math.min(14, clearedCount * 2));

      this.comboTimer = 1.0;
      const comboGain = clearedCount * 0.08;
      const oldComboTier = Math.floor(this.combo);
      this.combo = Math.min(10.0, this.combo + comboGain);
      const newComboTier = Math.floor(this.combo);

      if (newComboTier > oldComboTier) {
        sound.playComboChime(newComboTier);
        sound.playCoin();
        this.callbacks.onSpawnFloatingText({
          id: this.floatingTextId++,
          text: `x${newComboTier.toFixed(1)} COMBO!`,
          x: window.innerWidth / 2 + (Math.random() - 0.5) * 80,
          y: window.innerHeight / 2 - 80,
          color: newComboTier >= 5 ? '#facc15' : '#38bdf8',
          scale: 1.25,
          opacity: 1,
        });
      }

      if (this.combo > this.maxCombo) {
        this.maxCombo = this.combo;
      }

      const coinMultiplier = 1 + (this.upgrades.snowCapacity - 1) * 0.4;
      const coinsEarned = Math.round(clearedCount * this.combo * coinMultiplier);
      this.coins += coinsEarned;
      this.score += Math.round(clearedCount * 10 * this.combo);
    } else {
      sound.setSnowPlowing(false);
    }

    // Combo decay
    if (this.comboTimer > 0) {
      const decayDuration = 4.2;
      this.comboTimer -= dt / decayDuration;
      if (this.comboTimer <= 0) {
        this.comboTimer = 0;
        this.combo = 1.0;
      }
    }

    // Turbo boost salt emission
    if (this.isBoosting) {
      const rearPos = new THREE.Vector3(
        this.truckPos.x - forwardX * 1.6,
        0.4,
        this.truckPos.z - forwardZ * 1.6
      );
      this.particles.emitTurboSparks(rearPos, new THREE.Vector3(-forwardX, 0, -forwardZ));
    }

    // 7. Isometric Camera tracking with dynamic speed zoom
    const speedRatioZoom = Math.min(1.0, Math.abs(this.truckVelocity) / 14);
    const camDist = 26 + speedRatioZoom * 4.0;
    const camHeight = 30 + speedRatioZoom * 3.0;
    const targetCamX = this.truckPos.x + camDist;
    const targetCamY = camHeight;
    const targetCamZ = this.truckPos.z + camDist;

    let shakeX = 0;
    let shakeZ = 0;
    if (this.cameraShake > 0) {
      shakeX = (Math.random() - 0.5) * this.cameraShake;
      shakeZ = (Math.random() - 0.5) * this.cameraShake;
      this.cameraShake = Math.max(0, this.cameraShake - dt * 2.2);
    }

    this.camera.position.x = THREE.MathUtils.damp(this.camera.position.x, targetCamX + shakeX, 4.5, dt);
    this.camera.position.y = THREE.MathUtils.damp(this.camera.position.y, targetCamY, 4.5, dt);
    this.camera.position.z = THREE.MathUtils.damp(this.camera.position.z, targetCamZ + shakeZ, 4.5, dt);
    this.camera.lookAt(this.truckPos.x, 1.2, this.truckPos.z);

    // Keep sun shadow box centered around truck
    if (this.keyLight) {
      this.keyLight.position.set(this.truckPos.x + 25, 42, this.truckPos.z + 20);
      this.keyLight.target.position.set(this.truckPos.x, 0, this.truckPos.z);
      this.keyLight.target.updateMatrixWorld();
    }

    // 8. Update particles
    this.particles.update(dt, this.camera.position);

    // 9. District Cleared Condition
    const percentCleared = this.snowField.getPercentCleared();
    const currentDistrict = DISTRICTS.find((d) => d.id === this.currentDistrictId) || DISTRICTS[0];
    if (percentCleared >= currentDistrict.targetPercent && this.state === 'PLAYING') {
      this.state = 'VICTORY';
      sound.playVictoryFanfare();
      this.callbacks.onDistrictCleared(this.currentDistrictId, {
        score: this.score,
        coins: this.coins,
        percent: Math.round(percentCleared),
      });
    }

    // 10. Report Telemetry to React HUD
    this.callbacks.onTelemetry({
      snowCleared: this.snowField.clearedTiles,
      totalSnow: this.snowField.totalTiles,
      percentCleared: Math.round(percentCleared),
      coins: this.coins,
      score: this.score,
      combo: parseFloat(this.combo.toFixed(1)),
      comboTimer: this.comboTimer,
      maxCombo: parseFloat(this.maxCombo.toFixed(1)),
      boostEnergy: Math.round(this.boostEnergy),
      isBoosting: this.isBoosting,
      speed: Math.round(Math.abs(this.truckVelocity) * 3.6),
      isPlowing: clearedCount > 0,
      fps: Math.round(1 / dt),
      weather: this.weather,
      weatherTimer: Math.min(1.0, this.weatherTimeElapsed / this.weatherCycleDuration),
      windSpeed: Math.round(this.windSpeedKmH),
      traction: Math.round(this.tractionPercent),
      itemsFound: this.itemsFoundCount,
      blizzardSnowPlowed: this.blizzardPlowedCount,
    });
  }

  private render() {
    this.renderer.render(this.scene, this.camera);
  }

  public addCoins(amount: number) {
    this.coins += amount;
  }

  public spendCoins(amount: number): boolean {
    if (this.coins >= amount) {
      this.coins -= amount;
      return true;
    }
    return false;
  }

  public restartDistrict() {
    if (this.snowField && this.worldData && this.truckData) {
      this.snowField.reset();
      this.truckPos.copy(this.worldData.startPos);
      this.truckVelocity = 0;
      this.truckHeading = 0;
      this.steerAngle = 0;
      this.truckData.group.position.copy(this.truckPos);
      this.truckData.group.rotation.y = 0;
      this.combo = 1.0;
      this.comboTimer = 0;
      this.state = 'PLAYING';
    }
  }

  public nextDistrict() {
    const nextId = this.currentDistrictId >= 3 ? 1 : this.currentDistrictId + 1;
    this.loadDistrict(nextId);
    this.state = 'PLAYING';
  }

  public dispose() {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
    }
    if (this.particles) {
      this.particles.dispose();
    }
    if (this.collectibles) {
      this.collectibles.dispose();
    }
    if (this.snowField) {
      this.snowField.dispose();
    }
    if (this.pmremGenerator) {
      this.pmremGenerator.dispose();
    }
    this.renderer.dispose();
    sound.dispose();
  }
}
