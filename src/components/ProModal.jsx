import React from 'react';
import { X, Crown, Check, Sparkles, Zap, ShieldAlert } from 'lucide-react';

export default function ProModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const features = [
    'Unlock all 100+ Cartoon & AnimeGAN filters',
    'Ultra-HD 4K Export with zero compression',
    'Unlimited Caricature Big Head & Chin Warping',
    'Custom Blister Pack Action Figure & Poster badges',
    'Zero Ads & 100% Offline On-Device Processing'
  ];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        background: 'rgba(10, 12, 20, 0.85)',
        backdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '380px',
          background: 'linear-gradient(180deg, #1b162b 0%, #0d0f17 100%)',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid rgba(255, 0, 127, 0.3)',
          boxShadow: '0 20px 50px rgba(121, 40, 202, 0.5)',
          padding: '24px',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 14,
            right: 14,
            background: 'rgba(255, 255, 255, 0.1)',
            border: 'none',
            color: '#fff',
            width: 32,
            height: 32,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }}
        >
          <X size={18} />
        </button>

        <div
          style={{
            width: 60,
            height: 60,
            borderRadius: '50%',
            background: 'var(--grad-brand)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            marginBottom: 16,
            boxShadow: '0 0 25px rgba(255, 0, 127, 0.6)'
          }}
        >
          <Crown size={32} />
        </div>

        <h3 style={{ fontSize: '1.4rem', fontWeight: 900, marginBottom: 4 }}>Cartoonify PRO</h3>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 20 }}>
          Unlock unlimited creative power on your phone
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', marginBottom: 24, textAlign: 'left' }}>
          {features.map((feat, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.82rem' }}>
              <div
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  background: 'rgba(56, 239, 125, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#38ef7d',
                  flexShrink: 0
                }}
              >
                <Check size={12} strokeWidth={3} />
              </div>
              <span style={{ color: '#e2e8f0', fontWeight: 600 }}>{feat}</span>
            </div>
          ))}
        </div>

        <button
          className="btn-primary"
          style={{
            width: '100%',
            background: 'var(--grad-brand)',
            color: '#fff',
            boxShadow: '0 0 20px rgba(255, 0, 127, 0.5)'
          }}
          onClick={onClose}
        >
          <Sparkles size={18} />
          <span>Activated (Full Version)</span>
        </button>
      </div>
    </div>
  );
}
