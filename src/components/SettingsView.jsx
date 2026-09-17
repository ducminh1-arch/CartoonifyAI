import React, { useState } from 'react';
import {
  Cpu,
  ShieldCheck,
  Zap,
  Smartphone,
  Check,
  HardDrive,
  Info,
  Scan,
  GitBranch,
  Layers,
  Layers2
} from 'lucide-react';

export default function SettingsView() {
  const [resolution, setResolution] = useState('1080p');

  return (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px', paddingBottom: '30px' }}>
      <div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Settings & AI Diagnostics</h2>
        <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
          On-device offline AI pipeline details, benchmarks & preferences
        </p>
      </div>

      {/* Offline AI Architecture Status Card */}
      <div
        style={{
          background: 'var(--bg-glass)',
          border: '1px solid var(--border-glass)',
          borderRadius: 'var(--radius-lg)',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: '10px',
              background: 'rgba(56, 239, 125, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#38ef7d'
            }}
          >
            <Cpu size={22} />
          </div>
          <div>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 800 }}>On-Device AI Inference Engine</h4>
            <span style={{ fontSize: '0.72rem', color: '#38ef7d', fontWeight: 700 }}>● Active & 100% Offline (0 Server Calls)</span>
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '8px',
            marginTop: '4px'
          }}
        >
          <div style={{ background: 'var(--bg-tertiary)', padding: '10px', borderRadius: '10px' }}>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Face Detection</span>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#00f2fe' }}>MediaPipe Mesh</div>
          </div>
          <div style={{ background: 'var(--bg-tertiary)', padding: '10px', borderRadius: '10px' }}>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>AI Architecture</span>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#fff' }}>Feed-Forward GAN</div>
          </div>
          <div style={{ background: 'var(--bg-tertiary)', padding: '10px', borderRadius: '10px' }}>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Inference Latency</span>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#38ef7d' }}>0.3s - 1.2s / photo</div>
          </div>
          <div style={{ background: 'var(--bg-tertiary)', padding: '10px', borderRadius: '10px' }}>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Server Cost</span>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#38ef7d' }}>0 VNĐ (Local Chip)</div>
          </div>
        </div>
      </div>

      {/* Comparison Table: Cloud Diffusion vs On-Device GAN (From Prompt Spec) */}
      <div
        style={{
          background: 'var(--bg-glass)',
          border: '1px solid var(--border-glass)',
          borderRadius: 'var(--radius-lg)',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Layers2 size={18} color="#00f2fe" />
          <h4 style={{ fontSize: '0.9rem', fontWeight: 800 }}>Kiến trúc: Cloud Diffusion vs On-Device GAN</h4>
        </div>
        <p style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
          So sánh ưu thế vượt trội khi triển khai mô hình GAN Style Transfer on-device theo đề bài:
        </p>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.72rem', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-glass)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '6px 8px' }}>Tiêu chí</th>
                <th style={{ padding: '6px 8px', color: '#ff4e50' }}>Cloud Diffusion</th>
                <th style={{ padding: '6px 8px', color: '#38ef7d' }}>Offline GAN (App này)</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ padding: '8px', fontWeight: 700 }}>Chi phí máy chủ</td>
                <td style={{ padding: '8px', color: '#ff7b72' }}>Rất đắt (vài ngàn $/tháng)</td>
                <td style={{ padding: '8px', color: '#38ef7d', fontWeight: 800 }}>0 VNĐ (chạy trên máy)</td>
              </tr>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ padding: '8px', fontWeight: 700 }}>Tốc độ xử lý</td>
                <td style={{ padding: '8px' }}>5 – 15 giây (phụ thuộc mạng)</td>
                <td style={{ padding: '8px', color: '#00f2fe', fontWeight: 800 }}>Dưới 1 giây / ảnh</td>
              </tr>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ padding: '8px', fontWeight: 700 }}>Dung lượng cài đặt</td>
                <td style={{ padding: '8px' }}>App nhẹ (~30 MB)</td>
                <td style={{ padding: '8px' }}>Vừa phải (50 – 80 MB có model)</td>
              </tr>
              <tr>
                <td style={{ padding: '8px', fontWeight: 700 }}>Rủi ro kiểm duyệt</td>
                <td style={{ padding: '8px', color: '#ff7b72' }}>Dễ bị quét ảnh nhạy cảm</td>
                <td style={{ padding: '8px', color: '#38ef7d' }}>Rất an toàn (bộ lọc filter)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 3-Step Implementation Pipeline Architecture */}
      <div
        style={{
          background: 'var(--bg-glass)',
          border: '1px solid var(--border-glass)',
          borderRadius: 'var(--radius-lg)',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Scan size={18} color="#00f2fe" />
          <h4 style={{ fontSize: '0.9rem', fontWeight: 800 }}>Pipeline xử lý ảnh chuẩn On-Device</h4>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ background: 'var(--bg-tertiary)', padding: '10px', borderRadius: '8px' }}>
            <div style={{ color: '#00f2fe', fontWeight: 800, fontSize: '0.78rem', marginBottom: '4px' }}>
              Bước 1: Pre-processing (Tiền xử lý)
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
              • Camera selfie hoặc tải ảnh từ thư viện.<br />
              • MediaPipe Face Mesh định vị mắt, mũi, miệng, cằm và tính góc nghiêng θ.<br />
              • Căn chỉnh mắt ngang (0° tilt) và crop tỷ lệ chuẩn đầu vào 512x512.<br />
              • Chuẩn hóa pixel về tensor [-1, 1] hoặc [0, 1].
            </div>
          </div>

          <div style={{ background: 'var(--bg-tertiary)', padding: '10px', borderRadius: '8px' }}>
            <div style={{ color: '#38ef7d', fontWeight: 800, fontSize: '0.78rem', marginBottom: '4px' }}>
              Bước 2: On-Device Inference (Chạy AI)
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
              • AnimeGANv2 / White-box CartoonGAN (Feed-Forward 1 chiều).<br />
              • Android: TensorFlow Lite (TFLite) bật NNAPI / GPU Delegate.<br />
              • iOS: Core ML (.mlpackage) chạy qua Apple Neural Engine (ANE).<br />
              • Web / Hybrid: ONNX Runtime Web với WebGPU / WASM SIMD.
            </div>
          </div>

          <div style={{ background: 'var(--bg-tertiary)', padding: '10px', borderRadius: '8px' }}>
            <div style={{ color: '#ff007f', fontWeight: 800, fontSize: '0.78rem', marginBottom: '4px' }}>
              Bước 3: Post-processing (Hậu xử lý & Ghép nền)
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
              • Denormalize tensor thành ảnh RGB sắc nét.<br />
              • Caricature Mesh Warping: phóng to đầu/mắt, bóp thon cằm & vai (đầu to người nhỏ).<br />
              • Tách lớp chủ thể và ghép vào 8 mẫu nền hoạt hình (Manga, Tokyo Sunset, Pop Starburst, Riviera Palms).
            </div>
          </div>
        </div>
      </div>

      {/* Export Resolution */}
      <div
        style={{
          background: 'var(--bg-glass)',
          border: '1px solid var(--border-glass)',
          borderRadius: 'var(--radius-lg)',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}
      >
        <h4 style={{ fontSize: '0.9rem', fontWeight: 800 }}>Export Resolution</h4>
        <div style={{ display: 'flex', gap: '8px' }}>
          {['720p', '1080p', '2K Ultra'].map((res) => (
            <button
              key={res}
              onClick={() => setResolution(res)}
              style={{
                flex: 1,
                padding: '10px',
                borderRadius: '10px',
                background: resolution === res ? 'var(--grad-cyan-blue)' : 'var(--bg-tertiary)',
                color: resolution === res ? '#0a0c14' : '#fff',
                fontWeight: 800,
                fontSize: '0.8rem',
                border: '1px solid var(--border-glass)',
                cursor: 'pointer'
              }}
            >
              {res}
            </button>
          ))}
        </div>
      </div>

      {/* Mobile Native Packaging & Git Repositories */}
      <div
        style={{
          background: 'var(--bg-glass)',
          border: '1px solid var(--border-glass)',
          borderRadius: 'var(--radius-lg)',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Smartphone size={18} color="#00f2fe" />
          <h4 style={{ fontSize: '0.9rem', fontWeight: 800 }}>Mobile Native Repositories & Engine</h4>
        </div>
        <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
          Dự án đồng bộ mã nguồn Native Android (Kotlin + TFLite) và iOS (Swift + Core ML):
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem' }}>
            <Check size={14} color="#38ef7d" />
            <span>Android: TFLite GPU Delegate & NNAPI (<code style={{ color: '#00f2fe' }}>android/</code>)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem' }}>
            <Check size={14} color="#38ef7d" />
            <span>iOS: Apple Neural Engine Core ML (<code style={{ color: '#00f2fe' }}>ios/</code>)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem' }}>
            <GitBranch size={14} color="#38ef7d" />
            <span>GitLab iOS: gitlab.com/sondeptrai/cartoonify_ios</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem' }}>
            <GitBranch size={14} color="#38ef7d" />
            <span>GitLab Android: gitlab.com/sondeptrai/cartoonify_android</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem' }}>
            <HardDrive size={14} color="#38ef7d" />
            <span>Python Export Tools: PyTorch → ONNX → TFLite/CoreML (<code style={{ color: '#00f2fe' }}>tools/</code>)</span>
          </div>
        </div>
      </div>

      {/* Real AI Models Registry */}
      <div
        style={{
          background: 'var(--bg-glass)',
          border: '1px solid var(--border-glass)',
          borderRadius: 'var(--radius-lg)',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Zap size={18} color="#00f2fe" />
            <h4 style={{ fontSize: '0.9rem', fontWeight: 800 }}>Bundled Neural Networks</h4>
          </div>
          <span style={{ fontSize: '0.7rem', color: '#38ef7d', fontWeight: 800, background: 'rgba(56,239,125,0.15)', padding: '2px 8px', borderRadius: '12px' }}>
            4 Models Ready
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[
            { name: 'AnimeGANv2 Face Paint v2', style: 'Photo to Anime', size: '8.2 MB', file: 'face_paint_512_v2_0.onnx' },
            { name: 'AnimeGANv2 Hayao (Ghibli)', style: '3D Pixar Avatar', size: '8.2 MB', file: 'AnimeGANv2_Hayao.onnx' },
            { name: 'AnimeGANv2 Paprika', style: 'Caricature Artist', size: '8.2 MB', file: 'AnimeGANv2_Paprika.onnx' },
            { name: 'AnimeGANv2 Shinkai Cinema', style: 'Shinkai Cinema AI', size: '8.2 MB', file: 'AnimeGANv2_Shinkai.onnx' },
          ].map((m) => (
            <div
              key={m.name}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px 10px',
                background: 'var(--bg-tertiary)',
                borderRadius: '8px',
                fontSize: '0.78rem'
              }}
            >
              <div>
                <div style={{ fontWeight: 700, color: '#fff' }}>{m.name}</div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>Style: {m.style} · {m.file}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.72rem', color: '#00f2fe', fontWeight: 700 }}>{m.size}</span>
                <div style={{ fontSize: '0.65rem', color: '#38ef7d' }}>● Local Bundled</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Privacy Guarantee */}
      <div
        style={{
          background: 'rgba(121, 40, 202, 0.1)',
          border: '1px solid rgba(121, 40, 202, 0.25)',
          borderRadius: 'var(--radius-lg)',
          padding: '14px',
          display: 'flex',
          gap: '12px',
          alignItems: 'center'
        }}
      >
        <ShieldCheck size={28} color="#ff007f" />
        <div>
          <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#fff' }}>100% Privacy Guarantee</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
            Your photos never leave your device. All style transformations run locally.
          </div>
        </div>
      </div>
    </div>
  );
}
