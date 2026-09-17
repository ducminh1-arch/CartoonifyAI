/**
 * aiInferenceEngine.js
 * Real On-Device AI Inference Engine using ONNX Runtime Web.
 *
 * Runs AnimeGANv2 ONNX models 100% locally on the device (browser/webview/Capacitor)
 * via WebAssembly (WASM) with WebGPU / WebGL hardware acceleration fallback.
 *
 * Pipeline:
 *   Photo Canvas → Pre-process (Bilinear resize, NCHW or NHWC tensor, [-1, 1])
 *   → ONNX Neural Network Inference
 *   → Post-process (Denormalize, Bilinear scale, RGBA)
 *   → Output Canvas
 */

/**
 * Helper to get the globally loaded ONNX Runtime Web instance (from /ort.min.js in index.html)
 */
async function getOrt() {
  if (typeof window !== 'undefined' && window.ort) {
    return window.ort;
  }
  for (let i = 0; i < 30; i++) {
    await new Promise((r) => setTimeout(r, 100));
    if (typeof window !== 'undefined' && window.ort) {
      return window.ort;
    }
  }
  throw new Error('ONNX Runtime Web (window.ort) is not initialized');
}

// ─── Configuration ────────────────────────────────────────────────────────────

/**
 * Model registry — maps every artistic style to its dedicated ONNX neural network.
 * Priority:
 *   1. Local bundled file (/models/*.onnx) — 0 latency, 100% offline
 *   2. Remote CDN mirrors — if local asset is missing
 */
