import * as THREE from 'three';
import { TruckColor } from '../types';

// Palette definitions for truck paints
export const TRUCK_COLORS: Record<TruckColor, { hex: number; name: string; accent: number }> = {
  orange: { hex: 0xf97316, name: 'Blaze Orange', accent: 0xea580c },
  yellow: { hex: 0xeab308, name: 'Arctic Yellow', accent: 0xca8a04 },
  teal: { hex: 0x06b6d4, name: 'Glacier Teal', accent: 0x0891b2 },
  red: { hex: 0xef4444, name: 'Holiday Crimson', accent: 0xdc2626 },
  navy: { hex: 0x3b82f6, name: 'Alpine Blue', accent: 0x2563eb },
};

/**
 * Creates high-detail procedural Hero Snowplow Truck
 */
export function createSnowplowTruck(colorKey: TruckColor = 'orange') {
  const truckGroup = new THREE.Group();
  truckGroup.name = 'SnowplowTruck';

  const colorConfig = TRUCK_COLORS[colorKey];

  // Materials
  const bodyMaterial = new THREE.MeshStandardMaterial({
    color: colorConfig.hex,
    roughness: 0.32,
    metalness: 0.3,
  });

  const darkSteelMaterial = new THREE.MeshStandardMaterial({
    color: 0x1f242d,
    roughness: 0.65,
    metalness: 0.7,
  });

  const chromeMaterial = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    roughness: 0.12,
    metalness: 0.95,
  });

  const rubberTireMaterial = new THREE.MeshStandardMaterial({
    color: 0x14161b,
    roughness: 0.88,
    metalness: 0.08,
  });

  const glassMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x7dd3fc,
    metalness: 0.15,
    roughness: 0.08,
    transmission: 0.7,
    thickness: 0.5,
    transparent: true,
    opacity: 0.82,
    clearcoat: 1.0,
    clearcoatRoughness: 0.1,
  });

  const bladeSteelMaterial = new THREE.MeshStandardMaterial({
    color: 0xd1d5db,
    metalness: 0.85,
    roughness: 0.22,
  });

  const beaconMaterial = new THREE.MeshStandardMaterial({
    color: 0xfbbf24,
    emissive: 0xf59e0b,
    emissiveIntensity: 2.4,
    roughness: 0.15,
  });

  const headlightMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xfff7ed,
    emissiveIntensity: 3.0,
    roughness: 0.05,
  });

  // 1. Chassis Frame & Heavy Front Bumper
  const chassisGeom = new THREE.BoxGeometry(1.65, 0.42, 3.5);
  const chassis = new THREE.Mesh(chassisGeom, darkSteelMaterial);
  chassis.position.set(0, 0.45, 0);
  chassis.castShadow = true;
  chassis.receiveShadow = true;
  truckGroup.add(chassis);

  // Heavy steel push bumper
  const bumperGeom = new THREE.BoxGeometry(1.85, 0.38, 0.4);
  const bumper = new THREE.Mesh(bumperGeom, darkSteelMaterial);
  bumper.position.set(0, 0.45, 1.82);
  bumper.castShadow = true;
  truckGroup.add(bumper);

  // 2. Main Cabin & Hood
  const cabGroup = new THREE.Group();
  cabGroup.name = 'CabBody';

  // Hood with engine vent indent
  const hoodGeom = new THREE.BoxGeometry(1.52, 0.62, 1.45);
  const hood = new THREE.Mesh(hoodGeom, bodyMaterial);
  hood.position.set(0, 0.76, 0.85);
  hood.castShadow = true;
  cabGroup.add(hood);

  // Hood intake scoop
  const scoopGeom = new THREE.BoxGeometry(0.7, 0.1, 0.6);
  const scoop = new THREE.Mesh(scoopGeom, darkSteelMaterial);
  scoop.position.set(0, 1.1, 0.8);
  cabGroup.add(scoop);

  // Cab enclosure
  const cabinGeom = new THREE.BoxGeometry(1.52, 0.95, 1.25);
  const cabin = new THREE.Mesh(cabinGeom, bodyMaterial);
  cabin.position.set(0, 1.12, -0.32);
  cabin.castShadow = true;
  cabGroup.add(cabin);

  // Interior warm dashboard glow
  const dashGlowGeom = new THREE.BoxGeometry(1.1, 0.15, 0.2);
  const dashGlowMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
  const dashGlow = new THREE.Mesh(dashGlowGeom, dashGlowMat);
  dashGlow.position.set(0, 0.92, 0.18);
  cabGroup.add(dashGlow);

  // Front Windshield
  const windshieldGeom = new THREE.BoxGeometry(1.44, 0.58, 0.08);
  const windshield = new THREE.Mesh(windshieldGeom, glassMaterial);
  windshield.position.set(0, 1.2, 0.32);
  windshield.rotation.x = -0.16;
  cabGroup.add(windshield);

  // Rear cabin window
  const rearWin = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.46, 0.08), glassMaterial);
  rearWin.position.set(0, 1.22, -0.96);
  cabGroup.add(rearWin);

  // Side windows
  const leftWin = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.44, 0.75), glassMaterial);
  leftWin.position.set(-0.77, 1.22, -0.32);
  const rightWin = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.44, 0.75), glassMaterial);
  rightWin.position.set(0.77, 1.22, -0.32);
  cabGroup.add(leftWin);
  cabGroup.add(rightWin);

  // Side view mirrors
  const mirrorGeom = new THREE.BoxGeometry(0.06, 0.2, 0.12);
  const leftMirror = new THREE.Mesh(mirrorGeom, darkSteelMaterial);
  leftMirror.position.set(-0.88, 1.15, 0.1);
  const rightMirror = new THREE.Mesh(mirrorGeom, darkSteelMaterial);
  rightMirror.position.set(0.88, 1.15, 0.1);
  cabGroup.add(leftMirror);
  cabGroup.add(rightMirror);

  truckGroup.add(cabGroup);

  // 3. Salt Hopper Bed in rear with safety rails
  const hopperGeom = new THREE.BoxGeometry(1.5, 0.75, 1.2);
  const hopper = new THREE.Mesh(hopperGeom, darkSteelMaterial);
  hopper.position.set(0, 0.92, -1.22);
  hopper.castShadow = true;
  truckGroup.add(hopper);

  // Salt crystals inside hopper
  const saltPileGeom = new THREE.ConeGeometry(0.6, 0.4, 7);
  const saltPileMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.95 });
  const saltPile = new THREE.Mesh(saltPileGeom, saltPileMat);
  saltPile.position.set(0, 1.34, -1.22);
  truckGroup.add(saltPile);

  // Rear Salt Spreader Spinning Disc (Animated!)
  const spinnerShaft = new THREE.Group();
  spinnerShaft.name = 'SaltSpinner';
  spinnerShaft.position.set(0, 0.42, -1.9);

  const discGeom = new THREE.CylinderGeometry(0.32, 0.32, 0.05, 12);
  const discMat = new THREE.MeshStandardMaterial({ color: 0xeab308, metalness: 0.8, roughness: 0.2 });
  const spinnerDisc = new THREE.Mesh(discGeom, discMat);
  spinnerShaft.add(spinnerDisc);

  // 4 Spinner vanes
  for (let v = 0; v < 4; v++) {
    const vane = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.06, 0.28), discMat);
    vane.rotation.y = (v * Math.PI) / 2;
    spinnerShaft.add(vane);
  }
  truckGroup.add(spinnerShaft);

  // 4. Heavy Knobby All-Terrain Wheels with Rims & Lugs
  const wheelRadius = 0.44;
  const wheelWidth = 0.34;
  const wheelGeom = new THREE.CylinderGeometry(wheelRadius, wheelRadius, wheelWidth, 18);
  wheelGeom.rotateZ(Math.PI / 2);

  const rimGeom = new THREE.CylinderGeometry(wheelRadius * 0.6, wheelRadius * 0.6, wheelWidth + 0.03, 10);
  rimGeom.rotateZ(Math.PI / 2);

  const hubcapGeom = new THREE.CylinderGeometry(0.12, 0.12, wheelWidth + 0.05, 8);
  hubcapGeom.rotateZ(Math.PI / 2);

  const createDetailedWheel = () => {
    const wheelGroup = new THREE.Group();
    const tire = new THREE.Mesh(wheelGeom, rubberTireMaterial);
    tire.castShadow = true;
    const rim = new THREE.Mesh(rimGeom, chromeMaterial);
    const hub = new THREE.Mesh(hubcapGeom, darkSteelMaterial);
    wheelGroup.add(tire);
    wheelGroup.add(rim);
    wheelGroup.add(hub);
    return wheelGroup;
  };

  const frontWheelsGroup = new THREE.Group();
  frontWheelsGroup.position.set(0, 0.44, 1.05);

  const leftFrontWheel = createDetailedWheel();
  leftFrontWheel.position.set(-0.88, 0, 0);
  const rightFrontWheel = createDetailedWheel();
  rightFrontWheel.position.set(0.88, 0, 0);

  frontWheelsGroup.add(leftFrontWheel);
  frontWheelsGroup.add(rightFrontWheel);
  truckGroup.add(frontWheelsGroup);

  // Rear wheels
  const rearWheelsGroup = new THREE.Group();
  rearWheelsGroup.position.set(0, 0.44, -1.02);

  const leftRearWheel = createDetailedWheel();
  leftRearWheel.position.set(-0.88, 0, 0);
  const rightRearWheel = createDetailedWheel();
  rightRearWheel.position.set(0.88, 0, 0);

  rearWheelsGroup.add(leftRearWheel);
  rearWheelsGroup.add(rightRearWheel);
  truckGroup.add(rearWheelsGroup);

  // 5. Heavy Curved Snow Plow Blade Assembly (Front)
  const plowAssembly = new THREE.Group();
  plowAssembly.name = 'PlowAssembly';
  plowAssembly.position.set(0, 0.38, 2.05);

  // Dual chrome hydraulic lift pistons
  const cylGeom = new THREE.CylinderGeometry(0.08, 0.08, 0.45, 8);
  cylGeom.rotateX(Math.PI / 2.3);
  const rodGeom = new THREE.CylinderGeometry(0.045, 0.045, 0.55, 8);
  rodGeom.rotateX(Math.PI / 2.3);

  const leftCyl = new THREE.Mesh(cylGeom, darkSteelMaterial);
  leftCyl.position.set(-0.48, 0.12, -0.25);
  const leftRod = new THREE.Mesh(rodGeom, chromeMaterial);
  leftRod.position.set(-0.48, 0.16, -0.15);
  plowAssembly.add(leftCyl);
  plowAssembly.add(leftRod);

  const rightCyl = new THREE.Mesh(cylGeom, darkSteelMaterial);
  rightCyl.position.set(0.48, 0.12, -0.25);
  const rightRod = new THREE.Mesh(rodGeom, chromeMaterial);
  rightRod.position.set(0.48, 0.16, -0.15);
  plowAssembly.add(rightCyl);
  plowAssembly.add(rightRod);

  // Blade Mesh (Curved scoop)
  const bladeWidth = 2.5;
  const bladeMeshGeom = new THREE.BoxGeometry(bladeWidth, 0.78, 0.14);
  const bladeMesh = new THREE.Mesh(bladeMeshGeom, bladeSteelMaterial);
  bladeMesh.position.set(0, 0.24, 0.12);
  bladeMesh.rotation.x = -0.14;
  bladeMesh.castShadow = true;
  plowAssembly.add(bladeMesh);

  // Chevron Hazard Strip along top edge of blade
  const hazardGeom = new THREE.BoxGeometry(bladeWidth + 0.08, 0.14, 0.16);
  const hazardMat = new THREE.MeshStandardMaterial({
    color: 0xfacc15,
    metalness: 0.3,
    roughness: 0.4,
  });
  const hazardStrip = new THREE.Mesh(hazardGeom, hazardMat);
  hazardStrip.position.set(0, 0.6, 0.08);
  plowAssembly.add(hazardStrip);

  // Rubber bottom cutting edge
  const rubberEdgeGeom = new THREE.BoxGeometry(bladeWidth + 0.06, 0.09, 0.18);
  const rubberEdge = new THREE.Mesh(rubberEdgeGeom, rubberTireMaterial);
  rubberEdge.position.set(0, -0.12, 0.16);
  plowAssembly.add(rubberEdge);

  // Side deflector wings
  const wingGeom = new THREE.BoxGeometry(0.12, 0.72, 0.35);
  const leftWing = new THREE.Mesh(wingGeom, bladeSteelMaterial);
  leftWing.position.set(-bladeWidth / 2 - 0.02, 0.24, -0.02);
  leftWing.rotation.y = 0.25;
  const rightWing = new THREE.Mesh(wingGeom, bladeSteelMaterial);
  rightWing.position.set(bladeWidth / 2 + 0.02, 0.24, -0.02);
  rightWing.rotation.y = -0.25;
  plowAssembly.add(leftWing);
  plowAssembly.add(rightWing);

  truckGroup.add(plowAssembly);

  // 6. Rooftop Amber Warning Beacon Bar with dual beacons
  const lightBarGeom = new THREE.BoxGeometry(1.2, 0.08, 0.2);
  const lightBar = new THREE.Mesh(lightBarGeom, darkSteelMaterial);
  lightBar.position.set(0, 1.62, -0.32);

  const beaconDomeGeom = new THREE.SphereGeometry(0.12, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2);
  const leftBeacon = new THREE.Mesh(beaconDomeGeom, beaconMaterial);
  leftBeacon.position.set(-0.42, 0.04, 0);
  const rightBeacon = new THREE.Mesh(beaconDomeGeom, beaconMaterial);
  rightBeacon.position.set(0.42, 0.04, 0);
  lightBar.add(leftBeacon);
  lightBar.add(rightBeacon);

  // Amber point lights
  const beaconLight = new THREE.PointLight(0xf59e0b, 1.8, 6.5);
  beaconLight.position.set(0, 0.15, 0);
  lightBar.add(beaconLight);

  truckGroup.add(lightBar);

  // 7. Headlights + Volumetric Light Beam Cones
  const headlampGeom = new THREE.CylinderGeometry(0.14, 0.14, 0.1, 14);
  headlampGeom.rotateX(Math.PI / 2);

  const leftLamp = new THREE.Mesh(headlampGeom, headlightMaterial);
  leftLamp.position.set(-0.58, 0.74, 1.6);
  const rightLamp = new THREE.Mesh(headlampGeom, headlightMaterial);
  rightLamp.position.set(0.58, 0.74, 1.6);
  truckGroup.add(leftLamp);
  truckGroup.add(rightLamp);

  // Volumetric Headlight Beams (Cones of warm light cutting forward)
  const beamGeom = new THREE.CylinderGeometry(0.14, 1.6, 9.5, 16, 1, true);
  beamGeom.rotateX(Math.PI / 2);
  beamGeom.translate(0, 0, 4.75); // origin at apex

  const beamMaterial = new THREE.MeshBasicMaterial({
    color: 0xffedd5,
    transparent: true,
    opacity: 0.18,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  });

  const leftBeam = new THREE.Mesh(beamGeom, beamMaterial);
  leftBeam.position.set(-0.58, 0.74, 1.6);
  leftBeam.rotation.y = 0.04;
  const rightBeam = new THREE.Mesh(beamGeom, beamMaterial);
  rightBeam.position.set(0.58, 0.74, 1.6);
  rightBeam.rotation.y = -0.04;
  truckGroup.add(leftBeam);
  truckGroup.add(rightBeam);

  // Real ground spotlight
  const headSpotlight = new THREE.SpotLight(0xfff7ed, 4.5, 22, Math.PI / 3.8, 0.45, 1.2);
  headSpotlight.position.set(0, 0.8, 1.6);
  const spotTarget = new THREE.Object3D();
  spotTarget.position.set(0, 0.05, 9.5);
  truckGroup.add(spotTarget);
  headSpotlight.target = spotTarget;
  truckGroup.add(headSpotlight);

  // 8. Twin Exhaust Stacks
  const exhaustGeom = new THREE.CylinderGeometry(0.055, 0.055, 1.0, 10);
  const leftExhaust = new THREE.Mesh(exhaustGeom, chromeMaterial);
  leftExhaust.position.set(-0.7, 1.4, -0.88);
  const rightExhaust = new THREE.Mesh(exhaustGeom, chromeMaterial);
  rightExhaust.position.set(0.7, 1.4, -0.88);
  truckGroup.add(leftExhaust);
  truckGroup.add(rightExhaust);

  // Curved exhaust pipe tips
  const tipGeom = new THREE.TorusGeometry(0.08, 0.04, 6, 8, Math.PI / 2);
  const leftTip = new THREE.Mesh(tipGeom, chromeMaterial);
  leftTip.position.set(-0.7, 1.9, -0.88);
  leftTip.rotation.x = -Math.PI / 2;
  const rightTip = new THREE.Mesh(tipGeom, chromeMaterial);
  rightTip.position.set(0.7, 1.9, -0.88);
  rightTip.rotation.x = -Math.PI / 2;
  truckGroup.add(leftTip);
  truckGroup.add(rightTip);

  // Contact shadow disc
  const shadowGeom = new THREE.PlaneGeometry(2.5, 4.6);
  shadowGeom.rotateX(-Math.PI / 2);
  const shadowMat = new THREE.MeshBasicMaterial({
    color: 0x050e18,
    transparent: true,
    opacity: 0.42,
    depthWrite: false,
  });
  const shadowMesh = new THREE.Mesh(shadowGeom, shadowMat);
  shadowMesh.position.y = 0.02;
  truckGroup.add(shadowMesh);

  return {
    group: truckGroup,
    frontWheelsGroup,
    rearWheelsGroup,
    plowAssembly,
    beaconBase: lightBar,
    beaconLight,
    spinnerShaft,
    beamMaterial,
    setBladeScale: (scaleX: number) => {
      bladeMesh.scale.x = scaleX;
      hazardStrip.scale.x = scaleX;
      rubberEdge.scale.x = scaleX;
      leftWing.position.x = (-bladeWidth * scaleX) / 2 - 0.02;
      rightWing.position.x = (bladeWidth * scaleX) / 2 + 0.02;
    },
    setColor: (newColorKey: TruckColor) => {
      const c = TRUCK_COLORS[newColorKey];
      bodyMaterial.color.setHex(c.hex);
    },
  };
}

