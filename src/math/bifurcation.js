/**
 * High-Performance Interactive Logistic Map & Feigenbaum Bifurcation Explorer
 * Ultra-smooth panning, progressive zoom, and real-time fractal window inspection.
 */

export class BifurcationExplorer {
  constructor() {
    this.rMin = 2.4;
    this.rMax = 4.0;
    this.xMin = 0.0;
    this.xMax = 1.0;
    this.targetRMin = this.rMin;
    this.targetRMax = this.rMax;
    this.settleIterations = 180;
    this.sampleIterations = 180;
  }

  /**
   * Smoothly pans the parameter window horizontally.
   */
  pan(deltaXPercent) {
    const span = this.targetRMax - this.targetRMin;
    const shift = span * deltaXPercent;
    this.targetRMin = Math.max(0.0, this.targetRMin - shift);
    this.targetRMax = Math.min(4.0, this.targetRMax - shift);
  }

  /**
   * Smoothly zooms centered at the cursor position.
   */
  zoom(factor, centerPercent = 0.5) {
    const span = this.targetRMax - this.targetRMin;
    const centerR = this.targetRMin + span * centerPercent;
    const newSpan = Math.max(0.0005, Math.min(4.0, span * factor));

    this.targetRMin = Math.max(0.0, centerR - newSpan * centerPercent);
    this.targetRMax = Math.min(4.0, centerR + newSpan * (1 - centerPercent));
  }

  reset() {
    this.targetRMin = 2.4;
    this.targetRMax = 4.0;
    this.targetXMin = 0.0;
    this.targetXMax = 1.0;
  }

  /**
   * Renders the bifurcation diagram onto a target 2D canvas context.
   */
  render(ctx, width, height, color = 'rgba(0, 242, 254, 0.55)') {
    // Smooth LERP zoom & pan interpolation
    this.rMin += (this.targetRMin - this.rMin) * 0.18;
    this.rMax += (this.targetRMax - this.rMax) * 0.18;

    ctx.fillStyle = '#05050a';
    ctx.fillRect(0, 0, width, height);

    const numCols = Math.min(width, 1000);
    const colWidth = width / numCols;
    const rStep = (this.rMax - this.rMin) / numCols;
    const xSpan = this.xMax - this.xMin || 1;

    ctx.fillStyle = color;

    for (let col = 0; col < numCols; col++) {
      const r = this.rMin + col * rStep;
      let x = 0.5;

      // Settle
      for (let i = 0; i < this.settleIterations; i++) {
        x = r * x * (1.0 - x);
      }

      // Sample attractor
      for (let i = 0; i < this.sampleIterations; i++) {
        x = r * x * (1.0 - x);
        if (x >= this.xMin && x <= this.xMax) {
          const px = col * colWidth;
          const py = height - ((x - this.xMin) / xSpan) * height;
          ctx.fillRect(px, py, 1.2, 1.2);
        }
      }
    }

    this.drawAnnotations(ctx, width, height);
  }

  /**
   * Overlays mathematical landmarks and navigation guide.
   */
  drawAnnotations(ctx, width, height) {
    ctx.font = '12px "JetBrains Mono", monospace';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';

    // Bounds indicators
    ctx.fillText(`r Min: ${this.rMin.toFixed(5)}`, 16, height - 16);
    ctx.fillText(`r Max: ${this.rMax.toFixed(5)}`, width - 160, height - 16);
    ctx.fillText(`x Max: ${this.xMax.toFixed(2)}`, 16, 24);
    ctx.fillText(`x Min: ${this.xMin.toFixed(2)}`, 16, height - 36);

    // Feigenbaum point marker
    const rChaos = 3.569946;
    if (rChaos >= this.rMin && rChaos <= this.rMax) {
      const px = ((rChaos - this.rMin) / (this.rMax - this.rMin)) * width;
      ctx.strokeStyle = 'rgba(255, 0, 127, 0.6)';
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(px, 0);
      ctx.lineTo(px, height);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = '#ff007f';
      ctx.fillText('Feigenbaum Chaos Threshold r ≈ 3.5699', Math.min(px + 8, width - 260), 32);
    }

    // Interaction hint
    ctx.fillStyle = 'rgba(0, 242, 254, 0.75)';
    ctx.fillText('Click & Drag to Pan | Scroll Wheel to Zoom into Fractal Windows', width / 2 - 200, height - 16);
  }
}
