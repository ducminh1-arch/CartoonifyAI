import React from 'react';
import { Sliders, RefreshCw, Eye, Sparkles, Scan, Smile } from 'lucide-react';

export default function TuningPanel({
  params,
  onChangeParam,
  onResetParams,
  styleId,
  faceInfo
}) {
  return (
    <div className="tuning-panel">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sliders size={18} color="#00f2fe" />
          <span style={{ fontSize: '0.85rem', fontWeight: 800 }}>Fine-Tune AI Controls & Mesh</span>
        </div>
        <button
          onClick={onResetParams}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-muted)',
            fontSize: '0.75rem',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            cursor: 'pointer'
          }}
        >
          <RefreshCw size={12} />
          Reset
        </button>
      </div>

      {/* Face Detection & Alignment Diagnostics */}
      {faceInfo && (
        <div style={{
          background: 'rgba(0, 242, 254, 0.08)',
          border: '1px solid rgba(0, 242, 254, 0.25)',
          borderRadius: '8px',
          padding: '8px 10px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '0.74rem',
          margin: '4px 0 8px 0'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Scan size={14} color="#00f2fe" />
            <span style={{ color: '#fff', fontWeight: 700 }}>
              MediaPipe Face Mesh:
            </span>
          </div>
          <span style={{ color: '#38ef7d', fontWeight: 800 }}>
            {faceInfo.detected ? `✓ Active · Tilt ${faceInfo.angleDeg}°` : 'Default Anchors'}
          </span>
        </div>
      )}

      {/* 1. Caricature Head Warping (Đầu to) */}
      <div className="slider-row">
        <div className="slider-label-row">
          <span>Head Bulge Scale (Đầu to biếm họa)</span>
          <span className="slider-value">{Math.round((params.warpFactor || 0) * 100)}%</span>
        </div>
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={params.warpFactor ?? 0.2}
          onChange={(e) => onChangeParam('warpFactor', parseFloat(e.target.value))}
          className="custom-range"
        />
      </div>

      {/* 2. Caricature Eye Magnify (Mắt to hoạt hình) */}
      <div className="slider-row">
        <div className="slider-label-row">
          <span>Anime Big Eyes (Phóng to mắt)</span>
          <span className="slider-value">{Math.round((params.eyeMagnify || 0) * 100)}%</span>
        </div>
        <input
          type="range"
          min="0"
          max="0.8"
          step="0.05"
          value={params.eyeMagnify ?? 0.2}
          onChange={(e) => onChangeParam('eyeMagnify', parseFloat(e.target.value))}
          className="custom-range"
        />
      </div>

      {/* 3. Chin & Shoulder Pinch (Cằm nhọn & Thân nhỏ) */}
      <div className="slider-row">
        <div className="slider-label-row">
          <span>Chin & Body Pinch (Thân nhỏ đầu to)</span>
          <span className="slider-value">{Math.round((params.chinTaper || 0) * 100)}%</span>
        </div>
        <input
          type="range"
          min="0"
          max="0.8"
          step="0.05"
          value={params.chinTaper ?? 0.2}
          onChange={(e) => onChangeParam('chinTaper', parseFloat(e.target.value))}
          className="custom-range"
        />
      </div>

      {/* 4. Cartoon Line Inking */}
      <div className="slider-row">
        <div className="slider-label-row">
          <span>Ink Contours & Outlines</span>
          <span className="slider-value">{Math.round(params.lineStrength * 100)}%</span>
        </div>
        <input
          type="range"
          min="0.1"
          max="1.5"
          step="0.05"
          value={params.lineStrength}
          onChange={(e) => onChangeParam('lineStrength', parseFloat(e.target.value))}
          className="custom-range"
        />
      </div>

      {/* 5. Color Vibrance */}
      <div className="slider-row">
        <div className="slider-label-row">
          <span>Color Vibrance & Saturation</span>
          <span className="slider-value">{Math.round(params.saturation * 100)}%</span>
        </div>
        <input
          type="range"
          min="0.8"
          max="2.0"
          step="0.05"
          value={params.saturation}
          onChange={(e) => onChangeParam('saturation', parseFloat(e.target.value))}
          className="custom-range"
        />
      </div>

      {/* Toggles */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px', paddingTop: '6px', borderTop: '1px solid var(--border-glass)' }}>
        {/* Toggle Face Alignment */}
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: '#fff', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={params.enableFaceAlign ?? true}
            onChange={(e) => onChangeParam('enableFaceAlign', e.target.checked)}
            style={{ accentColor: '#00f2fe' }}
          />
          <span>Auto Face Tilt Alignment (0° Eye Level)</span>
        </label>

        {/* Toggle Landmark Mesh Visualizer */}
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: '#fff', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={params.showLandmarks ?? false}
            onChange={(e) => onChangeParam('showLandmarks', e.target.checked)}
            style={{ accentColor: '#38ef7d' }}
          />
          <span>Show MediaPipe Face Mesh & Landmarks</span>
        </label>

        {/* Badges and overlay toggles */}
        {styleId === 'game_poster' && (
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: '#fff', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={params.overlayPosterBadge}
              onChange={(e) => onChangeParam('overlayPosterBadge', e.target.checked)}
              style={{ accentColor: '#00f2fe' }}
            />
            <span>Show "RIVIERA RUSH" Game Poster Badge</span>
          </label>
        )}

        {styleId === 'action_figure' && (
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: '#fff', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={params.overlayActionBox}
              onChange={(e) => onChangeParam('overlayActionBox', e.target.checked)}
              style={{ accentColor: '#00f2fe' }}
            />
            <span>Show Collector Blister Card Box</span>
          </label>
        )}
      </div>
    </div>
  );
}
