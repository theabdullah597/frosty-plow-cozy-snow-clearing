import * as THREE from 'three';
import { createAlpineCabin, createPineTree, createStreetLamp, createSnowman } from '../graphics/models';
import { District } from '../types';

export interface WorldObstacle {
  x: number;
  z: number;
  radius: number;
  type: 'cabin' | 'tree' | 'lamp' | 'snowman';
  mesh?: THREE.Object3D;
}

export interface IceZone {
  x: number;
  z: number;
  radius: number;
}

export interface WorldData {
  group: THREE.Group;
  roadTiles: { x: number; z: number }[];
  obstacles: WorldObstacle[];
  iceZones: IceZone[];
  startPos: THREE.Vector3;
}

export const DISTRICTS: District[] = [
  {
    id: 1,
    name: 'Pinecone Pass',
    theme: 'Alpine Mountain Lane',
    description: 'A cozy mountain neighborhood with winding residential roads, snowdrifts, and cottages.',
    targetPercent: 75,
    gridWidth: 60,
    gridDepth: 60,
    weather: 'light_snow',
    timeOfDay: 'day',
  },
  {
    id: 2,
    name: 'Frosty Village Square',
    theme: 'Holiday Town Center',
    description: 'A bustling village center with a decorative pavilion, frozen pond, and cozy bakeries.',
    targetPercent: 80,
    gridWidth: 70,
    gridDepth: 70,
    weather: 'clear',
    timeOfDay: 'sunset',
  },
  {
    id: 3,
    name: 'Glacier Ridge Chalets',
    theme: 'High Altitude Ski Resort',
    description: 'Steep chalet driveways, heavy snowbanks, and icy hairpins high in the snowy peaks.',
    targetPercent: 85,
    gridWidth: 80,
    gridDepth: 80,
    weather: 'blizzard',
    timeOfDay: 'twilight',
  },
];

