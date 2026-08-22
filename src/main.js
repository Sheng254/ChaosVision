/**
 * ChaosVision: Master Application Orchestrator
 */

import { ATTRACTORS_3D, ATTRACTORS_2D } from './math/attractors.js';
import { TrajectorySwarm } from './math/rk4.js';
import { DoublePendulumSystem } from './math/pendulum.js';
import { BifurcationExplorer } from './math/bifurcation.js';
import { MathParser } from './math/parser.js';
import { OrbitCamera } from './renderer/camera.js';
import { Canvas2DRenderer } from './renderer/canvas2d.js';
import { Trajectory3DRenderer } from './renderer/webgl3d.js';
import { ChaoticSonifier } from './audio/sonifier.js';
import { HUDController } from './ui/hud.js';
import { StudioExporter, FlexibleVideoRecorder } from './ui/exporter.js';
import { URLStateManager } from './ui/urlState.js';

class ChaosVisionApp {
  constructor() {
    this.canvas = document.getElementById('main-canvas');
    this.renderer2D = new Canvas2DRenderer(this.canvas);
    this.renderer3D = new Trajectory3DRenderer(this.canvas);
    this.camera = new OrbitCamera(this.canvas);
    this.sonifier = new ChaoticSonifier();
    this.swarm = new TrajectorySwarm(3, 500);
    this.pendulum = new DoublePendulumSystem(10, 450);
    this.bifurcation = new BifurcationExplorer();
    this.videoRecorder = new FlexibleVideoRecorder(this.canvas);

    // App state
    this.systemType = '3d_attractor';
    this.systemId = 'lorenz';
    this.paletteId = 'bioluminescence';
    this.params = {};
    this.speed = 1.0;
    this.trailDecay = 0.06;
    this.swarmCount = 3;
    this.customFormula = 'sin(a * y) - cos(b * x)';
    this.customCompiledFn = null;

    // Performance metrics
    this.lastTime = performance.now();
    this.frameCount = 0;
    this.fps = 60;
    this.fpsTimer = performance.now();

    this.init();
  }

  init() {
    this.handleResize();
    window.addEventListener('resize', () => this.handleResize());

    this.hud = new HUDController(this);
    this.initExporters();
    this.initCustomFormulaUI();
    this.initBifurcationInteractivity();

    // Load from URL state or default to Lorenz
    const savedState = URLStateManager.loadState();
    if (savedState && savedState.systemType) {
      this.restoreState(savedState);
    } else {
      this.switchSystem('3d_attractor', 'lorenz');
    }

    // Start animation loop
    requestAnimationFrame((t) => this.renderLoop(t));
  }

  handleResize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = window.innerWidth;
    const height = window.innerHeight;

    this.canvas.width = width * dpr;
    this.canvas.height = height * dpr;
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;

