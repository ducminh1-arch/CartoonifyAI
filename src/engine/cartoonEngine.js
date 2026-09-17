/**
 * cartoonEngine.js
 * High-performance offline on-device Cartoonify & Neural Style Transfer Engine.
 * Runs 100% locally in the browser/mobile webview with zero server dependency.
 *
 * AI Backend: ONNX Runtime Web (onnxruntime-web)
 * Models: AnimeGANv2 variants (Face Paint, Hayao, Paprika) — ~8 MB each
 * Fallback: Classic computer vision filters (Bilateral, Sobel, Color Grading)
 */

import { applyCaricatureWarp } from './caricatureWarp';
import { runAICartoonify, AI_SUPPORTED_STYLES } from './aiInferenceEngine';
import { detectFaceLandmarks, alignAndCropFace } from './faceDetectionEngine';
import { compositeWithBackground } from './backgroundTemplates';

/**
 * Set to true to enable real ONNX AI inference.
 * Falls back to classic filters if AI fails.
 */
export const USE_REAL_AI = true;

export const STYLES = [
  {
    id: 'cartoon_avatar',
    name: 'Cartoon Yourself',
    category: 'Cartoon',
    description: 'Charming 2D modern cartoon illustration character with expressive eyes, sweet smile, and clean outlines.',
    tag: 'Signature',
    icon: 'Sparkles',
    gradient: 'linear-gradient(135deg, #10B981, #3B82F6)',
    presetUrl: '/samples/cartoon_yourself_girl.jpg',
    params: { lineStrength: 0.85, saturation: 1.35, brightness: 1.05, smoothing: 4, warpFactor: 0.25, eyeMagnify: 0.35 }
  },
  {
    id: 'anime',
    name: 'Photo to Anime',
    category: 'Anime',
    description: 'AnimeGANv2 aesthetic with silky skin, expressive eyes, and vibrant Japanese animation colors.',
    tag: 'Popular',
    icon: 'Sparkles',
    gradient: 'linear-gradient(135deg, #FF6B8B, #FF8E53)',
    params: { lineStrength: 0.7, saturation: 1.35, brightness: 1.08, smoothing: 3, warpFactor: 0.15, eyeMagnify: 0.3 }
  },
  {
    id: 'caricature',
    name: 'Caricature Artist',
    category: 'Caricature',
    description: 'Signature big-head street caricature with ink hatching and expressive humor.',
    tag: 'Signature',
    icon: 'Smile',
    gradient: 'linear-gradient(135deg, #F9D423, #FF4E50)',
    params: { lineStrength: 0.9, saturation: 1.2, brightness: 1.02, smoothing: 2, warpFactor: 0.65, eyeMagnify: 0.35, chinTaper: 0.45 }
  },
  {
    id: 'pixar3d',
    name: '3D Pixar Avatar',
    category: '3D Avatar',
    description: 'Warm, glossy Disney/Pixar 3D animated film character with ambient lighting.',
    tag: 'Trending',
    icon: 'User',
    gradient: 'linear-gradient(135deg, #4E65FF, #92EFFD)',
    params: { lineStrength: 0.35, saturation: 1.25, brightness: 1.12, smoothing: 4, warpFactor: 0.25, eyeMagnify: 0.3 }
  },
  {
    id: 'game_poster',
    name: 'Game Poster (Riviera)',
    category: 'Game Poster',
    description: 'GTA & Riviera Rush style video game cover art with bold cel-shading & comic badges.',
    tag: 'Featured',
    icon: 'Gamepad2',
    gradient: 'linear-gradient(135deg, #8E2DE2, #4A00E0)',
    params: { lineStrength: 0.85, saturation: 1.45, brightness: 1.0, smoothing: 2, warpFactor: 0.1, eyeMagnify: 0.15 }
  },
  {
    id: 'street_art',
    name: 'Street Art AI',
    category: 'Street Art',
    description: 'Urban graffiti stencil spray, bold neon pop contours, and vibrant street mural mood.',
    tag: 'New',
    icon: 'Palette',
    gradient: 'linear-gradient(135deg, #00F2FE, #4FACFE)',
    params: { lineStrength: 0.95, saturation: 1.5, brightness: 1.05, smoothing: 2, warpFactor: 0.3, eyeMagnify: 0.2 }
  },
  {
    id: 'action_figure',
    name: 'Action Figure Box',
    category: 'Collectible',
    description: 'Your photo turned into a 90s vintage action figure packaged inside a collectible blister card.',
    tag: 'Fun',
    icon: 'Box',
    gradient: 'linear-gradient(135deg, #11998E, #38EF7D)',
    params: { lineStrength: 0.6, saturation: 1.3, brightness: 1.06, smoothing: 3, warpFactor: 0.2, eyeMagnify: 0.2 }
  },
  {
    id: 'comic_book',
    name: 'Retro Comic Book',
    category: 'Comics',
    description: 'Classic Pop-Art with Ben-Day halftone screen dots and sharp comic ink lines.',
    tag: 'Classic',
    icon: 'BookOpen',
    gradient: 'linear-gradient(135deg, #ED213A, #93291E)',
    params: { lineStrength: 0.95, saturation: 1.4, brightness: 1.0, smoothing: 2, warpFactor: 0.2, eyeMagnify: 0.2 }
  },
  {
    id: 'cyberpunk',
    name: 'Neon Cyberpunk',
    category: 'Sci-Fi',
    description: 'Synthwave neon luminescence, cyan & magenta glowing contours, futuristic aesthetic.',
    tag: 'Cool',
    icon: 'Zap',
    gradient: 'linear-gradient(135deg, #F107A3, #7B2CBF)',
    params: { lineStrength: 0.8, saturation: 1.6, brightness: 0.95, smoothing: 2, warpFactor: 0.15, eyeMagnify: 0.2 }
  },
  {
    id: 'claymation',
    name: 'Clay Avatar',
    category: 'Clay',
    description: 'Soft plasticine stop-motion claymation texture with tactile highlights.',
    tag: 'Cute',
    icon: 'Shapes',
    gradient: 'linear-gradient(135deg, #F857A6, #FF5858)',
    params: { lineStrength: 0.3, saturation: 1.15, brightness: 1.1, smoothing: 4, warpFactor: 0.35, eyeMagnify: 0.3 }
  },
  {
    id: 'shinkai',
    name: 'Shinkai Cinema AI',
    category: 'Anime',
    description: 'Makoto Shinkai (Your Name) cinematic anime aesthetic with crystalline light and rich skies.',
    tag: 'Cinematic',
    icon: 'Sparkles',
    gradient: 'linear-gradient(135deg, #2b5876, #4e4376)',
    params: { lineStrength: 0.7, saturation: 1.4, brightness: 1.06, smoothing: 3, warpFactor: 0.15, eyeMagnify: 0.25 }
  }
];

