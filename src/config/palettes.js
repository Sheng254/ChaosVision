/**
 * Curated Designer Color Palettes & Gradient Interpolation Engine
 * Provides luminous multi-stop ramps for generative chaotic art.
 */

export const COLOR_PALETTES = {
  bioluminescence: {
    id: 'bioluminescence',
    name: 'Bioluminescence',
    stops: [
      { pos: 0.0, color: [0, 242, 254] },     // Electric Cyan
      { pos: 0.35, color: [79, 172, 254] },   // Ocean Blue
      { pos: 0.7, color: [123, 44, 191] },    // Deep Violet
      { pos: 1.0, color: [255, 0, 128] }      // Bio Pink
    ],
    primaryHex: '#00f2fe'
  },

  cyberpunk: {
    id: 'cyberpunk',
    name: 'Cyberpunk Neon',
    stops: [
      { pos: 0.0, color: [255, 0, 127] },     // Hot Magenta
      { pos: 0.4, color: [142, 45, 226] },    // Purple Haze
      { pos: 0.75, color: [0, 240, 255] },    // Laser Cyan
      { pos: 1.0, color: [255, 230, 0] }      // Volt Yellow
    ],
    primaryHex: '#ff007f'
  },

  solarFlare: {
    id: 'solarFlare',
    name: 'Solar Flare',
    stops: [
      { pos: 0.0, color: [255, 183, 3] },     // Magma Gold
      { pos: 0.4, color: [251, 133, 0] },     // Radiant Ember
      { pos: 0.75, color: [208, 0, 0] },      // Crimson Flame
      { pos: 1.0, color: [106, 4, 15] }       // Dark Core
    ],
    primaryHex: '#ffb703'
  },

  infrared: {
    id: 'infrared',
    name: 'Infrared Obsidian',
    stops: [
      { pos: 0.0, color: [255, 255, 255] },   // White Hot
      { pos: 0.25, color: [255, 77, 109] },   // Neon Coral
      { pos: 0.65, color: [164, 19, 60] },    // Ruby Obsidian
      { pos: 1.0, color: [36, 0, 70] }        // Deep Void
    ],
    primaryHex: '#ff4d6d'
  },

  cosmicNebula: {
    id: 'cosmicNebula',
    name: 'Cosmic Nebula',
    stops: [
      { pos: 0.0, color: [199, 125, 255] },   // Lavender Light
      { pos: 0.35, color: [114, 9, 183] },    // Deep Astral
      { pos: 0.7, color: [67, 97, 238] },     // Starlight Blue
      { pos: 1.0, color: [76, 201, 240] }     // Horizon Cyan
    ],
    primaryHex: '#c77dff'
  },

  crtPhosphor: {
    id: 'crtPhosphor',
    name: 'CRT Matrix Green',
    stops: [
      { pos: 0.0, color: [57, 255, 20] },     // Phosphor Green
      { pos: 0.5, color: [0, 200, 83] },      // Emerald Glow
      { pos: 1.0, color: [0, 77, 64] }        // Dark Phosphor
    ],
    primaryHex: '#39ff14'
  },

  electricAmethyst: {
    id: 'electricAmethyst',
    name: 'Electric Amethyst',
    stops: [
      { pos: 0.0, color: [224, 86, 253] },    // Vivid Pink Violet
      { pos: 0.5, color: [104, 109, 224] },   // Royal Indigo
      { pos: 1.0, color: [19, 15, 64] }       // Abyssal Night
    ],
    primaryHex: '#e056fd'
  }
};

/**
 * Samples an RGB color from a palette at normalized position t in [0, 1].
 * @param {string} paletteId - Palette ID
 * @param {number} t - Normalized value between 0.0 and 1.0
 * @param {number} alpha - Opacity from 0.0 to 1.0
 * @returns {string} CSS rgba() string
 */
export function samplePalette(paletteId, t, alpha = 1.0) {
  const palette = COLOR_PALETTES[paletteId] || COLOR_PALETTES.bioluminescence;
  const clampedT = Math.max(0.0, Math.min(1.0, t));
  const stops = palette.stops;

  if (clampedT <= stops[0].pos) {
    const c = stops[0].color;
    return `rgba(${c[0]}, ${c[1]}, ${c[2]}, ${alpha})`;
  }
  if (clampedT >= stops[stops.length - 1].pos) {
    const c = stops[stops.length - 1].color;
    return `rgba(${c[0]}, ${c[1]}, ${c[2]}, ${alpha})`;
  }

  for (let i = 0; i < stops.length - 1; i++) {
    const s1 = stops[i];
    const s2 = stops[i + 1];
    if (clampedT >= s1.pos && clampedT <= s2.pos) {
      const localT = (clampedT - s1.pos) / (s2.pos - s1.pos);
      const r = Math.round(s1.color[0] + (s2.color[0] - s1.color[0]) * localT);
      const g = Math.round(s1.color[1] + (s2.color[1] - s1.color[1]) * localT);
      const b = Math.round(s1.color[2] + (s2.color[2] - s1.color[2]) * localT);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
  }

  const c = stops[0].color;
  return `rgba(${c[0]}, ${c[1]}, ${c[2]}, ${alpha})`;
}

/**
 * Returns raw [r, g, b] array for WebGL or byte buffer operations.
 */
export function samplePaletteRGB(paletteId, t) {
  const palette = COLOR_PALETTES[paletteId] || COLOR_PALETTES.bioluminescence;
  const clampedT = Math.max(0.0, Math.min(1.0, t));
  const stops = palette.stops;

  for (let i = 0; i < stops.length - 1; i++) {
    const s1 = stops[i];
    const s2 = stops[i + 1];
    if (clampedT >= s1.pos && clampedT <= s2.pos) {
      const localT = (clampedT - s1.pos) / (s2.pos - s1.pos);
      return [
        s1.color[0] + (s2.color[0] - s1.color[0]) * localT,
        s1.color[1] + (s2.color[1] - s1.color[1]) * localT,
        s1.color[2] + (s2.color[2] - s1.color[2]) * localT
      ];
    }
  }
  return stops[0].color.slice();
}
