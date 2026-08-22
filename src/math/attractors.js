/**
 * Comprehensive Catalog of Strange Attractors and Dynamical Systems
 * Enriched with educational parameter descriptions and descriptive titles.
 */

export const ATTRACTORS_3D = {
  lorenz: {
    id: 'lorenz',
    name: 'Lorenz Attractor',
    category: '3D Continuous',
    author: 'Edward Lorenz (1963)',
    description: 'The foundational model of deterministic chaos representing atmospheric convection.',
    initialState: [0.1, 0.0, 0.0],
    scale: 12.5,
    center: [0, 0, 24],
    defaultDt: 0.006,
    defaultParams: {
      sigma: 10.0,
      rho: 28.0,
      beta: 2.666667
    },
    paramRanges: {
      sigma: {
        min: 0.1,
        max: 30.0,
        step: 0.1,
        label: 'σ · Fluid Viscosity',
        description: 'Prandtl number (viscous drag vs. thermal diffusion). Higher values stretch and accelerate the butterfly wings.'
      },
      rho: {
        min: 0.1,
        max: 60.0,
        step: 0.5,
        label: 'ρ · Atmospheric Heat',
        description: 'Rayleigh number (temperature difference). Values > 24.7 create chaos; sliding < 24.0 freezes into a calm point.'
      },
      beta: {
        min: 0.1,
        max: 10.0,
        step: 0.05,
        label: 'β · Convection Aspect Ratio',
        description: 'Geometric height-to-width ratio of the atmospheric convection rolls.'
      }
    },
    derivative: ([x, y, z], { sigma, rho, beta }) => [
      sigma * (y - x),
      x * (rho - z) - y,
      x * y - beta * z
    ]
  },

  aizawa: {
    id: 'aizawa',
    name: 'Aizawa Attractor',
    category: '3D Continuous',
    author: 'Yoji Aizawa (1983)',
    description: 'Mesmerizing spherical structure with a central rotating vortex axis and toroidal orbits.',
    initialState: [0.1, 0.0, 0.0],
    scale: 150.0,
    center: [0, 0, 0.65],
    defaultDt: 0.008,
    defaultParams: {
      a: 0.95,
      b: 0.7,
      c: 0.6,
      d: 3.5,
      e: 0.25,
      f: 0.1
    },
    paramRanges: {
      a: {
        min: 0.1,
        max: 2.0,
        step: 0.01,
        label: 'a · Vertical Growth',
        description: 'Vertical expansion rate. Controls the height of the outer spherical shell.'
      },
      b: {
        min: 0.1,
        max: 1.5,
        step: 0.01,
        label: 'b · Rotation Frequency',
        description: 'Harmonic orbital frequency of the outer wrapping shells.'
      },
      c: {
        min: 0.0,
        max: 1.5,
        step: 0.01,
        label: 'c · Z-Axis Lift',
        description: 'Constant vertical lift pulling trajectories upward from the bottom pole.'
      },
      d: {
        min: 0.5,
        max: 6.0,
        step: 0.05,
        label: 'd · Vortex Spin Speed',
        description: 'Spindle spin rate. Higher values tighten the central tornado spine and spin the outer sphere faster.'
      },
      e: {
        min: 0.0,
        max: 1.0,
        step: 0.01,
        label: 'e · Radial Coupling',
        description: 'Couples horizontal width with vertical height, shaping the spherical bulb.'
      },
      f: {
        min: 0.0,
        max: 0.5,
        step: 0.01,
        label: 'f · Cubic Nonlinearity',
        description: 'High-order non-linear distortion warping the equator of the sphere.'
      }
    },
    derivative: ([x, y, z], { a, b, c, d, e, f }) => [
      (z - b) * x - d * y,
      d * x + (z - b) * y,
      c + a * z - (z * z * z) / 3.0 - (x * x + y * y) * (1.0 + e * z) + f * z * (x * x * x)
    ]
  },

  thomas: {
    id: 'thomas',
    name: 'Thomas Labyrinth',
    category: '3D Continuous',
    author: 'René Thomas (1999)',
    description: 'Cyclically symmetric strange attractor with 3D labyrinthine chaotic trajectories.',
    initialState: [0.1, 1.0, 0.0],
    scale: 60.0,
    center: [0, 0, 0],
    defaultDt: 0.03,
    defaultParams: {
      b: 0.208186
    },
    paramRanges: {
      b: {
        min: 0.05,
        max: 0.35,
        step: 0.001,
        label: 'b · Energy Damping',
        description: 'Friction coefficient. When low (~0.208), particles navigate an infinite 3D maze. Values > 0.32 freeze motion.'
      }
    },
    derivative: ([x, y, z], { b }) => [
      Math.sin(y) - b * x,
      Math.sin(z) - b * y,
      Math.sin(x) - b * z
    ]
  },

  rossler: {
    id: 'rossler',
    name: 'Rössler Attractor',
    category: '3D Continuous',
    author: 'Otto Rössler (1976)',
    description: 'Continuous dynamical system designed to simplify the Lorenz attractor with a Möbius-like fold.',
    initialState: [0.1, 0.0, 0.0],
    scale: 12.0,
    center: [0, 0, 9],
    defaultDt: 0.015,
    defaultParams: {
      a: 0.2,
      b: 0.2,
      c: 5.7
    },
    paramRanges: {
      a: {
        min: 0.05,
        max: 0.5,
        step: 0.01,
        label: 'a · Spiral Outward Rate',
        description: 'Speed at which planar spiral loops expand outward from the center.'
      },
      b: {
        min: 0.05,
        max: 0.5,
        step: 0.01,
        label: 'b · Center Offset',
        description: 'Center equilibrium offset of the flat rotation plane.'
      },
      c: {
        min: 2.0,
        max: 14.0,
        step: 0.1,
        label: 'c · Fold / Catapult Height',
        description: 'Critical threshold that catapults outer loops vertically before folding them back down.'
      }
    },
    derivative: ([x, y, z], { a, b, c }) => [
      -y - z,
      x + a * y,
      b + z * (x - c)
    ]
  },

  chen: {
    id: 'chen',
    name: 'Chen System',
    category: '3D Continuous',
    author: 'Guanrong Chen (1999)',
    description: 'Dual-scroll chaotic attractor with complex topological vortex manifolds.',
    initialState: [-0.1, 0.5, -0.6],
    scale: 8.0,
    center: [0, 0, 20],
    defaultDt: 0.004,
    defaultParams: {
      a: 35.0,
      b: 3.0,
      c: 28.0
    },
    paramRanges: {
      a: {
        min: 20.0,
        max: 50.0,
        step: 0.5,
        label: 'a · Dual Vortex Strength',
        description: 'Controls the attraction velocity pulling orbits into both hyperbolic vortex hubs.'
      },
      b: {
        min: 1.0,
        max: 6.0,
        step: 0.1,
        label: 'b · Vertical Dissipation',
        description: 'Damping along the central Z-axis bridge connecting the two scrolls.'
      },
      c: {
        min: 15.0,
        max: 40.0,
        step: 0.5,
        label: 'c · Cross-Scroll Coupling',
        description: 'Instability strength that forces orbits to jump across the dual scrolls.'
      }
    },
    derivative: ([x, y, z], { a, b, c }) => [
      a * (y - x),
      (c - a) * x - x * z + c * y,
      x * y - b * z
    ]
  },

  halvorsen: {
    id: 'halvorsen',
    name: 'Halvorsen Attractor',
    category: '3D Continuous',
    author: 'Halvorsen (1889)',
    description: 'Tri-symmetric cyclic chaotic structure with intertwining orbital wings.',
    initialState: [-1.48, -1.24, -1.0],
    scale: 18.0,
    center: [0, 0, 0],
    defaultDt: 0.006,
    defaultParams: {
      a: 1.89
    },
    paramRanges: {
      a: {
        min: 1.2,
        max: 2.5,
        step: 0.01,
        label: 'a · Tri-Wing Friction',
        description: 'Symmetric dissipation. Lower values expand the 3 cyclic leaves into a wide, luminous knot.'
      }
    },
    derivative: ([x, y, z], { a }) => [
      -a * x - 4.0 * y - 4.0 * z - y * y,
      -a * y - 4.0 * z - 4.0 * x - z * z,
      -a * z - 4.0 * x - 4.0 * y - x * x
    ]
  }
};

