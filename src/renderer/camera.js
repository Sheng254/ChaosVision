/**
 * Precision 60/120Hz Orbit, Pan & Zoom Camera
 * Kinetic momentum physics, velocity tracking, and multi-touch pinch controls.
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

    // Kinetic velocity & momentum
    this.velRotX = 0;
    this.velRotY = 0;
    this.velPanX = 0;
    this.velPanY = 0;
    this.velZoom = 0;

    this.autoRotate = true;
    this.autoRotateSpeed = 0.002;

    this.isDragging = false;
    this.isPanning = false;
    this.lastMouseX = 0;
    this.lastMouseY = 0;

    // Multi-touch tracking
    this.initialTouchDist = 0;
    this.lastMidX = 0;
    this.lastMidY = 0;

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
      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;

      if (this.isDragging) {
        const sens = 0.0045;
        // Track rolling velocity for natural throw inertia
        this.velRotY = dx * sens;
        this.velRotX = dy * sens;

        this.targetRotY += this.velRotY;
        this.targetRotX += this.velRotX;
        this.targetRotX = Math.max(-Math.PI * 0.48, Math.min(Math.PI * 0.48, this.targetRotX));
      } else if (this.isPanning) {
        const panSens = 1.0;
        this.velPanX = dx * panSens;
        this.velPanY = dy * panSens;

        this.targetPanX += this.velPanX;
        this.targetPanY += this.velPanY;
      }
    });

    window.addEventListener('mouseup', () => {
      this.isDragging = false;
      this.isPanning = false;
    });

    el.addEventListener('contextmenu', (e) => e.preventDefault());

    // Kinetic Wheel / Trackpad Zoom
    el.addEventListener('wheel', (e) => {
      e.preventDefault();

      // Normalize delta across line vs pixel vs page modes
      const rawDelta = e.deltaMode === 1 ? e.deltaY * 16 : (e.deltaMode === 2 ? e.deltaY * 250 : e.deltaY);
      const clampedDelta = Math.max(-80, Math.min(80, rawDelta));

      // Smooth exponential zoom impulse
      const zoomImpulse = -clampedDelta * 0.0016;
      this.velZoom += zoomImpulse;
    }, { passive: false });

    // Touch Controls
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
      e.preventDefault();
      if (e.touches.length === 1 && this.isDragging) {
        const dx = e.touches[0].clientX - this.lastMouseX;
        const dy = e.touches[0].clientY - this.lastMouseY;
        this.lastMouseX = e.touches[0].clientX;
        this.lastMouseY = e.touches[0].clientY;

        const sens = 0.005;
        this.velRotY = dx * sens;
        this.velRotX = dy * sens;

        this.targetRotY += this.velRotY;
        this.targetRotX += this.velRotX;
        this.targetRotX = Math.max(-Math.PI * 0.48, Math.min(Math.PI * 0.48, this.targetRotX));
      } else if (e.touches.length === 2) {
        const t1 = e.touches[0];
        const t2 = e.touches[1];

        // Two-finger Pinch Zoom
        const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
        if (this.initialTouchDist > 0) {
          const ratio = dist / this.initialTouchDist;
          this.targetZoom = Math.max(0.15, Math.min(10.0, this.targetZoom * ratio));
          this.initialTouchDist = dist;
        }

        // Two-finger Pan
        const midX = (t1.clientX + t2.clientX) / 2;
        const midY = (t1.clientY + t2.clientY) / 2;
        const panDx = midX - this.lastMidX;
        const panDy = midY - this.lastMidY;
        this.lastMidX = midX;
        this.lastMidY = midY;

        this.targetPanX += panDx * 1.2;
        this.targetPanY += panDy * 1.2;
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
    // Auto-rotation when idle
    if (this.autoRotate && !this.isDragging) {
      this.targetRotY += this.autoRotateSpeed;
    }

    // Inertial glide on release
    if (!this.isDragging) {
      this.targetRotY += this.velRotY;
      this.targetRotX += this.velRotX;
      this.velRotX *= 0.94;
      this.velRotY *= 0.94;
    }

    if (!this.isPanning) {
      this.targetPanX += this.velPanX;
      this.targetPanY += this.velPanY;
      this.velPanX *= 0.90;
      this.velPanY *= 0.90;
    }

    // Apply zoom momentum
    if (Math.abs(this.velZoom) > 0.0001) {
      this.targetZoom = Math.max(0.15, Math.min(10.0, this.targetZoom * (1 + this.velZoom)));
      this.velZoom *= 0.82;
    }

    // Responsive LERP smoothing:
    // Snappy responsiveness during active dragging (0.38), smooth gliding on release (0.22)
    const rotSmoothing = this.isDragging ? 0.38 : 0.22;
    const zoomSmoothing = 0.28;
    const panSmoothing = this.isPanning ? 0.38 : 0.22;

    this.rotX += (this.targetRotX - this.rotX) * rotSmoothing;
    this.rotY += (this.targetRotY - this.rotY) * rotSmoothing;
    this.panX += (this.targetPanX - this.panX) * panSmoothing;
    this.panY += (this.targetPanY - this.panY) * panSmoothing;
    this.zoom += (this.targetZoom - this.zoom) * zoomSmoothing;
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
    this.velZoom = 0;
  }
}
