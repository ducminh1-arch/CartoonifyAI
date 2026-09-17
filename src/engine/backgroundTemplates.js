/**
 * backgroundTemplates.js
 * On-device procedural background generation and portrait composition engine.
 * Fulfills the requirement:
 * "Post-processing: Denormalize tensor thành ảnh RGB... Ghép lại vào nền hoạt hình hoặc background mẫu."
 */

export const BACKGROUND_TEMPLATES = [
  {
    id: 'none',
    name: 'Original AI Background',
    category: 'Clean',
    previewColor: '#1e2230',
    description: 'Keep the original neural-transferred background without template overlay.'
  },
  {
    id: 'manga_speed',
    name: 'Manga Speed Lines',
    category: 'Manga',
    previewColor: '#0a0a0a',
    description: 'Dynamic radial black-and-white shonen action focus lines.'
  },
  {
    id: 'tokyo_sunset',
    name: 'Tokyo Sunset Sky',
    category: 'Anime',
    previewColor: 'linear-gradient(135deg, #fa709a, #fee140)',
    description: 'Makoto Shinkai style twilight sky with luminous pink-orange clouds.'
  },
  {
    id: 'pop_starburst',
    name: 'Pop-Art Starburst',
    category: 'Comics',
    previewColor: 'linear-gradient(135deg, #f83600, #fe8c00)',
    description: 'Classic American comic book retro radial burst with yellow & orange rays.'
  },
  {
    id: 'graffiti_mural',
    name: 'Urban Street Graffiti',
    category: 'Street Art',
    previewColor: 'linear-gradient(135deg, #0575E6, #00F260)',
    description: 'Textured brick wall with neon splatter and spray paint stencil glow.'
  },
  {
    id: 'riviera_palms',
    name: 'GTA Riviera Palms',
    category: 'Game Poster',
    previewColor: 'linear-gradient(135deg, #8A2387, #E94057, #F27121)',
    description: 'Miami Vice & Riviera Rush aesthetic with palm silhouettes & sunset haze.'
  },
  {
    id: 'comic_halftone',
    name: 'Retro Comic Dots',
    category: 'Comics',
    previewColor: '#f7f4ea',
    description: 'Vintage pulp print Ben-Day halftone dot pattern with aged paper tone.'
  },
  {
    id: 'cyber_grid',
    name: 'Cyberpunk Neon Grid',
    category: 'Sci-Fi',
    previewColor: 'linear-gradient(135deg, #09090e, #2b1055)',
    description: 'Futuristic synthwave laser perspective floor grid with glowing horizon.'
  }
];

/**
 * Composite a cartoonized portrait canvas onto a chosen background template.
 *
 * @param {HTMLCanvasElement} foregroundCanvas - Cartoonized face canvas
 * @param {string} templateId - ID from BACKGROUND_TEMPLATES
 * @param {object} [options]
 * @returns {HTMLCanvasElement} Composite canvas
 */
export function compositeWithBackground(foregroundCanvas, templateId = 'none', options = {}) {
  const width = foregroundCanvas.width;
  const height = foregroundCanvas.height;

  if (!templateId || templateId === 'none') {
    return foregroundCanvas;
  }

  // 1. Create target composite canvas
  const compositeCanvas = document.createElement('canvas');
  compositeCanvas.width = width;
  compositeCanvas.height = height;
  const ctx = compositeCanvas.getContext('2d');

  // 2. Render Procedural Background
  renderTemplateBackground(ctx, templateId, width, height);

  // 3. Render Foreground Portrait with Subject Cutout / Soft Vignette Mask
  const maskedFgCanvas = createCutoutPortrait(foregroundCanvas, width, height);

  // 4. Composite: Drop shadow for cartoon sticker / cel-shaded depth
  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
  ctx.shadowBlur = Math.round(width * 0.04);
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = Math.round(height * 0.015);
  ctx.drawImage(maskedFgCanvas, 0, 0, width, height);
  ctx.restore();

  // Draw crisp foreground on top
  ctx.drawImage(maskedFgCanvas, 0, 0, width, height);

  return compositeCanvas;
}

