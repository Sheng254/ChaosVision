/**
 * High-Fidelity URL Hash State Synchronizer & Link Sharing Engine
 * Captures the exact parameters, speed, camera angle, and color palette.
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
    params.set('spd', (state.speed || 1.0).toFixed(2));
    params.set('dec', (state.trailDecay || 0.08).toFixed(3));
    params.set('swm', state.swarmCount || 3);

    // Save camera transform
    if (state.camera) {
      params.set('rx', state.camera.rotX.toFixed(3));
      params.set('ry', state.camera.rotY.toFixed(3));
      params.set('px', state.camera.panX.toFixed(1));
      params.set('py', state.camera.panY.toFixed(1));
      params.set('zm', state.camera.zoom.toFixed(3));
    }

    // Save exact math parameters
    if (state.params) {
      for (const [k, v] of Object.entries(state.params)) {
        params.set(`p_${k}`, typeof v === 'number' ? v.toFixed(5) : v);
      }
    }

    if (state.customFormula) {
      params.set('formula', encodeURIComponent(state.customFormula));
    }

    const fullUrl = `${window.location.origin}${window.location.pathname}#${params.toString()}`;
    window.history.replaceState(null, '', fullUrl);
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
      const formula = params.get('formula');

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
        paletteId: palette,
        speed,
        trailDecay: decay,
        swarmCount: swarm,
        camera: Object.keys(camera).length > 0 ? camera : null,
        params: Object.keys(customParams).length > 0 ? customParams : null,
        customFormula: formula ? decodeURIComponent(formula) : null
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