    const ctx = this.canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    this.renderer2D.canvas.width = width;
    this.renderer2D.canvas.height = height;
    this.renderer3D.canvas.width = width;
    this.renderer3D.canvas.height = height;
  }

  initBifurcationInteractivity() {
    let isBifDragging = false;
    let startX = 0;
    let initialTouchDist = 0;

    // Mouse Panning & Zooming
    this.canvas.addEventListener('mousedown', (e) => {
      if (this.systemType === 'bifurcation') {
        isBifDragging = true;
        startX = e.clientX;
      }
    });

    window.addEventListener('mousemove', (e) => {
      if (this.systemType === 'bifurcation' && isBifDragging) {
        const dx = e.clientX - startX;
        const deltaPercent = dx / window.innerWidth;
        this.bifurcation.pan(deltaPercent);
        startX = e.clientX;
      }
    });

    window.addEventListener('mouseup', () => {
      isBifDragging = false;
    });

    this.canvas.addEventListener('wheel', (e) => {
      if (this.systemType === 'bifurcation') {
        e.preventDefault();
        const factor = e.deltaY < 0 ? 0.85 : 1.18;
        const centerPercent = e.clientX / window.innerWidth;
        this.bifurcation.zoom(factor, centerPercent);
      }
    }, { passive: false });

    // Touch Screen Panning & Pinch-Zooming (Mobile / iPads)
    this.canvas.addEventListener('touchstart', (e) => {
      if (this.systemType === 'bifurcation') {
        if (e.touches.length === 1) {
          isBifDragging = true;
          startX = e.touches[0].clientX;
        } else if (e.touches.length === 2) {
          isBifDragging = false;
          initialTouchDist = Math.hypot(
            e.touches[0].clientX - e.touches[1].clientX,
            e.touches[0].clientY - e.touches[1].clientY
          );
        }
      }
    }, { passive: true });

    this.canvas.addEventListener('touchmove', (e) => {
      if (this.systemType === 'bifurcation') {
        if (e.touches.length === 1 && isBifDragging) {
          const dx = e.touches[0].clientX - startX;
          const deltaPercent = dx / window.innerWidth;
          this.bifurcation.pan(deltaPercent);
          startX = e.touches[0].clientX;
        } else if (e.touches.length === 2 && initialTouchDist > 0) {
          const dist = Math.hypot(
            e.touches[0].clientX - e.touches[1].clientX,
            e.touches[0].clientY - e.touches[1].clientY
          );
          const ratio = initialTouchDist / dist;
          const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
          const centerPercent = midX / window.innerWidth;
          this.bifurcation.zoom(ratio > 1 ? 1.04 : 0.96, centerPercent);
          initialTouchDist = dist;
        }
      }
    }, { passive: true });

    this.canvas.addEventListener('touchend', () => {
      isBifDragging = false;
      initialTouchDist = 0;
    });
  }

  switchSystem(type, id) {
    this.systemType = type;
    this.systemId = id;
    this.renderer2D.clear();
    this.renderer3D.clear();

    const customFormulaSection = document.getElementById('custom-formula-section');
    if (customFormulaSection) {
      customFormulaSection.style.display = (type === 'custom') ? 'block' : 'none';
    }

    if (type === '3d_attractor') {
      const def = ATTRACTORS_3D[id] || ATTRACTORS_3D.lorenz;
      this.params = { ...def.defaultParams };
      this.swarm.init(def.initialState, this.swarmCount);
      this.hud.updateDynamicParams(def.paramRanges, this.params, (k, v) => {
        this.params[k] = v;
      });
    } else if (type === '2d_map') {
      const def = ATTRACTORS_2D[id] || ATTRACTORS_2D.clifford;
      this.params = { ...def.defaultParams };
      this.renderer2D.clear();
      this.hud.updateDynamicParams(def.paramRanges, this.params, (k, v) => {
        this.params[k] = v;
        this.renderer2D.clear();
      });
    } else if (type === 'pendulum') {
      this.pendulum.init(Math.PI / 2, Math.PI / 2, this.swarmCount, 0.0001);
      this.hud.updateDynamicParams({
        gravity: { min: 1.0, max: 25.0, step: 0.1, label: 'Gravity (g)' },
        damping: { min: 0.0, max: 0.005, step: 0.0001, label: 'Friction' }
      }, { gravity: 9.81, damping: 0.0001 }, (k, v) => {
        if (k === 'gravity') this.pendulum.g = v;
        if (k === 'damping') this.pendulum.damping = v;
      });
    } else if (type === 'bifurcation') {
      this.bifurcation.reset();
      this.hud.updateDynamicParams({
        settle: { min: 50, max: 800, step: 50, label: 'Settle Steps' },
        samples: { min: 100, max: 600, step: 20, label: 'Sample Points' }
      }, { settle: 300, samples: 250 }, (k, v) => {
        if (k === 'settle') this.bifurcation.settleIterations = v;
        if (k === 'samples') this.bifurcation.sampleIterations = v;
      });
    } else if (type === 'custom') {
      this.compileCustomFormula();
    }

    const selectEl = document.getElementById('system-select');
    if (selectEl) selectEl.value = `${type}:${id}`;
  }

  setPalette(paletteId) {
    this.paletteId = paletteId;
    if (this.systemType === '2d_map' || this.systemType === 'bifurcation' || this.systemType === 'custom') {
      this.renderer2D.clear();
    }
  }

  setSwarmCount(count) {
    this.swarmCount = count;
    if (this.systemType === '3d_attractor') {
      const def = ATTRACTORS_3D[this.systemId] || ATTRACTORS_3D.lorenz;
      this.swarm.init(def.initialState, count);
    } else if (this.systemType === 'pendulum') {
      this.pendulum.init(Math.PI / 2, Math.PI / 2, count, 0.0001);
    }
  }

  setSpeed(speed) {
    this.speed = speed;
  }

  setTrailDecay(decay) {
    this.trailDecay = decay;
  }

  toggleAudio() {
    return this.sonifier.toggle();
  }

  resetCamera() {
    this.camera.reset();
    if (this.systemType === 'bifurcation') {
      this.bifurcation.reset();
    }
    if (this.systemType === '2d_map' || this.systemType === 'custom') {
      this.renderer2D.clear();
    }
  }

  loadPreset(preset) {
    this.paletteId = preset.palette || 'bioluminescence';
    document.getElementById('palette-select').value = this.paletteId;

    if (preset.systemType === '3d_attractor') {
      this.switchSystem('3d_attractor', preset.systemId);
      if (preset.params) this.params = { ...preset.params };
      if (preset.camera) {
        this.camera.targetRotX = preset.camera.rotX;
        this.camera.targetRotY = preset.camera.rotY;
        this.camera.targetZoom = preset.camera.zoom;
      }
      if (preset.divergenceTrails) {
        this.setSwarmCount(preset.divergenceTrails);
      }
    } else if (preset.systemType === '2d_map') {
      this.switchSystem('2d_map', preset.systemId);
      if (preset.params) this.params = { ...preset.params };
    } else if (preset.systemType === 'pendulum') {
      this.switchSystem('pendulum', 'double_pendulum');
      if (preset.pendulumCount) {
        this.setSwarmCount(preset.pendulumCount);
      }
    } else if (preset.systemType === 'bifurcation') {
      this.switchSystem('bifurcation', 'logistic');
    }
  }

  getState() {
    return {
      systemType: this.systemType,
      systemId: this.systemId,
      paletteId: this.paletteId,
      speed: this.speed,
      trailDecay: this.trailDecay,
      swarmCount: this.swarmCount,
      camera: {
        rotX: this.camera.rotX,
        rotY: this.camera.rotY,
        panX: this.camera.panX,
        panY: this.camera.panY,
        zoom: this.camera.zoom
      },
      params: this.params,
      customFormula: this.customFormula
    };
  }

  restoreState(s) {
    if (s.paletteId) {
      this.paletteId = s.paletteId;
      const palEl = document.getElementById('palette-select');
      if (palEl) palEl.value = s.paletteId;
    }
    if (s.speed) {
      this.speed = s.speed;
      const spdEl = document.getElementById('speed-input');
      if (spdEl) spdEl.value = s.speed;
      const spdVal = document.getElementById('speed-val');
      if (spdVal) spdVal.textContent = `${s.speed.toFixed(1)}x`;
    }
    if (s.trailDecay) {
      this.trailDecay = s.trailDecay;
      const decEl = document.getElementById('decay-input');
      if (decEl) decEl.value = s.trailDecay;
      const decVal = document.getElementById('decay-val');
      if (decVal) decVal.textContent = s.trailDecay.toFixed(2);
    }
    if (s.swarmCount) {
      this.swarmCount = s.swarmCount;
      const swmEl = document.getElementById('swarm-count-input');
      if (swmEl) swmEl.value = s.swarmCount;
      const swmVal = document.getElementById('swarm-count-val');
      if (swmVal) swmVal.textContent = s.swarmCount;
    }
    if (s.camera) {
      if (s.camera.rotX !== undefined) this.camera.rotX = this.camera.targetRotX = s.camera.rotX;
      if (s.camera.rotY !== undefined) this.camera.rotY = this.camera.targetRotY = s.camera.rotY;
      if (s.camera.panX !== undefined) this.camera.panX = this.camera.targetPanX = s.camera.panX;
      if (s.camera.panY !== undefined) this.camera.panY = this.camera.targetPanY = s.camera.panY;
      if (s.camera.zoom !== undefined) this.camera.zoom = this.camera.targetZoom = s.camera.zoom;
    }
    if (s.customFormula) {
      this.customFormula = s.customFormula;
      const cfInput = document.getElementById('custom-formula-input');
      if (cfInput) cfInput.value = s.customFormula;
    }

    this.switchSystem(s.systemType, s.systemId);

    if (s.params) {
      Object.assign(this.params, s.params);
      if (this.systemType === '3d_attractor') {
        const def = ATTRACTORS_3D[this.systemId];
        if (def) {
          this.hud.updateDynamicParams(def.paramRanges, this.params, (k, v) => {
            this.params[k] = v;
          });
        }
      } else if (this.systemType === '2d_map') {
        const def = ATTRACTORS_2D[this.systemId];
        if (def) {
          this.hud.updateDynamicParams(def.paramRanges, this.params, (k, v) => {
            this.params[k] = v;
            this.renderer2D.clear();
          });
        }
      }
    }
  }

  initCustomFormulaUI() {
    const input = document.getElementById('custom-formula-input');
    const compileBtn = document.getElementById('btn-compile-formula');
    const errorBox = document.getElementById('formula-error');

    if (compileBtn && input) {
      compileBtn.addEventListener('click', () => {
        this.customFormula = input.value;
        this.compileCustomFormula();
      });
    }
  }

  compileCustomFormula() {
    const errorBox = document.getElementById('formula-error');
    try {
      this.customCompiledFn = MathParser.compile(this.customFormula);
      if (errorBox) {
        errorBox.textContent = 'Formula compiled successfully!';
        errorBox.style.color = '#39ff14';
      }
      this.renderer2D.clear();
      this.params = { a: 1.4, b: -2.3, c: 2.4, d: -2.1 };
      this.hud.updateDynamicParams({
        a: { min: -3.0, max: 3.0, step: 0.05, label: 'a' },
        b: { min: -3.0, max: 3.0, step: 0.05, label: 'b' },
        c: { min: -3.0, max: 3.0, step: 0.05, label: 'c' },
        d: { min: -3.0, max: 3.0, step: 0.05, label: 'd' }
      }, this.params, (k, v) => {
        this.params[k] = v;
        this.renderer2D.clear();
      });
    } catch (err) {
      if (errorBox) {
        errorBox.textContent = `Syntax Error: ${err.message}`;
        errorBox.style.color = '#ff007f';
      }
    }
  }

  initExporters() {
    // 4K Wallpaper
    const export4kBtn = document.getElementById('btn-export-4k');
    if (export4kBtn) {
      export4kBtn.addEventListener('click', () => {
        this.hud.showToast('Rendering 4K Ultra-HD Wallpaper...');
        setTimeout(() => {
          StudioExporter.export4KWallpaper((offCtx, w, h) => {
            offCtx.fillStyle = '#05050a';
            offCtx.fillRect(0, 0, w, h);
            offCtx.drawImage(this.canvas, 0, 0, w, h);
          }, `ChaosVision_${this.systemId}_4K.png`);
          this.hud.showToast('4K Wallpaper Downloaded!');
        }, 60);
      });
    }

    // Vector SVG Export
    const exportSvgBtn = document.getElementById('btn-export-svg');
    if (exportSvgBtn) {
      exportSvgBtn.addEventListener('click', () => {
        if (this.systemType === '3d_attractor') {
          const trajectories = this.swarm.getTrajectories();
          const paths = trajectories.map(t => t.trail.map(pt => {
            const p = this.renderer3D.project(pt, this.camera, ATTRACTORS_3D[this.systemId].center, ATTRACTORS_3D[this.systemId].scale);
            return p ? { x: p.px, y: p.py } : { x: 0, y: 0 };
          }));
          StudioExporter.exportSVG(paths, window.innerWidth, window.innerHeight);
          this.hud.showToast('Vector SVG Exported!');
        } else {
          this.hud.showToast('SVG export is optimized for 3D trajectory lines.');
        }
      });
    }

    // Custom Duration Video Recorder
    const recBtn = document.getElementById('btn-record-video');
    if (recBtn) {
      recBtn.addEventListener('click', () => {
        if (this.videoRecorder.isRecording()) {
          this.videoRecorder.stop();
        } else {
          const ok = this.videoRecorder.start(
            (sec) => {
              const mins = Math.floor(sec / 60).toString().padStart(2, '0');
              const s = (sec % 60).toString().padStart(2, '0');
              recBtn.querySelector('.btn-label').textContent = `Stop (${mins}:${s})`;
            },
            () => {
              recBtn.classList.remove('recording');
              recBtn.querySelector('.btn-label').textContent = 'Record Video';
              this.hud.showToast('Video recording saved and downloaded!');
            }
          );

          if (ok) {
            recBtn.classList.add('recording');
            recBtn.querySelector('.btn-label').textContent = 'Stop (00:00)';
            this.hud.showToast('Recording started. Click "Stop" whenever you wish to finish.');
          }
        }
      });
    }
  }

  renderLoop(timestamp) {
    this.camera.update();

    let divergence = 0;
    let iterationMetric = '0';

    if (this.systemType === '3d_attractor') {
      const def = ATTRACTORS_3D[this.systemId] || ATTRACTORS_3D.lorenz;
      const dt = (def.defaultDt || 0.008) * this.speed;

      this.renderer3D.fade(this.trailDecay);
      this.swarm.update(def.derivative, dt, this.params, 4);
      this.renderer3D.renderTrajectories(
        this.swarm.getTrajectories(),
        this.camera,
        def.center,
        def.scale,
        this.paletteId
      );

      const trajectories = this.swarm.getTrajectories();
      if (trajectories.length > 1) {
        divergence = trajectories[1].divergence;
      }

      if (trajectories.length > 0) {
        this.sonifier.update(trajectories[0].state, trajectories[0].speed);
      }
      iterationMetric = `${trajectories.length * 500} pts`;
    } else if (this.systemType === '2d_map') {
      const def = ATTRACTORS_2D[this.systemId] || ATTRACTORS_2D.clifford;
      this.renderer2D.fade(this.trailDecay);
      this.renderer2D.render2DMapBatch(
        def.iterate,
        this.params,
        Math.round(35000 * this.speed),
        this.paletteId,
        def.scale,
        this.camera
      );
      iterationMetric = `${this.renderer2D.iterationCount.toLocaleString()} iter`;
    } else if (this.systemType === 'pendulum') {
      this.renderer3D.fade(this.trailDecay);
      this.pendulum.update(0.02 * this.speed, 10);
      this.renderer3D.renderDoublePendulum(this.pendulum.getPendulums(), this.camera, this.paletteId, true);
      iterationMetric = `${this.pendulum.count} bobs`;
    } else if (this.systemType === 'bifurcation') {
      this.bifurcation.render(
        this.canvas.getContext('2d'),
        window.innerWidth,
        window.innerHeight,
        'rgba(0, 242, 254, 0.5)'
      );
      iterationMetric = 'Cascade';
    } else if (this.systemType === 'custom' && this.customCompiledFn) {
      const a = this.params.a || 1.4;
      const b = this.params.b || -2.3;
      const c = this.params.c || 2.4;
      const d = this.params.d || -2.1;
      const t = timestamp * 0.001;
      const fn = this.customCompiledFn;

      this.renderer2D.fade(this.trailDecay);
      this.renderer2D.render2DMapBatch(
        (x, y) => {
          const nextX = fn(x, y, 0, t, a, b, c, d, this.params);
          const nextY = Math.sin(c * x) - Math.cos(d * y);
          return [nextX, nextY];
        },
        this.params,
        Math.round(35000 * this.speed),
        this.paletteId,
        0.25,
        this.camera
      );
      iterationMetric = 'Custom Sandbox';
    }

    // Performance metrics
    this.frameCount++;
    if (timestamp - this.fpsTimer >= 500) {
      this.fps = (this.frameCount * 1000) / (timestamp - this.fpsTimer);
      this.frameCount = 0;
      this.fpsTimer = timestamp;
      this.hud.updateMetrics(this.fps, divergence, iterationMetric);
    }

    requestAnimationFrame((t) => this.renderLoop(t));
  }
}

// Bootstrap application on window load
window.addEventListener('DOMContentLoaded', () => {
  window.chaosApp = new ChaosVisionApp();
});
