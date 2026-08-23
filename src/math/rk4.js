/**
 * 4th-Order Runge-Kutta integrator and particle trajectory swarm.
 */

/**
 * Fixed-capacity circular buffer for trajectory trail points.
 * Provides O(1) push instead of the O(N) Array.shift() approach.
 */
export class TrailBuffer {
  constructor(capacity) {
    this.capacity = capacity;
    this._buf = new Array(capacity);
    this._head = 0; // next write index
    this._size = 0;
  }

  push(item) {
    this._buf[this._head] = item;
    this._head = (this._head + 1) % this.capacity;
    if (this._size < this.capacity) this._size++;
  }

  /** Returns the element at logical index i (0 = oldest entry). */
  get(i) {
    const start = this._size < this.capacity ? 0 : this._head;
    return this._buf[(start + i) % this.capacity];
  }

  get length() {
    return this._size;
  }

  map(fn) {
    const result = new Array(this._size);
    for (let i = 0; i < this._size; i++) {
      result[i] = fn(this.get(i), i);
    }
    return result;
  }

  forEach(fn) {
    for (let i = 0; i < this._size; i++) {
      fn(this.get(i), i);
    }
  }
}

export class RK4Integrator {
  /**
   * Performs a single 4th-order Runge-Kutta integration step.
   * @param {Function} derivativeFn - (state, params) => [dx/dt, dy/dt, dz/dt]
   * @param {number[]} state - Current [x, y, z] state vector
   * @param {number} dt - Time step
   * @param {Object} params - System parameters
   * @returns {number[]} Next [x, y, z] state vector
   */
  static step(derivativeFn, state, dt, params) {
    const [x, y, z] = state;

    const k1 = derivativeFn([x, y, z], params);

    const s2 = [
      x + 0.5 * dt * k1[0],
      y + 0.5 * dt * k1[1],
      z + 0.5 * dt * k1[2]
    ];
    const k2 = derivativeFn(s2, params);

    const s3 = [
      x + 0.5 * dt * k2[0],
      y + 0.5 * dt * k2[1],
      z + 0.5 * dt * k2[2]
    ];
    const k3 = derivativeFn(s3, params);

    const s4 = [
      x + dt * k3[0],
      y + dt * k3[1],
      z + dt * k3[2]
    ];
    const k4 = derivativeFn(s4, params);

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
   * Initializes trajectories with small initial-condition offsets to demonstrate sensitivity.
   * @param {number[]} baseInitial - Base [x0, y0, z0] state
   * @param {number} count - Number of parallel trajectories
   */
  init(baseInitial = [0.1, 0.0, 0.0], count = 3) {
    this.baseInitial = baseInitial ? baseInitial.slice() : [0.1, 0.0, 0.0];
    this.capacity = count;
    this.trajectories = [];

    for (let i = 0; i < count; i++) {
      const offset = i === 0 ? 0 : this.initialPerturbation * i;
      const state = [
        this.baseInitial[0] + offset,
        this.baseInitial[1] + offset * 0.5,
        this.baseInitial[2] + offset * 0.25
      ];

      this.trajectories.push({
        id: i,
        state: state,
        trail: new TrailBuffer(this.maxTrailLength),
        speed: 0,
        divergence: 0
      });

      this.trajectories[this.trajectories.length - 1].trail.push(state.slice());
    }
  }

  /**
   * Advances all trajectories by one or more integration sub-steps.
   * @param {Function} derivativeFn - Derivative function for the system
   * @param {number} dt - Time step per sub-step
   * @param {Object} params - System parameters
   * @param {number} stepsPerFrame - Number of sub-steps per frame
   */
  update(derivativeFn, dt, params, stepsPerFrame = 4) {
    for (let s = 0; s < stepsPerFrame; s++) {
      for (let i = 0; i < this.trajectories.length; i++) {
        const traj = this.trajectories[i];
        const prev = traj.state;
        const nextState = RK4Integrator.step(derivativeFn, prev, dt, params);

        // Auto-recover if trajectory encountered NaN, Infinity, or overflow
        if (!isFinite(nextState[0]) || !isFinite(nextState[1]) || !isFinite(nextState[2]) ||
            Math.abs(nextState[0]) > 5e3 || Math.abs(nextState[1]) > 5e3 || Math.abs(nextState[2]) > 5e3) {
          const offset = i === 0 ? 0 : this.initialPerturbation * i;
          const base = this.baseInitial || [0.1, 0.0, 0.0];
          traj.state = [base[0] + offset, base[1] + offset * 0.5, base[2] + offset * 0.25];
          traj.trail = new TrailBuffer(this.maxTrailLength);
          traj.trail.push(traj.state.slice());
          traj.speed = 0;
          continue;
        }

        const dx = nextState[0] - prev[0];
        const dy = nextState[1] - prev[1];
        const dz = nextState[2] - prev[2];
        traj.speed = Math.sqrt(dx * dx + dy * dy + dz * dz) / dt;

        traj.state = nextState;
        traj.trail.push(nextState);
      }
    }

    // Compute distance from the primary trajectory (index 0)
    if (this.trajectories.length > 1) {
      const baseState = this.trajectories[0].state;
      for (let i = 1; i < this.trajectories.length; i++) {
        const other = this.trajectories[i].state;
        const dist = Math.sqrt(
          Math.pow(other[0] - baseState[0], 2) +
          Math.pow(other[1] - baseState[1], 2) +
          Math.pow(other[2] - baseState[2], 2)
        );
        this.trajectories[i].divergence = dist;
      }
    }
  }

  getTrajectories() {
    return this.trajectories;
  }
}
