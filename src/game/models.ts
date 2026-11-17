import * as THREE from 'three';
import type { EntityKind, HeroConfig, WorldId } from './types';

export interface HeroRig {
  root: THREE.Group;
  visualGroup: THREE.Group;
  bodyGroup: THREE.Group;
  headGroup: THREE.Group;
  leftArm: THREE.Group;
  rightArm: THREE.Group;
  leftLeg: THREE.Group;
  rightLeg: THREE.Group;
  tail: THREE.Mesh;
  cape: THREE.Mesh | null;
  hoverBike: THREE.Group | null;
  flameCone: THREE.Mesh | null;
  shieldDome: THREE.Mesh;
  powerRing: THREE.Mesh;
  contactShadow: THREE.Mesh;
}

export interface SharedAssets {
  pawCoinTex: THREE.CanvasTexture;
  rampTex: THREE.CanvasTexture;
  hazardTex: THREE.CanvasTexture;
  shadowTex: THREE.CanvasTexture;
  shadowGeo: THREE.CircleGeometry;
}

function makeShadowDisc(shadowTex: THREE.CanvasTexture, radius = 0.85, y = 0.015): THREE.Mesh {
  const mat = new THREE.MeshBasicMaterial({
    map: shadowTex,
    transparent: true,
    opacity: 0.48,
    depthWrite: false,
  });
  const mesh = new THREE.Mesh(new THREE.CircleGeometry(radius, 20), mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = y;
  return mesh;
}

export function buildHeroModel(hero: HeroConfig, shadowTex: THREE.CanvasTexture): HeroRig {
  const root = new THREE.Group();
  const visualGroup = new THREE.Group();
  root.add(visualGroup);

  const contactShadow = makeShadowDisc(shadowTex, hero.hasHoverBike ? 1.2 : 0.85, 0.018);
  root.add(contactShadow);

  const suitMat = new THREE.MeshStandardMaterial({
    color: hero.primaryColor,
    roughness: 0.35,
    metalness: 0.25,
  });
  const accentMat = new THREE.MeshStandardMaterial({
    color: hero.secondaryColor,
    roughness: 0.22,
    metalness: 0.65,
  });
  const furMat = new THREE.MeshStandardMaterial({
    color: hero.furColor,
    roughness: 0.78,
    metalness: 0.04,
  });
  const trimMat = new THREE.MeshStandardMaterial({
    color: hero.accentColor,
    roughness: 0.2,
    metalness: 0.4,
    emissive: hero.accentColor,
    emissiveIntensity: 0.35,
  });
  const darkMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    roughness: 0.45,
    metalness: 0.2,
  });

  const bodyGroup = new THREE.Group();
  bodyGroup.position.y = hero.hasHoverBike ? 0.55 : 0.0;
  visualGroup.add(bodyGroup);

  // Torso
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.32, 0.42, 6, 14), suitMat);
  torso.position.y = 0.82;
  torso.castShadow = true;
  bodyGroup.add(torso);

  // Chest shield plate & emblem
  const chestPlate = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.3, 0.16), accentMat);
  chestPlate.position.set(0, 0.9, -0.24);
  chestPlate.castShadow = true;
  bodyGroup.add(chestPlate);

  const emblem = new THREE.Mesh(new THREE.OctahedronGeometry(0.11, 0), trimMat);
  emblem.position.set(0, 0.9, -0.33);
  bodyGroup.add(emblem);

  // Utility belt
  const belt = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.12, 16), accentMat);
  belt.position.y = 0.6;
  bodyGroup.add(belt);

  // Head group
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 1.38, 0);
  bodyGroup.add(headGroup);

  const headMesh = new THREE.Mesh(new THREE.SphereGeometry(0.38, 18, 16), furMat);
  headMesh.scale.set(1.06, 0.96, 1.0);
  headMesh.castShadow = true;
  headGroup.add(headMesh);

  // Cat Ears
  const earGeo = new THREE.ConeGeometry(0.13, 0.28, 8);
  const leftEar = new THREE.Mesh(earGeo, furMat);
  leftEar.position.set(-0.24, 0.32, 0);
  leftEar.rotation.z = 0.35;
  headGroup.add(leftEar);

  const rightEar = new THREE.Mesh(earGeo, furMat);
  rightEar.position.set(0.24, 0.32, 0);
  rightEar.rotation.z = -0.35;
  headGroup.add(rightEar);

  const innerEarMat = new THREE.MeshStandardMaterial({ color: 0xfda4af, roughness: 0.7 });
  const innerEarGeo = new THREE.ConeGeometry(0.07, 0.16, 6);
  const lInner = new THREE.Mesh(innerEarGeo, innerEarMat);
  lInner.position.set(-0.24, 0.31, -0.05);
  lInner.rotation.z = 0.35;
  headGroup.add(lInner);
  const rInner = new THREE.Mesh(innerEarGeo, innerEarMat);
  rInner.position.set(0.24, 0.31, -0.05);
  rInner.rotation.z = -0.35;
  headGroup.add(rInner);

  // Mask or Helmet
  if (hero.hasHelmet) {
    const helmet = new THREE.Mesh(
      new THREE.SphereGeometry(0.41, 18, 14, 0, Math.PI * 2, 0, Math.PI * 0.62),
      suitMat,
    );
    helmet.rotation.x = 0.12;
    headGroup.add(helmet);

    const visor = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.18, 0.28), trimMat);
    visor.position.set(0, 0.04, -0.26);
    headGroup.add(visor);
  } else {
    const mask = new THREE.Mesh(new THREE.CylinderGeometry(0.395, 0.395, 0.2, 18), suitMat);
    mask.position.set(0, 0.05, 0);
    headGroup.add(mask);

    // Side lightning ear fins
    const finGeo = new THREE.BoxGeometry(0.06, 0.18, 0.24);
    const lFin = new THREE.Mesh(finGeo, accentMat);
    lFin.position.set(-0.4, 0.08, 0.04);
    lFin.rotation.x = 0.3;
    headGroup.add(lFin);

    const rFin = new THREE.Mesh(finGeo, accentMat);
    rFin.position.set(0.4, 0.08, 0.04);
    rFin.rotation.x = 0.3;
    headGroup.add(rFin);
  }

  // Expressive Eyes & Nose (facing -Z forward)
  const eyeWhiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 });
  const eyeIrisMat = new THREE.MeshStandardMaterial({
    color: hero.id === 'jet_angela' ? 0x38bdf8 : 0x22c55e,
    roughness: 0.2,
    emissive: hero.id === 'jet_angela' ? 0x0284c7 : 0x15803d,
    emissiveIntensity: 0.25,
  });
  for (const side of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.085, 10, 10), eyeWhiteMat);
    eye.position.set(side * 0.14, 0.03, -0.34);
    headGroup.add(eye);
    const iris = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8), eyeIrisMat);
    iris.position.set(side * 0.14, 0.03, -0.39);
    headGroup.add(iris);
  }
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 8), innerEarMat);
  nose.position.set(0, -0.04, -0.39);
  headGroup.add(nose);

  // Arms
  const makeArm = (side: -1 | 1): THREE.Group => {
    const armPivot = new THREE.Group();
    armPivot.position.set(side * 0.38, 1.05, 0);
    const upper = new THREE.Mesh(new THREE.CapsuleGeometry(0.09, 0.28, 4, 10), suitMat);
    upper.position.y = -0.18;
    upper.castShadow = true;
    armPivot.add(upper);
    const glove = new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 10), accentMat);
    glove.position.y = -0.36;
    armPivot.add(glove);
    return armPivot;
  };
  const leftArm = makeArm(-1);
  const rightArm = makeArm(1);
  bodyGroup.add(leftArm, rightArm);

  // Legs
  const makeLeg = (side: -1 | 1): THREE.Group => {
    const legPivot = new THREE.Group();
    legPivot.position.set(side * 0.16, 0.56, 0);
    const thigh = new THREE.Mesh(new THREE.CapsuleGeometry(0.1, 0.28, 4, 10), suitMat);
    thigh.position.y = -0.2;
    thigh.castShadow = true;
    legPivot.add(thigh);
    const boot = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.14, 0.28), darkMat);
    boot.position.set(0, -0.44, -0.05);
    boot.castShadow = true;
    legPivot.add(boot);
    const bootTrim = new THREE.Mesh(new THREE.BoxGeometry(0.19, 0.05, 0.29), accentMat);
    bootTrim.position.set(0, -0.37, -0.05);
    legPivot.add(bootTrim);
    return legPivot;
  };
  const leftLeg = makeLeg(-1);
  const rightLeg = makeLeg(1);
  bodyGroup.add(leftLeg, rightLeg);

  // Tail
  const tail = new THREE.Mesh(new THREE.CapsuleGeometry(0.055, 0.38, 4, 8), furMat);
  tail.position.set(0, 0.62, 0.36);
  tail.rotation.x = 1.05;
  bodyGroup.add(tail);

  // Optional Cape
  let cape: THREE.Mesh | null = null;
  if (hero.hasCape) {
    const capeGeo = new THREE.BoxGeometry(0.62, 0.82, 0.05);
    capeGeo.translate(0, -0.38, 0);
    cape = new THREE.Mesh(capeGeo, suitMat);
    cape.position.set(0, 1.12, 0.26);
    cape.rotation.x = 0.35;
    bodyGroup.add(cape);
  }

  // Optional Twin-Rotor Hover-Bike (matches Screenshot 1!)
  let hoverBike: THREE.Group | null = null;
  let flameCone: THREE.Mesh | null = null;
  if (hero.hasHoverBike) {
    hoverBike = new THREE.Group();
    hoverBike.position.set(0, 0.36, 0);
    visualGroup.add(hoverBike);

    const bikeHullMat = new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.28, metalness: 0.45 });
    const bikeBlueMat = new THREE.MeshStandardMaterial({ color: 0x1d4ed8, roughness: 0.3, metalness: 0.5 });
    const rotorMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.6,
      roughness: 0.2,
    });

    const hull = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.28, 1.55), bikeBlueMat);
    hull.castShadow = true;
    hoverBike.add(hull);

    const noseFairing = new THREE.Mesh(new THREE.ConeGeometry(0.32, 0.65, 8), bikeHullMat);
    noseFairing.rotation.x = -Math.PI / 2;
    noseFairing.position.set(0, 0.04, -1.02);
    hoverBike.add(noseFairing);

    for (const side of [-1, 1]) {
      const pod = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.38, 0.14, 16), bikeHullMat);
      pod.position.set(side * 0.64, -0.02, 0.05);
      hoverBike.add(pod);
      const fan = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.16, 12), rotorMat);
      fan.position.set(side * 0.64, -0.02, 0.05);
      hoverBike.add(fan);
    }

    const thruster = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.24, 0.4, 12), darkMat);
    thruster.rotation.x = Math.PI / 2;
    thruster.position.set(0, 0.04, 0.85);
    hoverBike.add(thruster);

    const flameMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.82,
    });
    flameCone = new THREE.Mesh(new THREE.ConeGeometry(0.24, 1.35, 12), flameMat);
    flameCone.rotation.x = Math.PI / 2;
    flameCone.position.set(0, 0.04, 1.6);
    hoverBike.add(flameCone);
  }

  // Shield Dome
  const shieldDome = new THREE.Mesh(
    new THREE.SphereGeometry(1.18, 20, 16),
    new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.26,
      wireframe: true,
    }),
  );
  shieldDome.position.y = 0.95;
  shieldDome.visible = false;
  visualGroup.add(shieldDome);

  // Power Shockwave Ring
  const powerRing = new THREE.Mesh(
    new THREE.TorusGeometry(1.25, 0.12, 8, 28),
    new THREE.MeshBasicMaterial({
      color: hero.auraColor,
      transparent: true,
      opacity: 0.85,
    }),
  );
  powerRing.rotation.x = Math.PI / 2;
  powerRing.position.y = 0.16;
  powerRing.visible = false;
  visualGroup.add(powerRing);

  return {
    root,
    visualGroup,
    bodyGroup,
    headGroup,
    leftArm,
    rightArm,
    leftLeg,
    rightLeg,
    tail,
    cape,
    hoverBike,
    flameCone,
    shieldDome,
    powerRing,
    contactShadow,
  };
}