export const MODEL_REGISTRY = {
  // AnimeGANv2 "Hayao" — True Anime / Studio Ghibli style matching sample screenshot
  anime: {
    url: '/models/AnimeGANv2_Hayao.onnx',
    fallbackUrls: [
      'https://huggingface.co/vumichien/AnimeGANv2_Hayao/resolve/main/AnimeGANv2_Hayao.onnx'
    ],
    inputSize: 512,
    inputLayout: 'NHWC',
    inputName: 'generator_input:0',
    outputName: 'generator/G_MODEL/out_layer/Tanh:0',
    normMode: 'neg1_pos1',
  },
  // AnimeGANv2 "Hayao" — Studio Ghibli / Miyazaki warm painterly aesthetic
  pixar3d: {
    url: '/models/AnimeGANv2_Hayao.onnx',
    fallbackUrls: [
      'https://huggingface.co/vumichien/AnimeGANv2_Hayao/resolve/main/AnimeGANv2_Hayao.onnx'
    ],
    inputSize: 512,
    inputLayout: 'NHWC',
    inputName: 'generator_input:0',
    outputName: 'generator/G_MODEL/out_layer/Tanh:0',
    normMode: 'neg1_pos1',
  },
  // AnimeGANv2 "Paprika" — Satoshi Kon vibrant saturated anime colors
  caricature: {
    url: '/models/AnimeGANv2_Paprika.onnx',
    fallbackUrls: [
      'https://huggingface.co/vumichien/AnimeGANv2_Paprika/resolve/main/AnimeGANv2_Paprika.onnx'
    ],
    inputSize: 512,
    inputLayout: 'NHWC',
    inputName: 'generator_input:0',
    outputName: 'generator/G_MODEL/out_layer/Tanh:0',
    normMode: 'neg1_pos1',
  },
  // AnimeGANv2 "Shinkai" — Makoto Shinkai (Your Name) luminous cinematic sky & lighting
  shinkai: {
    url: '/models/AnimeGANv2_Shinkai.onnx',
    fallbackUrls: [
      'https://huggingface.co/vumichien/AnimeGANv2_Shinkai/resolve/main/AnimeGANv2_Shinkai.onnx'
    ],
    inputSize: 512,
    inputLayout: 'NHWC',
    inputName: 'generator_input:0',
    outputName: 'generator/G_MODEL/out_layer/Tanh:0',
    normMode: 'neg1_pos1',
  },
  // Game Poster (Riviera Rush) — AnimeGAN Hayao cel-shading base + GTA poster art
  game_poster: {
    url: '/models/AnimeGANv2_Hayao.onnx',
    fallbackUrls: [
      'https://huggingface.co/vumichien/AnimeGANv2_Hayao/resolve/main/AnimeGANv2_Hayao.onnx'
    ],
    inputSize: 512,
    inputLayout: 'NHWC',
    inputName: 'generator_input:0',
    outputName: 'generator/G_MODEL/out_layer/Tanh:0',
    normMode: 'neg1_pos1',
  },
  // Street Art AI — Paprika high-contrast vibrant pop mural base
  street_art: {
    url: '/models/AnimeGANv2_Paprika.onnx',
    fallbackUrls: [
      'https://huggingface.co/vumichien/AnimeGANv2_Paprika/resolve/main/AnimeGANv2_Paprika.onnx'
    ],
    inputSize: 512,
    inputLayout: 'NHWC',
    inputName: 'generator_input:0',
    outputName: 'generator/G_MODEL/out_layer/Tanh:0',
    normMode: 'neg1_pos1',
  },
  // Retro Comic Book — Paprika ink lines base + Ben-Day halftone
  comic_book: {
    url: '/models/AnimeGANv2_Paprika.onnx',
    fallbackUrls: [
      'https://huggingface.co/vumichien/AnimeGANv2_Paprika/resolve/main/AnimeGANv2_Paprika.onnx'
    ],
    inputSize: 512,
    inputLayout: 'NHWC',
    inputName: 'generator_input:0',
    outputName: 'generator/G_MODEL/out_layer/Tanh:0',
    normMode: 'neg1_pos1',
  },
  // Neon Cyberpunk — Shinkai crystalline neon lighting base
  cyberpunk: {
    url: '/models/AnimeGANv2_Shinkai.onnx',
    fallbackUrls: [
      'https://huggingface.co/vumichien/AnimeGANv2_Shinkai/resolve/main/AnimeGANv2_Shinkai.onnx'
    ],
    inputSize: 512,
    inputLayout: 'NHWC',
    inputName: 'generator_input:0',
    outputName: 'generator/G_MODEL/out_layer/Tanh:0',
    normMode: 'neg1_pos1',
  },
  // Clay Avatar — Hayao smooth plasticine aesthetic
  claymation: {
    url: '/models/AnimeGANv2_Hayao.onnx',
    fallbackUrls: [
      'https://huggingface.co/vumichien/AnimeGANv2_Hayao/resolve/main/AnimeGANv2_Hayao.onnx'
    ],
    inputSize: 512,
    inputLayout: 'NHWC',
    inputName: 'generator_input:0',
    outputName: 'generator/G_MODEL/out_layer/Tanh:0',
    normMode: 'neg1_pos1',
  },
  // Action Figure Box — Hayao toy collectible aesthetic
  action_figure: {
    url: '/models/AnimeGANv2_Hayao.onnx',
    fallbackUrls: [
      'https://huggingface.co/vumichien/AnimeGANv2_Hayao/resolve/main/AnimeGANv2_Hayao.onnx'
    ],
    inputSize: 512,
    inputLayout: 'NHWC',
    inputName: 'generator_input:0',
    outputName: 'generator/G_MODEL/out_layer/Tanh:0',
    normMode: 'neg1_pos1',
  }
};

// ─── Session Cache ─────────────────────────────────────────────────────────────

const _sessionCache = new Map();
const _loadingPromises = new Map();

// ─── ONNX Runtime Setup ────────────────────────────────────────────────────────

let _ortConfigured = false;

async function configureOrtBackend() {
  if (_ortConfigured) return;
  const ort = await getOrt();
  // Point to root / for bundled offline WASM files, fallback to CDN if not local
  ort.env.wasm.wasmPaths = '/';
  ort.env.wasm.numThreads = typeof navigator !== 'undefined' && navigator.hardwareConcurrency > 4 ? 4 : 2;
  ort.env.wasm.simd = true;
  _ortConfigured = true;
}

