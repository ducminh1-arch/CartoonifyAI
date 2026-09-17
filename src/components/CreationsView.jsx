import React, { useState } from 'react';
import { Download, Trash2, ExternalLink, Image as ImageIcon, Sparkles } from 'lucide-react';

export default function CreationsView({ creations, onDeleteCreation, onSelectCreationToEdit }) {
  const [activeItem, setActiveItem] = useState(null);

  return (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>My Creations</h2>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
            {creations.length} cartoonized portraits saved locally
          </p>
        </div>
      </div>

      {creations.length === 0 ? (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '60px 20px',
            textAlign: 'center',
            background: 'var(--bg-glass)',
            borderRadius: 'var(--radius-xl)',
            border: '1px dashed var(--border-glass)'
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: 'rgba(0, 242, 254, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#00f2fe',
              marginBottom: 16
            }}
          >
            <ImageIcon size={32} />
          </div>
          <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 6 }}>No Creations Yet</h4>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', maxWidth: 260 }}>
            Go to Studio, transform a portrait into Anime or Caricature, and click "Save to Photo Library"!
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
          {creations.map((item) => (
            <div
              key={item.id}
              style={{
                position: 'relative',
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-glass)',
                aspectRatio: '3 / 4'
              }}
            >
              <img
                src={item.url}
                alt="Creation"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />

              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(180deg, transparent 50%, rgba(0,0,0,0.85) 100%)',
                  display: 'flex',
                  alignItems: 'flex-end',
                  justifyContent: 'space-between',
                  padding: '10px'
                }}
              >
                <span
                  style={{
                    fontSize: '0.65rem',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    color: '#00f2fe',
                    background: 'rgba(0,0,0,0.5)',
                    padding: '2px 6px',
                    borderRadius: '4px'
                  }}
                >
                  {item.styleId}
                </span>

                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = item.url;
                      link.download = `cartoonify_${item.id}.jpg`;
                      link.click();
                    }}
                    style={{
                      background: 'rgba(255,255,255,0.2)',
                      border: 'none',
                      color: '#fff',
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer'
                    }}
                    title="Download"
                  >
                    <Download size={14} />
                  </button>

                  <button
                    onClick={() => onDeleteCreation(item.id)}
                    style={{
                      background: 'rgba(255, 59, 48, 0.3)',
                      border: 'none',
                      color: '#ff3b30',
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer'
                    }}
                    title="Delete"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
