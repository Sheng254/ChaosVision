/**
 * Double pendulum physics engine using Lagrangian mechanics.
 * RK4 integration with configurable sub-steps per frame.
 */

import { TrailBuffer } from './rk4.js';

function wrapAngle(rad) {
  let a = (rad + Math.PI) % (2 * Math.PI);
  if (a < 0) a += 2 * Math.PI;
  return a - Math.PI;
}

export class DoublePendulumSystem {
  constructor(count = 10, maxTrailLength = 450) {
    this.count = count;
    this.maxTrailLength = maxTrailLength;
    this.pendulums = [];
    this.g = 9.81;
    this.l1 = 1.0;
    this.l2 = 1.0;
    this.m1 = 1.0;
    this.m2 = 1.0;
    this.damping = 0.00008;
    this.initialTheta1 = Math.PI / 2;
    this.initialTheta2 = Math.PI / 2;
  }

  /**
   * Initializes a swarm of double pendulums with microscopic initial angle differences.
   * @param {number} theta1 - Initial angle of the first arm (radians)
   * @param {number} theta2 - Initial angle of the second arm (radians)
   * @param {number} count - Number of pendulums in the swarm
   * @param {number} delta - Per-pendulum angle offset (radians)
   */
  init(theta1 = Math.PI / 2, theta2 = Math.PI / 2, count = 10, delta = 0.0001) {
    this.count = count;
    this.initialTheta1 = theta1;
    this.initialTheta2 = theta2;
    this.pendulums = [];

    for (let i = 0; i < count; i++) {
      const offset = i * delta;
      this.pendulums.push({
        id: i,
        theta1: theta1 + offset,
        theta2: theta2 + offset,
        omega1: 0,
        omega2: 0,
        trail: new TrailBuffer(this.maxTrailLength)
      });
    }
  }

  /**
   * Automatically re-energizes the pendulum swarm if they settle at static rest,
   * restoring full dynamic chaotic swinging when friction is lowered or gravity changed.
   */
  perturbIfStalled(force = false) {
    const isStalled = force || this.pendulums.every(p => {
      const spd = Math.abs(p.omega1) + Math.abs(p.omega2);
      const nearBottom = Math.abs(p.theta1) < 0.2 && Math.abs(p.theta2) < 0.2;
      return spd < 0.05 && nearBottom;
    });

    if (isStalled) {
      for (let i = 0; i < this.pendulums.length; i++) {
        const p = this.pendulums[i];
        const offset = i * 0.0001;
        p.theta1 = this.initialTheta1 + offset;
        p.theta2 = this.initialTheta2 + offset;
        p.omega1 = 0;
        p.omega2 = 0;
        p.trail = new TrailBuffer(this.maxTrailLength);
      }
    }
  }

  /**
   * Computes angular accelerations from the Lagrangian equations of motion.
   * @returns {number[]} [alpha1, alpha2] angular accelerations
   */
  derivatives(t1, t2, w1, w2) {
    const { g, l1, l2, m1, m2 } = this;
    const delta = t1 - t2;

    const den = 2 * m1 + m2 - m2 * Math.cos(2 * t1 - 2 * t2);
    if (Math.abs(den) < 1e-9) {
      return [0, 0];
    }

    const num1 =
      -g * (2 * m1 + m2) * Math.sin(t1) -
      m2 * g * Math.sin(t1 - 2 * t2) -
      2 * Math.sin(delta) * m2 * (w2 * w2 * l2 + w1 * w1 * l1 * Math.cos(delta));

    const alpha1 = num1 / (l1 * den);

    const num2 =
      2 * Math.sin(delta) *
      (w1 * w1 * l1 * (m1 + m2) +
        g * (m1 + m2) * Math.cos(t1) +
        w2 * w2 * l2 * m2 * Math.cos(delta));

    const alpha2 = num2 / (l2 * den);

    if (!isFinite(alpha1) || !isFinite(alpha2)) {
      return [0, 0];
    }

    return [alpha1, alpha2];
  }