export function buildDistrictWorld(districtId: number): WorldData {
  const worldGroup = new THREE.Group();
  worldGroup.name = `District_${districtId}`;

  const obstacles: WorldObstacle[] = [];
  const iceZones: IceZone[] = [];
  const roadTiles: { x: number; z: number }[] = [];

  // Ground Terrain (Snowy field extending far into distance)
  const terrainSize = 140;
  const terrainGeom = new THREE.PlaneGeometry(terrainSize, terrainSize, 24, 24);
  terrainGeom.rotateX(-Math.PI / 2);

  // Add subtle gentle rolling hills to outer edges
  const posAttr = terrainGeom.attributes.position;
  for (let i = 0; i < posAttr.count; i++) {
    const x = posAttr.getX(i);
    const z = posAttr.getZ(i);
    const distFromCenter = Math.sqrt(x * x + z * z);
    if (distFromCenter > 38) {
      const hill = (distFromCenter - 38) * 0.22 + Math.sin(x * 0.15) * Math.cos(z * 0.15) * 1.5;
      posAttr.setY(i, hill);
    }
  }
  terrainGeom.computeVertexNormals();

  const snowTerrainMat = new THREE.MeshStandardMaterial({
    color: 0xf1f5f9,
    roughness: 0.85,
    metalness: 0.05,
  });
  const terrainMesh = new THREE.Mesh(terrainGeom, snowTerrainMat);
  terrainMesh.receiveShadow = true;
  worldGroup.add(terrainMesh);

  // Materials for roads & curbs
  const asphaltMat = new THREE.MeshStandardMaterial({
    color: 0x18202f, // Wet dark asphalt
    roughness: 0.35,
    metalness: 0.25,
  });

  const curbMat = new THREE.MeshStandardMaterial({
    color: 0x475569, // Slate stone curb
    roughness: 0.85,
    metalness: 0.1,
  });

  const centerLineMat = new THREE.MeshStandardMaterial({
    color: 0xfacc15,
    roughness: 0.5,
  });

  // Helper to generate a straight road ribbon with curbs, center markings, and snow coverage
  const addRoadSegment = (startX: number, startZ: number, endX: number, endZ: number, roadWidth = 5.4) => {
    const dx = endX - startX;
    const dz = endZ - startZ;
    const length = Math.sqrt(dx * dx + dz * dz);
    const angle = Math.atan2(dx, dz);

    const midX = (startX + endX) / 2;
    const midZ = (startZ + endZ) / 2;

    // 1. Asphalt road surface
    const roadGeom = new THREE.PlaneGeometry(roadWidth, length);
    roadGeom.rotateX(-Math.PI / 2);
    const roadMesh = new THREE.Mesh(roadGeom, asphaltMat);
    roadMesh.position.set(midX, 0.04, midZ);
    roadMesh.rotation.y = angle;
    roadMesh.receiveShadow = true;
    worldGroup.add(roadMesh);

    // 2. Yellow centerline
    const lineGeom = new THREE.PlaneGeometry(0.18, length * 0.95);
    lineGeom.rotateX(-Math.PI / 2);
    const lineMesh = new THREE.Mesh(lineGeom, centerLineMat);
    lineMesh.position.set(midX, 0.045, midZ);
    lineMesh.rotation.y = angle;
    worldGroup.add(lineMesh);

    // 3. Stone Curbs on Left & Right
    const curbGeom = new THREE.BoxGeometry(0.24, 0.14, length);
    const leftCurb = new THREE.Mesh(curbGeom, curbMat);
    const rightCurb = new THREE.Mesh(curbGeom, curbMat);

    const perpX = -Math.sin(angle + Math.PI / 2);
    const perpZ = -Math.cos(angle + Math.PI / 2);

    leftCurb.position.set(midX - perpX * (roadWidth / 2 + 0.1), 0.08, midZ - perpZ * (roadWidth / 2 + 0.1));
    leftCurb.rotation.y = angle;
    leftCurb.castShadow = true;
    leftCurb.receiveShadow = true;

    rightCurb.position.set(midX + perpX * (roadWidth / 2 + 0.1), 0.08, midZ + perpZ * (roadWidth / 2 + 0.1));
    rightCurb.rotation.y = angle;
    rightCurb.castShadow = true;
    rightCurb.receiveShadow = true;

    worldGroup.add(leftCurb);
    worldGroup.add(rightCurb);

    // Populate roadTiles on grid
    const step = 0.95;
    const stepsLen = Math.floor(length / step);
    const stepsWidth = Math.floor(roadWidth / step);

    for (let l = 0; l <= stepsLen; l++) {
      const frac = l / stepsLen;
      const curX = startX + dx * frac;
      const curZ = startZ + dz * frac;

      const perpX = -Math.sin(angle + Math.PI / 2);
      const perpZ = -Math.cos(angle + Math.PI / 2);

      for (let w = -Math.floor(stepsWidth / 2); w <= Math.floor(stepsWidth / 2); w++) {
        const tx = curX + perpX * (w * step);
        const tz = curZ + perpZ * (w * step);

        // Deduplicate roughly
        const isNearExisting = roadTiles.some(
          (t) => Math.abs(t.x - tx) < 0.45 && Math.abs(t.z - tz) < 0.45
        );
        if (!isNearExisting) {
          roadTiles.push({ x: tx, z: tz });
        }
      }
    }
  };

  // Helper to add cozy cottage with obstacle collision
  const addCabin = (x: number, z: number, rotY = 0, width = 4.4, depth = 3.8) => {
    const cabin = createAlpineCabin(width, depth, 2.8);
    cabin.position.set(x, 0, z);
    cabin.rotation.y = rotY;
    worldGroup.add(cabin);

    obstacles.push({
      x,
      z,
      radius: Math.max(width, depth) * 0.58,
      type: 'cabin',
      mesh: cabin,
    });
  };

  // Helper to add Pine Tree
  const addTree = (x: number, z: number, height = 4.2) => {
    const tree = createPineTree(height);
    tree.position.set(x, 0, z);
    worldGroup.add(tree);

    obstacles.push({
      x,
      z,
      radius: 0.9,
      type: 'tree',
      mesh: tree,
    });
  };

  // Helper to add street lamp
  const addLamp = (x: number, z: number) => {
    const lamp = createStreetLamp();
    lamp.position.set(x, 0, z);
    worldGroup.add(lamp);

    obstacles.push({
      x,
      z,
      radius: 0.45,
      type: 'lamp',
      mesh: lamp,
    });
  };

  // Helper to add Snowman (destructible or cheerable!)
  const addSnowmanProp = (x: number, z: number) => {
    const snowman = createSnowman();
    snowman.position.set(x, 0, z);
    worldGroup.add(snowman);

    obstacles.push({
      x,
      z,
      radius: 0.65,
      type: 'snowman',
      mesh: snowman,
    });
  };

  // Helper to add ice patch
  const addIce = (x: number, z: number, radius = 5.0) => {
    const iceGeom = new THREE.CircleGeometry(radius, 24);
    iceGeom.rotateX(-Math.PI / 2);
    const iceMat = new THREE.MeshPhysicalMaterial({
      color: 0x93c5fd,
      roughness: 0.08,
      metalness: 0.15,
      transmission: 0.4,
      transparent: true,
      opacity: 0.8,
    });
    const iceMesh = new THREE.Mesh(iceGeom, iceMat);
    iceMesh.position.set(x, 0.05, z);
    worldGroup.add(iceMesh);

    iceZones.push({ x, z, radius });
  };

  // --- DISTRICT 1: Pinecone Pass ---
  if (districtId === 1) {
    // Main avenue
    addRoadSegment(-32, 0, 32, 0, 5.6);
    // Cross avenue
    addRoadSegment(0, -32, 0, 32, 5.6);
    // Residential loop roads
    addRoadSegment(-20, -20, 20, -20, 4.8);
    addRoadSegment(-20, 20, 20, 20, 4.8);
    addRoadSegment(-20, -20, -20, 20, 4.8);
    addRoadSegment(20, -20, 20, 20, 4.8);

    // Cabins along outer and inner roads
    addCabin(-12, 12, 0);
    addCabin(12, 12, Math.PI);
    addCabin(-12, -12, 0);
    addCabin(12, -12, Math.PI / 2);

    addCabin(-27, 8, Math.PI / 2);
    addCabin(-27, -8, Math.PI / 2);
    addCabin(27, 8, -Math.PI / 2);
    addCabin(27, -8, -Math.PI / 2);

    // Lamps along avenues
    addLamp(-10, 3.4);
    addLamp(10, 3.4);
    addLamp(-10, -3.4);
    addLamp(10, -3.4);
    addLamp(3.4, -10);
    addLamp(-3.4, 10);

    // Snowmen in front yards
    addSnowmanProp(-8, 9);
    addSnowmanProp(8, -9);
    addSnowmanProp(-23, 14);

    // Frozen puddle ice patch
    addIce(10, 10, 3.8);

    // Forest borders
    for (let i = -36; i <= 36; i += 7) {
      addTree(-37, i, 4.2 + (i % 3) * 0.5);
      addTree(37, i, 4.0 + (i % 2) * 0.7);
      addTree(i, -37, 4.5);
      addTree(i, 37, 4.2);
    }
  }
  // --- DISTRICT 2: Frosty Village Square ---
  else if (districtId === 2) {
    // Central Plaza ring
    const plazaRadius = 14;
    for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
      const x1 = Math.cos(a) * plazaRadius;
      const z1 = Math.sin(a) * plazaRadius;
      const x2 = Math.cos(a + Math.PI / 4) * plazaRadius;
      const z2 = Math.sin(a + Math.PI / 4) * plazaRadius;
      addRoadSegment(x1, z1, x2, z2, 5.8);
    }

    // Spokes outward
    addRoadSegment(0, 14, 0, 36, 5.2);
    addRoadSegment(0, -14, 0, -36, 5.2);
    addRoadSegment(14, 0, 36, 0, 5.2);
    addRoadSegment(-14, 0, -36, 0, 5.2);

    // Central Ice Skating Rink!
    addIce(0, 0, 8.5);

    // Giant Lit Town Christmas Tree in plaza
    const townTree = createPineTree(8.2);
    townTree.position.set(0, 0, 0);
    worldGroup.add(townTree);
    obstacles.push({ x: 0, z: 0, radius: 1.8, type: 'tree', mesh: townTree });

    // Surrounding town shops & chalets
    addCabin(-22, 22, Math.PI / 4, 5.0, 4.2);
    addCabin(22, 22, -Math.PI / 4, 5.0, 4.2);
    addCabin(-22, -22, Math.PI * 0.75, 5.0, 4.2);
    addCabin(22, -22, -Math.PI * 0.75, 5.0, 4.2);

    // Plazas lamps
    for (let a = 0; a < Math.PI * 2; a += Math.PI / 3) {
      addLamp(Math.cos(a) * 11.5, Math.sin(a) * 11.5);
    }

    // Snowmen & trees
    addSnowmanProp(-16, 8);
    addSnowmanProp(16, -8);
    addSnowmanProp(8, 16);

    for (let i = -40; i <= 40; i += 7) {
      addTree(-42, i, 4.5);
      addTree(42, i, 4.5);
      addTree(i, -42, 4.5);
      addTree(i, 42, 4.5);
    }
  }
  // --- DISTRICT 3: Glacier Ridge Chalets ---
  else {
    // S-curve mountain pass roads
    addRoadSegment(-36, -26, -14, -26, 5.6);
    addRoadSegment(-14, -26, 12, -12, 5.6);
    addRoadSegment(12, -12, -12, 8, 5.6);
    addRoadSegment(-12, 8, 22, 18, 5.6);
    addRoadSegment(22, 18, 36, 32, 5.6);

    // Side branches & chalet driveways
    addRoadSegment(-14, -26, -28, -8, 4.4);
    addRoadSegment(12, -12, 28, -24, 4.4);
    addRoadSegment(-12, 8, -32, 22, 4.4);

    // Luxury mountain chalets
    addCabin(-32, -6, 0, 5.2, 4.5);
    addCabin(28, -26, Math.PI, 5.2, 4.5);
    addCabin(-32, 24, 0.4, 5.2, 4.5);
    addCabin(30, 24, -Math.PI / 2, 5.2, 4.5);

    // Large frozen alpine lake
    addIce(-4, -4, 9.5);

    // Street lamps along pass
    addLamp(-20, -23);
    addLamp(0, -17);
    addLamp(0, 10);
    addLamp(16, 15);

    addSnowmanProp(-22, -12);
    addSnowmanProp(18, 8);
    addSnowmanProp(-4, 15);

    // Dense mountain pine groves
    for (let i = -42; i <= 42; i += 6) {
      addTree(-44, i, 5.2);
      addTree(44, i, 5.2);
      addTree(i, -44, 5.2);
      addTree(i, 44, 5.2);
    }
  }

  const startPos = new THREE.Vector3(roadTiles[0]?.x || 0, 0, roadTiles[0]?.z || 0);

  return {
    group: worldGroup,
    roadTiles,
    obstacles,
    iceZones,
    startPos,
  };
}
