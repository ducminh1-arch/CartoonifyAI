import React from 'react';
import { Sparkles, Crown, Zap } from 'lucide-react';

export default function Header({ onOpenProModal }) {
  return (
    <header className="app-header">
      <div className="brand-badge">
        <img src="/logo.svg" alt="Cartoonify AI" className="brand-logo" />
        <div>
          <h1 className="brand-name">Cartoonify AI</h1>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div className="offline-badge" title="Running 100% locally on your device">
          <span className="offline-dot"></span>
          <span>Offline AI</span>
        </div>

        <button className="pro-chip" onClick={onOpenProModal} aria-label="PRO features">
          <Crown size={13} />
          <span>PRO</span>
        </button>
      </div>
    </header>
  );
}
