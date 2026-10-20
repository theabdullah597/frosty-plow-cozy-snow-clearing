import * as THREE from 'three';

export interface SnowTile {
  index: number;
  x: number;
  z: number;
  cleared: boolean;
  scale: number;
  isTargetShrinking: boolean;
}

export class SnowField {
  public instancedMesh: THREE.InstancedMesh;
  public totalTiles: number = 0;
  public clearedTiles: number = 0;
  private tiles: SnowTile[] = [];
  private dummy: THREE.Object3D = new THREE.Object3D();

  // Spatial lookup grid for fast collision
  private gridCellSize: number = 2.0;
  private spatialMap: Map<string, number[]> = new Map();

  constructor(scene: THREE.Scene, roadTiles: { x: number; z: number }[]) {
    this.totalTiles = roadTiles.length;

    // Create puffy organic snowdrift mound geometry
    const snowGeom = new THREE.SphereGeometry(0.62, 9, 7);
    snowGeom.scale(1.0, 0.45, 1.0); // Flattened dome mound

    // Crystalline snowy material with subtle blue ambient tone
    const snowMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.5,
      metalness: 0.02,
    });

    this.instancedMesh = new THREE.InstancedMesh(snowGeom, snowMat, roadTiles.length);
    this.instancedMesh.castShadow = true;
    this.instancedMesh.receiveShadow = true;
    this.instancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

    // Initialize instances
    roadTiles.forEach((pos, idx) => {
      const tile: SnowTile = {
        index: idx,
        x: pos.x,
        z: pos.z,
        cleared: false,
        scale: 1.0 + (Math.sin(pos.x * 3 + pos.z * 2) * 0.15),
        isTargetShrinking: false,
      };
      this.tiles.push(tile);

      // Random slight jitter for natural cozy snowdrift look
      const jitterX = (Math.sin(idx * 99) * 0.12);
      const jitterZ = (Math.cos(idx * 77) * 0.12);

      this.dummy.position.set(pos.x + jitterX, 0.14, pos.z + jitterZ);
      this.dummy.scale.set(tile.scale, 1.0, tile.scale);
      this.dummy.rotation.y = (idx * 1.3) % (Math.PI * 2);
      this.dummy.updateMatrix();
      this.instancedMesh.setMatrixAt(idx, this.dummy.matrix);

      // Register in spatial lookup
      const cellKey = this.getCellKey(pos.x, pos.z);
      if (!this.spatialMap.has(cellKey)) {
        this.spatialMap.set(cellKey, []);
      }
      this.spatialMap.get(cellKey)!.push(idx);
    });

    this.instancedMesh.instanceMatrix.needsUpdate = true;
    this.instancedMesh.computeBoundingSphere();
    scene.add(this.instancedMesh);
  }

  private getCellKey(x: number, z: number): string {
    const cx = Math.floor(x / this.gridCellSize);
    const cz = Math.floor(z / this.gridCellSize);
    return `${cx},${cz}`;
  }

  /**
   * Check collision against blade position & width.
   * Returns number of snow tiles cleared in this frame.
   */
  public plowAt(bladePos: THREE.Vector3, bladeWidth: number, plowDir: THREE.Vector3): { clearedCount: number; clearedCoords: { x: number; z: number }[] } {
    let clearedCount = 0;
    const clearedCoords: { x: number; z: number }[] = [];
    const radius = (bladeWidth / 2) * 1.05;

    const minCx = Math.floor((bladePos.x - radius) / this.gridCellSize);
    const maxCx = Math.floor((bladePos.x + radius) / this.gridCellSize);
    const minCz = Math.floor((bladePos.z - radius) / this.gridCellSize);
    const maxCz = Math.floor((bladePos.z + radius) / this.gridCellSize);

    let matrixNeedsUpdate = false;

    for (let cx = minCx; cx <= maxCx; cx++) {
      for (let cz = minCz; cz <= maxCz; cz++) {
        const key = `${cx},${cz}`;
        const indices = this.spatialMap.get(key);
        if (!indices) continue;

        for (let i = 0; i < indices.length; i++) {
          const idx = indices[i];
          const tile = this.tiles[idx];
          if (tile.cleared) continue;

          const dx = tile.x - bladePos.x;
          const dz = tile.z - bladePos.z;
          const distSq = dx * dx + dz * dz;

          // Check if within blade clearing radius
          if (distSq < radius * radius) {
            tile.cleared = true;
            tile.isTargetShrinking = true;
            tile.scale = 0.001; // Instant pop/disappear
            this.clearedTiles++;
            clearedCount++;
            clearedCoords.push({ x: tile.x, z: tile.z });

            // Update instance transform to scale 0
            this.dummy.position.set(tile.x, -5, tile.z); // drop out
            this.dummy.scale.set(0, 0, 0);
            this.dummy.updateMatrix();
            this.instancedMesh.setMatrixAt(idx, this.dummy.matrix);
            matrixNeedsUpdate = true;
          }
        }
      }
    }

    if (matrixNeedsUpdate) {
      this.instancedMesh.instanceMatrix.needsUpdate = true;
    }

    return { clearedCount, clearedCoords };
  }

  public getPercentCleared(): number {
    if (this.totalTiles === 0) return 100;
    return Math.min(100, (this.clearedTiles / this.totalTiles) * 100);
  }

  public reset() {
    this.clearedTiles = 0;
    this.tiles.forEach((tile, idx) => {
      tile.cleared = false;
      tile.scale = 1.0;
      this.dummy.position.set(tile.x, 0.14, tile.z);
      this.dummy.scale.set(1.0, 1.0, 1.0);
      this.dummy.updateMatrix();
      this.instancedMesh.setMatrixAt(idx, this.dummy.matrix);
    });
    this.instancedMesh.instanceMatrix.needsUpdate = true;
  }

  public dispose() {
    this.instancedMesh.geometry.dispose();
    if (Array.isArray(this.instancedMesh.material)) {
      this.instancedMesh.material.forEach((m) => m.dispose());
    } else {
      this.instancedMesh.material.dispose();
    }
  }
}