export const CATEGORIES = [
  'All',
  'Trending',
  'Anime',
  'Caricature',
  '3D Avatar',
  'Game Poster',
  'Street Art',
  'Comics',
  'Collectible'
];

/**
 * Main pipeline to process an image canvas offline.
 * Routes to real AI (ONNX Runtime Web) when available,
 * falls back to classic computer vision filters.
 */

/**
 * Enhances AI-generated portrait with signature Anime/Cartoon facial aesthetics:
 * 1. Sparkling Anime Eye Highlights & Glint (makes eyes pop like Japanese Anime)
 * 2. Eyelash & Anime Liner Definition
 * 3. Soft Peachy/Sakura Anime Blush (Cheek Glow)
 * 4. Silky Porcelain Skin Smoothing & Soft Glow
 * 5. Anime Lip Tint & Soft Shading
 */

/**
 * Clean cartoon color and contrast booster (gives rich vibrant anime/cartoon look without drawing fake eyes)
 */
function applyCartoonColorBoost(canvas, styleId) {
  const ctx = canvas.getContext('2d');
  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imgData.data;

  const satBoost = styleId === 'game_poster' ? 1.45 : (styleId === 'anime' ? 1.35 : 1.25);
  const brightBoost = styleId === 'anime' ? 1.08 : 1.04;

  for (let i = 0; i < data.length; i += 4) {
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];

    // Saturation
    const gray = 0.299 * r + 0.587 * g + 0.114 * b;
    r = gray + (r - gray) * satBoost;
    g = gray + (g - gray) * satBoost;
    b = gray + (b - gray) * satBoost;

    // Brightness
    r *= brightBoost;
    g *= brightBoost;
    b *= brightBoost;

    // Anime pastel warmth
    if (styleId === 'anime') {
      r = r * 1.04 + 6;
      b = b * 0.96 + 4;
    }

    data[i] = Math.max(0, Math.min(255, Math.round(r)));
    data[i + 1] = Math.max(0, Math.min(255, Math.round(g)));
    data[i + 2] = Math.max(0, Math.min(255, Math.round(b)));
  }

  ctx.putImageData(imgData, 0, 0);
  return canvas;
}

