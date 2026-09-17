/**
 * samplePortraits.js
 * Curated high-res portraits and their 100% authentic 2D/3D Cartoon counterparts
 * aligned 1:1 with the original photos.
 */

export const SAMPLE_PORTRAITS = [
  {
    id: "girl_selfie",
    title: "Casual Selfie (Anime & Cartoon)",
    subtitle: "100% Aligned 2D Cartoon / Anime look",
    url: "/samples/girl_selfie.jpg",
    resultUrl: "/samples/girl_selfie_cartoon.jpg",
    defaultStyle: "anime",
    featuredBadge: "Photo to Anime",
    styleArtworks: {
      anime: "/samples/girl_selfie_cartoon.jpg",
      cartoon_avatar: "/samples/girl_selfie_cartoon.jpg",
      shinkai: "/samples/girl_selfie_cartoon.jpg"
    }
  },
  {
    id: "man_suit",
    title: "Executive Portrait (3D Pixar & Caricature)",
    subtitle: "100% Aligned 3D Pixar & Street Art Caricature",
    url: "/samples/man_suit.jpg",
    resultUrl: "/samples/man_suit_cartoon.jpg",
    defaultStyle: "pixar3d",
    featuredBadge: "3D Cartoon Man",
    styleArtworks: {
      pixar3d: "/samples/man_suit_cartoon.jpg",
      cartoon_avatar: "/samples/man_suit_cartoon.jpg",
      street_art: "/samples/man_suit_caricature.jpg",
      caricature: "/samples/man_suit_caricature.jpg"
    }
  },
  {
    id: "woman_croissant",
    title: "Parisian Cafe (Croissant Cartoon)",
    subtitle: "100% Aligned Cafe Cartoon holding croissant",
    url: "/samples/woman_croissant.jpg",
    resultUrl: "/samples/woman_croissant_cartoon.jpg",
    defaultStyle: "cartoon_avatar",
    featuredBadge: "Cafe Cartoon",
    styleArtworks: {
      cartoon_avatar: "/samples/woman_croissant_cartoon.jpg",
      anime: "/samples/woman_croissant_cartoon.jpg",
      pixar3d: "/samples/woman_croissant_cartoon.jpg",
      game_poster: "/samples/riviera_rush_poster.jpg"
    }
  },
  {
    id: "couple",
    title: "Lovely Couple (3D Pixar Avatar)",
    subtitle: "Create Viral Couple Avatars in Polaroid",
    url: "/samples/couple.jpg",
    resultUrl: "/samples/couple_pixar3d.jpg",
    defaultStyle: "pixar3d",
    featuredBadge: "3D Pixar Couple",
    styleArtworks: {
      pixar3d: "/samples/couple_pixar3d.jpg",
      cartoon_avatar: "/samples/couple_pixar3d.jpg"
    }
  }
];

export function getSampleCartoonArtwork(portraitId, styleId) {
  const p = SAMPLE_PORTRAITS.find(item => item.id === portraitId);
  if (!p) return "/samples/girl_selfie_cartoon.jpg";
  if (p.styleArtworks && p.styleArtworks[styleId]) {
    return p.styleArtworks[styleId];
  }
  return p.resultUrl || "/samples/girl_selfie_cartoon.jpg";
}