export function buildEntityMesh(kind: EntityKind, assets: SharedAssets): THREE.Group {
  const group = new THREE.Group();

  if (kind === 'coin') {
    const coinMat = new THREE.MeshStandardMaterial({
      color: 0xfbbf24,
      roughness: 0.18,
      metalness: 0.85,
      emissive: 0xb45309,
      emissiveIntensity: 0.2,
    });
    const faceMat = new THREE.MeshStandardMaterial({
      map: assets.pawCoinTex,
      color: 0xffffff,
      roughness: 0.22,
      metalness: 0.65,
    });
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.12, 18), [coinMat, faceMat, faceMat]);
    disc.rotation.x = Math.PI / 2;
    disc.position.y = 0.55;
    group.add(disc);
    return group;
  }

  if (kind === 'shield' || kind === 'magnet' || kind === 'jetboost' || kind === 'multiplier') {
    const shadow = makeShadowDisc(assets.shadowTex, 0.65, 0.02);
    group.add(shadow);

    const holder = new THREE.Group();
    holder.position.y = 0.95;
    group.add(holder);

    if (kind === 'shield') {
      const shieldShape = new THREE.Shape();
      shieldShape.moveTo(0, 0.52);
      shieldShape.lineTo(0.45, 0.36);
      shieldShape.lineTo(0.38, -0.2);
      shieldShape.lineTo(0, -0.55);
      shieldShape.lineTo(-0.38, -0.2);
      shieldShape.lineTo(-0.45, 0.36);
      shieldShape.closePath();

      const body = new THREE.Mesh(
        new THREE.ExtrudeGeometry(shieldShape, { depth: 0.16, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.04 }),
        new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.25, metalness: 0.4 }),
      );
      body.position.z = -0.08;
      holder.add(body);

      const star = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.22, 0),
        new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.2, metalness: 0.8, emissive: 0xca8a04, emissiveIntensity: 0.4 }),
      );
      star.position.z = 0.14;
      holder.add(star);
    } else if (kind === 'magnet') {
      const arch = new THREE.Mesh(
        new THREE.TorusGeometry(0.36, 0.11, 10, 18, Math.PI),
        new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.3, metalness: 0.35 }),
      );
      holder.add(arch);
      const tipMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.2, metalness: 0.85 });
      for (const s of [-1, 1]) {
        const tip = new THREE.Mesh(new THREE.CylinderGeometry(0.115, 0.115, 0.22, 10), tipMat);
        tip.position.set(s * 0.36, -0.1, 0);
        holder.add(tip);
      }
    } else if (kind === 'jetboost') {
      const tankMat = new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.25, metalness: 0.5 });
      const nozzleMat = new THREE.MeshStandardMaterial({ color: 0x22d3ee, emissive: 0x06b6d4, emissiveIntensity: 0.8, roughness: 0.2 });
      for (const s of [-1, 1]) {
        const tank = new THREE.Mesh(new THREE.CapsuleGeometry(0.14, 0.4, 4, 10), tankMat);
        tank.position.set(s * 0.2, 0, 0);
        holder.add(tank);
        const flame = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.32, 8), nozzleMat);
        flame.rotation.x = Math.PI;
        flame.position.set(s * 0.2, -0.4, 0);
        holder.add(flame);
      }
    } else {
      const gem = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.42, 0),
        new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.15, metalness: 0.85, emissive: 0xd97706, emissiveIntensity: 0.45 }),
      );
      holder.add(gem);
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(0.55, 0.06, 8, 24),
        new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0ea5e9, emissiveIntensity: 0.6 }),
      );
      holder.add(ring);
    }
    return group;
  }

  if (kind === 'ramp') {
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.lineTo(6.0, 0);
    shape.lineTo(6.0, 2.5);
    shape.closePath();

    const geo = new THREE.ExtrudeGeometry(shape, { depth: 2.3, bevelEnabled: false });
    geo.rotateY(Math.PI / 2);
    geo.translate(-1.15, 0, 3.0);

    const sideMat = new THREE.MeshStandardMaterial({ color: 0x312e81, roughness: 0.45, metalness: 0.3 });
    const rampMesh = new THREE.Mesh(geo, sideMat);
    rampMesh.castShadow = true;
    rampMesh.receiveShadow = true;
    group.add(rampMesh);

    // Top chevron surface plane tilted to match hypotenuse
    const slopeLen = Math.hypot(6.0, 2.5);
    const slopeAngle = Math.atan2(2.5, 6.0);
    const topPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(2.26, slopeLen),
      new THREE.MeshStandardMaterial({
        map: assets.rampTex,
        color: 0xffffff,
        roughness: 0.3,
        emissive: 0x4338ca,
        emissiveIntensity: 0.25,
      }),
    );
    topPlane.position.set(0, 1.26, 0);
    topPlane.rotation.x = -Math.PI / 2 + slopeAngle;
    group.add(topPlane);
    return group;
  }

  if (kind === 'barrier_low') {
    const legMat = new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.55 });
    const boardMat = new THREE.MeshStandardMaterial({ map: assets.hazardTex, color: 0xffffff, roughness: 0.35 });
    for (const s of [-1, 1]) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 1.1, 8), legMat);
      post.position.set(s * 0.9, 0.55, 0);
      post.castShadow = true;
      group.add(post);
      const foot = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.12, 0.55), legMat);
      foot.position.set(s * 0.9, 0.06, 0);
      group.add(foot);
    }
    const board = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.42, 0.16), boardMat);
    board.position.set(0, 0.88, 0);
    board.castShadow = true;
    group.add(board);
    return group;
  }

  if (kind === 'beam_high') {
    const steelMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.4, metalness: 0.45 });
    const barMat = new THREE.MeshStandardMaterial({ map: assets.hazardTex, color: 0xffffff, roughness: 0.35 });
    for (const s of [-1, 1]) {
      const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.24, 3.0, 0.24), steelMat);
      pillar.position.set(s * 1.15, 1.5, 0);
      pillar.castShadow = true;
      group.add(pillar);
    }
    const overhead = new THREE.Mesh(new THREE.BoxGeometry(2.55, 1.1, 0.42), barMat);
    overhead.position.set(0, 2.05, 0);
    overhead.castShadow = true;
    group.add(overhead);
    const beacon = new THREE.Mesh(
      new THREE.SphereGeometry(0.14, 10, 10),
      new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0ea5e9, emissiveIntensity: 0.9 }),
    );
    beacon.position.set(0, 2.7, 0);
    group.add(beacon);
    return group;
  }

  if (kind === 'truck') {
    group.add(makeShadowDisc(assets.shadowTex, 1.6, 0.015));
    const paintMat = new THREE.MeshStandardMaterial({ color: 0xea580c, roughness: 0.28, metalness: 0.35 });
    const cabGlassMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.1, metalness: 0.7 });
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.85 });
    const rimMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.2, metalness: 0.85 });

    const chassis = new THREE.Mesh(new THREE.BoxGeometry(2.15, 0.95, 4.1), paintMat);
    chassis.position.y = 0.82;
    chassis.castShadow = true;
    group.add(chassis);

    const cab = new THREE.Mesh(new THREE.BoxGeometry(1.95, 0.85, 1.8), paintMat);
    cab.position.set(0, 1.65, 0.75);
    cab.castShadow = true;
    group.add(cab);

    const windshield = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.56, 0.12), cabGlassMat);
    windshield.position.set(0, 1.68, 1.66);
    group.add(windshield);

    for (const sx of [-1, 1]) {
      for (const sz of [-1.25, 1.25]) {
        const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.28, 14), wheelMat);
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(sx * 1.05, 0.42, sz);
        group.add(wheel);
        const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.3, 10), rimMat);
        rim.rotation.z = Math.PI / 2;
        rim.position.set(sx * 1.05, 0.42, sz);
        group.add(rim);
      }
    }
    return group;
  }

  if (kind === 'dumpster') {
    group.add(makeShadowDisc(assets.shadowTex, 1.35, 0.015));
    const binMat = new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.55, metalness: 0.25 });
    const lidMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.65 });
    const body = new THREE.Mesh(new THREE.BoxGeometry(2.05, 1.35, 2.3), binMat);
    body.position.y = 0.78;
    body.castShadow = true;
    group.add(body);
    const lid = new THREE.Mesh(new THREE.BoxGeometry(2.15, 0.16, 2.38), lidMat);
    lid.position.y = 1.52;
    lid.rotation.x = 0.08;
    group.add(lid);
    return group;
  }

  // Raccoon Bandit Archetypes (3 distinct silhouettes!)
  group.add(makeShadowDisc(assets.shadowTex, kind === 'raccoon_boss' ? 1.15 : 0.78, 0.018));

  const furMat = new THREE.MeshStandardMaterial({ color: 0x78553a, roughness: 0.75 });
  const maskMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.55 });
  const shirtMat = new THREE.MeshStandardMaterial({
    color: kind === 'raccoon_boss' ? 0xdc2626 : kind === 'raccoon_jackhammer' ? 0xeab308 : 0x334155,
    roughness: 0.45,
  });
  const stripeMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.55 });

  const scale = kind === 'raccoon_boss' ? 1.38 : 1.0;
  const bodyHolder = new THREE.Group();
  bodyHolder.scale.setScalar(scale);
  group.add(bodyHolder);

  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.32, 0.36, 6, 12), shirtMat);
  torso.position.y = 0.72;
  torso.castShadow = true;
  bodyHolder.add(torso);

  for (const sy of [0.6, 0.76, 0.92]) {
    const stripe = new THREE.Mesh(new THREE.CylinderGeometry(0.335, 0.335, 0.07, 12), stripeMat);
    stripe.position.y = sy;
    bodyHolder.add(stripe);
  }

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.36, 14, 12), furMat);
  head.position.y = 1.26;
  head.castShadow = true;
  bodyHolder.add(head);

  const eyeBand = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.2, 0.24), maskMat);
  eyeBand.position.set(0, 1.28, 0.22);
  bodyHolder.add(eyeBand);

  const eyeMat = new THREE.MeshStandardMaterial({ color: 0xfef08a, emissive: 0xfacc15, emissiveIntensity: 0.45 });
  for (const s of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.065, 8, 8), eyeMat);
    eye.position.set(s * 0.12, 1.28, 0.34);
    bodyHolder.add(eye);
    const ear = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.22, 6), furMat);
    ear.position.set(s * 0.21, 1.56, 0);
    bodyHolder.add(ear);
    const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.08, 0.26, 4, 8), furMat);
    arm.position.set(s * 0.4, 0.8, 0.08);
    arm.rotation.x = -0.55;
    bodyHolder.add(arm);
    const leg = new THREE.Mesh(new THREE.CapsuleGeometry(0.09, 0.24, 4, 8), maskMat);
    leg.position.set(s * 0.15, 0.24, 0);
    bodyHolder.add(leg);
  }

  if (kind === 'raccoon_jackhammer') {
    // Red bucket hat + yellow jackhammer!
    const bucket = new THREE.Mesh(
      new THREE.CylinderGeometry(0.28, 0.22, 0.3, 12),
      new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.35 }),
    );
    bucket.position.set(0, 1.58, -0.02);
    bucket.rotation.z = 0.22;
    bodyHolder.add(bucket);

    const hammer = new THREE.Mesh(
      new THREE.BoxGeometry(0.18, 0.65, 0.22),
      new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.3, metalness: 0.4 }),
    );
    hammer.position.set(0, 0.46, 0.38);
    bodyHolder.add(hammer);
  } else if (kind === 'raccoon_boss') {
    // Villain top-hat + red apron + dual jet turbines
    const apron = new THREE.Mesh(
      new THREE.BoxGeometry(0.54, 0.56, 0.14),
      new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.4 }),
    );
    apron.position.set(0, 0.68, 0.31);
    bodyHolder.add(apron);
    const hat = new THREE.Mesh(
      new THREE.CylinderGeometry(0.24, 0.26, 0.36, 12),
      new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.35 }),
    );
    hat.position.set(0, 1.64, 0);
    bodyHolder.add(hat);
    const jetMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.25, metalness: 0.75 });
    for (const s of [-1, 1]) {
      const pod = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.14, 0.5, 10), jetMat);
      pod.position.set(s * 0.46, 0.84, -0.2);
      bodyHolder.add(pod);
    }
  }

  return group;
}

