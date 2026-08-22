/**
 * High-Density 2D Particle & Density Map Accumulator
 * Renders hundreds of thousands of discrete map iterations with 3D rotation, tilt & additive glow.
 */

import { samplePalette } from '../config/palettes.js';

export class Canvas2DRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.currX = 0.1;
    this.currY = 0.1;
    this.iterationCount = 0;
  }

  resize(width, height) {
    this.canvas.width = width;
    this.canvas.height = height;
    this.clear();
  }

  clear() {
    this.ctx.fillStyle = '#05050a';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.currX = 0.1;
    this.currY = 0.1;
    this.iterationCount = 0;
  }

  /**
   * Applies motion decay trail to the canvas.
   */
  fade(fadeAlpha = 0.04) {
    this.ctx.save();
    this.ctx.globalCompositeOperation = 'source-over';
    this.ctx.fillStyle = `rgba(5, 5, 10, ${fadeAlpha})`;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.restore();
  }

  /**
   * Renders a batch of discrete 2D map iterations with full 3D rotation, pan, and zoom camera support.
   */
  render2DMapBatch(iterateFn, params, iterations = 35000, paletteId = 'bioluminescence', scaleFactor = 0.25, camera = { rotX: 0, rotY: 0, panX: 0, panY: 0, zoom: 1.0 }) {
    const { width, height } = this.canvas;
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

    this.ctx.save();
    this.ctx.globalCompositeOperation = 'lighter';

    let x = this.currX;
    let y = this.currY;

    for (let i = 0; i < iterations; i++) {
      const [nextX, nextY] = iterateFn(x, y, params);
      x = nextX;
      y = nextY;

      // Filter non-finite or extreme values
      if (!isFinite(x) || !isFinite(y) || Math.abs(x) > 100 || Math.abs(y) > 100) {
        x = (Math.random() - 0.5) * 0.2;
        y = (Math.random() - 0.5) * 0.2;
      }

      // 3D rotation & projection of (x, y, 0)
      const x0 = x * baseDim;
      const y0 = y * baseDim;

      const x1 = x0 * cosY;
      const z1 = -x0 * sinY;

      const y2 = y0 * cosX - z1 * sinX;
      const z2 = y0 * sinX + z1 * cosX;

      const pz = z2 + distance;
      if (pz <= 20) continue;

      const fovScale = fov / pz;
      const px = cx + x1 * fovScale;
      const py = cy - y2 * fovScale;

      if (px >= 0 && px < width && py >= 0 && py < height) {
        const speed = Math.hypot(nextX - x, nextY - y);
        const normDist = Math.min(1.0, Math.hypot(x, y) * 0.4 + speed * 0.2);
        
        this.ctx.fillStyle = samplePalette(paletteId, normDist, 0.22);
        this.ctx.fillRect(px, py, 1.2, 1.2);
      }
    }

    this.currX = x;
    this.currY = y;
    this.iterationCount += iterations;

    this.ctx.restore();
  }
}
