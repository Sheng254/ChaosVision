/**
 * High-Fidelity URL Hash State Synchronizer & Link Sharing Engine
 * Captures the exact parameters, speed, camera angle, color palette, and custom equations.
 */

export class URLStateManager {
  /**
   * Encodes the complete application snapshot into the URL hash.
   */
  static saveState(state) {
    const params = new URLSearchParams();
    params.set('sys', state.systemType);
    params.set('id', state.systemId);
    params.set('pal', state.paletteId);
    params.set('spd', parseFloat((state.speed || 1.0).toFixed(2)).toString());
    params.set('dec', parseFloat((state.trailDecay || 0.06).toFixed(3)).toString());

    if (state.systemType === '3d_attractor' || state.systemType === 'pendulum') {
      params.set('swm', state.swarmCount || 3);
    }

    // Save camera transform
    if (state.camera) {
      params.set('rx', parseFloat(state.camera.rotX.toFixed(3)).toString());
      params.set('ry', parseFloat(state.camera.rotY.toFixed(3)).toString());
      if (Math.abs(state.camera.panX) > 0.1) params.set('px', parseFloat(state.camera.panX.toFixed(1)).toString());
      if (Math.abs(state.camera.panY) > 0.1) params.set('py', parseFloat(state.camera.panY.toFixed(1)).toString());
      params.set('zm', parseFloat(state.camera.zoom.toFixed(3)).toString());
    }

    // Save exact math parameters
    if (state.params) {
      for (const [k, v] of Object.entries(state.params)) {
        const numVal = typeof v === 'number' ? parseFloat(v.toFixed(4)).toString() : v;
        params.set(`p_${k}`, numVal);
      }
    }

    // Only serialize custom equations and templates when in Custom Sandbox mode
    if (state.systemType === 'custom') {
      if (state.customEquations && Array.isArray(state.customEquations) && state.customEquations.length > 0) {
        params.set('eqs', JSON.stringify(state.customEquations));
      }
      if (state.customTemplateId) {
        params.set('tpl', state.customTemplateId);
      }
    }

    const fullUrl = `${window.location.origin}${window.location.pathname}#${params.toString()}`;
    return fullUrl;
  }

  /**
   * Restores the complete application state from the URL hash.
   */
  static loadState() {
    const hash = window.location.hash.slice(1);
    if (!hash) return null;

    try {
      const params = new URLSearchParams(hash);
      const system = params.get('sys') || params.get('system');
      const id = params.get('id');
      const palette = params.get('pal') || params.get('palette');
      const speed = params.get('spd') ? parseFloat(params.get('spd')) : null;
      const decay = params.get('dec') ? parseFloat(params.get('dec')) : null;
      const swarm = params.get('swm') ? parseInt(params.get('swm'), 10) : null;
      
      // Multi-equation custom systems (only when in custom mode or when eqs present)
      let customEquations = null;
      if (params.has('eqs')) {
        try {
          customEquations = JSON.parse(params.get('eqs'));
        } catch (e) {
          console.warn('Failed to parse customEquations from URL', e);
        }
      } else if (params.has('formula')) {
        // Fallback for legacy single-formula links
        const formula = params.get('formula');
        customEquations = [
          { id: 'eq_x', target: 'x', latex: formula },
          { id: 'eq_y', target: 'y', latex: formula }
        ];
      }

      const templateId = params.get('tpl');

      // Camera
      const camera = {};
      if (params.has('rx')) camera.rotX = parseFloat(params.get('rx'));
      if (params.has('ry')) camera.rotY = parseFloat(params.get('ry'));
      if (params.has('px')) camera.panX = parseFloat(params.get('px'));
      if (params.has('py')) camera.panY = parseFloat(params.get('py'));
      if (params.has('zm')) camera.zoom = parseFloat(params.get('zm'));

      // Math params
      const customParams = {};
      for (const [k, v] of params.entries()) {
        if (k.startsWith('p_')) {
          customParams[k.slice(2)] = parseFloat(v);
        }
      }

      return {
        systemType: system,
        systemId: id,
        customTemplateId: templateId,
        paletteId: palette,
        speed,
        trailDecay: decay,
        swarmCount: swarm,
        camera: Object.keys(camera).length > 0 ? camera : null,
        params: Object.keys(customParams).length > 0 ? customParams : null,
        customEquations
      };
    } catch (e) {
      console.warn('Failed to parse URL state hash', e);
      return null;
    }
  }

  /**
   * Copies shareable URL to clipboard with fallback.
   */
  static copyShareableLink(url) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(url);
    }
    const input = document.createElement('input');
    input.value = url;
    document.body.appendChild(input);
    input.select();
    document.execCommand('copy');
    document.body.removeChild(input);
    return Promise.resolve();
  }
}