/**
 * Create a soft oval/torso cutout mask around the portrait subject so it blends
 * seamlessly into any cartoon background.
 */
function createCutoutPortrait(sourceCanvas, width, height) {
  const maskCanvas = document.createElement('canvas');
  maskCanvas.width = width;
  maskCanvas.height = height;
  const maskCtx = maskCanvas.getContext('2d');

  // Draw radial oval gradient: full opacity in center (face/torso), fades out gracefully at edges
  const cx = width * 0.5;
  const cy = height * 0.48;
  const rx = width * 0.48;
  const ry = height * 0.52;

  const grad = maskCtx.createRadialGradient(cx, cy, rx * 0.35, cx, cy, rx);
  grad.addColorStop(0.0, 'rgba(255, 255, 255, 1.0)');
  grad.addColorStop(0.75, 'rgba(255, 255, 255, 0.95)');
  grad.addColorStop(0.92, 'rgba(255, 255, 255, 0.45)');
  grad.addColorStop(1.0, 'rgba(255, 255, 255, 0.0)');

  maskCtx.fillStyle = grad;
  maskCtx.beginPath();
  maskCtx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  maskCtx.fill();

  // Fill lower torso area with solid mask
  maskCtx.fillRect(width * 0.1, height * 0.65, width * 0.8, height * 0.35);

  // Apply destination-in blend mode
  const resultCanvas = document.createElement('canvas');
  resultCanvas.width = width;
  resultCanvas.height = height;
  const resCtx = resultCanvas.getContext('2d');

  resCtx.drawImage(sourceCanvas, 0, 0);
  resCtx.globalCompositeOperation = 'destination-in';
  resCtx.drawImage(maskCanvas, 0, 0);
  resCtx.globalCompositeOperation = 'source-over';

  return resultCanvas;
}

/**
 * Procedurally render a vector/canvas background template.
 */
function renderTemplateBackground(ctx, templateId, width, height) {
  switch (templateId) {
    case 'manga_speed':
      renderMangaSpeedLines(ctx, width, height);
      break;
    case 'tokyo_sunset':
      renderTokyoSunset(ctx, width, height);
      break;
    case 'pop_starburst':
      renderPopStarburst(ctx, width, height);
      break;
    case 'graffiti_mural':
      renderGraffitiMural(ctx, width, height);
      break;
    case 'riviera_palms':
      renderRivieraPalms(ctx, width, height);
      break;
    case 'comic_halftone':
      renderComicHalftone(ctx, width, height);
      break;
    case 'cyber_grid':
      renderCyberGrid(ctx, width, height);
      break;
    default:
      ctx.fillStyle = '#12141e';
      ctx.fillRect(0, 0, width, height);
  }
}

/** 1. Manga Action Speed Lines */
function renderMangaSpeedLines(ctx, width, height) {
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  const cx = width * 0.5;
  const cy = height * 0.42;
  const maxR = Math.hypot(width, height);
  const innerR = width * 0.22;
  const rayCount = 80;

  ctx.fillStyle = '#0a0c14';
  for (let i = 0; i < rayCount; i++) {
    const angle = (i / rayCount) * Math.PI * 2;
    const angleW = (Math.PI * 2 / rayCount) * (0.35 + (i % 3) * 0.15);

    const x1 = cx + Math.cos(angle - angleW) * maxR;
    const y1 = cy + Math.sin(angle - angleW) * maxR;
    const x2 = cx + Math.cos(angle + angleW) * maxR;
    const y2 = cy + Math.sin(angle + angleW) * maxR;

    const rOffset = innerR * (0.85 + (i % 4) * 0.15);
    const inX = cx + Math.cos(angle) * rOffset;
    const inY = cy + Math.sin(angle) * rOffset;

    ctx.beginPath();
    ctx.moveTo(inX, inY);
    ctx.lineTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.closePath();
    ctx.fill();
  }
}

