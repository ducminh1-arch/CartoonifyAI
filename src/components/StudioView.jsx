import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Download,
  Share2,
  Camera,
  Upload,
  Layers,
  Sparkles,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  CheckCircle2,
  Brain,
  Cpu,
  RotateCcw,
  Wand2
} from "lucide-react";
import confetti from "canvas-confetti";
import SplitSlider from "./SplitSlider";
import StyleSelector from "./StyleSelector";
import BackgroundSelector from "./BackgroundSelector";
import CameraModal from "./CameraModal";
import TuningPanel from "./TuningPanel";
import { processCartoonify, STYLES } from "../engine/cartoonEngine";
import { isAISessionReady, AI_SUPPORTED_STYLES } from "../engine/aiInferenceEngine";
import { drawFaceLandmarksVisualizer } from "../engine/faceDetectionEngine";
import { SAMPLE_PORTRAITS, getSampleCartoonArtwork } from "../data/samplePortraits";

export default function StudioView({
  selectedPortrait,
  onSelectNewPortrait,
  onSaveCreation,
  initialStyleId = null
}) {
  const [currentStyleId, setCurrentStyleId] = useState(initialStyleId);
  const [isTransformed, setIsTransformed] = useState(false);
  const [processedUrl, setProcessedUrl] = useState(null);
  const [viewMode, setViewMode] = useState("split"); // "split", "full", or "pip"
  const [backgroundTemplate, setBackgroundTemplate] = useState("none");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showTuning, setShowTuning] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  // Face Detection state
  const [landmarks, setLandmarks] = useState(null);
  const [faceInfo, setFaceInfo] = useState(null);

  // Styling & Tuning parameters
  const defaultParams = {
    warpFactor: 0.2,
    chinTaper: 0.2,
    eyeMagnify: 0.2,
    lineStrength: 0.75,
    saturation: 1.35,
    brightness: 1.05,
    enableFaceAlign: true,
    showLandmarks: false,
    overlayPosterBadge: true,
    overlayActionBox: true
  };
  const [tuningParams, setTuningParams] = useState(defaultParams);

  // AI model loading state
  const [aiProgress, setAiProgress] = useState(null);

  const fileInputRef = useRef(null);
  const overlayCanvasRef = useRef(null);

  // Reset transformation whenever a new portrait is selected or uploaded:
  // Original real photo remains untouched until the user explicitly selects a style below!
  useEffect(() => {
    setIsTransformed(false);
    setProcessedUrl(null);
    setCurrentStyleId(null);
  }, [selectedPortrait?.id, selectedPortrait?.url]);

  // Show temporary toast notification
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Run cartoon transformation pipeline for custom uploaded images
  const runTransformation = useCallback(
    async (sourceImgUrl, styleId, params, bgTemplate = backgroundTemplate) => {
      setIsProcessing(true);
      setAiProgress(null);
      try {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = sourceImgUrl;

        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
        });

        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth || 600;
        canvas.height = img.naturalHeight || 800;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        const isAIStyle = AI_SUPPORTED_STYLES.includes(styleId);
        const alreadyLoaded = isAISessionReady(styleId);
        if (isAIStyle && !alreadyLoaded) {
          setAiProgress({ phase: "starting", percent: 0 });
        }

        const outputCanvas = await processCartoonify(canvas, {
          styleId: styleId,
          warpFactor: params.warpFactor,
          chinTaper: params.chinTaper,
          eyeMagnify: params.eyeMagnify,
          enableFaceAlign: params.enableFaceAlign,
          backgroundTemplate: bgTemplate,
          lineStrength: params.lineStrength,
          saturation: params.saturation,
          brightness: params.brightness,
          overlayPosterBadge: params.overlayPosterBadge,
          overlayActionBox: params.overlayActionBox,
          onProgress: (prog) => {
            setAiProgress(prog);
          }
        });

        if (outputCanvas._landmarks) {
          setLandmarks(outputCanvas._landmarks);
        }
        if (outputCanvas._faceInfo) {
          setFaceInfo(outputCanvas._faceInfo);
        }

        const dataUrl = outputCanvas.toDataURL("image/jpeg", 0.92);
        setProcessedUrl(dataUrl);
        setIsTransformed(true);
        setAiProgress(null);
      } catch (err) {
        console.error("Error cartoonifying:", err);
        showToast("Failed to process image. Please try another.");
        setAiProgress(null);
      } finally {
        setIsProcessing(false);
      }
    },
    [backgroundTemplate]
  );

  // Handle Style Selection from bottom carousel
  const handleSelectStyle = async (style) => {
    setCurrentStyleId(style.id);
    const updated = {
      ...tuningParams,
      ...(style.params || {})
    };
    setTuningParams(updated);

    if (!selectedPortrait?.url) return;

    // Check if current portrait is one of our curated demo samples
    const sample = SAMPLE_PORTRAITS.find((p) => p.id === selectedPortrait.id);
    if (sample) {
      // 1. If this sample has a dedicated pre-rendered artwork for this specific style:
      if (sample.styleArtworks && sample.styleArtworks[style.id]) {
        setProcessedUrl(sample.styleArtworks[style.id]);
        setIsTransformed(true);
        showToast(`✨ Switched to ${style.name}!`);
        return;
      }

      // 2. Otherwise, take the base high-quality cartoon artwork for this sample
      // and run the transformation engine to apply this style's distinctive shaders and overlays!
      const baseCartoonUrl = sample.resultUrl || sample.url;
      setIsTransformed(true);
      await runTransformation(baseCartoonUrl, style.id, updated, backgroundTemplate);
      showToast(`✨ Applied ${style.name}!`);
      return;
    }

    // For custom uploaded photos or camera selfies:
    setIsTransformed(true);
    await runTransformation(selectedPortrait.url, style.id, updated, backgroundTemplate);
    showToast(`✨ Switched to ${style.name}!`);
  };

  const handleRevertToOriginal = () => {
    setIsTransformed(false);
    showToast("Reverted to original photo");
  };

  // Switch demo portrait
  const handleSelectDemoPortrait = (p) => {
    onSelectNewPortrait(p);
    setIsTransformed(false);
    setProcessedUrl(null);
    setCurrentStyleId(null);
  };

  // Handle Tuning Param Change
  const handleParamChange = (key, value) => {
    const updated = { ...tuningParams, [key]: value };
    setTuningParams(updated);
  };

  // Debounced re-run when tuning sliders stop
  useEffect(() => {
    if (!isTransformed || !selectedPortrait?.url) return;
    const isSample = SAMPLE_PORTRAITS.some((p) => p.id === selectedPortrait.id);
    if (isSample) return; // Keep curated authentic cartoon artwork for samples

    const timer = setTimeout(() => {
      if (!isProcessing && currentStyleId) {
        runTransformation(selectedPortrait.url, currentStyleId, tuningParams, backgroundTemplate);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [tuningParams]);

  // Update Landmark visualizer overlay canvas
  useEffect(() => {
    const canvas = overlayCanvasRef.current;
    if (!canvas) return;

    if (tuningParams.showLandmarks && landmarks && landmarks.detected) {
      canvas.width = canvas.parentElement?.clientWidth || 400;
      canvas.height = canvas.parentElement?.clientHeight || 450;
      drawFaceLandmarksVisualizer(canvas, landmarks);
    } else {
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }, [landmarks, tuningParams.showLandmarks]);

  // File Upload
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const customPortrait = {
          id: `custom_${Date.now()}`,
          title: "Ảnh tải lên của bạn",
          url: event.target.result
        };
        onSelectNewPortrait(customPortrait);
        setIsTransformed(false);
        setProcessedUrl(null);
        setCurrentStyleId(null);
        showToast("Photo uploaded! Choose a cartoon style below.");
      };
      reader.readAsDataURL(file);
    }
  };

  // Save to Library
  const handleSaveToLibrary = () => {
    const urlToSave = isTransformed && processedUrl ? processedUrl : selectedPortrait.url;
    if (!urlToSave) return;

    // Trigger celebratory confetti
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 }
    });

    const creation = {
      id: `creation_${Date.now()}`,
      url: urlToSave,
      originalUrl: selectedPortrait.url,
      styleId: currentStyleId || "original",
      backgroundTemplate: backgroundTemplate,
      timestamp: new Date().toLocaleString()
    };
    onSaveCreation(creation);

    const link = document.createElement("a");
    link.href = urlToSave;
    link.download = `cartoonify_${currentStyleId || "photo"}_${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast("Saved to Photo Library & Creations!");
  };

  // Share
  const handleShare = async () => {
    const urlToShare = isTransformed && processedUrl ? processedUrl : selectedPortrait.url;
    if (!urlToShare) return;

    if (navigator.share) {
      try {
        const blob = await (await fetch(urlToShare)).blob();
        const file = new File([blob], `cartoonify_${currentStyleId || "photo"}.jpg`, {
          type: "image/jpeg"
        });
        await navigator.share({
          title: "Cartoonify AI Look",
          text: "Xem ảnh cartoon của tôi tạo bằng Cartoonify AI!",
          files: [file]
        });
        showToast("Shared successfully!");
      } catch (err) {
        if (err.name !== "AbortError") {
          showToast("Share link copied to clipboard");
        }
      }
    } else {
      showToast("Ready to share image");
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", padding: "0 0 20px 0" }}>
      {toastMessage && (
        <div className="toast-notice">
          <CheckCircle2 size={16} color="#00f2fe" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Quick Actions Bar */}
      <div className="quick-actions-bar">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          style={{ display: "none" }}
        />
        <button className="action-pill-btn" onClick={() => fileInputRef.current?.click()}>
          <Upload size={16} />
          <span>Upload Photo</span>
        </button>

        <button className="action-pill-btn" onClick={() => setIsCameraOpen(true)}>
          <Camera size={16} />
          <span>Camera</span>
        </button>

        {isTransformed && (
          <button
            className="action-pill-btn"
            onClick={handleRevertToOriginal}
            style={{ borderColor: "rgba(0, 242, 254, 0.4)", color: "#00f2fe" }}
          >
            <RotateCcw size={15} />
            <span>Original Photo</span>
          </button>
        )}
      </div>

      {/* Main Photo Canvas Container */}
      <div style={{ padding: "0 16px" }}>
        <div className="studio-canvas-container" style={{ position: "relative" }}>
          {selectedPortrait?.url && (
            <SplitSlider
              originalUrl={selectedPortrait.url}
              processedUrl={processedUrl}
              isTransformed={isTransformed}
              viewMode={viewMode}
              onChangeViewMode={setViewMode}
              onRevertToOriginal={isTransformed ? handleRevertToOriginal : null}
            />
          )}

          {/* MediaPipe Landmark Visualizer Overlay */}
          {tuningParams.showLandmarks && (
            <canvas
              ref={overlayCanvasRef}
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                pointerEvents: "none",
                zIndex: 20
              }}
            />
          )}

          {/* Processing Overlay */}
          {isProcessing && (
            <div className="processing-overlay">
              <div className="spinner-circle" />

              {aiProgress && aiProgress.phase !== "ready" ? (
                <>
                  <div
                    className="processing-text"
                    style={{ display: "flex", alignItems: "center", gap: "8px" }}
                  >
                    <Brain size={18} color="#00f2fe" />
                    {aiProgress.phase === "downloading" && "Downloading AnimeGANv2 model..."}
                    {aiProgress.phase === "loading_cache" && "Loading model from cache..."}
                    {aiProgress.phase === "initializing_session" && "Initializing ONNX Runtime Web..."}
                    {aiProgress.phase === "starting" && "Preparing AI model..."}
                    {aiProgress.phase === "processing" && "Running AI inference..."}
                  </div>

                  <div
                    style={{
                      width: "220px",
                      height: "6px",
                      background: "rgba(255,255,255,0.1)",
                      borderRadius: "3px",
                      overflow: "hidden",
                      margin: "8px 0 4px"
                    }}
                  >
                    <div
                      style={{
                        width: `${aiProgress.percent || 0}%`,
                        height: "100%",
                        background: "linear-gradient(90deg, #00f2fe, #4facfe)",
                        borderRadius: "3px",
                        transition: "width 0.3s ease"
                      }}
                    />
                  </div>

                  <div className="processing-sub">
                    {aiProgress.percent || 0}% — 100% Offline on device
                  </div>
                </>
              ) : (
                <>
                  <div className="processing-text">
                    ✨ Cartoonifying portrait...
                  </div>
                  <div className="processing-sub">
                    Transforming portrait to authentic cartoon style
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Demo Portraits Quick Switcher */}
      <div style={{ padding: "4px 16px 10px 16px" }}>
        <div
          style={{
            fontSize: "0.75rem",
            fontWeight: 700,
            color: "var(--text-muted)",
            marginBottom: "8px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}
        >
          <span>TRY DEMO PORTRAITS</span>
          <span style={{ fontSize: "0.68rem", color: "var(--text-secondary)" }}>
            {selectedPortrait?.title || ""}
          </span>
        </div>

        <div style={{ display: "flex", gap: "10px", overflowX: "auto", paddingBottom: "4px" }}>
          {SAMPLE_PORTRAITS.map((p) => {
            const isCurrent = selectedPortrait?.id === p.id;
            return (
              <div
                key={p.id}
                onClick={() => handleSelectDemoPortrait(p)}
                style={{
                  flex: "0 0 64px",
                  height: "64px",
                  borderRadius: "14px",
                  overflow: "hidden",
                  cursor: "pointer",
                  border: isCurrent ? "2px solid var(--accent-cyan)" : "1px solid var(--border-glass)",
                  boxShadow: isCurrent ? "0 0 12px rgba(0,242,254,0.6)" : "none",
                  position: "relative",
                  transition: "transform 0.2s ease, border-color 0.2s ease"
                }}
              >
                <img
                  src={p.url}
                  alt={p.title}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
                {isCurrent && (
                  <div
                    style={{
                      position: "absolute",
                      bottom: 0,
                      left: 0,
                      right: 0,
                      background: "rgba(0, 242, 254, 0.85)",
                      color: "#0a0c14",
                      fontSize: "0.55rem",
                      fontWeight: 800,
                      textAlign: "center",
                      padding: "1px 0"
                    }}
                  >
                    ĐANG CHỌN
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Style Browser Carousel (Chức năng biến hình Cartoon) */}
      <div style={{ padding: "0 16px 4px 16px" }}>
        <div
          style={{
            fontSize: "0.75rem",
            fontWeight: 700,
            color: "var(--text-muted)",
            marginBottom: "2px",
            display: "flex",
            alignItems: "center",
            gap: "6px"
          }}
        >
          <Wand2 size={13} color="#00f2fe" />
          <span>CHOOSE CARTOON STYLE:</span>
        </div>
      </div>

      <StyleSelector
        currentStyleId={currentStyleId}
        onSelectStyle={handleSelectStyle}
      />

      {/* Background & Template Selector */}
      {isTransformed && (
        <BackgroundSelector
          currentTemplateId={backgroundTemplate}
          onSelectTemplate={(tmplId) => {
            setBackgroundTemplate(tmplId);
            if (currentStyleId) {
              const sourceUrl = selectedPortrait.baseCartoonUrl || selectedPortrait.url;
              runTransformation(sourceUrl, currentStyleId, tuningParams, tmplId);
            }
          }}
        />
      )}

      {/* Accordion for Fine-Tuning Sliders & MediaPipe Controls */}
      {isTransformed && (
        <div style={{ padding: "0 16px 8px 16px" }}>
          <button
            onClick={() => setShowTuning(!showTuning)}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background: "var(--bg-glass)",
              border: "1px solid var(--border-glass)",
              color: "var(--text-primary)",
              padding: "10px 14px",
              borderRadius: "var(--radius-md)",
              fontSize: "0.8rem",
              fontWeight: 700,
              cursor: "pointer"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <SlidersHorizontal size={16} color="#00f2fe" />
              <span>Adjust Caricature & Face Warp</span>
            </div>
            {showTuning ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      )}

      {showTuning && isTransformed && (
        <TuningPanel
          params={tuningParams}
          onChangeParam={handleParamChange}
          onResetParams={() => setTuningParams(defaultParams)}
          styleId={currentStyleId}
          faceInfo={faceInfo}
        />
      )}

      {/* Main Action Buttons: Save & Share */}
      <div className="action-buttons-group" style={{ display: "flex", flexDirection: "column", gap: "10px", padding: "0 16px 16px" }}>
        <button
          className="btn-primary"
          onClick={handleShare}
          disabled={isProcessing}
          style={{
            width: "100%",
            background: "linear-gradient(135deg, #a855f7, #8b5cf6)",
            color: "#ffffff",
            borderRadius: "14px",
            padding: "14px",
            boxShadow: "0 4px 16px rgba(168, 85, 247, 0.35)",
            fontSize: "0.95rem",
            fontWeight: 700
          }}
        >
          <Share2 size={18} />
          <span>Share</span>
        </button>

        <button
          className="btn-primary"
          onClick={handleSaveToLibrary}
          disabled={isProcessing}
          style={{
            width: "100%",
            background: "linear-gradient(135deg, #9333ea, #7c3aed)",
            color: "#ffffff",
            borderRadius: "14px",
            padding: "14px",
            boxShadow: "0 4px 16px rgba(124, 58, 237, 0.4)",
            fontSize: "0.95rem",
            fontWeight: 700
          }}
        >
          <Download size={18} />
          <span>Save to Photo Library</span>
        </button>
      </div>

      {/* Camera Capture Modal */}
      <CameraModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapturePhoto={(dataUrl) => {
          const selfiePortrait = {
            id: `selfie_${Date.now()}`,
            title: "Ảnh chụp Selfie",
            url: dataUrl
          };
          onSelectNewPortrait(selfiePortrait);
          setIsTransformed(false);
          setProcessedUrl(null);
          setCurrentStyleId(null);
          showToast("Photo captured! Choose a cartoon style below.");
        }}
      />
    </div>
  );
}