  /**
   * Advances a single pendulum by one RK4 step with validation and recovery.
   * @param {Object} p - Pendulum state object
   * @param {number} dt - Time step
   */
  rk4Step(p, dt) {
    // Sanity check before step
    if (!isFinite(p.theta1) || !isFinite(p.theta2) || !isFinite(p.omega1) || !isFinite(p.omega2) ||
        Math.abs(p.omega1) > 200 || Math.abs(p.omega2) > 200) {
      const offset = p.id * 0.0001;
      p.theta1 = this.initialTheta1 + offset;
      p.theta2 = this.initialTheta2 + offset;
      p.omega1 = 0;
      p.omega2 = 0;
      p.trail = new TrailBuffer(this.maxTrailLength);
      return;
    }

    const { theta1, theta2, omega1, omega2 } = p;

    const [a1_k1, a2_k1] = this.derivatives(theta1, theta2, omega1, omega2);

    const t1_k2 = theta1 + 0.5 * dt * omega1;
    const t2_k2 = theta2 + 0.5 * dt * omega2;
    const w1_k2 = omega1 + 0.5 * dt * a1_k1;
    const w2_k2 = omega2 + 0.5 * dt * a2_k1;
    const [a1_k2, a2_k2] = this.derivatives(t1_k2, t2_k2, w1_k2, w2_k2);

    const t1_k3 = theta1 + 0.5 * dt * w1_k2;
    const t2_k3 = theta2 + 0.5 * dt * w2_k2;
    const w1_k3 = omega1 + 0.5 * dt * a1_k2;
    const w2_k3 = omega2 + 0.5 * dt * a2_k2;
    const [a1_k3, a2_k3] = this.derivatives(t1_k3, t2_k3, w1_k3, w2_k3);

    const t1_k4 = theta1 + dt * w1_k3;
    const t2_k4 = theta2 + dt * w2_k3;
    const w1_k4 = omega1 + dt * a1_k3;
    const w2_k4 = omega2 + dt * a2_k3;
    const [a1_k4, a2_k4] = this.derivatives(t1_k4, t2_k4, w1_k4, w2_k4);

    p.theta1 += (dt / 6.0) * (omega1 + 2 * w1_k2 + 2 * w1_k3 + w1_k4);
    p.theta2 += (dt / 6.0) * (omega2 + 2 * w2_k2 + 2 * w2_k3 + w2_k4);
    p.omega1 += (dt / 6.0) * (a1_k1 + 2 * a1_k2 + 2 * a1_k3 + a1_k4);
    p.omega2 += (dt / 6.0) * (a2_k1 + 2 * a2_k2 + 2 * a2_k3 + a2_k4);

    p.omega1 *= Math.max(0, 1 - this.damping);
    p.omega2 *= Math.max(0, 1 - this.damping);

    // Keep velocities in a stable bounded range
    const maxOmega = 80.0;
    p.omega1 = Math.max(-maxOmega, Math.min(maxOmega, p.omega1));
    p.omega2 = Math.max(-maxOmega, Math.min(maxOmega, p.omega2));

    // Wrap angles to avoid numerical precision loss
    p.theta1 = wrapAngle(p.theta1);
    p.theta2 = wrapAngle(p.theta2);
  }

  /**
   * Advances all pendulums by one frame using adaptive sub-stepping for extreme stability.
   * @param {number} dt - Total frame time step
   * @param {number} baseSubsteps - Minimum sub-steps
   */
  update(dt = 0.02, baseSubsteps = 16) {
    // Dynamically increase substeps for high gravity or fast velocity to prevent RK4 divergence
    let maxSpeed = 0;
    for (let i = 0; i < this.pendulums.length; i++) {
      const p = this.pendulums[i];
      const spd = Math.max(Math.abs(p.omega1), Math.abs(p.omega2));
      if (spd > maxSpeed) maxSpeed = spd;
    }

    // If friction was lowered and pendulums are stopped, wake them back up
    if (maxSpeed < 0.01 && this.damping < 0.0008) {
      this.perturbIfStalled();
    }

    const gravityFactor = Math.max(1, Math.ceil(this.g / 5));
    const speedFactor = Math.max(1, Math.ceil(maxSpeed / 10));
    const substeps = Math.min(64, Math.max(baseSubsteps, gravityFactor * 8, speedFactor * 8));
    const subDt = dt / substeps;

    for (let s = 0; s < substeps; s++) {
      for (let i = 0; i < this.pendulums.length; i++) {
        this.rk4Step(this.pendulums[i], subDt);
      }
    }

    // Record outer bob positions for trail rendering
    for (let i = 0; i < this.pendulums.length; i++) {
      const p = this.pendulums[i];
      const x1 = this.l1 * Math.sin(p.theta1);
      const y1 = this.l1 * Math.cos(p.theta1);
      const x2 = x1 + this.l2 * Math.sin(p.theta2);
      const y2 = y1 + this.l2 * Math.cos(p.theta2);

      p.trail.push({ x: x2, y: y2, x1, y1 });
    }
  }

  getPendulums() {
    return this.pendulums;
  }
}