/** 2. Tokyo Sunset Anime Sky */
function renderTokyoSunset(ctx, width, height) {
  const grad = ctx.createLinearGradient(0, 0, 0, height);
  grad.addColorStop(0.0, '#1c1b3d');
  grad.addColorStop(0.35, '#49235e');
  grad.addColorStop(0.65, '#b83b5e');
  grad.addColorStop(0.85, '#f08a5d');
  grad.addColorStop(1.0, '#fee140');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  // Anime twilight sun glow
  const sunGrad = ctx.createRadialGradient(width * 0.5, height * 0.65, 0, width * 0.5, height * 0.65, width * 0.45);
  sunGrad.addColorStop(0, 'rgba(255, 255, 220, 0.7)');
  sunGrad.addColorStop(0.4, 'rgba(255, 170, 70, 0.4)');
  sunGrad.addColorStop(1, 'rgba(255, 120, 50, 0.0)');
  ctx.fillStyle = sunGrad;
  ctx.fillRect(0, 0, width, height);

  // Distant city silhouette
  ctx.fillStyle = 'rgba(24, 16, 45, 0.75)';
  const bldgWidth = width / 18;
  for (let i = 0; i < 20; i++) {
    const bH = (0.15 + Math.sin(i * 3.7) * 0.1 + (i % 3) * 0.05) * height;
    ctx.fillRect(i * bldgWidth - 10, height * 0.85 - bH, bldgWidth + 2, bH + height * 0.2);
  }
}

/** 3. Pop-Art Starburst */
function renderPopStarburst(ctx, width, height) {
  const grad = ctx.createRadialGradient(width * 0.5, height * 0.45, 0, width * 0.5, height * 0.45, width * 0.8);
  grad.addColorStop(0, '#ffd200');
  grad.addColorStop(1, '#ff6a00');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  const cx = width * 0.5;
  const cy = height * 0.45;
  const maxR = Math.hypot(width, height);
  const rays = 28;

  ctx.fillStyle = '#ee0979';
  for (let i = 0; i < rays; i += 2) {
    const a1 = (i / rays) * Math.PI * 2;
    const a2 = ((i + 1) / rays) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(a1) * maxR, cy + Math.sin(a1) * maxR);
    ctx.lineTo(cx + Math.cos(a2) * maxR, cy + Math.sin(a2) * maxR);
    ctx.closePath();
    ctx.fill();
  }
}

/** 4. Urban Graffiti Brick Wall */
function renderGraffitiMural(ctx, width, height) {
  // Brick wall texture
  ctx.fillStyle = '#1c1f2b';
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
  ctx.lineWidth = 1.5;
  const rowH = 18;
  const brickW = 42;

  for (let y = 0; y < height; y += rowH) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();

    const offset = (Math.floor(y / rowH) % 2) * (brickW / 2);
    for (let x = offset; x < width; x += brickW) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, y + rowH);
      ctx.stroke();
    }
  }

  // Neon spray splatter accents
  const splatters = [
    { x: width * 0.2, y: height * 0.25, r: width * 0.25, color: 'rgba(0, 242, 254, 0.35)' },
    { x: width * 0.8, y: height * 0.35, r: width * 0.28, color: 'rgba(255, 0, 127, 0.35)' },
    { x: width * 0.5, y: height * 0.8, r: width * 0.32, color: 'rgba(56, 239, 125, 0.25)' },
  ];

  for (const s of splatters) {
    const sg = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r);
    sg.addColorStop(0, s.color);
    sg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = sg;
    ctx.fillRect(0, 0, width, height);
  }
}

/** 5. GTA Riviera Palms */
function renderRivieraPalms(ctx, width, height) {
  const grad = ctx.createLinearGradient(0, 0, 0, height);
  grad.addColorStop(0.0, '#3a1c71');
  grad.addColorStop(0.4, '#d76d77');
  grad.addColorStop(0.75, '#ffaf7b');
  grad.addColorStop(1.0, '#f9d423');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  // Palm silhouettes on sides
  ctx.fillStyle = 'rgba(25, 12, 38, 0.85)';

  // Left Palm
  drawPalmTree(ctx, width * 0.08, height, width * 0.35, height * 0.65);
  // Right Palm
  drawPalmTree(ctx, width * 0.92, height, -width * 0.35, height * 0.60);
}

