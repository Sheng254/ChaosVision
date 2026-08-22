/**
 * High-Performance 2D & 3D Particle & Density Map Accumulator
 * Precomputed color LUT and fast GPU state batching for locked 60/120 FPS interaction.
 */

import { samplePalette } from '../config/palettes.js';

export class Canvas2DRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.currX = 0.1;
    this.currY = 0.1;
    this.currZ = 0.1;
    this.iterationCount = 0;
    this.lutCache = {};
  }

  clear() {
    this.ctx.fillStyle = '#05050a';
    this.ctx.fillRect(0, 0, this.canvas.clientWidth, this.canvas.clientHeight);
    this.currX = 0.1;
    this.currY = 0.1;
    this.currZ = 0.1;
    this.iterationCount = 0;
  }

  fade(fadeAlpha = 0.04) {
    this.ctx.save();
    this.ctx.globalCompositeOperation = 'source-over';
    this.ctx.fillStyle = `rgba(5, 5, 10, ${fadeAlpha})`;
    this.ctx.fillRect(0, 0, this.canvas.clientWidth, this.canvas.clientHeight);
    this.ctx.restore();
  }

  getPaletteLUT(paletteId, alpha = 0.22) {
    const key = `${paletteId}_${alpha.toFixed(2)}`;
    if (!this.lutCache[key]) {
      const lut = new Array(256);
      for (let i = 0; i < 256; i++) {
        lut[i] = samplePalette(paletteId, i / 255, alpha);
      }
      this.lutCache[key] = lut;
    }
    return this.lutCache[key];
  }

  render2DMapBatch(iterateFn, params, iterations = 35000, paletteId = 'bioluminescence', scaleFactor = 0.25, camera = { rotX: 0, rotY: 0, panX: 0, panY: 0, zoom: 1.0 }) {
    const width = this.canvas.clientWidth;
    const height = this.canvas.clientHeight;
    const cx = width / 2 + camera.panX;
    const cy = height / 2 + camera.panY;
    const zoom = camera.zoom || 1.0;
    const baseDim = Math.min(width, height) * scaleFactor * zoom;

    const cosY = Math.cos(camera.rotY || 0);
    const sinY = Math.sin(camera.rotY || 0);
    const cosX = Math.cos(camera.rotX || 0);
    const sinX = Math.sin(camera.rotX || 0);

    const fov = 600;
    const distance = 800;

    const lut = this.getPaletteLUT(paletteId, 0.22);

    this.ctx.save();
    this.ctx.globalCompositeOperation = 'lighter';

    let x = this.currX;
    let y = this.currY;
    let z = this.currZ;
    const is3D = iterateFn.length > 3;

    let lastColor = null;

    for (let i = 0; i < iterations; i++) {
      const result = is3D ? iterateFn(x, y, z, params) : iterateFn(x, y, params);
      if (!result) continue;
      const nextX = result[0];
      const nextY = result[1];
      const nextZ = result.length > 2 ? result[2] : 0;

      // Filter non-finite, extreme exploding values, or fixed-point point stall
      const speed = Math.hypot(nextX - x, nextY - y, nextZ - z);
      if (!isFinite(nextX) || !isFinite(nextY) || !isFinite(nextZ) ||
          Math.abs(nextX) > 100 || Math.abs(nextY) > 100 || Math.abs(nextZ) > 100 ||
          (speed < 1e-6 && i > 100)) {
        x = (Math.random() - 0.5) * 0.4;
        y = (Math.random() - 0.5) * 0.4;
        z = (Math.random() - 0.5) * 0.4;
        continue;
      }

      x = nextX;
      y = nextY;
      z = nextZ;

      // True 3D rotation & perspective projection of (x, y, z)
      const x0 = x * baseDim;
      const y0 = y * baseDim;
      const z0 = z * baseDim;

      const x1 = x0 * cosY + z0 * sinY;
      const z1 = -x0 * sinY + z0 * cosY;

      const y2 = y0 * cosX - z1 * sinX;
      const z2 = y0 * sinX + z1 * cosX;

      const pz = z2 + distance;
      if (pz <= 20) continue;

      const fovScale = fov / pz;
      const px = cx + x1 * fovScale;
      const py = cy - y2 * fovScale;

      if (px >= 0 && px < width && py >= 0 && py < height) {
        const normDist = Math.min(1.0, Math.hypot(x, y, z) * 0.35 + speed * 0.2);
        const lutIndex = (normDist * 255) | 0;
        const color = lut[lutIndex];

        if (color !== lastColor) {
          this.ctx.fillStyle = color;
          lastColor = color;
        }
        this.ctx.fillRect(px, py, 1.2, 1.2);
      }
    }

    this.currX = x;
    this.currY = y;
    this.currZ = z;
    this.iterationCount += iterations;

    this.ctx.restore();
  }
}
