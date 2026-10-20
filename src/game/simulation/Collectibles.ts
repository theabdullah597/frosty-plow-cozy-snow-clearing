import * as THREE from 'three';

export type CollectibleType = 'cocoa' | 'diamond' | 'shaker' | 'gift';

export interface CollectibleItem {
  id: number;
  type: CollectibleType;
  x: number;
  z: number;
  revealed: boolean;
  collected: boolean;
  mesh: THREE.Group;
}

export class CollectibleManager {
  public items: CollectibleItem[] = [];
  private group: THREE.Group;

  constructor(scene: THREE.Scene, roadTiles: { x: number; z: number }[]) {
    this.group = new THREE.Group();
    this.group.name = 'CollectiblesGroup';

    // Place 8 buried items strategically along roads
    const types: CollectibleType[] = ['cocoa', 'diamond', 'shaker', 'gift', 'cocoa', 'diamond', 'shaker', 'gift'];
    const totalTiles = roadTiles.length;
    const step = Math.floor(totalTiles / (types.length + 1));

    types.forEach((type, idx) => {
      const tileIndex = Math.min(totalTiles - 1, step * (idx + 1) + Math.floor(Math.random() * 20));
      const pos = roadTiles[tileIndex] || { x: 0, z: 0 };

      const mesh = this.createCollectibleMesh(type);
      mesh.position.set(pos.x, 0.45, pos.z);
      mesh.visible = false; // Hidden until snow is cleared!

      this.group.add(mesh);

      this.items.push({
        id: idx + 1,
        type,
        x: pos.x,
        z: pos.z,
        revealed: false,
        collected: false,
        mesh,
      });
    });

    scene.add(this.group);
  }

  private createCollectibleMesh(type: CollectibleType): THREE.Group {
    const item = new THREE.Group();

    if (type === 'cocoa') {
      // Hot Cocoa Mug with steam
      const mugMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.3 });
      const mug = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.18, 0.38, 12), mugMat);
      item.add(mug);

      // Handle
      const handleMat = new THREE.MeshStandardMaterial({ color: 0xdc2626 });
      const handle = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.04, 6, 12, Math.PI), handleMat);
      handle.position.set(0.22, 0, 0);
      handle.rotation.z = Math.PI / 2;
      item.add(handle);

      // Whipped cream & marshmallows
      const creamMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9 });
      const cream = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 6), creamMat);
      cream.position.y = 0.22;
      item.add(cream);

      // Warm glow
      const light = new THREE.PointLight(0xf97316, 1.2, 4);
      light.position.y = 0.3;
      item.add(light);
    } else if (type === 'diamond') {
      // Sparkling Frost Diamond
      const diamondMat = new THREE.MeshPhysicalMaterial({
        color: 0x38bdf8,
        metalness: 0.2,
        roughness: 0.1,
        transmission: 0.8,
        thickness: 0.6,
        emissive: 0x0284c7,
        emissiveIntensity: 0.6,
      });
      const diamondGeom = new THREE.OctahedronGeometry(0.32, 0);
      const diamond = new THREE.Mesh(diamondGeom, diamondMat);
      item.add(diamond);

      const light = new THREE.PointLight(0x38bdf8, 1.5, 5);
      light.position.y = 0.1;
      item.add(light);
    } else if (type === 'shaker') {
      // Golden Salt Shaker
      const goldMat = new THREE.MeshStandardMaterial({
        color: 0xfacc15,
        metalness: 0.9,
        roughness: 0.15,
        emissive: 0xeab308,
        emissiveIntensity: 0.4,
      });
      const shaker = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.22, 0.45, 8), goldMat);
      item.add(shaker);

      const cap = new THREE.Mesh(new THREE.SphereGeometry(0.17, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2), goldMat);
      cap.position.y = 0.225;
      item.add(cap);

      const light = new THREE.PointLight(0xfacc15, 1.4, 4);
      item.add(light);
    } else {
      // Holiday Gift Box
      const giftMat = new THREE.MeshStandardMaterial({ color: 0x10b981, roughness: 0.4 });
      const box = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.38, 0.38), giftMat);
      item.add(box);

      const ribbonMat = new THREE.MeshStandardMaterial({ color: 0xf43f5e, metalness: 0.4 });
      const ribbonH = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.08), ribbonMat);
      const ribbonV = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.4, 0.4), ribbonMat);
      item.add(ribbonH);
      item.add(ribbonV);

      const light = new THREE.PointLight(0x10b981, 1.2, 4);
      item.add(light);
    }

    return item;
  }

  /**
   * Check if newly cleared snow coords reveal any hidden items
   */
  public checkSnowCleared(clearedCoords: { x: number; z: number }[]): CollectibleItem[] {
    const revealedItems: CollectibleItem[] = [];

    for (const coord of clearedCoords) {
      for (const item of this.items) {
        if (!item.revealed && !item.collected) {
          const dx = item.x - coord.x;
          const dz = item.z - coord.z;
          if (dx * dx + dz * dz < 1.44) {
            item.revealed = true;
            item.mesh.visible = true;
            revealedItems.push(item);
          }
        }
      }
    }

    return revealedItems;
  }

  /**
   * Check if snowplow truck touches revealed items
   */
  public checkTruckPickup(truckPos: THREE.Vector3, truckRadius: number = 1.6): CollectibleItem[] {
    const collectedItems: CollectibleItem[] = [];

    for (const item of this.items) {
      if (item.revealed && !item.collected) {
        const dx = item.x - truckPos.x;
        const dz = item.z - truckPos.z;
        if (dx * dx + dz * dz < (truckRadius + 0.4) * (truckRadius + 0.4)) {
          item.collected = true;
          item.mesh.visible = false;
          collectedItems.push(item);
        }
      }
    }

    return collectedItems;
  }

  /**
   * Animate floating and spinning of revealed items
   */
  public update(dt: number) {
    const time = performance.now() * 0.003;
    for (const item of this.items) {
      if (item.revealed && !item.collected) {
        item.mesh.rotation.y += dt * 2.5;
        item.mesh.position.y = 0.5 + Math.sin(time + item.id) * 0.12;
      }
    }
  }

  public dispose() {
    this.group.children.forEach((c) => {
      if (c instanceof THREE.Group) {
        c.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.geometry.dispose();
            if (Array.isArray(child.material)) {
              child.material.forEach((m) => m.dispose());
            } else {
              child.material.dispose();
            }
          }
        });
      }
    });
  }
}