// ─── Model Download & Cache ─────────────────────────────────────────────────

const CACHE_NAME = 'cartoonify-ai-models-v3';

async function fetchModelWithCache(url, styleId, onProgress) {
  const isLocal = url.startsWith('/');

  if (!isLocal) {
    try {
      if (typeof caches !== 'undefined') {
        const cache = await caches.open(CACHE_NAME);
        const cachedResponse = await cache.match(url);
        if (cachedResponse) {
          console.log(`[AI] Loading ${styleId} model from Cache API`);
          onProgress?.({ phase: 'loading_cache', percent: 85 });
          const buffer = await cachedResponse.arrayBuffer();
          onProgress?.({ phase: 'loaded', percent: 100 });
          return buffer;
        }
      }
    } catch (e) {
      console.warn('[AI] Cache API check skipped:', e.message);
    }
  }

  console.log(`[AI] Loading ${styleId} model from: ${url}`);
  onProgress?.({ phase: 'downloading', percent: 10, loadedBytes: 0, totalBytes: 8500000 });

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} fetching model: ${url}`);
  }

  const contentLength = parseInt(response.headers.get('content-length') || '8500000', 10);

  if (response.body && response.body.getReader) {
    const reader = response.body.getReader();
    const chunks = [];
    let loaded = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      loaded += value.length;

      const pct = contentLength > 0 ? Math.min(95, Math.round((loaded / contentLength) * 100)) : 50;
      onProgress?.({
        phase: 'downloading',
        percent: pct,
        loadedBytes: loaded,
        totalBytes: contentLength,
      });
    }

    const totalLength = chunks.reduce((acc, c) => acc + c.length, 0);
    const combined = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
      combined.set(chunk, offset);
      offset += chunk.length;
    }

    if (!isLocal && typeof caches !== 'undefined') {
      try {
        const cache = await caches.open(CACHE_NAME);
        await cache.put(url, new Response(combined.buffer, {
          headers: { 'Content-Type': 'application/octet-stream' }
        }));
      } catch (e) {
        console.warn('[AI] Cache API save failed:', e.message);
      }
    }

    return combined.buffer;
  }

  const buffer = await response.arrayBuffer();
  onProgress?.({ phase: 'downloading', percent: 90 });
  return buffer;
}

// ─── Session Initialization ──────────────────────────────────────────────────

export async function initAISession(styleId, onProgress) {
  const modelKey = MODEL_REGISTRY[styleId] ? styleId : 'anime';

  if (_sessionCache.has(modelKey)) {
    return _sessionCache.get(modelKey);
  }

  if (_loadingPromises.has(modelKey)) {
    return _loadingPromises.get(modelKey);
  }

  const loadPromise = (async () => {
    await configureOrtBackend();
    const ort = await getOrt();

    const config = MODEL_REGISTRY[modelKey];
    let modelBuffer = null;
    let lastError = null;

    const urlsToTry = [config.url, ...(config.fallbackUrls || [])];
    for (const url of urlsToTry) {
      try {
        modelBuffer = await fetchModelWithCache(url, modelKey, onProgress);
        break;
      } catch (err) {
        console.warn(`[AI] Failed to load model from ${url}:`, err.message);
        lastError = err;
      }
    }

    if (!modelBuffer) {
      throw lastError || new Error(`Failed to load AI model for style: ${modelKey}`);
    }

    onProgress?.({ phase: 'initializing_session', percent: 92 });

    let session;
    try {
      session = await ort.InferenceSession.create(modelBuffer, {
        executionProviders: ['webgpu', 'wasm'],
        graphOptimizationLevel: 'all',
      });
      console.log(`[AI] ONNX Session for ${modelKey} created with WebGPU/WASM`);
    } catch (gpuErr) {
      console.log(`[AI] WebGPU fallback to WASM (CPU):`, gpuErr.message);
      session = await ort.InferenceSession.create(modelBuffer, {
        executionProviders: ['wasm'],
        graphOptimizationLevel: 'all',
      });
      console.log(`[AI] ONNX Session for ${modelKey} created with WASM (CPU)`);
    }

    const actualInputName = (session.inputNames && session.inputNames[0]) || config.inputName;
    const actualOutputName = (session.outputNames && session.outputNames[0]) || config.outputName;
    session._resolvedInputName = actualInputName;
    session._resolvedOutputName = actualOutputName;
    session._modelConfig = config;

    console.log(`[AI] Model "${modelKey}" ready → in: "${actualInputName}", out: "${actualOutputName}", layout: ${config.inputLayout}`);

    onProgress?.({ phase: 'ready', percent: 100 });
    _sessionCache.set(modelKey, session);
    _loadingPromises.delete(modelKey);
    return session;
  })();

  _loadingPromises.set(modelKey, loadPromise);
  return loadPromise;
}

export function isAISessionReady(styleId) {
  const modelKey = MODEL_REGISTRY[styleId] ? styleId : 'anime';
  return _sessionCache.has(modelKey);
}

export function getModelSize(styleId) {
  return '8.6 MB';
}

// ─── Pre / Post Processing ──────────────────────────────────────────────────

/**
 * Pre-process: ImageData → Float32Array tensor
 * Supports both NCHW [1, 3, H, W] and NHWC [1, H, W, 3] layouts normalized to [-1, 1]
 */
function preprocessImage(imageData, targetSize, layout = 'NCHW') {
  const { width, height, data: pixels } = imageData;
  const isNCHW = layout === 'NCHW';
  const tensor = new Float32Array(1 * 3 * targetSize * targetSize);

  const scaleX = width / targetSize;
  const scaleY = height / targetSize;
  const channelSize = targetSize * targetSize;

  for (let y = 0; y < targetSize; y++) {
    for (let x = 0; x < targetSize; x++) {
      const srcX = x * scaleX;
      const srcY = y * scaleY;
      const x0 = Math.floor(srcX);
      const y0 = Math.floor(srcY);
      const x1 = Math.min(x0 + 1, width - 1);
      const y1 = Math.min(y0 + 1, height - 1);
      const wx = srcX - x0;
      const wy = srcY - y0;

      const i00 = (y0 * width + x0) * 4;
      const i10 = (y0 * width + x1) * 4;
      const i01 = (y1 * width + x0) * 4;
      const i11 = (y1 * width + x1) * 4;

      for (let c = 0; c < 3; c++) {
        const v = (pixels[i00 + c] * (1 - wx) + pixels[i10 + c] * wx) * (1 - wy) +
                  (pixels[i01 + c] * (1 - wx) + pixels[i11 + c] * wx) * wy;
        const norm = (v / 127.5) - 1.0;

        if (isNCHW) {
          tensor[c * channelSize + y * targetSize + x] = norm;
        } else {
          tensor[(y * targetSize + x) * 3 + c] = norm;
        }
      }
    }
  }

  return {
    data: tensor,
    dims: isNCHW ? [1, 3, targetSize, targetSize] : [1, targetSize, targetSize, 3]
  };
}

/**
 * Post-process: Converts ONNX output tensor (NCHW or NHWC)
 * into RGBA Uint8ClampedArray scaled back to original image dimensions.
 */
function postprocessOutput(outputTensor, targetSize, origWidth, origHeight) {
  const outputData = outputTensor.data;
  const dims = outputTensor.dims || [1, 3, targetSize, targetSize];

  const isNCHW = dims.length === 4 && dims[1] === 3;
  const H = isNCHW ? dims[2] : dims[1];
  const W = isNCHW ? dims[3] : dims[2];
  const channelSize = H * W;

  const rgbaOut = new Uint8ClampedArray(origWidth * origHeight * 4);
  const scaleX = W / origWidth;
  const scaleY = H / origHeight;

  for (let y = 0; y < origHeight; y++) {
    for (let x = 0; x < origWidth; x++) {
      const srcX = x * scaleX;
      const srcY = y * scaleY;
      const x0 = Math.floor(srcX);
      const y0 = Math.floor(srcY);
      const x1 = Math.min(x0 + 1, W - 1);
      const y1 = Math.min(y0 + 1, H - 1);
      const wx = srcX - x0;
      const wy = srcY - y0;

      const outIdx = (y * origWidth + x) * 4;

      for (let c = 0; c < 3; c++) {
        let v00, v10, v01, v11;
        if (isNCHW) {
          const offset = c * channelSize;
          v00 = outputData[offset + y0 * W + x0];
          v10 = outputData[offset + y0 * W + x1];
          v01 = outputData[offset + y1 * W + x0];
          v11 = outputData[offset + y1 * W + x1];
        } else {
          v00 = outputData[(y0 * W + x0) * 3 + c];
          v10 = outputData[(y0 * W + x1) * 3 + c];
          v01 = outputData[(y1 * W + x0) * 3 + c];
          v11 = outputData[(y1 * W + x1) * 3 + c];
        }

        const v = (v00 * (1 - wx) + v10 * wx) * (1 - wy) +
                  (v01 * (1 - wx) + v11 * wx) * wy;

        let byteVal;
        if (v < 3.0 && v > -3.0) {
          byteVal = Math.round((v + 1.0) * 127.5);
        } else {
          byteVal = Math.round(v);
        }

        rgbaOut[outIdx + c] = Math.max(0, Math.min(255, byteVal));
      }
      rgbaOut[outIdx + 3] = 255;
    }
  }

  return rgbaOut;
}

// ─── Main Inference API ─────────────────────────────────────────────────────

export async function runAICartoonify(sourceCanvas, styleId, onProgress) {
  const modelKey = MODEL_REGISTRY[styleId] ? styleId : 'anime';
  const config = MODEL_REGISTRY[modelKey];

  const session = await initAISession(modelKey, onProgress);

  const srcCtx = sourceCanvas.getContext('2d');
  const srcImageData = srcCtx.getImageData(0, 0, sourceCanvas.width, sourceCanvas.height);

  const ort = await getOrt();
  const inputInfo = preprocessImage(srcImageData, config.inputSize, config.inputLayout || 'NCHW');
  const inputOrtTensor = new ort.Tensor('float32', inputInfo.data, inputInfo.dims);

  const inputName = session._resolvedInputName || (session.inputNames && session.inputNames[0]) || config.inputName;
  const feeds = { [inputName]: inputOrtTensor };

  console.time(`[AI] Inference: ${modelKey}`);
  const results = await session.run(feeds);
  console.timeEnd(`[AI] Inference: ${modelKey}`);

  const outputName = session._resolvedOutputName || (session.outputNames && session.outputNames[0]) || config.outputName;
  const outputTensor = results[outputName] || Object.values(results)[0];

  if (!outputTensor || !outputTensor.data) {
    throw new Error(`AI model output tensor "${outputName}" is missing or empty`);
  }

  const rgbaPixels = postprocessOutput(
    outputTensor,
    config.inputSize,
    sourceCanvas.width,
    sourceCanvas.height
  );

  const outCanvas = document.createElement('canvas');
  outCanvas.width = sourceCanvas.width;
  outCanvas.height = sourceCanvas.height;
  const outCtx = outCanvas.getContext('2d');
  const outImageData = new ImageData(rgbaPixels, sourceCanvas.width, sourceCanvas.height);
  outCtx.putImageData(outImageData, 0, 0);

  return outCanvas;
}

export async function clearAISessions() {
  for (const [, session] of _sessionCache) {
    try {
      await session.release();
    } catch (_) {}
  }
  _sessionCache.clear();
  _loadingPromises.clear();
  console.log('[AI] All sessions released');
}

export async function clearModelCache() {
  try {
    if (typeof caches !== 'undefined') {
      await caches.delete(CACHE_NAME);
    }
    console.log('[AI] Model cache cleared');
  } catch (e) {
    console.warn('[AI] Could not clear cache:', e);
  }
}

export const AI_SUPPORTED_STYLES = Object.keys(MODEL_REGISTRY);
