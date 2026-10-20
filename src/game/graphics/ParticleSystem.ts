import * as THREE from 'three';
import { WeatherType } from '../types';

interface SnowSprayParticle {
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  life: number;
  maxLife: number;
  size: number;
}

export class ParticleSystem {
  private scene: THREE.Scene;

  // 1. Snow Spray Particle Pool
  private sprayMax: number = 400;
  private sprayParticles: SnowSprayParticle[] = [];
  private sprayGeom: THREE.BufferGeometry;
  private sprayPositions: Float32Array;
  private spraySizes: Float32Array;
  private sprayPoints: THREE.Points;

  // 2. Ambient Falling Snow / Weather Storm
  private maxSnowCount: number = 2600;
  private activeSnowCount: number = 1400;
  private snowPositions: Float32Array;
  private snowVelocities: Float32Array;
  private snowBaseSpeeds: Float32Array;
  private snowPoints: THREE.Points;
  private snowMaterial: THREE.PointsMaterial;

  // 3. Chimney Smoke & Turbo Sparks
  private sparkMax: number = 200;
  private sparkPositions: Float32Array;
  private sparkVelocities: Float32Array;
  private sparkLifes: Float32Array;
  private sparkPoints: THREE.Points;

  // Weather parameters
  private currentWeather: WeatherType = 'light_snow';
  private windVec = new THREE.Vector3(1.2, 0, 0.8);
  private windSpeedFactor: number = 1.0;

