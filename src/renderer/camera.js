/**
 * Ultra-Smooth 60/120Hz Orbit & Pan Camera with Velocity Inertia and Gliding
 * Full Multi-Touch Pinch-to-Zoom, Two-Finger Pan, and Touch Momentum Physics.
 */

export class OrbitCamera {
  constructor(canvas) {
    this.canvas = canvas;
    
    // Core angles and positions
    this.rotX = 0.35;
    this.rotY = -0.6;
    this.targetRotX = this.rotX;
    this.targetRotY = this.rotY;

    this.panX = 0;
    this.panY = 0;
    this.targetPanX = 0;
    this.targetPanY = 0;

    this.zoom = 1.0;
    this.targetZoom = 1.0;

    // Velocity & Inertia Gliding
    this.velRotX = 0;
    this.velRotY = 0;
    this.velPanX = 0;
    this.velPanY = 0;

    this.autoRotate = true;
    this.autoRotateSpeed = 0.0025;

    this.isDragging = false;
    this.isPanning = false;
    this.lastMouseX = 0;
    this.lastMouseY = 0;

    // Multi-touch tracking
    this.initialTouchDist = 0;
    this.lastMidX = 0;
    this.lastMidY = 0;

    this.smoothing = 0.14; // Silky responsive damping

    this.initEvents();
  }

  initEvents() {
    const el = this.canvas;

    // Mouse Controls
    el.addEventListener('mousedown', (e) => {
      this.isDragging = (e.button === 0 && !e.shiftKey);
      this.isPanning = (e.button === 2 || (e.button === 0 && e.shiftKey));
      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;
      this.velRotX = 0;
      this.velRotY = 0;
      this.velPanX = 0;
      this.velPanY = 0;

      if (this.isDragging) {
        this.autoRotate = false;
      }
    });

    window.addEventListener('mousemove', (e) => {
      if (!this.isDragging && !this.isPanning) return;

      const dx = e.clientX - this.lastMouseX;
      const dy = e.clientY - this.lastMouseY;

      if (this.isDragging) {
        const sens = 0.005;
        this.velRotY = dx * sens;
        this.velRotX = dy * sens;
        this.targetRotY += this.velRotY;
        this.targetRotX += this.velRotX;
        this.targetRotX = Math.max(-Math.PI * 0.48, Math.min(Math.PI * 0.48, this.targetRotX));
      } else if (this.isPanning) {
        const panSens = 1.2;
        this.velPanX = dx * panSens;
        this.velPanY = dy * panSens;
        this.targetPanX += this.velPanX;
        this.targetPanY += this.velPanY;
      }

      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;
    });

    window.addEventListener('mouseup', () => {
      this.isDragging = false;
      this.isPanning = false;
    });

    el.addEventListener('contextmenu', (e) => e.preventDefault());

    // Silky smooth exponential wheel zoom
    el.addEventListener('wheel', (e) => {
      e.preventDefault();
      const zoomSpeed = 0.0018;
      const factor = Math.exp(-e.deltaY * zoomSpeed);
      this.targetZoom = Math.max(0.15, Math.min(8.0, this.targetZoom * factor));
    }, { passive: false });

    // Multi-Touch Controls (Mobile / Tablets / iPads)
    el.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        this.isDragging = true;
        this.isPanning = false;
        this.lastMouseX = e.touches[0].clientX;
        this.lastMouseY = e.touches[0].clientY;
        this.velRotX = 0;
        this.velRotY = 0;
        this.autoRotate = false;
      } else if (e.touches.length === 2) {
        this.isDragging = false;
        this.isPanning = true;
        const t1 = e.touches[0];
        const t2 = e.touches[1];
        this.initialTouchDist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
        this.lastMidX = (t1.clientX + t2.clientX) / 2;
        this.lastMidY = (t1.clientY + t2.clientY) / 2;
      }
    }, { passive: false });

    el.addEventListener('touchmove', (e) => {
      e.preventDefault(); // Prevent page bounce on mobile
      if (e.touches.length === 1 && this.isDragging) {
        const dx = e.touches[0].clientX - this.lastMouseX;
        const dy = e.touches[0].clientY - this.lastMouseY;
        const sens = 0.006;
        this.velRotY = dx * sens;
        this.velRotX = dy * sens;
        this.targetRotY += this.velRotY;
        this.targetRotX += this.velRotX;
        this.targetRotX = Math.max(-Math.PI * 0.48, Math.min(Math.PI * 0.48, this.targetRotX));
        this.lastMouseX = e.touches[0].clientX;
        this.lastMouseY = e.touches[0].clientY;
      } else if (e.touches.length === 2) {
        const t1 = e.touches[0];
        const t2 = e.touches[1];

        // 1. Two-finger Pinch-to-Zoom
        const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
        if (this.initialTouchDist > 0) {
          const ratio = dist / this.initialTouchDist;
          this.targetZoom = Math.max(0.15, Math.min(8.0, this.targetZoom * ratio));
          this.initialTouchDist = dist;
        }

        // 2. Two-finger Pan
        const midX = (t1.clientX + t2.clientX) / 2;
        const midY = (t1.clientY + t2.clientY) / 2;
        const panDx = midX - this.lastMidX;
        const panDy = midY - this.lastMidY;
        this.velPanX = panDx * 1.5;
        this.velPanY = panDy * 1.5;
        this.targetPanX += this.velPanX;
        this.targetPanY += this.velPanY;

        this.lastMidX = midX;
        this.lastMidY = midY;
      }
    }, { passive: false });

    const endTouch = (e) => {
      if (e.touches.length === 0) {
        this.isDragging = false;
        this.isPanning = false;
        this.initialTouchDist = 0;
      } else if (e.touches.length === 1) {
        this.isDragging = true;
        this.isPanning = false;
        this.lastMouseX = e.touches[0].clientX;
        this.lastMouseY = e.touches[0].clientY;
        this.initialTouchDist = 0;
      }
    };

    el.addEventListener('touchend', endTouch);
    el.addEventListener('touchcancel', endTouch);
  }

  update() {
    // Auto-rotation when not manually dragging
    if (this.autoRotate && !this.isDragging) {
      this.targetRotY += this.autoRotateSpeed;
    }

    // Inertial gliding on release
    if (!this.isDragging) {
      this.targetRotY += this.velRotY;
      this.targetRotX += this.velRotX;
      this.velRotX *= 0.92;
      this.velRotY *= 0.92;
    }

    if (!this.isPanning) {
      this.targetPanX += this.velPanX;
      this.targetPanY += this.velPanY;
      this.velPanX *= 0.90;
      this.velPanY *= 0.90;
    }

    // Exponential smoothing LERP
    this.rotX += (this.targetRotX - this.rotX) * this.smoothing;
    this.rotY += (this.targetRotY - this.rotY) * this.smoothing;
    this.panX += (this.targetPanX - this.panX) * this.smoothing;
    this.panY += (this.targetPanY - this.panY) * this.smoothing;
    this.zoom += (this.targetZoom - this.zoom) * this.smoothing;
  }

  reset() {
    this.targetRotX = 0.35;
    this.targetRotY = -0.6;
    this.targetPanX = 0;
    this.targetPanY = 0;
    this.targetZoom = 1.0;
    this.velRotX = 0;
    this.velRotY = 0;
    this.velPanX = 0;
    this.velPanY = 0;
  }
}