export async function processCartoonify(sourceCanvas, options = {}) {
  const {
    styleId = 'anime',
    warpFactor = 0.3,
    chinTaper = 0.3,
    eyeMagnify = 0.25,
    enableFaceAlign = true,
    backgroundTemplate = 'none',
    lineStrength = 0.7,
    saturation = 1.3,
    brightness = 1.05,
    overlayPosterBadge = true,
    overlayActionBox = false,
    maxDimension = 900,
    onProgress = null,
  } = options;

  // ── Step 1: Scale source canvas for quality vs. speed balance ─────────────
  let width = sourceCanvas.width;
  let height = sourceCanvas.height;
  if (Math.max(width, height) > maxDimension) {
    const scale = maxDimension / Math.max(width, height);
    width = Math.round(width * scale);
    height = Math.round(height * scale);
  }

  let baseCanvas = document.createElement('canvas');
  baseCanvas.width = width;
  baseCanvas.height = height;
  const baseCtx = baseCanvas.getContext('2d');
  baseCtx.drawImage(sourceCanvas, 0, 0, width, height);

  // ── Step 2: On-Device Face Detection & Alignment (MediaPipe / BlazeFace) ───
  let landmarks = null;
  try {
    landmarks = await detectFaceLandmarks(baseCanvas);
    console.log(`[FaceDetection] Face detected: ${landmarks.detected}, tilt: ${landmarks.angleDeg}°`);
  } catch (faceErr) {
    console.warn('[FaceDetection] Detection skipped:', faceErr);
  }

  // Tilt alignment if enabled and tilt is noticeable
  if (enableFaceAlign && landmarks && landmarks.detected && Math.abs(landmarks.angleDeg) > 1.2) {
    const alignedResult = alignAndCropFace(baseCanvas, landmarks, Math.max(width, height));
    baseCanvas = alignedResult.alignedCanvas;
    width = baseCanvas.width;
    height = baseCanvas.height;
    // Re-detect on aligned canvas
    try {
      landmarks = await detectFaceLandmarks(baseCanvas);
    } catch (_) {}
  }

  // ── Step 3: Apply Caricature Warping guided by Face Landmarks ─────────────
  let warpedCanvas = baseCanvas;
  const activeWarp = warpFactor !== undefined ? warpFactor : (styleId === 'caricature' ? 0.6 : 0.2);
  const activeChin = chinTaper !== undefined ? chinTaper : (styleId === 'caricature' ? 0.45 : 0.2);
  const activeEye = eyeMagnify !== undefined ? eyeMagnify : ((styleId === 'anime' || styleId === 'caricature') ? 0.35 : 0.15);

  if (activeWarp > 0.05 || activeChin > 0.05 || activeEye > 0.05 || styleId === 'caricature') {
    warpedCanvas = applyCaricatureWarp(baseCanvas, activeWarp, activeChin, activeEye, landmarks);
  }

  // ── Step 4: AI Inference (Real ONNX AnimeGANv2) or Classic Filter ──────────
  let styledCanvas;
  const isAIStyle = USE_REAL_AI && AI_SUPPORTED_STYLES.includes(styleId);

  if (isAIStyle) {
    try {
      styledCanvas = await runAICartoonify(warpedCanvas, styleId, onProgress);
      console.log(`[Engine] Real AI inference complete for style: ${styleId}`);
      // Apply smooth cartoon stylization
      styledCanvas = applyCartoonColorBoost(styledCanvas, styleId);
    } catch (aiErr) {
      console.warn('[Engine] AI inference failed, falling back to classic filters:', aiErr.message);
      styledCanvas = applyClassicFilters(warpedCanvas, styleId, lineStrength, saturation, brightness);
    }
  } else {
    styledCanvas = applyClassicFilters(warpedCanvas, styleId, lineStrength, saturation, brightness);
  }

  // ── Step 5: Background Template Composition ───────────────────────────────
  let compositedCanvas = styledCanvas;
  if (backgroundTemplate && backgroundTemplate !== 'none') {
    compositedCanvas = compositeWithBackground(styledCanvas, backgroundTemplate);
  }

  // ── Step 6: Compose final canvas with style-specific overlays ─────────────
  const finalCanvas = document.createElement('canvas');
  finalCanvas.width = width;
  finalCanvas.height = height;
  const finalCtx = finalCanvas.getContext('2d');

  finalCtx.drawImage(compositedCanvas, 0, 0);

  // Style-specific graphical embellishments (mỗi style có hiệu ứng và overlay đặc trưng 100%)
  if (styleId === 'game_poster') {
    drawGamePosterBadges(finalCtx, width, height);
  } else if (styleId === 'action_figure') {
    drawActionFigureBox(finalCtx, width, height);
  } else if (styleId === 'street_art') {
    drawStreetArtSplatter(finalCtx, width, height);
  } else if (styleId === 'comic_book') {
    drawComicBook(finalCtx, width, height);
  } else if (styleId === 'cyberpunk') {
    drawCyberpunk(finalCtx, width, height);
  } else if (styleId === 'caricature') {
    drawCaricatureBadge(finalCtx, width, height);
  } else if (styleId === 'pixar3d') {
    draw3DPixarBadge(finalCtx, width, height);
  } else if (styleId === 'anime') {
    drawAnimeBadge(finalCtx, width, height);
  } else if (styleId === 'claymation') {
    drawClaymationBadge(finalCtx, width, height);
  } else if (styleId === 'shinkai') {
    drawShinkai(finalCtx, width, height);
  }

  // Attach metadata to canvas for UI diagnostics and visualizer overlay
  finalCanvas._landmarks = landmarks;
  finalCanvas._faceInfo = landmarks ? {
    detected: landmarks.detected,
    angleDeg: landmarks.angleDeg,
    confidence: landmarks.confidence
  } : null;

  return finalCanvas;
}

/**
 * Classic computer vision filter pipeline (no AI).
 * Used as fallback, and for styles that use manual overlays.
 */
function applyClassicFilters(sourceCanvas, styleId, lineStrength, saturation, brightness) {
  const width = sourceCanvas.width;
  const height = sourceCanvas.height;
  const srcCtx = sourceCanvas.getContext("2d");
  const imgData = srcCtx.getImageData(0, 0, width, height);
  const src = imgData.data;

  // Working buffers for multi-pass cartoon cel-shading
  const buf1 = new Uint8ClampedArray(width * height * 4);
  const buf2 = new Uint8ClampedArray(width * height * 4);

  // Pass 1: Kuwahara filter to eliminate realistic skin pores and textures
  applyKuwaharaFilter(src, buf1, width, height, 3);
  // Pass 2: Second smoothing pass for velvety cartoon cel-shading
  applyKuwaharaFilter(buf1, buf2, width, height, 2);

  // Compute clean cartoon ink outlines
  const edgeMask = computeInkEdges(buf2, width, height, lineStrength, styleId);
  // Color grading, quantization and inking
  applyStyleColorGrading(buf2, width, height, styleId, saturation, brightness, edgeMask);

  const smoothedCanvas = document.createElement("canvas");
  smoothedCanvas.width = width;
  smoothedCanvas.height = height;
  const smoothCtx = smoothedCanvas.getContext("2d");
  const finalData = new ImageData(buf2, width, height);
  smoothCtx.putImageData(finalData, 0, 0);
  return smoothedCanvas;
}