/**
 * Creates high-detail Alpine Chalet / Log Cabin
 */
export function createAlpineCabin(width = 4.6, depth = 4.0, height = 3.0) {
  const cabin = new THREE.Group();
  cabin.name = 'AlpineCabin';

  // Foundation stone base
  const foundationMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.95 });
  const foundation = new THREE.Mesh(new THREE.BoxGeometry(width + 0.3, 0.45, depth + 0.3), foundationMat);
  foundation.position.y = 0.225;
  foundation.castShadow = true;
  foundation.receiveShadow = true;
  cabin.add(foundation);

  // Rich Cedar Log Walls
  const wallMat = new THREE.MeshStandardMaterial({
    color: 0x5c3826,
    roughness: 0.8,
    metalness: 0.05,
  });
  const walls = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), wallMat);
  walls.position.y = height / 2 + 0.35;
  walls.castShadow = true;
  walls.receiveShadow = true;
  cabin.add(walls);

  // Sloped Timber Roof
  const roofHeight = 1.8;
  const roofMat = new THREE.MeshStandardMaterial({ color: 0x3b2518, roughness: 0.85 });
  const roofGeom = new THREE.ConeGeometry(Math.max(width, depth) * 0.82, roofHeight, 4);
  roofGeom.rotateY(Math.PI / 4);
  const roof = new THREE.Mesh(roofGeom, roofMat);
  roof.position.y = height + 0.35 + roofHeight / 2 - 0.2;
  roof.scale.set(width / 3.8, 1, depth / 3.8);
  roof.castShadow = true;
  cabin.add(roof);

  // Sculpted Puffy Snow Cap with marshmallow-like thickness
  const snowRoofMat = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    roughness: 0.55,
    metalness: 0.05,
  });
  const snowRoofGeom = new THREE.ConeGeometry(Math.max(width, depth) * 0.88, roofHeight * 0.9, 4);
  snowRoofGeom.rotateY(Math.PI / 4);
  const snowRoof = new THREE.Mesh(snowRoofGeom, snowRoofMat);
  snowRoof.position.y = height + 0.35 + roofHeight / 2 - 0.05;
  snowRoof.scale.set(width / 3.6, 0.95, depth / 3.6);
  snowRoof.castShadow = true;
  cabin.add(snowRoof);

  // Glowing Windows with Wood Grids
  const windowGlowMat = new THREE.MeshStandardMaterial({
    color: 0xffedd5,
    emissive: 0xf59e0b,
    emissiveIntensity: 1.8,
    roughness: 0.15,
  });
  const frameMat = new THREE.MeshStandardMaterial({ color: 0x22150e, roughness: 0.9 });

  // Front Windows (pair)
  for (const side of [-1, 1]) {
    const winGroup = new THREE.Group();
    winGroup.position.set(side * (width * 0.28), height * 0.6 + 0.3, depth / 2 + 0.02);
    const winGlass = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.85, 0.08), windowGlowMat);
    const frame = new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.93, 0.06), frameMat);
    winGroup.add(frame);
    winGroup.add(winGlass);

    // Snowy window sill
    const sill = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.12, 0.18), snowRoofMat);
    sill.position.y = -0.45;
    winGroup.add(sill);

    cabin.add(winGroup);
  }

  // Wooden Cabin Door
  const doorGroup = new THREE.Group();
  doorGroup.position.set(0, 0.35 + 0.8, depth / 2 + 0.03);
  const door = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.6, 0.08), frameMat);
  doorGroup.add(door);
  cabin.add(doorGroup);

  // Stone Chimney
  const chimneyMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.92 });
  const chimney = new THREE.Mesh(new THREE.BoxGeometry(0.72, height + roofHeight + 0.5, 0.72), chimneyMat);
  chimney.position.set(width * 0.32, (height + roofHeight + 0.5) / 2, -depth * 0.22);
  chimney.castShadow = true;
  cabin.add(chimney);

  // Chimney snow rim
  const chimneySnow = new THREE.Mesh(new THREE.BoxGeometry(0.86, 0.16, 0.86), snowRoofMat);
  chimneySnow.position.set(width * 0.32, height + roofHeight + 0.45, -depth * 0.22);
  cabin.add(chimneySnow);

  // Warm ambient light pool outside house
  const houseLight = new THREE.PointLight(0xf59e0b, 1.4, 8.5);
  houseLight.position.set(0, 1.6, depth / 2 + 1.2);
  cabin.add(houseLight);

  return cabin;
}

