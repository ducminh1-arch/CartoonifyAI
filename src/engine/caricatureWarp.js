/**
 * caricatureWarp.js
 * On-device offline Caricature Warping Engine.
 * Implements smooth radial bulge & pinch deformation to create the signature
 * "Big Head / Caricature" (đầu to người nhỏ) effect matching the reference apps.
 *
 * Supports dynamic Face Landmarks (MediaPipe / BlazeFace) for anatomically accurate
 * head expansion, eye magnification, and chin tapering.
 */

/**
 * Apply caricature deformation onto a source canvas.
 *
 * @param {HTMLCanvasElement} sourceCanvas
 * @param {number} warpFactor - Head bulge magnitude (0 to 1)
 * @param {number} chinTaper - Chin & shoulder shrinkage (0 to 1)
 * @param {number} eyeMagnify - Eye enlargement (0 to 1)
 * @param {object} [landmarks] - Optional detected facial landmarks from faceDetectionEngine
 * @returns {HTMLCanvasElement}
 */
export function applyCaricatureWarp(
  sourceCanvas,
  warpFactor = 0.5,
  chinTaper = 0.35,
  eyeMagnify = 0.25,
  landmarks = null
) {
  const width = sourceCanvas.width;
  const height = sourceCanvas.height;

  const srcCtx = sourceCanvas.getContext('2d');
  const srcImgData = srcCtx.getImageData(0, 0, width, height);
  const srcPixels = srcImgData.data;

  // Create target canvas & buffer
  const outCanvas = document.createElement('canvas');
  outCanvas.width = width;
  outCanvas.height = height;
  const outCtx = outCanvas.getContext('2d');
  const outImgData = outCtx.createImageData(width, height);
  const outPixels = outImgData.data;

  if (warpFactor === 0 && chinTaper === 0 && eyeMagnify === 0) {
    outCtx.drawImage(sourceCanvas, 0, 0);
    return outCanvas;
  }

  // Determine face geometry anchors
  let headCx, headCy, headRadius;
  let chinCx, chinCy, chinRadius;
  let leftEyeX, leftEyeY, rightEyeX, rightEyeY, eyeRadius;

  if (landmarks && landmarks.detected) {
    // ── Dynamic Landmark-Guided Anchors (MediaPipe) ──
    const bbox = landmarks.boundingBox;
    headCx = (landmarks.leftEye.x + landmarks.rightEye.x) / 2;
    headCy = bbox.y + bbox.height * 0.38;
    headRadius = Math.max(bbox.width, bbox.height) * 0.68;

    chinCx = landmarks.chin.x;
    chinCy = landmarks.chin.y;
    chinRadius = bbox.width * 0.55;

    leftEyeX = landmarks.leftEye.x;
    leftEyeY = landmarks.leftEye.y;
    rightEyeX = landmarks.rightEye.x;
    rightEyeY = landmarks.rightEye.y;
    eyeRadius = Math.hypot(rightEyeX - leftEyeX, rightEyeY - leftEyeY) * 0.45;
  } else {
    // ── Default Proportional Anchors ──
    headCx = width * 0.5;
    headCy = height * 0.42;
    headRadius = Math.min(width, height) * 0.48;

    chinCx = width * 0.5;
    chinCy = height * 0.72;
    chinRadius = Math.min(width, height) * 0.42;

    leftEyeX = width * 0.40;
    leftEyeY = height * 0.39;
    rightEyeX = width * 0.60;
    rightEyeY = height * 0.39;
    eyeRadius = Math.min(width, height) * 0.16;
  }

  // Inverse mapping with bilinear interpolation
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let srcX = x;
      let srcY = y;

      // 1. Head Bulge Deformation (Caricature Big Head / Đầu to)
      if (warpFactor > 0) {
        const dx = srcX - headCx;
        const dy = srcY - headCy;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < headRadius) {
          const normDist = dist / headRadius;
          // Smooth bell-shaped contraction for inverse mapping (bulges forward)
          const strength = warpFactor * 0.48 * Math.pow(1 - normDist * normDist, 2);
          const factor = 1 - strength;
          srcX = headCx + dx * factor;
          srcY = headCy + dy * factor;
        }
      }

      // 2. Chin & Body Pinch (đầu to thân nhỏ)
      if (chinTaper > 0) {
        const cdx = srcX - chinCx;
        const cdy = srcY - chinCy;
        const cDist = Math.sqrt(cdx * cdx + cdy * cdy);

        if (cDist < chinRadius && srcY > headCy) {
          const normCDist = cDist / chinRadius;
          // Expansion in inverse mapping pulls pixels inward (slender chin & small shoulders)
          const taperStrength = chinTaper * 0.42 * Math.pow(1 - normCDist, 2);
          const factor = 1 + taperStrength;
          srcX = chinCx + cdx * factor;
          srcY = chinCy + cdy * factor;
        }
      }

      // 3. Eye Magnification (Anime / Caricature Expressive Big Eyes)
      if (eyeMagnify > 0) {
        // Left Eye
        const ldx = srcX - leftEyeX;
        const ldy = srcY - leftEyeY;
        const lDist = Math.sqrt(ldx * ldx + ldy * ldy);
        if (lDist < eyeRadius) {
          const normL = lDist / eyeRadius;
          const eyeStrength = eyeMagnify * 0.38 * Math.pow(1 - normL * normL, 2);
          srcX = leftEyeX + ldx * (1 - eyeStrength);
          srcY = leftEyeY + ldy * (1 - eyeStrength);
        } else {
          // Right Eye
          const rdx = srcX - rightEyeX;
          const rdy = srcY - rightEyeY;
          const rDist = Math.sqrt(rdx * rdx + rdy * rdy);
          if (rDist < eyeRadius) {
            const normR = rDist / eyeRadius;
            const eyeStrength = eyeMagnify * 0.38 * Math.pow(1 - normR * normR, 2);
            srcX = rightEyeX + rdx * (1 - eyeStrength);
            srcY = rightEyeY + rdy * (1 - eyeStrength);
          }
        }
      }

      // Bilinear sampling from source image
      sampleBilinear(srcPixels, width, height, srcX, srcY, outPixels, (y * width + x) * 4);
    }
  }

  outCtx.putImageData(outImgData, 0, 0);
  return outCanvas;
}

function sampleBilinear(pixels, width, height, x, y, outPixels, outIdx) {
  // Clamp boundaries
  if (x < 0) x = 0;
  if (x >= width - 1) x = width - 1.001;
  if (y < 0) y = 0;
  if (y >= height - 1) y = height - 1.001;

  const x0 = Math.floor(x);
  const x1 = x0 + 1;
  const y0 = Math.floor(y);
  const y1 = y0 + 1;

  const wx = x - x0;
  const wy = y - y0;

  const idx00 = (y0 * width + x0) * 4;
  const idx10 = (y0 * width + x1) * 4;
  const idx01 = (y1 * width + x0) * 4;
  const idx11 = (y1 * width + x1) * 4;

  for (let c = 0; c < 4; c++) {
    const top = pixels[idx00 + c] * (1 - wx) + pixels[idx10 + c] * wx;
    const bottom = pixels[idx01 + c] * (1 - wx) + pixels[idx11 + c] * wx;
    outPixels[outIdx + c] = Math.round(top * (1 - wy) + bottom * wy);
  }
}