  constructor(scene: THREE.Scene) {
    this.scene = scene;

    // --- Snow Spray setup ---
    this.sprayGeom = new THREE.BufferGeometry();
    this.sprayPositions = new Float32Array(this.sprayMax * 3);
    this.spraySizes = new Float32Array(this.sprayMax);
    this.sprayGeom.setAttribute('position', new THREE.BufferAttribute(this.sprayPositions, 3));
    this.sprayGeom.setAttribute('size', new THREE.BufferAttribute(this.spraySizes, 1));

    const sprayMat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.38,
      transparent: true,
      opacity: 0.9,
      blending: THREE.NormalBlending,
      depthWrite: false,
    });
    this.sprayPoints = new THREE.Points(this.sprayGeom, sprayMat);
    this.sprayPoints.frustumCulled = false;
    scene.add(this.sprayPoints);

    for (let i = 0; i < this.sprayMax; i++) {
      this.sprayParticles.push({
        pos: new THREE.Vector3(0, -999, 0),
        vel: new THREE.Vector3(0, 0, 0),
        life: 0,
        maxLife: 0.45,
        size: 0,
      });
    }

    // --- Ambient Falling Snow setup ---
    const snowGeom = new THREE.BufferGeometry();
    this.snowPositions = new Float32Array(this.maxSnowCount * 3);
    this.snowVelocities = new Float32Array(this.maxSnowCount * 3);
    this.snowBaseSpeeds = new Float32Array(this.maxSnowCount);

    for (let i = 0; i < this.maxSnowCount; i++) {
      this.snowPositions[i * 3] = (Math.random() - 0.5) * 90;
      this.snowPositions[i * 3 + 1] = Math.random() * 28 + 0.2;
      this.snowPositions[i * 3 + 2] = (Math.random() - 0.5) * 90;

      this.snowBaseSpeeds[i] = 1.8 + Math.random() * 2.8;
      this.snowVelocities[i * 3] = (Math.random() - 0.5) * 0.8;
      this.snowVelocities[i * 3 + 1] = -this.snowBaseSpeeds[i];
      this.snowVelocities[i * 3 + 2] = (Math.random() - 0.5) * 0.8;
    }

    snowGeom.setAttribute('position', new THREE.BufferAttribute(this.snowPositions, 3));
    this.snowMaterial = new THREE.PointsMaterial({
      color: 0xf1f8ff,
      size: 0.24,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
    });
    this.snowPoints = new THREE.Points(snowGeom, this.snowMaterial);
    this.snowPoints.frustumCulled = false;
    scene.add(this.snowPoints);

    // --- Sparks / Chimney Smoke setup ---
    const sparkGeom = new THREE.BufferGeometry();
    this.sparkPositions = new Float32Array(this.sparkMax * 3);
    this.sparkVelocities = new Float32Array(this.sparkMax * 3);
    this.sparkLifes = new Float32Array(this.sparkMax);

    for (let i = 0; i < this.sparkMax; i++) {
      this.sparkPositions[i * 3 + 1] = -999;
      this.sparkLifes[i] = 0;
    }

    sparkGeom.setAttribute('position', new THREE.BufferAttribute(this.sparkPositions, 3));
    const sparkMat = new THREE.PointsMaterial({
      color: 0xfbbf24,
      size: 0.32,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.sparkPoints = new THREE.Points(sparkGeom, sparkMat);
    this.sparkPoints.frustumCulled = false;
    scene.add(this.sparkPoints);
  }

  /**
   * Update weather conditions and wind dynamics
   */
  public setWeather(weather: WeatherType, windSpeed = 1.0) {
    this.currentWeather = weather;
    this.windSpeedFactor = windSpeed;

    if (weather === 'blizzard') {
      this.activeSnowCount = this.maxSnowCount; // all 2,600 flakes
      this.snowMaterial.opacity = 0.95;
      this.snowMaterial.size = 0.35;
      // High sideways wind squall
      this.windVec.set(-14.0 * windSpeed, 0, -8.0 * windSpeed);
    } else if (weather === 'light_snow') {
      this.activeSnowCount = 1300;
      this.snowMaterial.opacity = 0.75;
      this.snowMaterial.size = 0.22;
      this.windVec.set(1.5, 0, 0.8);
    } else {
      // Clear skies: few occasional sunny sparkles
      this.activeSnowCount = 120;
      this.snowMaterial.opacity = 0.35;
      this.snowMaterial.size = 0.16;
      this.windVec.set(0.5, 0, 0.3);
    }
  }

  /**
   * Emit high-speed directional snow spray when plow blade pushes snow
   */
  public emitSnowSpray(bladePos: THREE.Vector3, forwardDir: THREE.Vector3, count: number = 8) {
    const rightDir = new THREE.Vector3(-forwardDir.z, 0, forwardDir.x).normalize();

    for (let c = 0; c < count; c++) {
      const p = this.sprayParticles.find((part) => part.life <= 0);
      if (!p) break;

      const side = Math.random() > 0.5 ? 1 : -1;
      const spread = (Math.random() - 0.5) * 0.7;

      p.pos.copy(bladePos);
      p.pos.x += rightDir.x * (side * 1.1 + spread);
      p.pos.z += rightDir.z * (side * 1.1 + spread);
      p.pos.y = 0.28 + Math.random() * 0.25;

      const speed = 4.5 + Math.random() * 6.5;
      p.vel.set(
        rightDir.x * side * speed + forwardDir.x * 1.5 + (Math.random() - 0.5) * 1.8,
        3.0 + Math.random() * 3.5,
        rightDir.z * side * speed + forwardDir.z * 1.5 + (Math.random() - 0.5) * 1.8
      );

      p.maxLife = 0.4 + Math.random() * 0.35;
      p.life = p.maxLife;
      p.size = 0.3 + Math.random() * 0.3;
    }
  }

  /**
   * Emit turbo sparks / hot salt behind vehicle
   */
  public emitTurboSparks(rearPos: THREE.Vector3, reverseDir: THREE.Vector3, count: number = 4) {
    for (let c = 0; c < count; c++) {
      for (let i = 0; i < this.sparkMax; i++) {
        if (this.sparkLifes[i] <= 0) {
          this.sparkPositions[i * 3] = rearPos.x + (Math.random() - 0.5) * 0.9;
          this.sparkPositions[i * 3 + 1] = rearPos.y + 0.35 + Math.random() * 0.3;
          this.sparkPositions[i * 3 + 2] = rearPos.z + (Math.random() - 0.5) * 0.9;

          const speed = 6.0 + Math.random() * 4.5;
          this.sparkVelocities[i * 3] = reverseDir.x * speed + (Math.random() - 0.5) * 2.5;
          this.sparkVelocities[i * 3 + 1] = 1.2 + Math.random() * 3.0;
          this.sparkVelocities[i * 3 + 2] = reverseDir.z * speed + (Math.random() - 0.5) * 2.5;

          this.sparkLifes[i] = 0.45;
          break;
        }
      }
    }
  }

  /**
   * Emit chimney smoke puffs rising from village cottages
   */
  public emitChimneySmoke(chimneyPos: THREE.Vector3) {
    if (Math.random() > 0.15) return;
    for (let i = 0; i < this.sparkMax; i++) {
      if (this.sparkLifes[i] <= 0) {
        this.sparkPositions[i * 3] = chimneyPos.x + (Math.random() - 0.5) * 0.2;
        this.sparkPositions[i * 3 + 1] = chimneyPos.y;
        this.sparkPositions[i * 3 + 2] = chimneyPos.z + (Math.random() - 0.5) * 0.2;

        this.sparkVelocities[i * 3] = this.windVec.x * 0.2 + (Math.random() - 0.5) * 0.3;
        this.sparkVelocities[i * 3 + 1] = 1.4 + Math.random() * 0.8;
        this.sparkVelocities[i * 3 + 2] = this.windVec.z * 0.2 + (Math.random() - 0.5) * 0.3;

        this.sparkLifes[i] = 1.4;
        break;
      }
    }
  }

  /**
   * Update particle positions per tick with dynamic wind physics
   */
  public update(dt: number, cameraPos: THREE.Vector3) {
    const gravity = 9.8;

    // 1. Update spray particles
    for (let i = 0; i < this.sprayMax; i++) {
      const p = this.sprayParticles[i];
      if (p.life > 0) {
        p.life -= dt;
        p.vel.y -= gravity * dt;
        // Pushed by wind
        p.vel.x += this.windVec.x * 0.4 * dt;
        p.vel.z += this.windVec.z * 0.4 * dt;
        p.pos.addScaledVector(p.vel, dt);

        if (p.pos.y < 0.05) {
          p.pos.y = 0.05;
          p.life = 0;
        }

        this.sprayPositions[i * 3] = p.pos.x;
        this.sprayPositions[i * 3 + 1] = p.pos.y;
        this.sprayPositions[i * 3 + 2] = p.pos.z;
        this.spraySizes[i] = p.size * (p.life / p.maxLife);
      } else {
        this.sprayPositions[i * 3 + 1] = -999;
      }
    }
    this.sprayGeom.attributes.position.needsUpdate = true;
    this.sprayGeom.attributes.size.needsUpdate = true;

    // 2. Update ambient weather snowflakes
    const snowAttr = this.snowPoints.geometry.attributes.position;
    const boxRadius = 45;
    const isBlizzard = this.currentWeather === 'blizzard';

    for (let i = 0; i < this.maxSnowCount; i++) {
      if (i >= this.activeSnowCount) {
        this.snowPositions[i * 3 + 1] = -999;
        continue;
      }

      // Blizzard flakes move fast sideways
      const fallSpeed = isBlizzard ? this.snowBaseSpeeds[i] * 2.2 : this.snowBaseSpeeds[i];
      this.snowPositions[i * 3] += this.windVec.x * dt;
      this.snowPositions[i * 3 + 1] -= fallSpeed * dt;
      this.snowPositions[i * 3 + 2] += this.windVec.z * dt;

      // Wrap around relative to camera view
      if (this.snowPositions[i * 3 + 1] < 0) {
        this.snowPositions[i * 3 + 1] = 26;
        this.snowPositions[i * 3] = cameraPos.x + (Math.random() - 0.5) * boxRadius * 1.6;
        this.snowPositions[i * 3 + 2] = cameraPos.z + (Math.random() - 0.5) * boxRadius * 1.6;
      }
    }
    snowAttr.needsUpdate = true;

    // 3. Update sparks / smoke
    const sparkAttr = this.sparkPoints.geometry.attributes.position;
    for (let i = 0; i < this.sparkMax; i++) {
      if (this.sparkLifes[i] > 0) {
        this.sparkLifes[i] -= dt;
        this.sparkPositions[i * 3] += (this.sparkVelocities[i * 3] + this.windVec.x * 0.3) * dt;
        this.sparkPositions[i * 3 + 1] += this.sparkVelocities[i * 3 + 1] * dt;
        this.sparkPositions[i * 3 + 2] += (this.sparkVelocities[i * 3 + 2] + this.windVec.z * 0.3) * dt;
        this.sparkVelocities[i * 3 + 1] -= gravity * 0.3 * dt;
      } else {
        this.sparkPositions[i * 3 + 1] = -999;
      }
    }
    sparkAttr.needsUpdate = true;
  }

  public dispose() {
    this.sprayGeom.dispose();
    if (Array.isArray(this.sprayPoints.material)) {
      this.sprayPoints.material.forEach((m) => m.dispose());
    } else {
      this.sprayPoints.material.dispose();
    }

    this.snowPoints.geometry.dispose();
    if (Array.isArray(this.snowPoints.material)) {
      this.snowPoints.material.forEach((m) => m.dispose());
    } else {
      this.snowPoints.material.dispose();
    }

    this.sparkPoints.geometry.dispose();
    if (Array.isArray(this.sparkPoints.material)) {
      this.sparkPoints.material.forEach((m) => m.dispose());
    } else {
      this.sparkPoints.material.dispose();
    }
  }
}