/**
 * Creates rich Decorated Holiday Pine Tree with stacked snowy boughs
 * and twinkling fairy lights
 */
export function createPineTree(height = 4.8) {
  const tree = new THREE.Group();
  tree.name = 'PineTree';

  // Wood Trunk
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x3d2516, roughness: 0.9 });
  const trunkHeight = height * 0.24;
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.32, trunkHeight, 8), trunkMat);
  trunk.position.y = trunkHeight / 2;
  trunk.castShadow = true;
  tree.add(trunk);

  // Foliage tiers
  const pineGreenMat = new THREE.MeshStandardMaterial({
    color: 0x163828,
    roughness: 0.85,
  });

  const snowCapMat = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    roughness: 0.55,
  });

  const tiers = 4;
  for (let i = 0; i < tiers; i++) {
    const tierFrac = i / (tiers - 1);
    const tierRadius = (1 - tierFrac * 0.55) * (height * 0.38);
    const tierHeight = height * 0.32;
    const tierY = trunkHeight + i * (height * 0.2);

    // Green pine cone
    const cone = new THREE.Mesh(new THREE.ConeGeometry(tierRadius, tierHeight, 9), pineGreenMat);
    cone.position.y = tierY + tierHeight / 2;
    cone.castShadow = true;
    cone.receiveShadow = true;
    tree.add(cone);

    // Sculpted Snowy Rim
    const snowCap = new THREE.Mesh(
      new THREE.ConeGeometry(tierRadius * 0.82, tierHeight * 0.45, 9),
      snowCapMat
    );
    snowCap.position.y = tierY + tierHeight * 0.72;
    snowCap.castShadow = true;
    tree.add(snowCap);
  }

  // Twinkling Fairy lights
  const lightColors = [0xef4444, 0xfacc15, 0x38bdf8, 0x10b981];
  const fairyLightGeom = new THREE.SphereGeometry(0.09, 6, 6);
  for (let j = 0; j < 10; j++) {
    const angle = (j / 10) * Math.PI * 2;
    const yFrac = 0.25 + (j / 10) * 0.55;
    const r = (1 - yFrac * 0.55) * (height * 0.36);
    const col = lightColors[j % lightColors.length];
    const fairyMat = new THREE.MeshStandardMaterial({
      color: col,
      emissive: col,
      emissiveIntensity: 2.5,
      roughness: 0.1,
    });
    const bulb = new THREE.Mesh(fairyLightGeom, fairyMat);
    bulb.position.set(Math.cos(angle) * r, trunkHeight + yFrac * height * 0.7, Math.sin(angle) * r);
    tree.add(bulb);
  }

  return tree;
}

