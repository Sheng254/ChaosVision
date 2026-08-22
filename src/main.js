/**
 * ChaosVision: Application Orchestrator
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
import { StudioExporter } from './ui/exporter.js';
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

    // App state
    this.systemType = '3d_attractor';
    this.systemId = 'lorenz';
    this.paletteId = 'bioluminescence';
    this.params = {};
    this.speed = 1.0;
    this.trailDecay = 0.06;
    this.swarmCount = 3;

    // Dynamic Multi-Equation Sandbox state
    this.customTemplateId = 'peter_dejong';
    this.customEquations = [
      { id: 'eq_x', target: 'x', latex: '\\sin(a \\cdot y) - \\cos(b \\cdot x)' },
      { id: 'eq_y', target: 'y', latex: '\\sin(c \\cdot x) - \\cos(d \\cdot y)' }
    ];
    this.customCompiledSystem = null;
    this.lastFocusedMathField = null;

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
    ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform before scaling
    ctx.scale(dpr, dpr);
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

    const swarmGroup = document.getElementById('swarm-count-input')?.closest('.control-group');
    if (swarmGroup) {
      swarmGroup.style.display = (type === '3d_attractor' || type === 'pendulum') ? 'flex' : 'none';
    }

    if (type === '3d_attractor') {
      this.camera.autoRotate = true;
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
      this.camera.autoRotate = false;
      this.camera.rotX = this.camera.targetRotX = 0.0;
      this.camera.rotY = this.camera.targetRotY = 0.0;
      this.camera.zoom = this.camera.targetZoom = 1.0;
      this.camera.panX = this.camera.targetPanX = 0.0;
      this.camera.panY = this.camera.targetPanY = 0.0;
      this.hud.updateDynamicParams({
        settle: { min: 50, max: 600, step: 25, label: 'Settle Steps' },
        samples: { min: 50, max: 400, step: 10, label: 'Sample Points' }
      }, { settle: this.bifurcation.settleIterations, samples: this.bifurcation.sampleIterations }, (k, v) => {
        if (k === 'settle') this.bifurcation.settleIterations = v;
        if (k === 'samples') this.bifurcation.sampleIterations = v;
        this.bifurcation.reset();
      });
    } else if (type === 'custom') {
      this.compileCustomFormula();
    }

    const selectEl = document.getElementById('system-select');
    if (selectEl) {
      selectEl.value = (type === 'custom') ? 'custom:sandbox' : `${type}:${id}`;
    }
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
    const isFlatMode = (this.systemType === '2d_map' || this.systemType === 'custom' || this.systemType === 'bifurcation');
    this.camera.targetRotX = isFlatMode ? 0.0 : 0.35;
    this.camera.targetRotY = isFlatMode ? 0.0 : -0.6;
    this.camera.targetPanX = 0;
    this.camera.targetPanY = 0;
    this.camera.targetZoom = 1.0;
    this.camera.velRotX = 0;
    this.camera.velRotY = 0;
    this.camera.velPanX = 0;
    this.camera.velPanY = 0;
    this.camera.velZoom = 0;
  }

  applyPreset(preset) {
    if (!preset) return;

    if (preset.palette) {
      this.setPalette(preset.palette);
      const palEl = document.getElementById('palette-select');
      if (palEl) palEl.value = preset.palette;
    }

    if (preset.speed !== undefined) {
      this.speed = preset.speed;
      const spdEl = document.getElementById('speed-input');
      if (spdEl) spdEl.value = preset.speed;
      const spdVal = document.getElementById('speed-val');
      if (spdVal) spdVal.textContent = `${preset.speed.toFixed(1)}x`;
    }

    if (preset.trailDecay !== undefined) {
      this.trailDecay = preset.trailDecay;
      const decEl = document.getElementById('decay-input');
      if (decEl) decEl.value = preset.trailDecay;
      const decVal = document.getElementById('decay-val');
      if (decVal) decVal.textContent = preset.trailDecay.toFixed(2);
    }

    const swarm = preset.swarmCount || preset.divergenceTrails;
    if (swarm !== undefined) {
      this.swarmCount = swarm;
      const swmEl = document.getElementById('swarm-count-input');
      if (swmEl) swmEl.value = swarm;
      const swmVal = document.getElementById('swarm-count-val');
      if (swmVal) swmVal.textContent = swarm;
    }

    if (preset.camera) {
      if (preset.camera.rotX !== undefined) this.camera.rotX = this.camera.targetRotX = preset.camera.rotX;
      if (preset.camera.rotY !== undefined) this.camera.rotY = this.camera.targetRotY = preset.camera.rotY;
      if (preset.camera.panX !== undefined) this.camera.panX = this.camera.targetPanX = preset.camera.panX;
      if (preset.camera.panY !== undefined) this.camera.panY = this.camera.targetPanY = preset.camera.panY;
      if (preset.camera.zoom !== undefined) this.camera.zoom = this.camera.targetZoom = preset.camera.zoom;
    }

    if (preset.params) {
      this.params = { ...preset.params };
    }

    if (preset.systemType === '3d_attractor') {
      this.switchSystem('3d_attractor', preset.systemId);
      const def = ATTRACTORS_3D[preset.systemId];
      if (def) {
        this.hud.updateDynamicParams(def.paramRanges, this.params, (k, v) => {
          this.params[k] = v;
        });
      }
    } else if (preset.systemType === '2d_map') {
      this.switchSystem('2d_map', preset.systemId);
      const def = ATTRACTORS_2D[preset.systemId];
      if (def) {
        this.hud.updateDynamicParams(def.paramRanges, this.params, (k, v) => {
          this.params[k] = v;
          this.renderer2D.clear();
        });
      }
    } else if (preset.systemType === 'pendulum') {
      this.switchSystem('pendulum', 'double_pendulum');
      this.hud.updateDynamicParams({
        gravity: { min: 1.0, max: 25.0, step: 0.1, label: 'Gravity (g)' },
        damping: { min: 0.0, max: 0.005, step: 0.0001, label: 'Friction' }
      }, this.params, (k, v) => {
        if (k === 'gravity') this.pendulum.g = v;
        if (k === 'damping') this.pendulum.damping = v;
      });
    } else if (preset.systemType === 'bifurcation') {
      this.switchSystem('bifurcation', 'logistic');
    }
  }

  loadPreset(preset) {
    this.applyPreset(preset);
  }

  getState() {
    // Filter parameters to ONLY the active system's legitimate parameters
    const activeParams = {};
    if (this.systemType === '3d_attractor') {
      const def = ATTRACTORS_3D[this.systemId];
      if (def && def.defaultParams) {
        for (const k of Object.keys(def.defaultParams)) {
          if (this.params[k] !== undefined) activeParams[k] = this.params[k];
        }
      }
    } else if (this.systemType === '2d_map') {
      const def = ATTRACTORS_2D[this.systemId];
      if (def && def.defaultParams) {
        for (const k of Object.keys(def.defaultParams)) {
          if (this.params[k] !== undefined) activeParams[k] = this.params[k];
        }
      }
    } else if (this.systemType === 'pendulum') {
      activeParams.gravity = this.pendulum.g;
      activeParams.damping = this.pendulum.damping;
    } else if (this.systemType === 'bifurcation') {
      activeParams.settle = this.bifurcation.settleIterations;
      activeParams.samples = this.bifurcation.sampleIterations;
    } else if (this.systemType === 'custom') {
      const freeVars = (this.customCompiledSystem && this.customCompiledSystem.freeVars) || ['a', 'b', 'c', 'd'];
      for (const v of freeVars) {
        if (this.params[v] !== undefined) activeParams[v] = this.params[v];
      }
    }

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
      params: activeParams,
      customEquations: this.systemType === 'custom' ? this.customEquations : undefined,
      customTemplateId: this.systemType === 'custom' ? (this.customTemplateId || 'peter_dejong') : undefined
    };
  }

  restoreState(s) {
    if (s.paletteId) {
      this.paletteId = s.paletteId;
      const palEl = document.getElementById('palette-select');
      if (palEl) palEl.value = s.paletteId;
    }
    if (s.speed !== undefined && s.speed !== null) {
      this.speed = s.speed;
      const spdEl = document.getElementById('speed-input');
      if (spdEl) spdEl.value = s.speed;
      const spdVal = document.getElementById('speed-val');
      if (spdVal) spdVal.textContent = `${s.speed.toFixed(1)}x`;
    }
    if (s.trailDecay !== undefined && s.trailDecay !== null) {
      this.trailDecay = s.trailDecay;
      const decEl = document.getElementById('decay-input');
      if (decEl) decEl.value = s.trailDecay;
      const decVal = document.getElementById('decay-val');
      if (decVal) decVal.textContent = s.trailDecay.toFixed(2);
    }
    if (s.swarmCount !== undefined && s.swarmCount !== null) {
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

    if (s.systemType === 'custom') {
      if (s.customEquations && Array.isArray(s.customEquations)) {
        this.customEquations = s.customEquations;
      }
      if (s.customTemplateId) {
        this.customTemplateId = s.customTemplateId;
      }
      this.renderEquationRows();
    }

    // Switch system first to initialize clean default parameter schemas
    this.switchSystem(s.systemType, s.systemId);

    // Overwrite only the relevant parameters that were shared in the link
    if (s.params) {
      if (this.systemType === '3d_attractor') {
        const def = ATTRACTORS_3D[this.systemId];
        if (def && def.defaultParams) {
          for (const k of Object.keys(def.defaultParams)) {
            if (s.params[k] !== undefined) {
              this.params[k] = s.params[k];
            }
          }
          this.hud.updateDynamicParams(def.paramRanges, this.params, (k, v) => {
            this.params[k] = v;
          });
        }
      } else if (this.systemType === '2d_map') {
        const def = ATTRACTORS_2D[this.systemId];
        if (def && def.defaultParams) {
          for (const k of Object.keys(def.defaultParams)) {
            if (s.params[k] !== undefined) {
              this.params[k] = s.params[k];
            }
          }
          this.hud.updateDynamicParams(def.paramRanges, this.params, (k, v) => {
            this.params[k] = v;
            this.renderer2D.clear();
          });
        }
      } else if (this.systemType === 'pendulum') {
        if (s.params.gravity !== undefined) this.pendulum.g = s.params.gravity;
        if (s.params.damping !== undefined) this.pendulum.damping = s.params.damping;
        this.hud.updateDynamicParams({
          gravity: { min: 1.0, max: 25.0, step: 0.1, label: 'Gravity (g)' },
          damping: { min: 0.0, max: 0.005, step: 0.0001, label: 'Friction' }
        }, { gravity: this.pendulum.g, damping: this.pendulum.damping }, (k, v) => {
          if (k === 'gravity') this.pendulum.g = v;
          if (k === 'damping') this.pendulum.damping = v;
        });
      } else if (this.systemType === 'bifurcation') {
        if (s.params.settle !== undefined) this.bifurcation.settleIterations = s.params.settle;
        if (s.params.samples !== undefined) this.bifurcation.sampleIterations = s.params.samples;
        this.bifurcation.reset();
        this.hud.updateDynamicParams({
          settle: { min: 50, max: 600, step: 25, label: 'Settle Steps' },
          samples: { min: 50, max: 400, step: 10, label: 'Sample Points' }
        }, { settle: this.bifurcation.settleIterations, samples: this.bifurcation.sampleIterations }, (k, v) => {
          if (k === 'settle') this.bifurcation.settleIterations = v;
          if (k === 'samples') this.bifurcation.sampleIterations = v;
          this.bifurcation.reset();
        });
      } else if (this.systemType === 'custom') {
        this.params = { ...s.params };
        this.compileCustomFormula();
      }
    }
  }

  initCustomFormulaUI() {
    this.renderEquationRows();

    // Add Equation Button
    const addEqBtn = document.getElementById('btn-add-equation');
    if (addEqBtn) {
      addEqBtn.addEventListener('click', () => {
        const hasZ = this.customEquations.some(e => e.target === 'z');
        if (hasZ || this.customEquations.length >= 3) return;

        this.customEquations.push({
          id: 'eq_z',
          target: 'z',
          latex: '\\cos(x \\cdot y)'
        });

        this.renderEquationRows();
        this.compileCustomFormula();
      });
    }

    // Keypad Toggle
    const keypadToggle = document.getElementById('btn-toggle-keypad');
    const keypadContainer = document.getElementById('custom-math-keypad');
    if (keypadToggle && keypadContainer) {
      keypadToggle.addEventListener('click', () => {
        keypadContainer.classList.toggle('collapsed');
        keypadToggle.classList.toggle('active', !keypadContainer.classList.contains('collapsed'));
      });
    }

    // Keypad Buttons
    const keypadButtons = document.querySelectorAll('.keypad-btn');
    keypadButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const latex = btn.getAttribute('data-latex');
        if (this.lastFocusedMathField && latex) {
          this.lastFocusedMathField.executeCommand(['insert', latex]);
          this.lastFocusedMathField.focus();
        }
      });
    });

    // Preset Templates
    const templateSelect = document.getElementById('custom-template-select');
    const templates = {
      peter_dejong: {
        eqs: [
          { id: 'eq_x', target: 'x', latex: '\\sin(a \\cdot y) - \\cos(b \\cdot x)' },
          { id: 'eq_y', target: 'y', latex: '\\sin(c \\cdot x) - \\cos(d \\cdot y)' }
        ],
        params: { a: 1.4, b: -2.3, c: 2.4, d: -2.1 }
      },
      clifford: {
        eqs: [
          { id: 'eq_x', target: 'x', latex: '\\sin(a \\cdot y) + c \\cdot \\cos(a \\cdot x)' },
          { id: 'eq_y', target: 'y', latex: '\\sin(b \\cdot x) + d \\cdot \\cos(b \\cdot y)' }
        ],
        params: { a: -1.4, b: 1.6, c: 1.0, d: 0.7 }
      },
      hopalong: {
        eqs: [
          { id: 'eq_x', target: 'x', latex: 'y - \\operatorname{sign}(x) \\cdot \\sqrt{\\left| b \\cdot x - c \\right|}' },
          { id: 'eq_y', target: 'y', latex: 'a - x' }
        ],
        params: { a: 2.0, b: 1.0, c: 0.0 }
      },
      ikeda: {
        eqs: [
          { id: 'eq_t', target: 't', latex: '0.4 - \\frac{6}{1 + x^2 + y^2}' },
          { id: 'eq_x', target: 'x', latex: '1 + u \\cdot (x \\cdot \\cos(t) - y \\cdot \\sin(t))' },
          { id: 'eq_y', target: 'y', latex: 'u \\cdot (x \\cdot \\sin(t) + y \\cdot \\cos(t))' }
        ],
        params: { u: 0.9 }
      },
      gumowski: {
        eqs: [
          { id: 'eq_x', target: 'x', latex: 'y + a \\cdot (1 - 0.05 \\cdot y^2) \\cdot y + \\frac{2 \\cdot x}{1 + x^2}' },
          { id: 'eq_y', target: 'y', latex: '-x + \\frac{2 \\cdot y}{1 + y^2}' }
        ],
        params: { a: 0.008, b: 0.05 }
      },
      tinkerbell: {
        eqs: [
          { id: 'eq_x', target: 'x', latex: 'x^2 - y^2 + a \\cdot x + b \\cdot y' },
          { id: 'eq_y', target: 'y', latex: '2 \\cdot x \\cdot y + c \\cdot x + d \\cdot y' }
        ],
        params: { a: 0.9, b: -0.6, c: 2.0, d: 0.5 }
      },
      sprott_3d: {
        eqs: [
          { id: 'eq_x', target: 'x', latex: '\\sin(a \\cdot y) - z \\cdot \\cos(b \\cdot x)' },
          { id: 'eq_y', target: 'y', latex: 'z \\cdot \\sin(c \\cdot x) - \\cos(d \\cdot y)' },
          { id: 'eq_z', target: 'z', latex: '\\sin(x)' }
        ],
        params: { a: 2.24, b: -0.65, c: 0.43, d: -2.43 }
      },
      blank: {
        eqs: [
          { id: 'eq_x', target: 'x', latex: '' },
          { id: 'eq_y', target: 'y', latex: '' }
        ],
        params: { a: 1.0, b: 1.0 }
      }
    };

    if (templateSelect) {
      templateSelect.addEventListener('change', (e) => {
        const val = e.target.value;
        this.customTemplateId = val;
        const t = templates[val];
        if (t) {
          this.customEquations = JSON.parse(JSON.stringify(t.eqs));
          this.params = { ...t.params };
          this.renderEquationRows();
          this.compileCustomFormula();
        }
      });
    }
  }

  renderEquationRows() {
    const listContainer = document.getElementById('math-equations-list');
    if (!listContainer) return;

    this.isRenderingRows = true;
    listContainer.innerHTML = '';

    this.customEquations.forEach((eq, index) => {
      const row = document.createElement('div');
      row.className = 'math-row';

      const label = document.createElement('div');
      label.className = 'math-eq-label';
      label.innerHTML = `${eq.target}<sub>n+1</sub> =`;

      const mf = document.createElement('math-field');
      mf.className = 'custom-math-field';
      mf.setAttribute('virtual-keyboard-mode', 'manual');

      mf.addEventListener('focus', () => {
        this.lastFocusedMathField = mf;
      });

      mf.addEventListener('input', () => {
        if (this.isRenderingRows || this.systemType !== 'custom') return;

        // Check if user is actively interacting with this math-field
        const isUserFocused = (document.activeElement === mf || mf.matches(':focus-within') || (typeof mf.hasFocus === 'function' && mf.hasFocus()));
        
        // If it's a background event and value didn't change, ignore
        if (!isUserFocused && mf.value === eq.latex) return;

        const valueChanged = (mf.value !== eq.latex);
        eq.latex = mf.value;

        // Update formula compilation
        this.compileCustomFormula();
      });

      row.appendChild(label);
      row.appendChild(mf);

      // Only allow deleting optional equations (e.g. z or helper variables), never core x and y
      const isCoreEquation = (eq.target === 'x' || eq.target === 'y') && (index < 2);
      if (!isCoreEquation) {
        const delBtn = document.createElement('button');
        delBtn.type = 'button';
        delBtn.className = 'btn-remove-eq';
        delBtn.title = `Remove ${eq.target} equation`;
        delBtn.setAttribute('aria-label', `Remove equation ${eq.target}`);
        delBtn.innerHTML = '<i class="fas fa-times"></i>';

        delBtn.addEventListener('click', () => {
          this.customEquations.splice(index, 1);
          this.renderEquationRows();
          if (this.systemType === 'custom') {
            this.compileCustomFormula();
          }
        });

        row.appendChild(delBtn);
      }

      listContainer.appendChild(row);

      // Set MathLive LaTeX value securely
      if (typeof mf.setValue === 'function') {
        mf.setValue(eq.latex || '', { format: 'latex' });
      } else {
        mf.value = eq.latex || '';
      }

      if (index === 0 && !this.lastFocusedMathField) {
        this.lastFocusedMathField = mf;
      }
    });

    const templateSelect = document.getElementById('custom-template-select');
    if (templateSelect && this.customTemplateId && this.customTemplateId !== 'custom') {
      templateSelect.value = this.customTemplateId;
    }

    this.isRenderingRows = false;

    // Update Add Equation Button (Max 3 equations: X, Y, Z)
    const addEqBtn = document.getElementById('btn-add-equation');
    if (addEqBtn) {
      if (this.customEquations.length < 3) {
        addEqBtn.style.display = 'flex';
        addEqBtn.querySelector('.btn-label').textContent = 'Add Z Equation (3D Mode)';
      } else {
        addEqBtn.style.display = 'none';
      }
    }
  }

  compileCustomFormula() {
    const errorBox = document.getElementById('formula-error');
    try {
      this.customCompiledSystem = MathParser.compileSystem(this.customEquations);

      if (errorBox) {
        errorBox.textContent = `✓ ${this.customEquations.length} equations compiled successfully`;
        errorBox.style.color = '#39ff14';
      }

      this.renderer2D.clear();

      // STRICT GUARD: Only overwrite HUD sliders if the application is actively in Custom Sandbox mode!
      if (this.systemType === 'custom') {
        const freeVars = this.customCompiledSystem.freeVars || [];
        const activeVars = freeVars.length > 0 ? freeVars : ['a', 'b', 'c', 'd'];

        const paramRanges = {};
        const defaultParamVals = { a: 1.4, b: -2.3, c: 2.4, d: -2.1, k: 1.0, m: 1.0, u: 0.9 };

        activeVars.forEach(v => {
          paramRanges[v] = { min: -3.0, max: 3.0, step: 0.05, label: v };
          if (this.params[v] === undefined) {
            this.params[v] = defaultParamVals[v] !== undefined ? defaultParamVals[v] : 1.0;
          }
        });

        this.hud.updateDynamicParams(paramRanges, this.params, (k, val) => {
          this.params[k] = val;
          this.renderer2D.clear();
        });
      }
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
        this.hud.showToast('Rendering 4K Wallpaper...');
        StudioExporter.export4KWallpaper(
          (offCtx, w, h) => {
            offCtx.fillStyle = '#05050a';
            offCtx.fillRect(0, 0, w, h);
            offCtx.drawImage(this.canvas, 0, 0, w, h);
          },
          `ChaosVision_${this.systemId}_4K.png`,
          () => {
            this.hud.showToast('4K Wallpaper Downloaded!');
          }
        );
      });
    }

    // Vector SVG Export
    const exportSvgBtn = document.getElementById('btn-export-svg');
    if (exportSvgBtn) {
      exportSvgBtn.addEventListener('click', () => {
        StudioExporter.exportSystemSVG(this, window.innerWidth, window.innerHeight);
        this.hud.showToast('Vector SVG Exported!');
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
      const isInteracting = this.camera.isDragging || this.camera.isPanning ||
        Math.abs(this.camera.velZoom) > 0.0005 ||
        Math.abs(this.camera.velRotX) > 0.0005 ||
        Math.abs(this.camera.velRotY) > 0.0005;

      const dynamicFade = isInteracting ? Math.max(0.22, this.trailDecay * 3) : this.trailDecay;

      this.renderer2D.fade(dynamicFade);
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
        this.camera,
        this.paletteId,
        this.canvas.clientWidth,
        this.canvas.clientHeight
      );
      iterationMetric = '3D Manifold';
    } else if (this.systemType === 'custom' && this.customCompiledSystem) {
      const t = timestamp * 0.001;
      const fnSystem = this.customCompiledSystem;
      const params = this.params;
      const isInteracting = this.camera.isDragging || this.camera.isPanning ||
        Math.abs(this.camera.velZoom) > 0.0005 ||
        Math.abs(this.camera.velRotX) > 0.0005 ||
        Math.abs(this.camera.velRotY) > 0.0005;

      const dynamicFade = isInteracting ? Math.max(0.22, this.trailDecay * 3) : this.trailDecay;

      this.renderer2D.fade(dynamicFade);
      this.renderer2D.render2DMapBatch(
        (x, y, z, p) => fnSystem(x, y, z, t, p || params),
        params,
        Math.round(35000 * this.speed),
        this.paletteId,
        0.25,
        this.camera
      );
      iterationMetric = `${this.customEquations.length} Equations`;
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

window.addEventListener('DOMContentLoaded', () => {
  window.chaosApp = new ChaosVisionApp();
});
