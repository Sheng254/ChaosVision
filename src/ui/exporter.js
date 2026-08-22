/**
 * Studio-Grade Exporter Deck
 * Handles Ultra-HD 4K PNG wallpapers, Vector SVG for plotters, and custom duration WebM recording.
 */

export class StudioExporter {
  /**
   * Generates a 4K (3840x2160) wallpaper render off-screen with supersampling.
   */
  static export4KWallpaper(renderCallback, filename = 'ChaosVision_4K_UltraHD.png') {
    const offscreen = document.createElement('canvas');
    offscreen.width = 3840;
    offscreen.height = 2160;
    const offCtx = offscreen.getContext('2d');

    renderCallback(offCtx, 3840, 2160);

    const link = document.createElement('a');
    link.download = filename;
    link.href = offscreen.toDataURL('image/png', 1.0);
    link.click();
  }

  /**
   * Exports 3D trajectory lines as a vector SVG file.
   */
  static exportSVG(paths, width = 1920, height = 1080, strokeColor = '#00f2fe') {
    let svgContent = `<!-- ChaosVision Vector Artwork | Created by Sheng254 (https://github.com/Sheng254/ChaosVision) | MIT License © 2026 -->\n`;
    svgContent += `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" style="background:#05050a;">\n`;

    for (const path of paths) {
      if (path.length < 2) continue;
      let d = `M ${path[0].x.toFixed(2)} ${path[0].y.toFixed(2)} `;
      for (let i = 1; i < path.length; i++) {
        d += `L ${path[i].x.toFixed(2)} ${path[i].y.toFixed(2)} `;
      }
      svgContent += `  <path d="${d}" fill="none" stroke="${strokeColor}" stroke-width="1.2" opacity="0.8" />\n`;
    }

    svgContent += `</svg>`;

    const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = 'ChaosVision_Vector.svg';
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  }
}

/**
 * Custom Duration Video Recorder Controller
 */
export class FlexibleVideoRecorder {
  constructor(canvas) {
    this.canvas = canvas;
    this.recorder = null;
    this.chunks = [];
    this.startTime = 0;
    this.timerInterval = null;
    this.onTick = null;
    this.onStop = null;
  }

  isRecording() {
    return this.recorder && this.recorder.state === 'recording';
  }

  start(onTick, onStop) {
    if (!window.MediaRecorder) {
      alert('MediaRecorder API is not supported in this browser.');
      return false;
    }

    this.onTick = onTick;
    this.onStop = onStop;
    this.chunks = [];

    const stream = this.canvas.captureStream(60);
    this.recorder = new MediaRecorder(stream, {
      mimeType: 'video/webm;codecs=vp9',
      videoBitsPerSecond: 10000000
    });

    this.recorder.ondataavailable = (e) => {
      if (e.data.size > 0) this.chunks.push(e.data);
    };

    this.recorder.onstop = () => {
      clearInterval(this.timerInterval);
      const blob = new Blob(this.chunks, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = `ChaosVision_Recording_${Date.now()}.webm`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
      if (this.onStop) this.onStop();
    };

    this.recorder.start();
    this.startTime = Date.now();

    this.timerInterval = setInterval(() => {
      const elapsedSec = Math.floor((Date.now() - this.startTime) / 1000);
      if (this.onTick) this.onTick(elapsedSec);
    }, 1000);

    return true;
  }

  stop() {
    if (this.isRecording()) {
      this.recorder.stop();
    }
  }
}