function drawPalmTree(ctx, rootX, rootY, reachX, reachY) {
  // Trunk
  ctx.beginPath();
  ctx.moveTo(rootX - 10, rootY);
  ctx.quadraticCurveTo(rootX + reachX * 0.4, rootY - reachY * 0.5, rootX + reachX, rootY - reachY);
  ctx.quadraticCurveTo(rootX + reachX * 0.4, rootY - reachY * 0.5, rootX + 10, rootY);
  ctx.fill();

  // Fronds
  const topX = rootX + reachX;
  const topY = rootY - reachY;
  const frondCount = 6;
  for (let i = 0; i < frondCount; i++) {
    const angle = (i / frondCount) * Math.PI - Math.PI * 0.2;
    const fLen = 90;
    ctx.beginPath();
    ctx.moveTo(topX, topY);
    ctx.quadraticCurveTo(
      topX + Math.cos(angle) * fLen * 0.8,
      topY - Math.sin(angle) * fLen * 0.4,
      topX + Math.cos(angle) * fLen,
      topY - Math.sin(angle) * fLen + 20
    );
    ctx.lineWidth = 6;
    ctx.strokeStyle = 'rgba(25, 12, 38, 0.85)';
    ctx.stroke();
  }
}

/** 6. Retro Comic Halftone */
function renderComicHalftone(ctx, width, height) {
  ctx.fillStyle = '#f6f0dc';
  ctx.fillRect(0, 0, width, height);

  const dotSpacing = 16;
  const cx = width * 0.5;
  const cy = height * 0.45;
  const maxD = Math.hypot(width, height) * 0.5;

  ctx.fillStyle = '#e63946';
  for (let y = 0; y < height; y += dotSpacing) {
    for (let x = 0; x < width; x += dotSpacing) {
      const dist = Math.hypot(x - cx, y - cy);
      const radius = Math.max(1, (1 - dist / maxD) * 5.5);

      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

/** 7. Cyberpunk Grid & Horizon */
function renderCyberGrid(ctx, width, height) {
  // Deep space sky
  const skyGrad = ctx.createLinearGradient(0, 0, 0, height * 0.65);
  skyGrad.addColorStop(0, '#0a0618');
  skyGrad.addColorStop(1, '#2c0b4d');
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, width, height * 0.65);

  // Glowing neon sun
  const sunR = width * 0.22;
  const sunY = height * 0.55;
  const sunGrad = ctx.createLinearGradient(0, sunY - sunR, 0, sunY + sunR);
  sunGrad.addColorStop(0, '#ff007f');
  sunGrad.addColorStop(1, '#ffd200');
  ctx.fillStyle = sunGrad;
  ctx.beginPath();
  ctx.arc(width * 0.5, sunY, sunR, 0, Math.PI * 2);
  ctx.fill();

  // Cyber Floor Grid
  const floorY = height * 0.62;
  ctx.fillStyle = '#06030c';
  ctx.fillRect(0, floorY, width, height - floorY);

  ctx.strokeStyle = '#00f2fe';
  ctx.lineWidth = 1.5;

  // Perspective vertical rays
  const vanishX = width * 0.5;
  const vanishY = floorY;
  const rayCols = 16;
  for (let i = -rayCols; i <= rayCols; i++) {
    const bottomX = vanishX + i * (width / 10);
    ctx.beginPath();
    ctx.moveTo(vanishX, vanishY);
    ctx.lineTo(bottomX, height);
    ctx.stroke();
  }

  // Horizontal receding lines
  for (let i = 1; i <= 8; i++) {
    const py = floorY + Math.pow(i / 8, 2.2) * (height - floorY);
    ctx.beginPath();
    ctx.moveTo(0, py);
    ctx.lineTo(width, py);
    ctx.stroke();
  }
}