/**
 * Creates Vintage Cozy Street Lamp with warm ground glow pool
 */
export function createStreetLamp() {
  const lamp = new THREE.Group();
  lamp.name = 'StreetLamp';

  const ironMat = new THREE.MeshStandardMaterial({
    color: 0x111827,
    metalness: 0.8,
    roughness: 0.35,
  });

  const postGeom = new THREE.CylinderGeometry(0.08, 0.14, 3.4, 8);
  const post = new THREE.Mesh(postGeom, ironMat);
  post.position.y = 1.7;
  post.castShadow = true;
  lamp.add(post);

  // Base decorative bell
  const baseGeom = new THREE.CylinderGeometry(0.32, 0.38, 0.35, 8);
  const base = new THREE.Mesh(baseGeom, ironMat);
  base.position.y = 0.175;
  lamp.add(base);

  // Lantern head
  const headGroup = new THREE.Group();
  headGroup.position.y = 3.4;

  const glassMat = new THREE.MeshStandardMaterial({
    color: 0xffedd5,
    emissive: 0xf59e0b,
    emissiveIntensity: 2.6,
    roughness: 0.1,
  });
  const glass = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.16, 0.5, 6), glassMat);
  headGroup.add(glass);

  const cap = new THREE.Mesh(new THREE.ConeGeometry(0.35, 0.28, 6), ironMat);
  cap.position.y = 0.36;
  headGroup.add(cap);

  // Snow cap on top of lantern
  const snowCap = new THREE.Mesh(
    new THREE.ConeGeometry(0.3, 0.18, 6),
    new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.5 })
  );
  snowCap.position.y = 0.46;
  headGroup.add(snowCap);

  lamp.add(headGroup);

  // Warm light source
  const light = new THREE.PointLight(0xf59e0b, 2.2, 10.0);
  light.position.y = 3.3;
  lamp.add(light);

  // Warm golden ground halo decal
  const haloGeom = new THREE.CircleGeometry(3.2, 18);
  haloGeom.rotateX(-Math.PI / 2);
  const haloMat = new THREE.MeshBasicMaterial({
    color: 0xfbbf24,
    transparent: true,
    opacity: 0.18,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const halo = new THREE.Mesh(haloGeom, haloMat);
  halo.position.y = 0.05;
  lamp.add(halo);

  return lamp;
}

/**
 * Creates cute Snowman with carrot nose, top hat and coal stones
 */
export function createSnowman() {
  const snowman = new THREE.Group();
  snowman.name = 'Snowman';

  const snowMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.75 });
  const coalMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.95 });
  const carrotMat = new THREE.MeshStandardMaterial({ color: 0xea580c, roughness: 0.4 });
  const scarfMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.6 });
  const hatMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5 });

  // 3 Snow spheres
  const bottom = new THREE.Mesh(new THREE.SphereGeometry(0.68, 14, 12), snowMat);
  bottom.position.y = 0.58;
  bottom.castShadow = true;
  snowman.add(bottom);

  const middle = new THREE.Mesh(new THREE.SphereGeometry(0.5, 14, 12), snowMat);
  middle.position.y = 1.4;
  middle.castShadow = true;
  snowman.add(middle);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.36, 14, 12), snowMat);
  head.position.y = 2.02;
  head.castShadow = true;
  snowman.add(head);

  // Carrot Nose
  const carrotGeom = new THREE.ConeGeometry(0.065, 0.32, 8);
  carrotGeom.rotateX(Math.PI / 2);
  const carrot = new THREE.Mesh(carrotGeom, carrotMat);
  carrot.position.set(0, 2.02, 0.4);
  snowman.add(carrot);

  // Coal Eyes
  const eyeGeom = new THREE.SphereGeometry(0.045, 6, 6);
  const leftEye = new THREE.Mesh(eyeGeom, coalMat);
  leftEye.position.set(-0.11, 2.12, 0.32);
  const rightEye = new THREE.Mesh(eyeGeom, coalMat);
  rightEye.position.set(0.11, 2.12, 0.32);
  snowman.add(leftEye);
  snowman.add(rightEye);

  // Red/Gold Scarf
  const scarf = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.09, 8, 16), scarfMat);
  scarf.position.y = 1.74;
  scarf.rotation.x = Math.PI / 2;
  snowman.add(scarf);

  // Top Hat
  const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.04, 14), hatMat);
  brim.position.y = 2.34;
  const cylinder = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.38, 14), hatMat);
  cylinder.position.y = 2.53;
  snowman.add(brim);
  snowman.add(cylinder);

  return snowman;
}
