/**
 * Glassmorphic HUD & Control Deck
 * Dynamic parameter controls, tutorial modal, two-way synchronized Museum Tour controller.
 */

import { COLOR_PALETTES } from '../config/palettes.js';
import { MUSEUM_EXHIBITS } from '../config/presets.js';
import { URLStateManager } from './urlState.js';

export class HUDController {
  constructor(app) {
    this.app = app;
    this.container = document.getElementById('hud-container');
    this.paramsContainer = document.getElementById('dynamic-params');
    this.statsFps = document.getElementById('stats-fps');
    this.statsDivergence = document.getElementById('stats-divergence');
    this.statsRate = document.getElementById('stats-rate');

    this.currentExhibitIndex = 0;

    this.initStaticControls();
    this.initTutorialModal();
    this.initLiveMuseumTour();
    this.makeDeckDraggable();
  }

  initStaticControls() {
    // System selection
    const systemSelect = document.getElementById('system-select');
    systemSelect.addEventListener('change', (e) => {
      const val = e.target.value;
      const [type, id] = val.split(':');
      this.app.switchSystem(type, id);
      this.syncActiveExhibitWithSystem(type, id);
    });

    // Palette selection
    const paletteSelect = document.getElementById('palette-select');
    for (const [key, p] of Object.entries(COLOR_PALETTES)) {
      const opt = document.createElement('option');
      opt.value = key;
      opt.textContent = p.name;
      paletteSelect.appendChild(opt);
    }
    paletteSelect.addEventListener('change', (e) => {
      this.app.setPalette(e.target.value);
    });

    // Audio Sonification Toggle
    const soundBtn = document.getElementById('btn-sound-toggle');
    soundBtn.addEventListener('click', () => {
      const active = this.app.toggleAudio();
      soundBtn.classList.toggle('active', active);
      soundBtn.querySelector('.btn-label').textContent = active ? 'Audio: ON' : 'Audio: OFF';
    });

    // Recenter View Button
    const resetCamBtn = document.getElementById('btn-reset-camera');
    if (resetCamBtn) {
      resetCamBtn.addEventListener('click', () => {
        this.app.resetCamera();
        this.showToast('Camera recentered');
      });
    }

    // Share Creation Button
    const shareBtn = document.getElementById('btn-share');
    if (shareBtn) {
      shareBtn.addEventListener('click', () => {
        const url = URLStateManager.saveState(this.app.getState());
        URLStateManager.copyShareableLink(url).then(() => {
          this.showToast('Link copied! Exact parameters, colors, and camera angle saved.');
        });
      });
    }

    // HUD Collapse toggle
    const toggleHudBtn = document.getElementById('btn-toggle-hud');
    toggleHudBtn.addEventListener('click', () => {
      this.container.classList.toggle('collapsed');
      toggleHudBtn.querySelector('i').classList.toggle('fa-chevron-left');
      toggleHudBtn.querySelector('i').classList.toggle('fa-chevron-right');
    });

    // Butterfly Swarm Count slider
    const swarmInput = document.getElementById('swarm-count-input');
    if (swarmInput) {
      swarmInput.addEventListener('input', (e) => {
        const count = parseInt(e.target.value, 10);
        document.getElementById('swarm-count-val').textContent = count;
        this.app.setSwarmCount(count);
      });
    }

    // Speed slider
    const speedInput = document.getElementById('speed-input');
    if (speedInput) {
      speedInput.addEventListener('input', (e) => {
        const speed = parseFloat(e.target.value);
        document.getElementById('speed-val').textContent = `${speed.toFixed(1)}x`;
        this.app.setSpeed(speed);
      });
    }

    // Trail Decay slider
    const decayInput = document.getElementById('decay-input');
    if (decayInput) {
      decayInput.addEventListener('input', (e) => {
        const decay = parseFloat(e.target.value);
        document.getElementById('decay-val').textContent = decay.toFixed(2);
        this.app.setTrailDecay(decay);
      });
    }
  }

  /**
   * Synchronizes the Museum Tour deck content whenever the user selects a system from the controls drawer.
   */
  syncActiveExhibitWithSystem(type, id) {
    const idx = MUSEUM_EXHIBITS.findIndex(ex => ex.systemType === type && ex.systemId === id);
    if (idx !== -1) {
      this.updateDeckContent(idx);
    }
  }

