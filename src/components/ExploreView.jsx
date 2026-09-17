import React from "react";
import { ArrowRight, Flame } from "lucide-react";
import { SAMPLE_PORTRAITS } from "../data/samplePortraits";

export default function ExploreView({ onOpenStudioWithPreset }) {
  const manSuit = SAMPLE_PORTRAITS.find((p) => p.id === "man_suit");
  const girlSelfie = SAMPLE_PORTRAITS.find((p) => p.id === "girl_selfie");
  const girlBench = SAMPLE_PORTRAITS.find((p) => p.id === "girl_bench");
  const womanCroissant = SAMPLE_PORTRAITS.find((p) => p.id === "woman_croissant");
  const couple = SAMPLE_PORTRAITS.find((p) => p.id === "couple");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px", paddingBottom: "20px" }}>
      {/* Hero Banner: Game Poster Style (Riviera Rush) */}
      <div
        className="hero-banner"
        onClick={() => onOpenStudioWithPreset(womanCroissant, "game_poster")}
        style={{ cursor: "pointer" }}
      >
        <img
          src="/samples/woman_cafe_cartoon.jpg"
          alt="Game Poster Style Riviera Rush"
          className="hero-img"
        />
        <div className="hero-overlay">
          <div className="hero-badge">
            <Flame size={12} style={{ display: "inline", marginRight: 4 }} />
            FEATURED GAME POSTER
          </div>
          <h2 className="hero-title">Riviera Rush Poster</h2>
          <p className="hero-subtitle">Grand Theft Auto & Riviera Rush comic game cover art with bold cel-shading</p>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#00f2fe", fontSize: "0.85rem", fontWeight: 700 }}>
            <span>Thử phong cách này ngay</span>
            <ArrowRight size={16} />
          </div>
        </div>
      </div>

      {/* 100+ Styles Header */}
      <div style={{ padding: "8px 16px 4px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h3 style={{ fontSize: "1.2rem", fontWeight: 800 }}>100+ Phong cách Cartoon</h3>
          <p style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>
            Biến ảnh chân dung thành Anime, Caricature, Riviera Poster & 3D Pixar
          </p>
        </div>
        <div
          style={{
            background: "rgba(0, 242, 254, 0.12)",
            color: "#00f2fe",
            padding: "4px 10px",
            borderRadius: "var(--radius-full)",
            fontSize: "0.72rem",
            fontWeight: 800
          }}
        >
          100% CARTOON
        </div>
      </div>

      {/* Grid Showcase Matching App Store Screenshots with True Cartoons */}
      <div className="showcase-grid">
        {/* Card 1: Turn your Photos to Anime */}
        <div
          className="showcase-card"
          onClick={() => onOpenStudioWithPreset(girlSelfie, "anime")}
        >
          <img src="/samples/girl_selfie_anime.jpg" alt="Turn your Photos to Anime" />
          <div className="showcase-info">
            <span className="showcase-tag">TRENDING</span>
            <span className="showcase-title">Turn Photos to Anime</span>
          </div>
        </div>

        {/* Card 2: Cartoon Yourself */}
        <div
          className="showcase-card"
          onClick={() => onOpenStudioWithPreset(girlBench || girlSelfie, "cartoon_avatar")}
        >
          <img src="/samples/cartoon_yourself_girl.jpg" alt="Cartoon Yourself" />
          <div className="showcase-info">
            <span className="showcase-tag">PARK ARTIST</span>
            <span className="showcase-title">Cartoon Yourself</span>
          </div>
        </div>

        {/* Card 3: Game Poster Riviera Rush */}
        <div
          className="showcase-card"
          onClick={() => onOpenStudioWithPreset(womanCroissant, "game_poster")}
        >
          <img src="/samples/woman_cafe_cartoon.jpg" alt="Game Poster Riviera Rush" />
          <div className="showcase-info">
            <span className="showcase-tag">ACTION POSTER</span>
            <span className="showcase-title">Game Poster Style</span>
          </div>
        </div>

        {/* Card 4: Street Art Executive Man */}
        <div
          className="showcase-card"
          onClick={() => onOpenStudioWithPreset(manSuit, "street_art")}
        >
          <img src="/samples/man_suit_cartoon.jpg" alt="Street Art AI Man in Suit" />
          <div className="showcase-info">
            <span className="showcase-tag">URBAN MURAL</span>
            <span className="showcase-title">Street Art AI</span>
          </div>
        </div>

        {/* Card 5: Lovely Couple 3D Pixar */}
        <div
          className="showcase-card"
          onClick={() => onOpenStudioWithPreset(couple, "pixar3d")}
        >
          <img src="/samples/couple_pixar3d.jpg" alt="Lovely Couple 3D Disney Pixar" />
          <div className="showcase-info">
            <span className="showcase-tag">DISNEY 3D</span>
            <span className="showcase-title">3D Pixar Avatar</span>
          </div>
        </div>

        {/* Card 6: Caricature Big Head */}
        <div
          className="showcase-card"
          onClick={() => onOpenStudioWithPreset(manSuit, "caricature")}
        >
          <img src="/samples/man_suit_cartoon.jpg" alt="Caricature Maker" />
          <div className="showcase-info">
            <span className="showcase-tag">BIG HEAD</span>
            <span className="showcase-title">Caricature Artist</span>
          </div>
        </div>
      </div>
    </div>
  );
}
