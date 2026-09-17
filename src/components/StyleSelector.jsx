import React, { useState } from 'react';
import {
  Sparkles,
  Smile,
  User,
  Gamepad2,
  Palette,
  Box,
  BookOpen,
  Zap,
  Shapes
} from 'lucide-react';
import { STYLES, CATEGORIES } from '../engine/cartoonEngine';
import { AI_SUPPORTED_STYLES } from '../engine/aiInferenceEngine';

const ICON_MAP = {
  Sparkles,
  Smile,
  User,
  Gamepad2,
  Palette,
  Box,
  BookOpen,
  Zap,
  Shapes
};

export default function StyleSelector({ currentStyleId, onSelectStyle }) {
  const [activeCategory, setActiveCategory] = useState('All');

  const filteredStyles = STYLES.filter(s => {
    if (activeCategory === 'All') return true;
    if (activeCategory === 'Trending') return s.tag === 'Trending' || s.tag === 'Popular';
    return s.category === activeCategory;
  });

  return (
    <div style={{ marginTop: '8px', marginBottom: '8px' }}>
      {/* Category Pills */}
      <div className="category-scroll">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            className={`category-pill ${activeCategory === cat ? 'active' : ''}`}
            onClick={() => setActiveCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Styles Horizontal Carousel */}
      <div className="style-scroll">
        {filteredStyles.map(style => {
          const IconComp = ICON_MAP[style.icon] || Sparkles;
          const isActive = currentStyleId === style.id;
          return (
            <div
              key={style.id}
              className={`style-card ${isActive ? 'active' : ''}`}
              onClick={() => onSelectStyle(style)}
              role="button"
              tabIndex={0}
            >
              {style.tag && <div className="style-tag-badge">{style.tag}</div>}
              {/* AI Badge for real ONNX inference styles */}
              {AI_SUPPORTED_STYLES.includes(style.id) && (
                <div style={{
                  position: 'absolute',
                  bottom: '22px',
                  right: '4px',
                  background: 'linear-gradient(135deg, #00b4d8, #0077b6)',
                  color: '#fff',
                  fontSize: '0.55rem',
                  fontWeight: 800,
                  padding: '2px 5px',
                  borderRadius: '4px',
                  letterSpacing: '0.03em',
                  lineHeight: 1.2
                }}>🧠 AI</div>
              )}
              <div
                className="style-icon-circle"
                style={{ background: style.gradient }}
              >
                <IconComp size={22} />
              </div>
              <span className="style-title">{style.name}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
