/**
 * Double Pendulum Dynamical Physics Engine with Lagrangian Mechanics
 * High-precision RK4 solver with 16 substeps per frame for buttery smooth simulation.
 */

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
    this.trailLength = maxTrailLength;
  }

  /**
   * Initializes a swarm of double pendulums with microscopic initial angle differences.
   */
  init(theta1 = Math.PI / 2, theta2 = Math.PI / 2, count = 10, delta = 0.0001) {
    this.count = count;
    this.pendulums = [];

    for (let i = 0; i < count; i++) {
      const offset = i * delta;
      this.pendulums.push({
        id: i,
        theta1: theta1 + offset,
        theta2: theta2 + offset,
        omega1: 0,
        omega2: 0,
        trail: []
      });
    }
  }

  /**
   * Evaluates angular accelerations using Lagrangian equations of motion.
   */
  derivatives(t1, t2, w1, w2) {
    const { g, l1, l2, m1, m2 } = this;
    const delta = t1 - t2;

    const den = 2 * m1 + m2 - m2 * Math.cos(2 * t1 - 2 * t2);

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

    return [alpha1, alpha2];
  }

  /**
   * RK4 Step for a single pendulum.
   */
  rk4Step(p, dt) {
    const { theta1, theta2, omega1, omega2 } = p;

    // k1
    const [a1_k1, a2_k1] = this.derivatives(theta1, theta2, omega1, omega2);

    // k2
    const t1_k2 = theta1 + 0.5 * dt * omega1;
    const t2_k2 = theta2 + 0.5 * dt * omega2;
    const w1_k2 = omega1 + 0.5 * dt * a1_k1;
    const w2_k2 = omega2 + 0.5 * dt * a2_k1;
    const [a1_k2, a2_k2] = this.derivatives(t1_k2, t2_k2, w1_k2, w2_k2);

    // k3
    const t1_k3 = theta1 + 0.5 * dt * w1_k2;
    const t2_k3 = theta2 + 0.5 * dt * w2_k2;
    const w1_k3 = omega1 + 0.5 * dt * a1_k2;
    const w2_k3 = omega2 + 0.5 * dt * a2_k2;
    const [a1_k3, a2_k3] = this.derivatives(t1_k3, t2_k3, w1_k3, w2_k3);

    // k4
    const t1_k4 = theta1 + dt * w1_k3;
    const t2_k4 = theta2 + dt * w2_k3;
    const w1_k4 = omega1 + dt * a1_k3;
    const w2_k4 = omega2 + dt * a2_k3;
    const [a1_k4, a2_k4] = this.derivatives(t1_k4, t2_k4, w1_k4, w2_k4);

    // Update state
    p.theta1 += (dt / 6.0) * (omega1 + 2 * w1_k2 + 2 * w1_k3 + w1_k4);
    p.theta2 += (dt / 6.0) * (omega2 + 2 * w2_k2 + 2 * w2_k3 + w2_k4);
    p.omega1 += (dt / 6.0) * (a1_k1 + 2 * a1_k2 + 2 * a1_k3 + a1_k4);
    p.omega2 += (dt / 6.0) * (a2_k1 + 2 * a2_k2 + 2 * a2_k3 + a2_k4);

    p.omega1 *= (1 - this.damping);
    p.omega2 *= (1 - this.damping);
  }

  /**
   * Updates all pendulums with 16 sub-steps for ultra-smooth continuous motion.
   */
  update(dt = 0.02, substeps = 16) {
    const subDt = dt / substeps;

    for (let s = 0; s < substeps; s++) {
      for (let i = 0; i < this.pendulums.length; i++) {
        const p = this.pendulums[i];
        this.rk4Step(p, subDt);
      }
    }

    // Record outer bob trajectory coordinates
    for (let i = 0; i < this.pendulums.length; i++) {
      const p = this.pendulums[i];
      const x1 = this.l1 * Math.sin(p.theta1);
      const y1 = this.l1 * Math.cos(p.theta1);
      const x2 = x1 + this.l2 * Math.sin(p.theta2);
      const y2 = y1 + this.l2 * Math.cos(p.theta2);

      p.trail.push({ x: x2, y: y2, x1, y1 });
      if (p.trail.length > this.trailLength) {
        p.trail.shift();
      }
    }
  }

  getPendulums() {
    return this.pendulums;
  }
}
