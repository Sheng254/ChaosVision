/**
 * 4th-Order Runge-Kutta (RK4) Numerical Integrator & Particle Trajectory Engine
 * High-precision integration for continuous dynamical systems.
 */

export class RK4Integrator {
  /**
   * Performs a single 4th-order Runge-Kutta integration step.
   * @param {Function} derivativeFn - Function (state, params) => [dx/dt, dy/dt, dz/dt]
   * @param {Array<number>} state - Current [x, y, z] state
   * @param {number} dt - Time step
   * @param {Object} params - System parameters
   * @returns {Array<number>} Next [x, y, z] state
   */
  static step(derivativeFn, state, dt, params) {
    const [x, y, z] = state;

    // k1 = f(y_n)
    const k1 = derivativeFn([x, y, z], params);

    // k2 = f(y_n + 0.5 * dt * k1)
    const s2 = [
      x + 0.5 * dt * k1[0],
      y + 0.5 * dt * k1[1],
      z + 0.5 * dt * k1[2]
    ];
    const k2 = derivativeFn(s2, params);

    // k3 = f(y_n + 0.5 * dt * k2)
    const s3 = [
      x + 0.5 * dt * k2[0],
      y + 0.5 * dt * k2[1],
      z + 0.5 * dt * k2[2]
    ];
    const k3 = derivativeFn(s3, params);

    // k4 = f(y_n + dt * k3)
    const s4 = [
      x + dt * k3[0],
      y + dt * k3[1],
      z + dt * k3[2]
    ];
    const k4 = derivativeFn(s4, params);

    // y_{n+1} = y_n + (dt/6) * (k1 + 2*k2 + 2*k3 + k4)
    return [
      x + (dt / 6.0) * (k1[0] + 2.0 * k2[0] + 2.0 * k3[0] + k4[0]),
      y + (dt / 6.0) * (k1[1] + 2.0 * k2[1] + 2.0 * k3[1] + k4[1]),
      z + (dt / 6.0) * (k1[2] + 2.0 * k2[2] + 2.0 * k3[2] + k4[2])
    ];
  }
}

/**
 * Manages a swarm of trajectories for continuous 3D strange attractors.
 */
export class TrajectorySwarm {
  constructor(capacity = 5, maxTrailLength = 500) {
    this.capacity = capacity;
    this.maxTrailLength = maxTrailLength;
    this.trajectories = [];
    this.initialPerturbation = 1e-4;
  }

  /**
   * Initializes trajectories with tiny initial condition offsets to demonstrate chaos.
   * @param {Array<number>} baseInitial - [x0, y0, z0]
   * @param {number} count - Number of trajectories
   */
  init(baseInitial = [0.1, 0.0, 0.0], count = 3) {
    this.capacity = count;
    this.trajectories = [];

    for (let i = 0; i < count; i++) {
      // Perturb slightly along x, y, or z
      const offset = (i === 0) ? 0 : this.initialPerturbation * i;
      const state = [
        baseInitial[0] + offset,
        baseInitial[1] + offset * 0.5,
        baseInitial[2] + offset * 0.25
      ];

      this.trajectories.push({
        id: i,
        state: state,
        trail: [state.slice()],
        speed: 0,
        divergence: 0
      });
    }
  }

  /**
   * Updates all trajectories by one or multiple steps.
   * @param {Function} derivativeFn - Derivative function
   * @param {number} dt - Time step
   * @param {Object} params - System parameters
   * @param {number} stepsPerFrame - Sub-steps for smoothness
   */
  update(derivativeFn, dt, params, stepsPerFrame = 4) {
    for (let s = 0; s < stepsPerFrame; s++) {
      for (let i = 0; i < this.trajectories.length; i++) {
        const traj = this.trajectories[i];
        const nextState = RK4Integrator.step(derivativeFn, traj.state, dt, params);

        // Calculate instantaneous speed
        const dx = nextState[0] - traj.state[0];
        const dy = nextState[1] - traj.state[1];
        const dz = nextState[2] - traj.state[2];
        traj.speed = Math.sqrt(dx * dx + dy * dy + dz * dz) / dt;

        traj.state = nextState;
        traj.trail.push(nextState);

        if (traj.trail.length > this.maxTrailLength) {
          traj.trail.shift();
        }
      }
    }

    // Compute divergence relative to the primary trajectory (id 0)
    if (this.trajectories.length > 1) {
      const baseState = this.trajectories[0].state;
      for (let i = 1; i < this.trajectories.length; i++) {
        const otherState = this.trajectories[i].state;
        const dist = Math.sqrt(
          Math.pow(otherState[0] - baseState[0], 2) +
          Math.pow(otherState[1] - baseState[1], 2) +
          Math.pow(otherState[2] - baseState[2], 2)
        );
        this.trajectories[i].divergence = dist;
      }
    }
  }

  getTrajectories() {
    return this.trajectories;
  }
}
