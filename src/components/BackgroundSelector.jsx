import React from 'react';
import { BACKGROUND_TEMPLATES } from '../engine/backgroundTemplates';
import { Image as ImageIcon, Sparkles } from 'lucide-react';

export default function BackgroundSelector({ currentTemplateId, onSelectTemplate }) {
  return (
    <div style={{ marginTop: '4px', marginBottom: '8px', padding: '0 16px' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '6px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <ImageIcon size={14} color="#38ef7d" />
          <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)' }}>
            CARTOON BACKGROUND & TEMPLATES
          </span>
        </div>
        <span style={{ fontSize: '0.7rem', color: '#38ef7d', fontWeight: 700 }}>
          {BACKGROUND_TEMPLATES.find(t => t.id === currentTemplateId)?.name || 'Default'}
        </span>
      </div>

      {/* Horizontal Carousel of Background Templates */}
      <div style={{
        display: 'flex',
        gap: '8px',
        overflowX: 'auto',
        paddingBottom: '4px',
        scrollbarWidth: 'none'
      }}>
        {BACKGROUND_TEMPLATES.map((tmpl) => {
          const isActive = currentTemplateId === tmpl.id;
          return (
            <div
              key={tmpl.id}
              onClick={() => onSelectTemplate(tmpl.id)}
              role="button"
              tabIndex={0}
              style={{
                flex: '0 0 84px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
                cursor: 'pointer',
                borderRadius: '10px',
                padding: '5px',
                background: isActive ? 'rgba(56, 239, 125, 0.12)' : 'var(--bg-glass)',
                border: isActive ? '2px solid #38ef7d' : '1px solid var(--border-glass)',
                transition: 'all 0.2s ease'
              }}
            >
              {/* Preview swatch */}
              <div
                style={{
                  width: '100%',
                  height: '42px',
                  borderRadius: '6px',
                  background: tmpl.previewColor,
                  border: '1px solid rgba(255,255,255,0.1)',
                  boxShadow: isActive ? '0 0 8px rgba(56,239,125,0.4)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontSize: '0.65rem',
                  fontWeight: 800
                }}
              >
                {tmpl.id === 'none' ? 'Clean' : tmpl.category}
              </div>

              <span
                style={{
                  fontSize: '0.68rem',
                  fontWeight: isActive ? 800 : 600,
                  color: isActive ? '#fff' : 'var(--text-secondary)',
                  textAlign: 'center',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  width: '100%'
                }}
              >
                {tmpl.name}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
