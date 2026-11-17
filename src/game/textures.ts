import * as THREE from 'three';

export function createRoadTexture(
  roadHex: number,
  stripeHex: number,
  curbHex: number,
  maxAnisotropy: number,
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  const roadColor = new THREE.Color(roadHex).getStyle();
  const stripeColor = new THREE.Color(stripeHex).getStyle();
  const curbColor = new THREE.Color(curbHex).getStyle();

  // Base road fill
  ctx.fillStyle = roadColor;
  ctx.fillRect(0, 0, 512, 512);

  // Subtle asphalt grain speckles
  for (let i = 0; i < 1600; i++) {
    const x = (i * 97) % 512;
    const y = (i * 193) % 512;
    ctx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.035)' : 'rgba(0,0,0,0.08)';
    ctx.fillRect(x, y, 2, 3);
  }

  // Side curbs
  ctx.fillStyle = curbColor;
  ctx.fillRect(0, 0, 26, 512);
  ctx.fillRect(486, 0, 26, 512);

  // Curb alternating highlight blocks
  ctx.fillStyle = 'rgba(255,255,255,0.28)';
  for (let y = 0; y < 512; y += 64) {
    ctx.fillRect(4, y, 18, 30);
    ctx.fillRect(490, y, 18, 30);
  }

  // 2 inner lane divider lines (3 lanes total)
  ctx.fillStyle = stripeColor;
  ctx.globalAlpha = 0.85;
  for (let y = 16; y < 512; y += 64) {
    ctx.fillRect(172, y, 10, 38);
    ctx.fillRect(330, y, 10, 38);
  }
  ctx.globalAlpha = 1;

  // Center subtle speed track grooves
  ctx.fillStyle = 'rgba(255,255,255,0.06)';
  ctx.fillRect(82, 0, 4, 512);
  ctx.fillRect(254, 0, 4, 512);
  ctx.fillRect(426, 0, 4, 512);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1, 3);
  tex.anisotropy = maxAnisotropy;
  return tex;
}

export function createSurfaceBumpTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 2400; i++) {
    const x = (i * 53) % 256;
    const y = (i * 113) % 256;
    const shade = 100 + ((i * 29) % 60);
    ctx.fillStyle = `rgb(${shade},${shade},${shade})`;
    ctx.fillRect(x, y, 2, 2);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 6);
  tex.anisotropy = maxAnisotropy;
  return tex;
}

export function createRampChevronTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createLinearGradient(0, 0, 0, 512);
  grad.addColorStop(0, '#4f46e5');
  grad.addColorStop(1, '#7c3aed');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 512);

  // Side neon borders
  ctx.fillStyle = '#22d3ee';
  ctx.fillRect(0, 0, 18, 512);
  ctx.fillRect(238, 0, 18, 512);

  // Chevrons pointing forward
  ctx.strokeStyle = '#fef08a';
  ctx.lineWidth = 22;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (let y = 75; y < 480; y += 110) {
    ctx.beginPath();
    ctx.moveTo(46, y + 48);
    ctx.lineTo(128, y);
    ctx.lineTo(210, y + 48);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

export function createHazardStripeTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#facc15';
  ctx.fillRect(0, 0, 256, 128);
  ctx.fillStyle = '#1e293b';
  for (let x = -128; x < 384; x += 48) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + 24, 0);
    ctx.lineTo(x + 88, 128);
    ctx.lineTo(x + 64, 128);
    ctx.closePath();
    ctx.fill();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

export function createPawCoinTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#fbbf24';
  ctx.fillRect(0, 0, 128, 128);

  // Outer rim ring
  ctx.strokeStyle = '#d97706';
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.arc(64, 64, 54, 0, Math.PI * 2);
  ctx.stroke();

  // Inner embossed paw print
  ctx.fillStyle = '#fef08a';
  ctx.beginPath();
  ctx.ellipse(64, 78, 22, 18, 0, 0, Math.PI * 2);
  ctx.fill();

  const toes = [
    [38, 48],
    [55, 36],
    [73, 36],
    [90, 48],
  ];
  for (const [tx, ty] of toes) {
    ctx.beginPath();
    ctx.ellipse(tx, ty, 8, 11, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

export function createContactShadowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createRadialGradient(64, 64, 6, 64, 64, 60);
  grad.addColorStop(0, 'rgba(0,0,0,0.65)');
  grad.addColorStop(0.55, 'rgba(0,0,0,0.28)');
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 128);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