/**
 * Fast Kuwahara filter for oil-painting / cel-shaded cartoon surface
 * Completely removes human skin pores and noise while preserving bold silhouette boundaries
 */
function applyKuwaharaFilter(src, dst, width, height, radius = 3) {
  const r = radius;
  for (let y = 0; y < height; y++) {
    const yMin = Math.max(0, y - r);
    const yMax = Math.min(height - 1, y + r);
    for (let x = 0; x < width; x++) {
      const xMin = Math.max(0, x - r);
      const xMax = Math.min(width - 1, x + r);

      const quads = [
        { x0: xMin, x1: x, y0: yMin, y1: y },
        { x0: x, x1: xMax, y0: yMin, y1: y },
        { x0: xMin, x1: x, y0: y, y1: yMax },
        { x0: x, x1: xMax, y0: y, y1: yMax }
      ];

      let minVar = Infinity;
      let bestR = src[(y * width + x) * 4];
      let bestG = src[(y * width + x) * 4 + 1];
      let bestB = src[(y * width + x) * 4 + 2];

      for (let q = 0; q < 4; q++) {
        const { x0, x1, y0, y1 } = quads[q];
        let sumR = 0, sumG = 0, sumB = 0;
        let sumSqR = 0, sumSqG = 0, sumSqB = 0;
        let count = 0;

        for (let qy = y0; qy <= y1; qy++) {
          const rowOffset = qy * width;
          for (let qx = x0; qx <= x1; qx++) {
            const idx = (rowOffset + qx) * 4;
            const pr = src[idx];
            const pg = src[idx + 1];
            const pb = src[idx + 2];
            sumR += pr; sumG += pg; sumB += pb;
            sumSqR += pr * pr; sumSqG += pg * pg; sumSqB += pb * pb;
            count++;
          }
        }

        if (count > 0) {
          const mR = sumR / count;
          const mG = sumG / count;
          const mB = sumB / count;
          const totalVar = (sumSqR - count * mR * mR) + (sumSqG - count * mG * mG) + (sumSqB - count * mB * mB);
          if (totalVar < minVar) {
            minVar = totalVar;
            bestR = mR;
            bestG = mG;
            bestB = mB;
          }
        }
      }

      const outIdx = (y * width + x) * 4;
      dst[outIdx] = Math.round(bestR);
      dst[outIdx + 1] = Math.round(bestG);
      dst[outIdx + 2] = Math.round(bestB);
      dst[outIdx + 3] = src[(y * width + x) * 4 + 3];
    }
  }
}

/**
 * Compute crisp cartoon ink outlines
 */
function computeInkEdges(src, width, height, lineStrength, styleId) {
  const edgeMask = new Uint8Array(width * height);
  const threshold = Math.max(15, 60 - lineStrength * 40);

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      // Sobel kernels for horizontal and vertical gradients
      const idxT = ((y - 1) * width + x) * 4;
      const idxB = ((y + 1) * width + x) * 4;
      const idxL = (y * width + (x - 1)) * 4;
      const idxR = (y * width + (x + 1)) * 4;

      const lumT = (src[idxT] * 299 + src[idxT + 1] * 587 + src[idxT + 2] * 114) / 1000;
      const lumB = (src[idxB] * 299 + src[idxB + 1] * 587 + src[idxB + 2] * 114) / 1000;
      const lumL = (src[idxL] * 299 + src[idxL + 1] * 587 + src[idxL + 2] * 114) / 1000;
      const lumR = (src[idxR] * 299 + src[idxR + 1] * 587 + src[idxR + 2] * 114) / 1000;

      const gx = lumR - lumL;
      const gy = lumB - lumT;
      const mag = Math.sqrt(gx * gx + gy * gy);

      if (mag > threshold) {
        edgeMask[y * width + x] = Math.min(255, Math.round((mag / 100) * 255 * lineStrength));
      }
    }
  }
  return edgeMask;
}

/**
 * Color grading, quantization, and ink blending
 */