export function buildWorldProp(worldId: WorldId, variant: number, shadowTex: THREE.CanvasTexture): THREE.Group {
  const group = new THREE.Group();

  if (worldId === 'metro_city') {
    if (variant % 3 === 0) {
      // Stylized Skyscraper
      const h = 11 + (variant % 4) * 3.5;
      const bColors = [0x3b82f6, 0x64748b, 0x4f46e5, 0x0ea5e9];
      const bMat = new THREE.MeshStandardMaterial({
        color: bColors[variant % bColors.length],
        roughness: 0.45,
        metalness: 0.2,
      });
      const tower = new THREE.Mesh(new THREE.BoxGeometry(4.2, h, 4.2), bMat);
      tower.position.y = h / 2;
      group.add(tower);
      const roof = new THREE.Mesh(
        new THREE.BoxGeometry(4.5, 0.45, 4.5),
        new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.35 }),
      );
      roof.position.y = h + 0.22;
      group.add(roof);
      const spire = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.14, 2.2, 6),
        new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.7, roughness: 0.25 }),
      );
      spire.position.y = h + 1.4;
      group.add(spire);
      const winMat = new THREE.MeshStandardMaterial({
        color: 0xe0f2fe,
        emissive: 0xbae6fd,
        emissiveIntensity: 0.35,
        roughness: 0.15,
      });
      for (let row = 2; row < h - 1.5; row += 2.2) {
        const strip = new THREE.Mesh(new THREE.BoxGeometry(4.3, 0.7, 3.2), winMat);
        strip.position.y = row;
        group.add(strip);
      }
    } else if (variant % 3 === 1) {
      // Lush Tree
      group.add(makeShadowDisc(shadowTex, 1.5, 0.02));
      const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.28, 0.38, 2.4, 8),
        new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.85 }),
      );
      trunk.position.y = 1.2;
      group.add(trunk);
      const leafMat = new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.65 });
      const crown1 = new THREE.Mesh(new THREE.SphereGeometry(1.45, 10, 10), leafMat);
      crown1.position.y = 3.1;
      group.add(crown1);
      const crown2 = new THREE.Mesh(new THREE.SphereGeometry(1.05, 10, 10), leafMat);
      crown2.position.set(0.6, 2.6, 0.4);
      group.add(crown2);
    } else {
      // Yellow Construction Crane Tower with Counterweight & Hook
      const craneMat = new THREE.MeshStandardMaterial({ color: 0xeab308, roughness: 0.35, metalness: 0.5 });
      const darkSteel = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.5, metalness: 0.6 });
      const mast = new THREE.Mesh(new THREE.BoxGeometry(0.9, 14, 0.9), craneMat);
      mast.position.y = 7;
      group.add(mast);
      const cab = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.3, 1.4), darkSteel);
      cab.position.set(0, 13.1, 0);
      group.add(cab);
      const jib = new THREE.Mesh(new THREE.BoxGeometry(7.2, 0.65, 0.65), craneMat);
      jib.position.set(0, 14.1, 0);
      group.add(jib);
      const cable = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 3.2, 6), darkSteel);
      cable.position.set(2.4, 12.2, 0);
      group.add(cable);
    }
    return group;
  }

  if (worldId === 'sunset_beach') {
    if (variant % 2 === 0) {
      // Palm Tree
      group.add(makeShadowDisc(shadowTex, 1.3, 0.02));
      const trunkMat = new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.85 });
      const palmMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.6 });
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.36, 4.8, 8), trunkMat);
      trunk.position.y = 2.4;
      trunk.rotation.z = (variant % 2 === 0 ? 1 : -1) * 0.1;
      group.add(trunk);
      for (let i = 0; i < 5; i++) {
        const frond = new THREE.Mesh(new THREE.ConeGeometry(0.55, 2.5, 5), palmMat);
        frond.position.set(0, 4.8, 0);
        frond.rotation.z = Math.PI / 2.4;
        frond.rotation.y = (i * Math.PI * 2) / 5;
        group.add(frond);
      }
    } else {
      // Striped Beach Umbrella
      group.add(makeShadowDisc(shadowTex, 1.4, 0.02));
      const pole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.08, 3.0, 8),
        new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.6, roughness: 0.3 }),
      );
      pole.position.y = 1.5;
      group.add(pole);
      const canopy = new THREE.Mesh(
        new THREE.ConeGeometry(1.75, 0.9, 8),
        new THREE.MeshStandardMaterial({ color: variant % 4 === 1 ? 0xef4444 : 0x06b6d4, roughness: 0.55 }),
      );
      canopy.position.y = 3.0;
      group.add(canopy);
    }
    return group;
  }

  if (worldId === 'arctic_canyon') {
    if (variant % 2 === 0) {
      // Purple Glowing Ice Crystal Cluster
      const iceMat = new THREE.MeshStandardMaterial({
        color: 0xa855f7,
        roughness: 0.15,
        metalness: 0.25,
        emissive: 0x7e22ce,
        emissiveIntensity: 0.35,
      });
      for (let i = 0; i < 3; i++) {
        const h = 2.4 + i * 0.9;
        const spire = new THREE.Mesh(new THREE.ConeGeometry(0.65 - i * 0.1, h, 5), iceMat);
        spire.position.set((i - 1) * 0.55, h / 2, (i % 2) * 0.3);
        spire.rotation.z = (i - 1) * 0.18;
        group.add(spire);
      }
    } else {
      // Snowbank & Pine Cabin Pillar
      const cabin = new THREE.Mesh(
        new THREE.BoxGeometry(3.2, 2.8, 3.2),
        new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.8 }),
      );
      cabin.position.y = 1.4;
      group.add(cabin);
      const roof = new THREE.Mesh(
        new THREE.ConeGeometry(2.7, 1.6, 4),
        new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.7 }),
      );
      roof.position.y = 3.5;
      roof.rotation.y = Math.PI / 4;
      group.add(roof);
    }
    return group;
  }

  // Pharaoh Temple
  if (variant % 2 === 0) {
    // Golden Bastet Cat Statue on Pedestal
    const stoneMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.7 });
    const statueMat = new THREE.MeshStandardMaterial({ color: 0x1e1b4b, roughness: 0.28, metalness: 0.55 });
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.2, metalness: 0.85 });

    const ped = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.5, 2.2), stoneMat);
    ped.position.y = 0.75;
    group.add(ped);

    const catBody = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.72, 2.3, 10), statueMat);
    catBody.position.y = 2.65;
    group.add(catBody);

    const catHead = new THREE.Mesh(new THREE.SphereGeometry(0.52, 12, 10), statueMat);
    catHead.position.y = 4.0;
    group.add(catHead);

    const collar = new THREE.Mesh(new THREE.TorusGeometry(0.52, 0.1, 8, 16), goldMat);
    collar.rotation.x = Math.PI / 2;
    collar.position.y = 3.55;
    group.add(collar);

    for (const s of [-1, 1]) {
      const ear = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.42, 6), goldMat);
      ear.position.set(s * 0.28, 4.5, 0);
      group.add(ear);
    }
  } else {
    // Sandstone Obelisk & Treasure Mound
    const pillar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.55, 0.82, 6.2, 4),
      new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.65 }),
    );
    pillar.position.y = 3.1;
    pillar.rotation.y = Math.PI / 4;
    group.add(pillar);

    const tip = new THREE.Mesh(
      new THREE.ConeGeometry(0.75, 1.2, 4),
      new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.2, metalness: 0.85 }),
    );
    tip.position.y = 6.8;
    tip.rotation.y = Math.PI / 4;
    group.add(tip);
  }

  return group;
}
