/**
 * 3D Dynamical Trajectory & Particle Swarm Renderer
 */

import { samplePalette } from '../config/palettes.js';

export class Trajectory3DRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.fov = 600;
  }

  clear() {
    this.ctx.fillStyle = '#05050a';
    this.ctx.fillRect(0, 0, this.canvas.clientWidth, this.canvas.clientHeight);
  }

  fade(fadeAlpha = 0.06) {
    this.ctx.save();
    this.ctx.globalCompositeOperation = 'source-over';
    this.ctx.fillStyle = `rgba(5, 5, 10, ${fadeAlpha})`;
    this.ctx.fillRect(0, 0, this.canvas.clientWidth, this.canvas.clientHeight);
    this.ctx.restore();
  }

  project(point, camera, center = [0, 0, 0], scale = 1.0) {
    const width = this.canvas.clientWidth;
    const height = this.canvas.clientHeight;
    const cx = width / 2 + (camera.panX || 0);
    const cy = height / 2 + (camera.panY || 0);

    const x0 = (point[0] - center[0]) * scale * (camera.zoom || 1.0);
    const y0 = (point[1] - center[1]) * scale * (camera.zoom || 1.0);
    const z0 = (point[2] - center[2]) * scale * (camera.zoom || 1.0);

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
    if (pz <= 20) return null;

    const fovScale = this.fov / pz;
    const px = cx + x1 * fovScale;
    const py = cy - y2 * fovScale;

    return { px, py, pz, z2 };
  }

  renderTrajectories(trajectories, camera, center, scale, paletteId = 'bioluminescence') {
    const ctx = this.ctx;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    for (let t = 0; t < trajectories.length; t++) {
      const traj = trajectories[t];
      const trail = traj.trail;
      if (trail.length < 2) continue;

      ctx.beginPath();
      let hasStarted = false;

      for (let i = 0; i < trail.length; i++) {
        const pt = this.project(trail.get(i), camera, center, scale);
        if (!pt) {
          hasStarted = false;
          continue;
        }

        if (!hasStarted) {
          ctx.moveTo(pt.px, pt.py);
          hasStarted = true;
        } else {
          ctx.lineTo(pt.px, pt.py);
        }
      }

      const trailAlpha = Math.min(0.85, 0.2 + (trail.length / 500) * 0.6);
      const colorPos = (t / Math.max(1, trajectories.length - 1)) * 0.8 + 0.1;
      ctx.strokeStyle = samplePalette(paletteId, colorPos, trailAlpha);
      ctx.lineWidth = (t === 0) ? 1.8 : 1.2;
      ctx.stroke();

      const headPt = this.project(traj.state, camera, center, scale);
      if (headPt) {
        const headRadius = (t === 0) ? 4.0 : 2.5;
        const grad = ctx.createRadialGradient(headPt.px, headPt.py, 0, headPt.px, headPt.py, headRadius * 3);
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.4, samplePalette(paletteId, colorPos, 0.9));
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(headPt.px, headPt.py, headRadius * 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
  }

  renderDoublePendulum(pendulums, camera, paletteId = 'solarFlare', showRods = true) {
    const ctx = this.ctx;
    const width = this.canvas.clientWidth;
    const height = this.canvas.clientHeight;
    const rodScale = Math.min(width, height) * 0.175;
    const center = [0, 0.0, 0];
    const anchorY = 0.55;

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    for (let i = 0; i < pendulums.length; i++) {
      const p = pendulums[i];
      const trail = p.trail;
      if (trail.length < 2) continue;

      ctx.beginPath();
      let hasStarted = false;

      for (let j = 0; j < trail.length; j++) {
        const trailPt = trail.get(j);
        const pt3D = [trailPt.x, anchorY - trailPt.y, 0];
        const pt = this.project(pt3D, camera, center, rodScale);
        if (!pt) {
          hasStarted = false;
          continue;
        }

        if (!hasStarted) {
          ctx.moveTo(pt.px, pt.py);
          hasStarted = true;
        } else {
          ctx.lineTo(pt.px, pt.py);
        }
      }

      const colorPos = i / Math.max(1, pendulums.length - 1);
      ctx.strokeStyle = samplePalette(paletteId, colorPos, 0.55);
      ctx.lineWidth = (i === 0) ? 2.0 : 1.2;
      ctx.stroke();
    }

    if (showRods && pendulums.length > 0) {
      ctx.globalCompositeOperation = 'source-over';
      const primary = pendulums[0];
      const x1 = Math.sin(primary.theta1);
      const y1 = Math.cos(primary.theta1);
      const x2 = x1 + Math.sin(primary.theta2);
      const y2 = y1 + Math.cos(primary.theta2);

      const anchor = this.project([0, anchorY, 0], camera, center, rodScale);
      const bob1 = this.project([x1, anchorY - y1, 0], camera, center, rodScale);
      const bob2 = this.project([x2, anchorY - y2, 0], camera, center, rodScale);

      if (anchor && bob1 && bob2) {
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(anchor.px, anchor.py, 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(anchor.px, anchor.py);
        ctx.lineTo(bob1.px, bob1.py);
        ctx.stroke();

        ctx.fillStyle = samplePalette(paletteId, 0.2, 1.0);
        ctx.beginPath();
        ctx.arc(bob1.px, bob1.py, 7, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.lineWidth = 2.0;
        ctx.beginPath();
        ctx.moveTo(bob1.px, bob1.py);
        ctx.lineTo(bob2.px, bob2.py);
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(bob2.px, bob2.py, 8, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
  }
}