  initTutorialModal() {
    const tutBtn = document.getElementById('btn-tutorial');
    const tutModal = document.getElementById('tutorial-modal');
    const tutClose = document.getElementById('tutorial-modal-close');

    if (tutBtn && tutModal) {
      tutBtn.addEventListener('click', () => {
        tutModal.classList.add('visible');
      });
    }

    if (tutClose && tutModal) {
      tutClose.addEventListener('click', () => {
        tutModal.classList.remove('visible');
      });
    }

    // Close on overlay click
    window.addEventListener('click', (e) => {
      if (e.target.classList.contains('modal-overlay')) {
        e.target.classList.remove('visible');
      }
    });

    // Keyboard shortcuts
    window.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;

      if (e.key.toLowerCase() === 't') {
        tutModal.classList.toggle('visible');
      } else if (e.key.toLowerCase() === 'r') {
        this.app.resetCamera();
      } else if (e.key.toLowerCase() === 'm') {
        document.getElementById('btn-sound-toggle').click();
      } else if (e.key.toLowerCase() === 'h') {
        document.getElementById('btn-toggle-hud').click();
      }
    });
  }

  /**
   * Makes the floating Museum Tour Deck draggable across the screen.
   */
  makeDeckDraggable() {
    const deck = document.getElementById('museum-tour-deck');
    const header = document.getElementById('tour-deck-header');
    if (!deck || !header) return;

    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let initialLeft = 0;
    let initialTop = 0;

    header.addEventListener('pointerdown', (e) => {
      if (e.target.closest('.deck-btn-icon') || e.target.closest('button') || e.target.closest('select')) return;
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;

      const rect = deck.getBoundingClientRect();
      initialLeft = rect.left;
      initialTop = rect.top;

      deck.style.right = 'auto';
      deck.style.bottom = 'auto';
      deck.style.left = `${initialLeft}px`;
      deck.style.top = `${initialTop}px`;
      deck.classList.add('is-dragging');
      header.setPointerCapture(e.pointerId);
    });

    header.addEventListener('pointermove', (e) => {
      if (!isDragging) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;

      let nextLeft = initialLeft + dx;
      let nextTop = initialTop + dy;

      // Viewport boundary clamping
      const maxLeft = window.innerWidth - deck.offsetWidth - 10;
      const maxTop = window.innerHeight - deck.offsetHeight - 10;
      nextLeft = Math.max(10, Math.min(maxLeft, nextLeft));
      nextTop = Math.max(10, Math.min(maxTop, nextTop));

      deck.style.left = `${nextLeft}px`;
      deck.style.top = `${nextTop}px`;
    });

    const stopDrag = (e) => {
      if (isDragging) {
        isDragging = false;
        deck.classList.remove('is-dragging');
        if (e && e.pointerId) {
          try { header.releasePointerCapture(e.pointerId); } catch (_) {}
        }
      }
    };

    header.addEventListener('pointerup', stopDrag);
    header.addEventListener('pointercancel', stopDrag);
  }

  /**
   * Initializes the Live Museum Tour floating educational card.
   */
  initLiveMuseumTour() {
    const tourBtn = document.getElementById('btn-museum-tour');
    const deck = document.getElementById('museum-tour-deck');
    const closeBtn = document.getElementById('tour-deck-close');
    const minimizeBtn = document.getElementById('tour-deck-minimize');
    const prevBtn = document.getElementById('tour-prev-btn');
    const nextBtn = document.getElementById('tour-next-btn');
    const selectEl = document.getElementById('tour-exhibit-select');

    if (selectEl) {
      selectEl.innerHTML = '';
      MUSEUM_EXHIBITS.forEach((ex, idx) => {
        const opt = document.createElement('option');
        opt.value = idx;
        opt.textContent = `${idx + 1}. ${ex.title}`;
        selectEl.appendChild(opt);
      });

      selectEl.addEventListener('change', (e) => {
        this.loadMuseumExhibit(parseInt(e.target.value, 10));
      });
    }

    if (tourBtn && deck) {
      tourBtn.addEventListener('click', () => {
        deck.classList.add('visible');
        deck.classList.remove('minimized');

        // Intelligently sync to currently active simulation on canvas
        const activeType = this.app.systemType;
        const activeId = this.app.systemId;
        const matchingIdx = MUSEUM_EXHIBITS.findIndex(ex => ex.systemType === activeType && ex.systemId === activeId);

        const targetIdx = matchingIdx !== -1 ? matchingIdx : this.currentExhibitIndex;
        this.loadMuseumExhibit(targetIdx);
      });
    }

    if (closeBtn && deck) {
      closeBtn.addEventListener('click', () => {
        deck.classList.remove('visible');
      });
    }

    if (minimizeBtn && deck) {
      minimizeBtn.addEventListener('click', () => {
        deck.classList.toggle('minimized');
        minimizeBtn.querySelector('i').classList.toggle('fa-window-minimize');
        minimizeBtn.querySelector('i').classList.toggle('fa-window-restore');
      });
    }

    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        const newIdx = (this.currentExhibitIndex - 1 + MUSEUM_EXHIBITS.length) % MUSEUM_EXHIBITS.length;
        this.loadMuseumExhibit(newIdx);
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        const newIdx = (this.currentExhibitIndex + 1) % MUSEUM_EXHIBITS.length;
        this.loadMuseumExhibit(newIdx);
      });
    }
  }

  /**
   * Updates only the educational card text, equations, and badges in the deck.
   */
  updateDeckContent(index) {
    this.currentExhibitIndex = index;
    const ex = MUSEUM_EXHIBITS[index];
    if (!ex) return;

    const selectEl = document.getElementById('tour-exhibit-select');
    if (selectEl) selectEl.value = index;

    document.getElementById('tour-title').textContent = ex.title;
    document.getElementById('tour-subtitle').textContent = ex.subtitle || '';
    document.getElementById('tour-author').textContent = ex.author;
    document.getElementById('tour-category-badge').textContent = ex.category.toUpperCase();

    // Render multi-line stacked equations
    const formulaContainer = document.getElementById('tour-formula');
    formulaContainer.innerHTML = '';
    if (ex.equations && ex.equations.length > 0) {
      const stack = document.createElement('div');
      stack.className = 'equation-stack';
      ex.equations.forEach(eq => {
        const row = document.createElement('div');
        row.className = 'equation-row';
        row.innerHTML = `<span class="eq-lhs">${eq.lhs}</span> <span class="eq-equals">=</span> <span class="eq-rhs">${eq.rhs}</span>`;
        stack.appendChild(row);
      });
      formulaContainer.appendChild(stack);
    } else if (ex.formula) {
      formulaContainer.textContent = ex.formula;
    }

    document.getElementById('tour-narrative').textContent = ex.narrative;
    document.getElementById('tour-visual-cue').textContent = ex.visualCue;
    document.getElementById('tour-experiment').textContent = ex.experiment;
    document.getElementById('tour-physics').textContent = ex.physicsBreakdown;
    document.getElementById('tour-impact').textContent = ex.realWorldImpact;
    document.getElementById('tour-index-indicator').textContent = `${index + 1} / ${MUSEUM_EXHIBITS.length}`;
  }

  /**
   * Loads an exhibit into the live simulation and updates the educational card.
   */
  loadMuseumExhibit(index) {
    this.updateDeckContent(index);
    const ex = MUSEUM_EXHIBITS[index];
    if (!ex) return;

    // 1. Launch simulation live on canvas with curated look
    this.app.applyPreset(ex);

    // 2. Synchronize left drawer dropdown
    const systemSelect = document.getElementById('system-select');
    if (systemSelect) {
      systemSelect.value = `${ex.systemType}:${ex.systemId}`;
    }

    this.showToast(`Museum Exhibit: ${ex.title}`);
  }

  /**
   * Dynamically renders parameter sliders for the current mathematical model.
   */
  updateDynamicParams(paramDefs, currentValues, onParamChange) {
    this.paramsContainer.innerHTML = '';
    if (!paramDefs || Object.keys(paramDefs).length === 0) {
      this.paramsContainer.innerHTML = '<div class="no-params-msg">No adjustable parameters for this mode.</div>';
      return;
    }

    for (const [key, meta] of Object.entries(paramDefs)) {
      const row = document.createElement('div');
      row.className = 'param-row';

      const label = document.createElement('label');
      label.textContent = meta.label || key;
      if (meta.description) {
        label.setAttribute('data-tooltip', meta.description);
        label.classList.add('param-label-interactive');
      }

      const sliderWrapper = document.createElement('div');
      sliderWrapper.className = 'slider-wrapper';

      const slider = document.createElement('input');
      slider.type = 'range';
      slider.min = meta.min;
      slider.max = meta.max;
      slider.step = meta.step || (meta.max - meta.min) / 100;
      slider.value = currentValues[key] !== undefined ? currentValues[key] : meta.min;
      if (meta.description) {
        slider.setAttribute('data-tooltip', meta.description);
      }

      const numVal = document.createElement('span');
      numVal.className = 'param-num-val';
      numVal.textContent = parseFloat(slider.value).toFixed(3);

      slider.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        numVal.textContent = val.toFixed(3);
        onParamChange(key, val);
      });

      sliderWrapper.appendChild(slider);
      sliderWrapper.appendChild(numVal);

      row.appendChild(label);
      row.appendChild(sliderWrapper);
      this.paramsContainer.appendChild(row);
    }
  }

  /**
   * Updates real-time metrics in the HUD.
   */
  updateMetrics(fps, divergence, rate) {
    if (this.statsFps) this.statsFps.textContent = `${Math.round(fps)} FPS`;
    if (this.statsDivergence) this.statsDivergence.textContent = divergence > 0 ? divergence.toFixed(3) : '0.000';
    if (this.statsRate) this.statsRate.textContent = rate;
  }

  showToast(message, duration = 3000) {
    let toast = document.getElementById('app-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'app-toast';
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add('visible');
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      toast.classList.remove('visible');
    }, duration);
  }
}
