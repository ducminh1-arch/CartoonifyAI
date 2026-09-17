import React, { useRef, useState, useEffect } from 'react';
import { Camera, X, RefreshCw, AlertCircle } from 'lucide-react';

export default function CameraModal({ isOpen, onClose, onCapturePhoto }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [facingMode, setFacingMode] = useState('user'); // 'user' (front) or 'environment' (back)
  const [cameraError, setCameraError] = useState(null);
  const [isInitializing, setIsInitializing] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      stopStream();
      return;
    }

    startCamera(facingMode);

    return () => {
      stopStream();
    };
  }, [isOpen, facingMode]);

  const startCamera = async (mode) => {
    setIsInitializing(true);
    setCameraError(null);
    stopStream();

    try {
      const constraints = {
        video: {
          facingMode: mode,
          width: { ideal: 960 },
          height: { ideal: 960 }
        },
        audio: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (err) {
      console.warn('[Camera] Could not access camera:', err);
      setCameraError('Camera access denied or unavailable. Please check browser permissions.');
    } finally {
      setIsInitializing(false);
    }
  };

  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const handleCapture = () => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 720;
    canvas.height = video.videoHeight || 960;
    const ctx = canvas.getContext('2d');

    // If front camera, mirror horizontally for natural selfie
    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.95);

    stopStream();
    onCapturePhoto(dataUrl);
    onClose();
  };

  const toggleFacingMode = () => {
    setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.92)',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '20px 16px'
      }}
    >
      {/* Top Header */}
      <div
        style={{
          width: '100%',
          maxWidth: '500px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          color: '#fff'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Camera size={20} color="#00f2fe" />
          <span style={{ fontSize: '0.95rem', fontWeight: 800 }}>Take Portrait Selfie</span>
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'rgba(255,255,255,0.12)',
            border: 'none',
            borderRadius: '50%',
            width: 36,
            height: 36,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            cursor: 'pointer'
          }}
        >
          <X size={20} />
        </button>
      </div>

      {/* Camera Viewfinder View */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '440px',
          aspectRatio: '3/4',
          borderRadius: '24px',
          overflow: 'hidden',
          backgroundColor: '#0a0c14',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '2px solid rgba(0, 242, 254, 0.3)'
        }}
      >
        {cameraError ? (
          <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <AlertCircle size={36} color="#ff4e50" style={{ margin: '0 auto 12px' }} />
            <p style={{ fontSize: '0.85rem', color: '#fff', marginBottom: '8px' }}>{cameraError}</p>
            <button
              onClick={() => startCamera(facingMode)}
              className="btn-secondary"
              style={{ margin: '8px auto 0', padding: '6px 14px', fontSize: '0.78rem' }}
            >
              Retry Access
            </button>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              playsInline
              autoPlay
              muted
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transform: facingMode === 'user' ? 'scaleX(-1)' : 'none'
              }}
            />

            {/* Oval Face Guide Overlay */}
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '68%',
                height: '62%',
                border: '2px dashed rgba(0, 242, 254, 0.7)',
                borderRadius: '50%',
                pointerEvents: 'none',
                boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.35)'
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: '-24px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: 'rgba(0, 242, 254, 0.9)',
                  color: '#0a0c14',
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: '10px',
                  whiteSpace: 'nowrap'
                }}
              >
                ALIGN FACE HERE
              </div>
            </div>
          </>
        )}
      </div>

      {/* Bottom Controls */}
      <div
        style={{
          width: '100%',
          maxWidth: '440px',
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'center',
          paddingBottom: '10px'
        }}
      >
        <button
          onClick={toggleFacingMode}
          title="Flip Camera"
          style={{
            background: 'rgba(255,255,255,0.12)',
            border: 'none',
            borderRadius: '50%',
            width: 48,
            height: 48,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            cursor: 'pointer'
          }}
        >
          <RefreshCw size={20} />
        </button>

        {/* Shutter Button */}
        <button
          onClick={handleCapture}
          disabled={!!cameraError || isInitializing}
          style={{
            width: 72,
            height: 72,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #00f2fe, #4facfe)',
            border: '4px solid #ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 20px rgba(0, 242, 254, 0.6)',
            cursor: 'pointer',
            opacity: cameraError ? 0.4 : 1
          }}
        >
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: '50%',
              backgroundColor: '#ffffff'
            }}
          />
        </button>

        <div style={{ width: 48 }} />
      </div>
    </div>
  );
}
