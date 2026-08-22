/**
 * Professional Studio Exporter Engine
 * Asynchronous 4K Ultra-HD Wallpapers & High-Precision Vector SVG Exporters
 * Clean curves with zero (0,0) artifacts and full support for all 3D & 2D systems.
 */

import { samplePalette, COLOR_PALETTES } from '../config/palettes.js';
import { RK4Integrator } from '../math/rk4.js';
import { ATTRACTORS_3D, ATTRACTORS_2D } from '../math/attractors.js';

export class StudioExporter {
  /**
   * Asynchronously exports a 4K Ultra-HD wallpaper without blocking the main JS thread.
   */
  static export4KWallpaper(renderCallback, filename = 'ChaosVision_4K.png', onComplete = null) {
    const offscreen = document.createElement('canvas');
    offscreen.width = 3840;
    offscreen.height = 2160;
    const offCtx = offscreen.getContext('2d', { alpha: false });

    // Render high-res background and buffer
    renderCallback(offCtx, 3840, 2160);

    // Asynchronous binary Blob conversion off the main thread
    offscreen.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = filename;
      link.href = url;
      link.click();

      setTimeout(() => URL.revokeObjectURL(url), 3000);
      if (typeof onComplete === 'function') {
        onComplete();
      }
    }, 'image/png');
  }

  /**
   * Universal Vector SVG Exporter for all 3D Attractors, 2D Maps, Pendulums, and Bifurcations.
   */
  static exportSystemSVG(app, width = 1920, height = 1080) {
    const paletteId = app.paletteId;
    const palette = COLOR_PALETTES[paletteId] || COLOR_PALETTES.bioluminescence;
    const strokeColor = palette.primaryHex || '#00f2fe';
    const camera = app.camera;

    let bodySvg = '';

    if (app.systemType === '3d_attractor') {
      const def = ATTRACTORS_3D[app.systemId] || ATTRACTORS_3D.lorenz;
      const dt = def.defaultDt || 0.008;
      const totalSteps = 8000;
      const swarmCount = app.swarmCount || 3;
      const center = def.center || [0, 0, 0];
      const scale = def.scale || 12.0;

      for (let sw = 0; sw < swarmCount; sw++) {
        const offset = sw === 0 ? 0 : 0.0001 * sw;
        let state = [
          def.initialState[0] + offset,
          def.initialState[1] + offset * 0.5,
          def.initialState[2] + offset * 0.25
        ];

        // Burn-in transient settle steps
        for (let i = 0; i < 300; i++) {
          state = RK4Integrator.step(def.derivative, state, dt, app.params);
        }

        const segments = [];
        let currentSegment = [];

        for (let i = 0; i < totalSteps; i++) {
          state = RK4Integrator.step(def.derivative, state, dt, app.params);
          const proj = app.renderer3D.project(state, camera, center, scale);

          if (proj) {
            currentSegment.push(proj);
          } else {
            if (currentSegment.length > 1) segments.push(currentSegment);
            currentSegment = [];
          }
        }
        if (currentSegment.length > 1) segments.push(currentSegment);

        const colorPos = (sw / Math.max(1, swarmCount - 1)) * 0.8 + 0.1;
        const color = samplePalette(paletteId, colorPos, 0.85);

        for (const seg of segments) {
          let d = `M ${seg[0].px.toFixed(2)} ${seg[0].py.toFixed(2)} `;
          for (let k = 1; k < seg.length; k++) {
            d += `L ${seg[k].px.toFixed(2)} ${seg[k].py.toFixed(2)} `;
          }
          bodySvg += `  <path d="${d}" fill="none" stroke="${color}" stroke-width="${sw === 0 ? '1.5' : '1.0'}" opacity="0.85" stroke-linecap="round" stroke-linejoin="round" />\n`;
        }
      }
    } else if (app.systemType === '2d_map' || app.systemType === 'custom') {
      let iterateFn = null;
      let scaleFactor = 0.25;

      if (app.systemType === '2d_map') {
        const def = ATTRACTORS_2D[app.systemId] || ATTRACTORS_2D.clifford;
        iterateFn = def.iterate;
        scaleFactor = def.scale || 0.25;
      } else if (app.customCompiledSystem) {
        const compiled = app.customCompiledSystem;
        iterateFn = (x, y, z, p) => compiled(x, y, z, 0, p);
      }

      if (iterateFn) {
        const totalPoints = 20000;
        const baseDim = Math.min(width, height) * scaleFactor * (camera.zoom || 1.0);
        const cx = width / 2 + (camera.panX || 0);
        const cy = height / 2 + (camera.panY || 0);
        const cosY = Math.cos(camera.rotY || 0);
        const sinY = Math.sin(camera.rotY || 0);
        const cosX = Math.cos(camera.rotX || 0);
        const sinX = Math.sin(camera.rotX || 0);
        const distance = 800;
        const fov = 600;

        let x = 0.1, y = 0.1, z = 0.1;
        const is3D = iterateFn.length > 3;

        // Warm up iterations
        for (let i = 0; i < 200; i++) {
          const res = is3D ? iterateFn(x, y, z, app.params) : iterateFn(x, y, app.params);
          if (res) { x = res[0]; y = res[1]; z = res[2] || 0; }
        }

        bodySvg += `  <g fill="${strokeColor}" opacity="0.55">\n`;
        for (let i = 0; i < totalPoints; i++) {
          const res = is3D ? iterateFn(x, y, z, app.params) : iterateFn(x, y, app.params);
          if (!res) continue;
          const nextX = res[0], nextY = res[1], nextZ = res[2] || 0;

          if (!isFinite(nextX) || !isFinite(nextY) || Math.abs(nextX) > 50) {
            x = (Math.random() - 0.5) * 0.2;
            y = (Math.random() - 0.5) * 0.2;
            continue;
          }

          x = nextX; y = nextY; z = nextZ;

          const x0 = x * baseDim, y0 = y * baseDim, z0 = z * baseDim;
          const x1 = x0 * cosY + z0 * sinY;
          const z1 = -x0 * sinY + z0 * cosY;
          const y2 = y0 * cosX - z1 * sinX;
          const z2 = y0 * sinX + z1 * cosX;

          const pz = z2 + distance;
          if (pz <= 20) continue;

          const px = cx + x1 * (fov / pz);
          const py = cy - y2 * (fov / pz);

          if (px >= 0 && px <= width && py >= 0 && py <= height) {
            bodySvg += `    <circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="0.9" />\n`;
          }
        }
        bodySvg += `  </g>\n`;
      }
    } else if (app.systemType === 'bifurcation') {
      const points = app.bifurcation.computePoints(600);
      bodySvg += `  <g fill="${strokeColor}" opacity="0.55">\n`;
      for (const pt of points) {
        const proj = app.bifurcation.project(pt, camera, width, height);
        if (proj && proj.px >= 0 && proj.px <= width && proj.py >= 0 && proj.py <= height) {
          bodySvg += `    <circle cx="${proj.px.toFixed(1)}" cy="${proj.py.toFixed(1)}" r="0.9" />\n`;
        }
      }
      bodySvg += `  </g>\n`;
    } else if (app.systemType === 'pendulum') {
      const pendulums = app.pendulum.getPendulums();
      for (let i = 0; i < pendulums.length; i++) {
        const p = pendulums[i];
        const trail = p.trail;
        if (trail.length < 2) continue;

        let d = '';
        let hasStarted = false;
        const rodScale = Math.min(width, height) * 0.175;
        const center = [0, 0, 0];
        const anchorY = 0.55;

        for (let j = 0; j < trail.length; j++) {
          const pt3D = [trail.get(j).x, anchorY - trail.get(j).y, 0];
          const proj = app.renderer3D.project(pt3D, camera, center, rodScale);
          if (proj) {
            if (!hasStarted) {
              d += `M ${proj.px.toFixed(2)} ${proj.py.toFixed(2)} `;
              hasStarted = true;
            } else {
              d += `L ${proj.px.toFixed(2)} ${proj.py.toFixed(2)} `;
            }
          }
        }
        if (d) {
          const colorPos = i / Math.max(1, pendulums.length - 1);
          const col = samplePalette(paletteId, colorPos, 0.75);
          bodySvg += `  <path d="${d}" fill="none" stroke="${col}" stroke-width="${i === 0 ? '2.0' : '1.2'}" opacity="0.8" />\n`;
        }
      }
    }

    let svgHeader = `<!-- ChaosVision Vector Artwork | MIT License -->\n`;
    svgHeader += `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" style="background:#05050a;">\n`;
    const fullSvg = svgHeader + bodySvg + `</svg>`;

    const blob = new Blob([fullSvg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `ChaosVision_${app.systemId || app.systemType}_Vector.svg`;
    link.href = url;
    link.click();

    setTimeout(() => URL.revokeObjectURL(url), 3000);
  }
}
