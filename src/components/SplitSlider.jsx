import React, { useState, useRef, useEffect, useCallback } from "react";
import { ArrowLeftRight, RotateCcw, Columns, Maximize2, PictureInPicture2 } from "lucide-react";

export default function SplitSlider({
  originalUrl,
  processedUrl,
  isTransformed = false,
  viewMode = "split",
  onChangeViewMode,
  onRevertToOriginal
}) {
  const [sliderPos, setSliderPos] = useState(50); // percentage 0 - 100
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef(null);

  const handlePointerDown = (e) => {
    if (viewMode !== "split" || !isTransformed) return;
    setIsDragging(true);
    updateSlider(e);
  };

  const updateSlider = useCallback((e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clientX = e.clientX || (e.touches && e.touches[0] ? e.touches[0].clientX : rect.left + rect.width / 2);
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percent = Math.round((x / rect.width) * 100);
    setSliderPos(percent);
  }, []);

  useEffect(() => {
    const handlePointerMove = (e) => {
      if (!isDragging) return;
      updateSlider(e);
    };

    const handlePointerUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener("pointermove", handlePointerMove);
      window.addEventListener("pointerup", handlePointerUp);
      window.addEventListener("touchmove", handlePointerMove);
      window.addEventListener("touchend", handlePointerUp);
    }

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("touchmove", handlePointerMove);
      window.removeEventListener("touchend", handlePointerUp);
    };
  }, [isDragging, updateSlider]);

  // 1. CASE: NOT TRANSFORMED YET -> Pure, untouched Real Photo
  if (!isTransformed || !processedUrl) {
    return (
      <div className="slider-container" style={{ userSelect: "none" }}>
        <img
          src={originalUrl}
          alt="Original real photo"
          className="slider-img-after"
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />

        {/* Real Photo Badge */}
        <div
          style={{
            position: "absolute",
            top: 14,
            left: 14,
            background: "rgba(10, 12, 20, 0.75)",
            color: "#ffffff",
            fontSize: "0.72rem",
            fontWeight: 700,
            padding: "5px 10px",
            borderRadius: "8px",
            backdropFilter: "blur(8px)",
            border: "1px solid rgba(255, 255, 255, 0.15)",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            zIndex: 10
          }}
        >
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#00f2fe" }}></span>
          ORIGINAL PHOTO
        </div>

        {/* Guiding Prompt on Canvas */}
        <div
          style={{
            position: "absolute",
            bottom: 16,
            left: 16,
            right: 16,
            background: "rgba(10, 12, 20, 0.82)",
            color: "#ffffff",
            fontSize: "0.8rem",
            fontWeight: 600,
            padding: "10px 14px",
            borderRadius: "12px",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(0, 242, 254, 0.3)",
            textAlign: "center",
            boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
            zIndex: 10,
            animation: "pulse 2s infinite ease-in-out"
          }}
        >
          ✨ Select a style below to cartoonify
        </div>
      </div>
    );
  }

  // 2. CASE: TRANSFORMED -> Shows Cartoon with Before/After controls
  return (
    <div
      ref={containerRef}
      className="slider-container"
      onPointerDown={viewMode === "split" ? handlePointerDown : undefined}
      style={{ userSelect: "none" }}
    >
      {/* Top Floating Control Bar */}
      <div
        style={{
          position: "absolute",
          top: 12,
          left: 12,
          right: 12,
          zIndex: 30,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          pointerEvents: "none"
        }}
      >
        {/* View Mode Switcher */}
        <div
          style={{
            display: "flex",
            gap: "4px",
            background: "rgba(10, 12, 20, 0.8)",
            padding: "3px",
            borderRadius: "10px",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(255, 255, 255, 0.15)",
            pointerEvents: "auto"
          }}
        >
          <button
            onClick={() => onChangeViewMode && onChangeViewMode("split")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              background: viewMode === "split" ? "var(--accent-cyan)" : "transparent",
              color: viewMode === "split" ? "#0a0c14" : "#ffffff",
              border: "none",
              borderRadius: "7px",
              padding: "4px 8px",
              fontSize: "0.7rem",
              fontWeight: 700,
              cursor: "pointer"
            }}
            title="So sánh Trái/Phải"
          >
            <Columns size={13} />
            <span>Split</span>
          </button>

          <button
            onClick={() => onChangeViewMode && onChangeViewMode("full")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              background: viewMode === "full" ? "var(--accent-cyan)" : "transparent",
              color: viewMode === "full" ? "#0a0c14" : "#ffffff",
              border: "none",
              borderRadius: "7px",
              padding: "4px 8px",
              fontSize: "0.7rem",
              fontWeight: 700,
              cursor: "pointer"
            }}
            title="Ảnh Cartoon đầy đủ"
          >
            <Maximize2 size={13} />
            <span>Cartoon</span>
          </button>

          <button
            onClick={() => onChangeViewMode && onChangeViewMode("pip")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              background: viewMode === "pip" ? "var(--accent-cyan)" : "transparent",
              color: viewMode === "pip" ? "#0a0c14" : "#ffffff",
              border: "none",
              borderRadius: "7px",
              padding: "4px 8px",
              fontSize: "0.7rem",
              fontWeight: 700,
              cursor: "pointer"
            }}
            title="Ảnh Cartoon kèm góc ảnh thật"
          >
            <PictureInPicture2 size={13} />
            <span>PiP</span>
          </button>
        </div>

        {/* Revert to Original Button */}
        {onRevertToOriginal && (
          <button
            onClick={onRevertToOriginal}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              background: "rgba(10, 12, 20, 0.8)",
              color: "#ffffff",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              borderRadius: "10px",
              padding: "5px 9px",
              fontSize: "0.7rem",
              fontWeight: 700,
              backdropFilter: "blur(10px)",
              cursor: "pointer",
              pointerEvents: "auto"
            }}
            title="Xem lại ảnh thật gốc"
          >
            <RotateCcw size={12} color="#00f2fe" />
            <span>Original</span>
          </button>
        )}
      </div>

      {/* Main Processed Cartoon Result (Full canvas) */}
      <img
        src={processedUrl}
        alt="Cartoonified result"
        className="slider-img-after"
      />

      {/* Mode A: Interactive Split Wipe Slider */}
      {viewMode === "split" && (
        <>
          <div
            className="slider-img-before"
            style={{ width: `${sliderPos}%` }}
          >
            <img
              src={originalUrl}
              alt="Original portrait"
              style={{
                width: containerRef.current ? containerRef.current.clientWidth : "100%",
                height: "100%",
                objectFit: "cover"
              }}
            />
            {/* Label BEFORE */}
            <div
              style={{
                position: "absolute",
                top: 48,
                left: 14,
                background: "rgba(0,0,0,0.7)",
                color: "#ffffff",
                fontSize: "0.68rem",
                fontWeight: 800,
                padding: "3px 8px",
                borderRadius: "6px",
                backdropFilter: "blur(4px)",
                border: "1px solid rgba(255,255,255,0.15)"
              }}
            >
              BEFORE
            </div>
          </div>

          {/* Label CARTOON */}
          <div
            style={{
              position: "absolute",
              top: 48,
              right: 14,
              background: "rgba(0, 242, 254, 0.9)",
              color: "#0a0c14",
              fontSize: "0.68rem",
              fontWeight: 900,
              padding: "3px 8px",
              borderRadius: "6px",
              boxShadow: "0 2px 8px rgba(0, 242, 254, 0.4)"
            }}
          >
            CARTOON
          </div>

          {/* Draggable Divider Line & Handle */}
          <div className="slider-divider" style={{ left: `${sliderPos}%` }}>
            <div className="slider-handle">
              <ArrowLeftRight size={16} strokeWidth={2.5} />
            </div>
          </div>
        </>
      )}

      {/* Mode B: Full Cartoon view with badge */}
      {viewMode === "full" && (
        <div
          style={{
            position: "absolute",
            bottom: 16,
            right: 16,
            background: "linear-gradient(135deg, #00f2fe, #4facfe)",
            color: "#0a0c14",
            fontSize: "0.72rem",
            fontWeight: 800,
            padding: "5px 10px",
            borderRadius: "8px",
            boxShadow: "0 4px 14px rgba(0, 242, 254, 0.4)"
          }}
        >
          ✨ 100% CARTOON
        </div>
      )}

      {/* Mode C: Picture-in-Picture Floating Original Selfie */}
      {viewMode === "pip" && (
        <div className="pip-thumbnail-wrapper">
          <div className="pip-thumbnail">
            <svg
              className="pip-arrow"
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#ffffff"
              strokeWidth="2.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 18a9 9 0 0 0-9-9H4m0 0l4-4m-4 4l4 4" />
            </svg>
            <img src={originalUrl} alt="Original real photo" />
            <div className="pip-badge">ORIGINAL</div>
          </div>
        </div>
      )}
    </div>
  );
}