function applyStyleColorGrading(dst, width, height, styleId, saturation, brightness, edgeMask) {
  // Palette steps for cel-shading
  const quantSteps = (styleId === 'anime' || styleId === 'game_poster') ? 6 : (styleId === 'comic_book' ? 4 : 12);
  const stepSize = 255 / quantSteps;

  for (let i = 0; i < width * height; i++) {
    const idx = i * 4;
    let r = dst[idx];
    let g = dst[idx + 1];
    let b = dst[idx + 2];

    // 1. Cel-shading Quantization
    if (quantSteps < 12) {
      r = Math.floor(r / stepSize + 0.5) * stepSize;
      g = Math.floor(g / stepSize + 0.5) * stepSize;
      b = Math.floor(b / stepSize + 0.5) * stepSize;
    }

    // 2. Saturation and Brightness Adjustment
    const gray = 0.299 * r + 0.587 * g + 0.114 * b;
    r = gray + (r - gray) * saturation;
    g = gray + (g - gray) * saturation;
    b = gray + (b - gray) * saturation;

    r *= brightness;
    g *= brightness;
    b *= brightness;

    // 3. Style-specific color tones
    if (styleId === 'anime') {
      // Warm anime skin tone + pastel cherry blossom boost
      r = r * 1.05 + 8;
      b = b * 0.96 + 4;
    } else if (styleId === 'caricature') {
      // Classic caricaturist sepia/newspaper cream tone
      r = r * 1.04 + 10;
      g = g * 0.98 + 4;
      b = b * 0.88;
    } else if (styleId === 'pixar3d') {
      // Rich 3D lighting highlights
      r = Math.min(255, r * 1.08 + 12);
      g = Math.min(255, g * 1.05 + 8);
    } else if (styleId === 'game_poster') {
      // High-contrast poster vibrancy (Riviera Rush)
      r = Math.min(255, r * 1.15);
      g = Math.min(255, g * 1.05);
      b = Math.min(255, b * 0.95);
    } else if (styleId === 'street_art') {
      // Neon pop contrast
      if (r > 150) r = Math.min(255, r * 1.2);
      if (b > 120) b = Math.min(255, b * 1.25);
    } else if (styleId === 'cyberpunk') {
      // Cyan & Magenta split
      r = Math.min(255, r * 1.2 + 20);
      b = Math.min(255, b * 1.35 + 30);
      g = g * 0.8;
    }

    // 4. Blend Inking Outlines
    const edge = edgeMask[i];
    if (edge > 0) {
      const inkAlpha = edge / 255;
      let inkR = 25, inkG = 20, inkB = 30; // Dark ink

      if (styleId === 'cyberpunk') {
        inkR = 0; inkG = 242; inkB = 254; // Cyan neon edge
      } else if (styleId === 'street_art') {
        inkR = 15; inkG = 15; inkB = 25;
      }

      r = r * (1 - inkAlpha) + inkR * inkAlpha;
      g = g * (1 - inkAlpha) + inkG * inkAlpha;
      b = b * (1 - inkAlpha) + inkB * inkAlpha;
    }

    dst[idx] = Math.max(0, Math.min(255, Math.round(r)));
    dst[idx + 1] = Math.max(0, Math.min(255, Math.round(g)));
    dst[idx + 2] = Math.max(0, Math.min(255, Math.round(b)));
  }
}

/**
 * Overlay "Riviera Rush" / GTA Game Poster badges and stickers
 */
function drawGamePosterBadges(ctx, width, height) {
  ctx.save();

  // Top Game Title Banner: "RIVIERA RUSH"
  const bannerY = height * 0.12;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Drop shadow
  ctx.font = `900 ${Math.round(width * 0.09)}px 'Outfit', sans-serif`;
  ctx.fillStyle = '#000000';
  ctx.fillText('RIVIERA', width * 0.5 + 4, bannerY - 14 + 4);
  ctx.fillText('RUSH', width * 0.5 + 4, bannerY + 28 + 4);

  // Gradient text
  const grad = ctx.createLinearGradient(0, bannerY - 30, 0, bannerY + 40);
  grad.addColorStop(0, '#FFFFFF');
  grad.addColorStop(0.5, '#FFE600');
  grad.addColorStop(1, '#FF3B30');
  ctx.fillStyle = grad;
  ctx.lineWidth = 6;
  ctx.strokeStyle = '#000000';
  ctx.strokeText('RIVIERA', width * 0.5, bannerY - 14);
  ctx.fillText('RIVIERA', width * 0.5, bannerY - 14);

  ctx.font = `900 ${Math.round(width * 0.08)}px 'Outfit', sans-serif`;
  ctx.strokeText('RUSH', width * 0.5, bannerY + 28);
  ctx.fillText('RUSH', width * 0.5, bannerY + 28);

  // Next-Gen PS5 Badge top-left
  const psW = Math.round(width * 0.22);
  const psH = Math.round(height * 0.038);
  ctx.fillStyle = '#003791';
  ctx.fillRect(width * 0.04, height * 0.03, psW, psH);
  ctx.fillStyle = '#FFFFFF';
  ctx.font = `800 ${Math.round(psH * 0.55)}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText('PS5 • 4K 60FPS', width * 0.04 + psW / 2, height * 0.03 + psH * 0.65);

  // ESRB / Game Rating Badge bottom left
  const badgeSize = Math.round(width * 0.09);
  const badgeX = width * 0.06;
  const badgeY = height * 0.88;
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(badgeX, badgeY, badgeSize, badgeSize * 1.2);
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 3;
  ctx.strokeRect(badgeX, badgeY, badgeSize, badgeSize * 1.2);

  ctx.fillStyle = '#000000';
  ctx.font = `900 ${Math.round(badgeSize * 0.65)}px sans-serif`;
  ctx.fillText('M', badgeX + badgeSize * 0.5, badgeY + badgeSize * 0.6);

  ctx.restore();
}

/**
 * Overlay Action Figure Blister Pack Frame
 */
function drawActionFigureBox(ctx, width, height) {
  ctx.save();

  // Outer blister card border
  const margin = Math.round(width * 0.04);
  ctx.lineWidth = 8;
  ctx.strokeStyle = '#FFCC00';
  ctx.strokeRect(margin, margin, width - margin * 2, height - margin * 2);

  // Top hanger slot
  const slotW = width * 0.22;
  const slotH = 14;
  const slotX = (width - slotW) / 2;
  const slotY = margin + 12;
  ctx.fillStyle = '#111';
  ctx.beginPath();
  ctx.roundRect(slotX, slotY, slotW, slotH, 7);
  ctx.fill();

  // Vintage Branding Card Header
  ctx.fillStyle = '#E63946';
  ctx.fillRect(margin, margin, width - margin * 2, height * 0.14);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = `900 ${Math.round(width * 0.075)}px 'Outfit', sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText('ACTION FIGURE', width / 2, margin + height * 0.07);

  ctx.font = `700 ${Math.round(width * 0.035)}px 'Outfit', sans-serif`;
  ctx.fillStyle = '#FFD166';
  ctx.fillText('LIMITED COLLECTOR EDITION • 100% ARTICULATED', width / 2, margin + height * 0.11);

  // Plastic Bubble Highlight Glare
  const glareGrad = ctx.createLinearGradient(0, height * 0.2, width, height * 0.8);
  glareGrad.addColorStop(0, 'rgba(255, 255, 255, 0.28)');
  glareGrad.addColorStop(0.15, 'rgba(255, 255, 255, 0.06)');
  glareGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.0)');
  glareGrad.addColorStop(0.85, 'rgba(255, 255, 255, 0.15)');
  ctx.fillStyle = glareGrad;
  ctx.fillRect(margin + 6, margin + height * 0.14, width - margin * 2 - 12, height * 0.72);

  // Bottom Name Plate
  ctx.fillStyle = '#1D3557';
  ctx.fillRect(margin, height - margin - height * 0.09, width - margin * 2, height * 0.09);

  ctx.fillStyle = '#F1FAEE';
  ctx.font = `800 ${Math.round(width * 0.05)}px 'Outfit', sans-serif`;
  ctx.fillText('THE CARTOON HERO // VINTAGE SERIES', width / 2, height - margin - height * 0.04);

  ctx.restore();
}