export const ATTRACTORS_2D = {
  clifford: {
    id: 'clifford',
    name: 'Clifford Attractor',
    category: '2D Discrete Map',
    author: 'Clifford Pickover (1988)',
    description: 'Iterated sine and cosine map yielding intricate smoke-like topological density ribbons.',
    defaultParams: {
      a: -1.4,
      b: 1.6,
      c: 1.0,
      d: 0.7
    },
    paramRanges: {
      a: {
        min: -3.0,
        max: 3.0,
        step: 0.05,
        label: 'a · X-Wave Phase',
        description: 'Primary horizontal sinusoidal frequency. Unravels and twists the gossamer filaments.'
      },
      b: {
        min: -3.0,
        max: 3.0,
        step: 0.05,
        label: 'b · Y-Wave Phase',
        description: 'Primary vertical sinusoidal frequency. Controls vertical ribbon curvature.'
      },
      c: {
        min: -3.0,
        max: 3.0,
        step: 0.05,
        label: 'c · X-Harmonic Weight',
        description: 'Amplitude of the horizontal cosine harmonic term.'
      },
      d: {
        min: -3.0,
        max: 3.0,
        step: 0.05,
        label: 'd · Y-Harmonic Weight',
        description: 'Amplitude of the vertical cosine harmonic term.'
      }
    },
    scale: 0.20,
    iterate: (x, y, { a, b, c, d }) => [
      Math.sin(a * y) + c * Math.cos(a * x),
      Math.sin(b * x) + d * Math.cos(b * y)
    ]
  },

  dejong: {
    id: 'dejong',
    name: 'Peter de Jong Attractor',
    category: '2D Discrete Map',
    author: 'Peter de Jong (1991)',
    description: 'Harmonic difference mapping generating crystalline geometric chaos with silk-like depth.',
    defaultParams: {
      a: 1.4,
      b: -2.3,
      c: 2.4,
      d: -2.1
    },
    paramRanges: {
      a: {
        min: -3.0,
        max: 3.0,
        step: 0.05,
        label: 'a · Primary X Frequency',
        description: 'Tuning of the first trigonometric difference component.'
      },
      b: {
        min: -3.0,
        max: 3.0,
        step: 0.05,
        label: 'b · X-Fold Frequency',
        description: 'Interference frequency that stretches and pleats the translucent silk sheet.'
      },
      c: {
        min: -3.0,
        max: 3.0,
        step: 0.05,
        label: 'c · Primary Y Frequency',
        description: 'Tuning of the second trigonometric difference component.'
      },
      d: {
        min: -3.0,
        max: 3.0,
        step: 0.05,
        label: 'd · Y-Fold Frequency',
        description: 'Interference frequency that opens and closes geometric flower petals.'
      }
    },
    scale: 0.20,
    iterate: (x, y, { a, b, c, d }) => [
      Math.sin(a * y) - Math.cos(b * x),
      Math.sin(c * x) - Math.cos(d * y)
    ]
  },

  tinkerbell: {
    id: 'tinkerbell',
    name: 'Tinkerbell Map',
    category: '2D Discrete Map',
    author: 'Nusse & Yorke (1998)',
    description: 'Chaotic quadratic polynomial map whose trajectory resembles the trajectory of a fluttering fairy.',
    defaultParams: {
      a: 0.9,
      b: -0.6013,
      c: 2.0,
      d: 0.5
    },
    paramRanges: {
      a: {
        min: 0.1,
        max: 1.5,
        step: 0.01,
        label: 'a · Horizontal Wing Spread',
        description: 'Linear horizontal drift spreading the fairy wings outward.'
      },
      b: {
        min: -1.0,
        max: 0.0,
        step: 0.01,
        label: 'b · Wing Stability',
        description: 'Crucial stability threshold. Values below -0.62 shatter the wings into chaotic dispersion.'
      },
      c: {
        min: 0.5,
        max: 3.0,
        step: 0.05,
        label: 'c · Cross-Shear Coupling',
        description: 'Coupling between horizontal and vertical polynomial terms.'
      },
      d: {
        min: 0.1,
        max: 1.0,
        step: 0.01,
        label: 'd · Vertical Drift',
        description: 'Vertical damping coefficient preserving flight stability.'
      }
    },
    scale: 0.28,
    iterate: (x, y, { a, b, c, d }) => [
      x * x - y * y + a * x + b * y,
      2 * x * y + c * x + d * y
    ]
  },

  ikeda: {
    id: 'ikeda',
    name: 'Ikeda Map',
    category: '2D Discrete Map',
    author: 'Kensuke Ikeda (1979)',
    description: 'Models a pulse of light traversing a nonlinear optical resonator containing a ring cavity.',
    defaultParams: {
      u: 0.9,
      k: 0.4,
      p: 6.0
    },
    paramRanges: {
      u: {
        min: 0.5,
        max: 0.99,
        step: 0.01,
        label: 'u · Laser Mirror Reflectivity',
        description: 'Cavity mirror reflectivity. Higher values sustain swirling optical chaotic spirals.'
      },
      k: {
        min: 0.1,
        max: 1.0,
        step: 0.05,
        label: 'k · Linear Phase Delay',
        description: 'Constant optical phase delay through the ring resonator.'
      },
      p: {
        min: 1.0,
        max: 10.0,
        step: 0.2,
        label: 'p · Intensity Refraction',
        description: 'Nonlinear refractive index power. Drives high-intensity laser pulse self-focusing.'
      }
    },
    scale: 0.38,
    iterate: (x, y, { u, k, p }) => {
      const t = k - p / (1.0 + x * x + y * y);
      return [
        1.0 + u * (x * Math.cos(t) - y * Math.sin(t)),
        u * (x * Math.sin(t) + y * Math.cos(t))
      ];
    }
  },

  gumowski: {
    id: 'gumowski',
    name: 'Gumowski-Mira Map',
    category: '2D Discrete Map',
    author: 'Igor Gumowski & Christian Mira (1980)',
    description: 'Non-invertible 2D mapping originating from high-energy accelerator particle physics at CERN.',
    defaultParams: {
      alpha: 0.008,
      beta: 0.05,
      mu: -0.49
    },
    paramRanges: {
      alpha: {
        min: -0.1,
        max: 0.1,
        step: 0.001,
        label: 'α · Beam Perturbation',
        description: 'Relativistic synchrotron beam trajectory perturbation.'
      },
      beta: {
        min: -0.1,
        max: 0.1,
        step: 0.005,
        label: 'β · Nonlinear Dispersion',
        description: 'Quadratic damping factor stabilizing particle accelerator beam dispersion.'
      },
      mu: {
        min: -1.0,
        max: 1.0,
        step: 0.01,
        label: 'μ · Stability Island Bifurcation',
        description: 'Critical stability multiplier. Splits single particle orbits into intricate multi-island dendrites.'
      }
    },
    scale: 0.035,
    iterate: (x, y, { alpha, beta, mu }) => {
      const f = (val) => mu * val + (2.0 * (1.0 - mu) * val * val) / (1.0 + val * val);
      const nextX = y + alpha * (1.0 - beta * y * y) * y + f(x);
      const nextY = -x + f(nextX);
      return [nextX, nextY];
    }
  }
};
