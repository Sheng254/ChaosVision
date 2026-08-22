/**
 * Mathematical 3D Phase-Space Feigenbaum Bifurcation Cascade Engine
 * Computes the exact delay-coordinate embedding (r, x_n, x_{n-1}) of the Logistic Map:
 *   x_{n+1} = r * x_n * (1 - x_n)
 *
 * Clean, pure generative visualization consistent with all other strange attractors.
 */

import { samplePalette, COLOR_PALETTES } from '../config/palettes.js';

export class BifurcationExplorer {
  constructor() {
    this.settleIterations = 300;
    this.sampleIterations = 220;
    this.pointsCache = null;
    this.lastParamsHash = '';
  }

  /**
   * Generates or retrieves the high-precision 3D phase-space point cloud.
   */
  computePoints(numColumns = 750) {
    const hash = `${numColumns}_${this.settleIterations}_${this.sampleIterations}`;
    if (this.pointsCache && this.lastParamsHash === hash) {
      return this.pointsCache;
    }

    const points = [];
    const rStart = 2.4;
    const rEnd = 4.0;
    const rStep = (rEnd - rStart) / numColumns;
    const settle = this.settleIterations;
    const samples = this.sampleIterations;

    for (let col = 0; col < numColumns; col++) {
      const r = rStart + col * rStep;
      let x = 0.5;

      // Settle iterations to discard transient behavior
      for (let i = 0; i < settle; i++) {
        x = r * x * (1.0 - x);
      }

      // Sample attractor points in (r, x_n, x_{n-1}) delay embedding
      let prevX = x;
      for (let i = 0; i < samples; i++) {
        const nextX = r * prevX * (1.0 - prevX);

        // 3D coordinates centered at origin:
        // X: Parameter r (scaled)
        // Y: State x_n
        // Z: Delay state x_{n-1}
        const px = (r - 3.2) * 320;
        const py = (nextX - 0.5) * 380;
        const pz = (prevX - 0.5) * 380;

        points.push([px, py, pz, r, nextX]);
        prevX = nextX;
      }
    }

    this.pointsCache = points;
    this.lastParamsHash = hash;
    return points;
  }

  /**
   * Resets any cached data to force recomputation.
   */
  reset() {
    this.pointsCache = null;
  }

  /**
   * 3D Perspective Projection using the unified camera.
   */
  project(point, camera, width, height) {
    const cx = width / 2 + (camera.panX || 0);
    const cy = height / 2 + (camera.panY || 0);

    const zoom = camera.zoom || 1.0;
    const x0 = point[0] * zoom;
    const y0 = point[1] * zoom;
    const z0 = point[2] * zoom;

    const cosY = Math.cos(camera.rotY || 0);
    const sinY = Math.sin(camera.rotY || 0);
    const x1 = x0 * cosY + z0 * sinY;
    const z1 = -x0 * sinY + z0 * cosY;

    const cosX = Math.cos(camera.rotX || 0);
    const sinX = Math.sin(camera.rotX || 0);
    const y2 = y0 * cosX - z1 * sinX;
    const z2 = y0 * sinX + z1 * cosX;

    const distance = 800;
    const pz = z2 + distance;
    if (pz <= 30) return null;

    const fovScale = 600 / pz;
    const px = cx + x1 * fovScale;
    const py = cy - y2 * fovScale;

    return { px, py, pz, z2 };
  }

  /**
   * Renders the 3D Bifurcation Cascade with clean generative aesthetic.
   */
  render(ctx, camera, paletteId = 'bioluminescence', width, height) {
    const points = this.computePoints(750);

    ctx.save();
    ctx.fillStyle = '#05050a';
    ctx.fillRect(0, 0, width, height);

    // Precompute color LUT from active palette
    const lut = new Array(256);
    for (let i = 0; i < 256; i++) {
      lut[i] = samplePalette(paletteId, i / 255, 0.45);
    }

    // Render all 3D points cleanly without arbitrary axis lines or text
    for (let i = 0; i < points.length; i++) {
      const pt = points[i];
      const proj = this.project(pt, camera, width, height);
      if (!proj) continue;

      // Color based on x-state & r-parameter
      const colorT = Math.max(0, Math.min(1, (pt[3] - 2.4) / 1.6 * 0.5 + pt[4] * 0.5));
      const colorIdx = Math.floor(colorT * 255);

      ctx.fillStyle = lut[colorIdx];
      ctx.fillRect(proj.px, proj.py, 1.4, 1.4);
    }

    ctx.restore();
  }
}