/**
 * Street Art graffiti splatter accents & stencil tag
 */
function drawStreetArtSplatter(ctx, width, height) {
  ctx.save();
  const colors = ['#00F2FE', '#4FACFE', '#FF007F', '#FFE600', '#38EF7D'];
  const splatters = [
    { x: width * 0.12, y: height * 0.15, r: 14, c: 0 },
    { x: width * 0.88, y: height * 0.18, r: 18, c: 2 },
    { x: width * 0.10, y: height * 0.84, r: 16, c: 3 },
    { x: width * 0.90, y: height * 0.82, r: 20, c: 1 },
    { x: width * 0.25, y: height * 0.08, r: 10, c: 4 },
    { x: width * 0.78, y: height * 0.90, r: 12, c: 2 }
  ];

  splatters.forEach(s => {
    ctx.fillStyle = colors[s.c];
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();

    // Drips
    ctx.beginPath();
    ctx.arc(s.x, s.y + s.r * 1.6, s.r * 0.45, 0, Math.PI * 2);
    ctx.arc(s.x + 1, s.y + s.r * 2.6, s.r * 0.28, 0, Math.PI * 2);
    ctx.fill();
  });

  // Stencil graffiti badge in bottom-right
  const tagW = Math.round(width * 0.44);
  const tagH = Math.round(height * 0.055);
  const tagX = width - tagW - width * 0.05;
  const tagY = height - tagH - height * 0.05;

  ctx.save();
  ctx.translate(tagX + tagW / 2, tagY + tagH / 2);
  ctx.rotate(-0.06);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
  ctx.fillRect(-tagW / 2, -tagH / 2, tagW, tagH);
  ctx.strokeStyle = '#00F2FE';
  ctx.lineWidth = 2;
  ctx.strokeRect(-tagW / 2, -tagH / 2, tagW, tagH);
  ctx.fillStyle = '#FFE600';
  ctx.font = `900 ${Math.round(tagH * 0.52)}px 'Outfit', sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('★ STREET ART AI ★', 0, 1);
  ctx.restore();

  ctx.restore();
}

/**
 * Retro comic book Pop-Art with Ben-Day halftone dots, narration box & "POW!" starburst
 */
function drawComicBook(ctx, width, height) {
  ctx.save();

  // Ben-Day Halftone screen dot pattern overlay
  const dotStep = 18;
  ctx.fillStyle = 'rgba(255, 230, 0, 0.09)';
  for (let y = 10; y < height; y += dotStep) {
    for (let x = 10; x < width; x += dotStep) {
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Heavy Black Comic Book Frame
  ctx.lineWidth = 14;
  ctx.strokeStyle = '#111111';
  ctx.strokeRect(7, 7, width - 14, height - 14);

  // Inner White Line
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#FFFFFF';
  ctx.strokeRect(15, 15, width - 30, height - 30);

  // 1. Narration Box in top-left: "MEANWHILE..."
  const boxW = Math.round(width * 0.36);
  const boxH = Math.round(height * 0.048);
  ctx.fillStyle = '#FFE600';
  ctx.fillRect(20, 20, boxW, boxH);
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#000000';
  ctx.strokeRect(20, 20, boxW, boxH);
  ctx.fillStyle = '#000000';
  ctx.font = `900 ${Math.round(boxH * 0.48)}px 'Outfit', sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('MEANWHILE...', 20 + boxW / 2, 20 + boxH / 2);

  // 2. Action Starburst in top-right: "POW!"
  const burstCX = width - width * 0.16;
  const burstCY = height * 0.14;
  const outerR = Math.round(width * 0.13);
  const innerR = Math.round(width * 0.075);
  const spikes = 14;

  ctx.save();
  ctx.translate(burstCX, burstCY);
  ctx.rotate(-0.1);

  ctx.beginPath();
  for (let i = 0; i < spikes * 2; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const angle = (i * Math.PI) / spikes;
    const x = Math.cos(angle) * r;
    const y = Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fillStyle = '#FF3B30';
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#000000';
  ctx.stroke();

  // Yellow inner starburst
  ctx.beginPath();
  for (let i = 0; i < spikes * 2; i++) {
    const r = (i % 2 === 0 ? outerR : innerR) * 0.78;
    const angle = (i * Math.PI) / spikes;
    const x = Math.cos(angle) * r;
    const y = Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fillStyle = '#FFE600';
  ctx.fill();

  // "POW!" text
  ctx.font = `900 ${Math.round(outerR * 0.65)}px 'Outfit', sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#000000';
  ctx.strokeText('POW!', 0, 0);
  ctx.fillStyle = '#FF3B30';
  ctx.fillText('POW!', 0, 0);
  ctx.restore();

  ctx.restore();
}

/**
 * 5. Neon Cyberpunk Synthwave laser grid & HUD telemetry
 */
function drawCyberpunk(ctx, width, height) {
  ctx.save();

  // Horizon laser grid at bottom 30%
  const horizonY = height * 0.72;
  const gridGrad = ctx.createLinearGradient(0, horizonY, 0, height);
  gridGrad.addColorStop(0, 'rgba(255, 0, 127, 0.25)');
  gridGrad.addColorStop(1, 'rgba(0, 242, 254, 0.45)');

  // Horizontal perspective lines
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = gridGrad;
  const numHLines = 8;
  for (let i = 1; i <= numHLines; i++) {
    const progress = Math.pow(i / numHLines, 1.8);
    const y = horizonY + progress * (height - horizonY);
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  // Converging perspective lines from horizon center
  const centerX = width * 0.5;
  const numVLines = 12;
  for (let i = -numVLines; i <= numVLines; i++) {
    const bottomX = centerX + (i * width) / (numVLines * 0.75);
    ctx.beginPath();
    ctx.moveTo(centerX, horizonY);
    ctx.lineTo(bottomX, height);
    ctx.stroke();
  }

  // Horizon neon line
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#00F2FE';
  ctx.shadowColor = '#00F2FE';
  ctx.shadowBlur = 12;
  ctx.beginPath();
  ctx.moveTo(0, horizonY);
  ctx.lineTo(width, horizonY);
  ctx.stroke();

  // HUD crosshair reticle top-right
  const retX = width * 0.88;
  const retY = height * 0.12;
  const retR = Math.round(width * 0.055);
  ctx.strokeStyle = '#00F2FE';
  ctx.lineWidth = 2;
  ctx.shadowBlur = 8;
  ctx.beginPath();
  ctx.arc(retX, retY, retR, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(retX - retR * 1.4, retY);
  ctx.lineTo(retX + retR * 1.4, retY);
  ctx.moveTo(retX, retY - retR * 1.4);
  ctx.lineTo(retX, retY + retR * 1.4);
  ctx.stroke();

  // Top-left HUD telemetry banner
  ctx.shadowBlur = 0;
  ctx.fillStyle = 'rgba(10, 12, 24, 0.75)';
  ctx.fillRect(width * 0.05, height * 0.04, width * 0.50, height * 0.04);
  ctx.strokeStyle = '#FF007F';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(width * 0.05, height * 0.04, width * 0.50, height * 0.04);
  ctx.fillStyle = '#00F2FE';
  ctx.font = `800 ${Math.round(height * 0.022)}px monospace`;
  ctx.textAlign = 'left';
  ctx.fillText('SYS.NEON // OVERDRIVE 2099', width * 0.07, height * 0.067);

  ctx.restore();
}

/**
 * 6. Big Head Caricature Artist Seal
 */
function drawCaricatureBadge(ctx, width, height) {
  ctx.save();
  const sealR = Math.round(width * 0.09);
  const sealX = width * 0.13;
  const sealY = height * 0.88;

  // Gold Seal Outer
  ctx.save();
  ctx.translate(sealX, sealY);
  ctx.beginPath();
  ctx.arc(0, 0, sealR, 0, Math.PI * 2);
  ctx.fillStyle = '#FFCC00';
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#B8860B';
  ctx.stroke();

  // Inner ring
  ctx.beginPath();
  ctx.arc(0, 0, sealR * 0.84, 0, Math.PI * 2);
  ctx.strokeStyle = '#7A5800';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Mascot smiling face
  ctx.fillStyle = '#222';
  ctx.font = `900 ${Math.round(sealR * 0.65)}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('😆', 0, -sealR * 0.12);

  ctx.font = `800 ${Math.round(sealR * 0.28)}px 'Outfit', sans-serif`;
  ctx.fillStyle = '#7A5800';
  ctx.fillText('BIG HEAD', 0, sealR * 0.48);
  ctx.restore();

  // Artist signature in bottom right
  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.font = `italic 700 ${Math.round(width * 0.035)}px serif`;
  ctx.textAlign = 'right';
  ctx.fillText('- Caricature Studio AI -', width * 0.94, height * 0.96);

  ctx.restore();
}

/**
 * 7. 3D Disney Pixar Avatar Badge & Ambient Glow
 */
function draw3DPixarBadge(ctx, width, height) {
  ctx.save();

  // Top-right 3D Disney golden pill badge
  const pillW = Math.round(width * 0.48);
  const pillH = Math.round(height * 0.048);
  const pillX = width - pillW - width * 0.04;
  const pillY = height * 0.03;

  ctx.fillStyle = 'rgba(20, 24, 40, 0.75)';
  ctx.beginPath();
  ctx.roundRect(pillX, pillY, pillW, pillH, pillH / 2);
  ctx.fill();

  ctx.strokeStyle = 'rgba(146, 239, 253, 0.8)';
  ctx.lineWidth = 2;
  ctx.shadowColor = '#4E65FF';
  ctx.shadowBlur = 10;
  ctx.stroke();

  ctx.shadowBlur = 0;
  ctx.fillStyle = '#92EFFD';
  ctx.font = `800 ${Math.round(pillH * 0.48)}px 'Outfit', sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('✨ DISNEY 3D AVATAR', pillX + pillW / 2, pillY + pillH / 2);

  ctx.restore();
}

/**
 * 8. AnimeGAN AI Japanese Anime Badge & Sparkles
 */
function drawAnimeBadge(ctx, width, height) {
  ctx.save();

  // Top-left Japanese Anime pill badge
  const pillW = Math.round(width * 0.44);
  const pillH = Math.round(height * 0.048);
  const pillX = width * 0.04;
  const pillY = height * 0.03;

  ctx.fillStyle = 'rgba(28, 12, 35, 0.75)';
  ctx.beginPath();
  ctx.roundRect(pillX, pillY, pillW, pillH, pillH / 2);
  ctx.fill();

  ctx.strokeStyle = 'rgba(255, 107, 139, 0.8)';
  ctx.lineWidth = 2;
  ctx.shadowColor = '#FF6B8B';
  ctx.shadowBlur = 10;
  ctx.stroke();

  ctx.shadowBlur = 0;
  ctx.fillStyle = '#FFB3C6';
  ctx.font = `800 ${Math.round(pillH * 0.48)}px 'Outfit', sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('🌸 ANIME AI • 日本', pillX + pillW / 2, pillY + pillH / 2);

  // Little star sparkles in corners
  const drawSparkle = (x, y, r) => {
    ctx.fillStyle = '#FFF';
    ctx.beginPath();
    ctx.arc(x, y, r * 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#FFE600';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x - r, y); ctx.lineTo(x + r, y);
    ctx.moveTo(x, y - r); ctx.lineTo(x, y + r);
    ctx.stroke();
  };

  drawSparkle(width * 0.90, height * 0.12, 10);
  drawSparkle(width * 0.85, height * 0.20, 6);
  drawSparkle(width * 0.12, height * 0.80, 8);

  ctx.restore();
}

/**
 * 9. Claymation 3D Avatar Badge
 */
function drawClaymationBadge(ctx, width, height) {
  ctx.save();
  const pillW = Math.round(width * 0.44);
  const pillH = Math.round(height * 0.048);
  const pillX = width - pillW - width * 0.04;
  const pillY = height * 0.03;

  ctx.fillStyle = 'rgba(60, 25, 25, 0.75)';
  ctx.beginPath();
  ctx.roundRect(pillX, pillY, pillW, pillH, pillH / 2);
  ctx.fill();

  ctx.strokeStyle = '#FF5858';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = '#FFD166';
  ctx.font = `800 ${Math.round(pillH * 0.48)}px 'Outfit', sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('🧸 CLAYMATION 3D', pillX + pillW / 2, pillY + pillH / 2);

  ctx.restore();
}

/**
 * 10. Shinkai Cinema AI — Widescreen 2.39:1 Letterbox, Azure Anamorphic Flare & Badge
 */
function drawShinkai(ctx, width, height) {
  ctx.save();
  const barH = Math.round(height * 0.045);
  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, width, barH);
  ctx.fillRect(0, height - barH, width, barH);

  const pillW = Math.round(width * 0.44);
  const pillH = Math.round(height * 0.042);
  const pillX = width * 0.04;
  const pillY = barH + 6;

  ctx.fillStyle = "rgba(10, 20, 35, 0.8)";
  ctx.beginPath();
  ctx.roundRect(pillX, pillY, pillW, pillH, pillH / 2);
  ctx.fill();

  ctx.strokeStyle = "#4FACFE";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.fillStyle = "#A0E9FF";
  ctx.font = `800 ${Math.round(pillH * 0.48)}px "Outfit", sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("🎬 SHINKAI CINEMA AI", pillX + pillW / 2, pillY + pillH / 2);

  const flareY = height * 0.35;
  const flareGrad = ctx.createLinearGradient(0, flareY, width, flareY);
  flareGrad.addColorStop(0, "rgba(0, 242, 254, 0)");
  flareGrad.addColorStop(0.3, "rgba(0, 242, 254, 0.1)");
  flareGrad.addColorStop(0.5, "rgba(255, 255, 255, 0.35)");
  flareGrad.addColorStop(0.7, "rgba(79, 172, 254, 0.1)");
  flareGrad.addColorStop(1, "rgba(0, 242, 254, 0)");

  ctx.fillStyle = flareGrad;
  ctx.fillRect(0, flareY - 2, width, 4);

  ctx.restore();
}
