/**
 * World-Class Museum of Chaos & Dynamical Systems Exhibition Archive
 * Editorial science curation with structured, multi-line mathematical systems.
 */

export const MUSEUM_EXHIBITS = [
  {
    id: 'lorenz',
    title: 'The Butterfly Effect (Lorenz 1963)',
    subtitle: 'How a 3-Decimal Rounding Error Destroyed Determinism',
    author: 'Edward Lorenz (MIT Meteorologist, 1963)',
    category: '3D Continuous Strange Attractor',
    systemType: '3d_attractor',
    systemId: 'lorenz',
    palette: 'bioluminescence',
    dt: 0.006,
    speed: 1.0,
    trailDecay: 0.06,
    divergenceTrails: 3,
    camera: { rotX: 0.35, rotY: -0.6, panX: 0, panY: 0, zoom: 1.0 },
    params: { sigma: 10.0, rho: 28.0, beta: 2.666667 },
    
    equations: [
      { lhs: 'dx / dt', rhs: 'σ(y - x)' },
      { lhs: 'dy / dt', rhs: 'x(ρ - z) - y' },
      { lhs: 'dz / dt', rhs: 'x·y - βz' }
    ],
    
    narrative: 'In the winter of 1961, meteorologist Edward Lorenz wanted to re-examine a computer weather simulation. Instead of typing the full 0.506127 from his printout, he entered 0.506 to save time. When he returned from coffee, the new forecast was completely opposite from the original. This revealed that deterministic equations can produce totally unpredictable outcomes: the "Butterfly Effect".',
    
    visualCue: 'Watch the glowing swarm trajectories right now. They orbit tightly together for several loops around one wing, then without warning, one trajectory leaps to the opposite wing while another stays behind. The two paths will never intersect or synchronize again.',
    
    experiment: 'Try this experiment: In the Dynamical Controls drawer on the left, slide ρ (Rayleigh Number) below 24.0. Watch the chaotic butterfly collapse into a calm, dead fixed point. Then slide ρ above 28.0 to watch chaos erupt again.',
    
    physicsBreakdown: 'σ (Prandtl number = fluid viscosity), ρ (Rayleigh number = temperature difference between top and bottom atmospheric air layers), β (geometric aspect ratio of the convection roll).',
    
    realWorldImpact: 'Overturned 300 years of Newtonian determinism (Laplace\'s Demon). Today, it dictates why weather forecasts are fundamentally limited to ~10 days and shapes turbulence control in jet engines.'
  },

  {
    id: 'aizawa',
    title: 'Celestial Inversion (Aizawa 1983)',
    subtitle: 'The Infinite Toroidal Vortex of Rotating Fluids',
    author: 'Yoji Aizawa (Kyoto University, 1983)',
    category: '3D Continuous Strange Attractor',
    systemType: '3d_attractor',
    systemId: 'aizawa',
    palette: 'cyberpunk',
    dt: 0.008,
    speed: 1.0,
    trailDecay: 0.05,
    divergenceTrails: 4,
    camera: { rotX: 0.5, rotY: 0.25, panX: 0, panY: 0, zoom: 1.1 },
    params: { a: 0.95, b: 0.7, c: 0.6, d: 3.5, e: 0.25, f: 0.1 },
    
    equations: [
      { lhs: 'dx / dt', rhs: '(z - b)x - dy' },
      { lhs: 'dy / dt', rhs: 'dx + (z - b)y' },
      { lhs: 'dz / dt', rhs: 'c + az - z³/3 - (x² + y²)(1 + ez) + fzx³' }
    ],
    
    narrative: 'While investigating how rotating fluid spheres transition from calm rhythm to turbulence, Japanese physicist Yoji Aizawa discovered this topological sphere. It acts like a magnetic celestial motor: pulling particle trajectories upward through an intense central tornado, flinging them outward along a sphere, and folding them back through the bottom.',
    
    visualCue: 'Rotate the camera to look straight down through the top pole. Notice the high-speed central vortex spine and the delicate onion-like layers wrapping around it.',
    
    experiment: 'Try this experiment: Drag parameter d (Vortex Speed) from 3.5 up to 5.5. Notice how the central vortex tightens into an intense laser-like spine and accelerates the outer toroidal shell.',
    
    physicsBreakdown: 'a controls vertical expansion rate, b tunes rotational frequency, d dictates vortex rotation speed, and e couples radial expansion with vertical height.',
    
    realWorldImpact: 'Directly mirrors the magnetohydrodynamics of solar flare ejection loops, stellar accretion disks around black holes, and fusion plasma containment in tokamaks.'
  },

  {
    id: 'thomas',
    title: 'Cyclic Labyrinth (Thomas 1999)',
    subtitle: 'The Frictionless Maze of Pure Symmetry',
    author: 'René Thomas (University of Brussels, 1999)',
    category: '3D Continuous Strange Attractor',
    systemType: '3d_attractor',
    systemId: 'thomas',
    palette: 'crtPhosphor',
    dt: 0.03,
    speed: 1.2,
    trailDecay: 0.05,
    divergenceTrails: 3,
    camera: { rotX: 0.6, rotY: 0.78, panX: 0, panY: 0, zoom: 0.95 },
    params: { b: 0.208186 },
    
    equations: [
      { lhs: 'dx / dt', rhs: 'sin(y) - bx' },
      { lhs: 'dy / dt', rhs: 'sin(z) - by' },
      { lhs: 'dz / dt', rhs: 'sin(x) - bz' }
    ],
    
    narrative: 'Theoretical biologist René Thomas sought to answer: "What is the simplest possible mathematical rule that can generate endless 3D chaos?" He eliminated complex polynomial math, using only pure sinusoidal sine waves with cyclic permutation (x to y to z) and a single dissipation damper b.',
    
    visualCue: 'Follow a single glowing particle head. Notice how it weaves through a 3D tubular lattice, constantly choosing between left, right, up, and down turns without ever repeating its history.',
    
    experiment: 'Try this experiment: Set parameter b to exactly 0.208186. This is the critical threshold where dissipation perfectly balances chaotic expansion. If you raise b to 0.32, all motion quickly freezes into a silent dead stop.',
    
    physicsBreakdown: 'b is the dissipation coefficient (friction). When b is small, energy cannot escape, driving particles through an infinite 3D labyrinth.',
    
    realWorldImpact: 'Models feedback inhibition loops in genetic regulatory networks, biological circadian rhythm stability, and multi-robot navigation through complex environments.'
  },

  {
    id: 'rossler',
    title: 'The Möbius Ribbon (Rössler 1976)',
    subtitle: 'The Taffy-Puller of Phase Space',
    author: 'Otto Rössler (Theoretical Biochemist, 1976)',
    category: '3D Continuous Strange Attractor',
    systemType: '3d_attractor',
    systemId: 'rossler',
    palette: 'solarFlare',
    dt: 0.015,
    speed: 1.1,
    trailDecay: 0.06,
    divergenceTrails: 3,
    camera: { rotX: 0.45, rotY: -0.4, panX: 0, panY: 0, zoom: 0.95 },
    params: { a: 0.2, b: 0.2, c: 5.7 },
    
    equations: [
      { lhs: 'dx / dt', rhs: '-y - z' },
      { lhs: 'dy / dt', rhs: 'x + ay' },
      { lhs: 'dz / dt', rhs: 'b + z(x - c)' }
    ],
    
    narrative: 'Biochemist Otto Rössler was inspired by a candy factory machine pulling and folding saltwater taffy. He wanted to strip away the dual wings of Lorenz to isolate the single, purest mechanism of chaos: stretching a flat sheet outward, twisting it upward, and folding it back down onto itself.',
    
    visualCue: 'Notice how particles start near the center and spiral outwards on a smooth 2D plate. Once they reach the critical outer edge, they suddenly get launched vertically, folded over, and reinjected into the center.',
    
    experiment: 'Try this experiment: Slide parameter c from 2.0 to 12.0. Watch the single periodic loop double into 2 loops, then 4 loops, then explode into full chaos (period-doubling cascade in 3D).',
    
    physicsBreakdown: 'x and y generate simple harmonic 2D rotation. The non-linear z term acts as a vertical catapult triggered only when x crosses threshold c.',
    
    realWorldImpact: 'Underpins the chemistry of oscillating reactions (Belousov-Zhabotinsky), cardiac electrical wave fibrillation, and secure chaotic encryption.'
  },

  {
    id: 'chen',
    title: 'Dual Vortex Core (Chen 1999)',
    subtitle: 'The Topological Dual of Atmospheric Convection',
    author: 'Guanrong Chen (Nonlinear Control Theorist, 1999)',
    category: '3D Continuous Strange Attractor',
    systemType: '3d_attractor',
    systemId: 'chen',
    palette: 'electricAmethyst',
    dt: 0.004,
    speed: 1.0,
    trailDecay: 0.06,
    divergenceTrails: 3,
    camera: { rotX: 0.4, rotY: 0.5, panX: 0, panY: 0, zoom: 0.9 },
    params: { a: 35.0, b: 3.0, c: 28.0 },
    
    equations: [
      { lhs: 'dx / dt', rhs: 'a(y - x)' },
      { lhs: 'dy / dt', rhs: '(c - a)x - xz + cy' },
      { lhs: 'dz / dt', rhs: 'xy - bz' }
    ],
    
    narrative: 'For decades, mathematicians believed all dual-scroll attractors were just trivial variations of Lorenz. In 1999, Guanrong Chen proved the existence of an entirely distinct dynamical class where the topological eigenvalues satisfy opposite conditions, unlocking a new frontier in chaos anti-control.',
    
    visualCue: 'Compare this to Lorenz: Chen has far denser, more violent spirals that wrap tightly around two hyperbolic focal lines before launching across the bridge.',
    
    experiment: 'Try this experiment: Increase parameter a to 45.0. Watch the two vortex hubs become razor sharp, increasing the Lyapunov divergence exponent.',
    
    physicsBreakdown: 'The cross-coupling term (c - a)x creates a strong repulsive saddle focus that forcefully repels trajectories between two swirling vortex basins.',
    
    realWorldImpact: 'Used in anti-control of chaos to stabilize power transmission grids during sudden load spikes and in synchronized secure telecommunication carriers.'
  },

  {
    id: 'halvorsen',
    title: 'Tri-Symmetric Vortex (Halvorsen 1889)',
    subtitle: 'The Hypnotic 3-Winged Cosmic Knot',
    author: 'Halvorsen System',
    category: '3D Continuous Strange Attractor',
    systemType: '3d_attractor',
    systemId: 'halvorsen',
    palette: 'infrared',
    dt: 0.006,
    speed: 1.0,
    trailDecay: 0.06,
    divergenceTrails: 3,
    camera: { rotX: 0.55, rotY: -0.65, panX: 0, panY: 0, zoom: 0.95 },
    params: { a: 1.89 },
    
    equations: [
      { lhs: 'dx / dt', rhs: '-ax - 4y - 4z - y²' },
      { lhs: 'dy / dt', rhs: '-ay - 4z - 4x - z²' },
      { lhs: 'dz / dt', rhs: '-az - 4x - 4y - x²' }
    ],
    
    narrative: 'What happens when three dimensions are perfectly democratic, governed by identical quadratic friction and rotational cross-talk? The Halvorsen system produces an intricate three-leaf clover of chaos with perfect 120-degree rotational symmetry.',
    
    visualCue: 'Watch how particles cycle through wing A, wing B, and wing C in an unpredictable permutation: A->B->C->B->A->C. It never settles into a repeating sequence.',
    
    experiment: 'Try this experiment: Adjust parameter a to 1.4. The three wings will dramatically expand and intertwine into a wide, luminous orbital knot.',
    
    physicsBreakdown: 'The -4 cross-terms couple all axes with equal weight, while the -y², -z², -x² quadratic nonlinearities fold the trajectory back inward.',
    
    realWorldImpact: 'Serves as an analytical model for 3-phase alternating current power network instability and multi-rotor aerodynamic vortex collisions.'
  },

  {
    id: 'clifford',
    title: 'Cosmic Smoke (Clifford Pickover 1988)',
    subtitle: 'Weaving Nebulae from Millions of Trigonometric Steps',
    author: 'Clifford Pickover (IBM Research & Author, 1988)',
    category: '2D Discrete Iterated Map',
    systemType: '2d_map',
    systemId: 'clifford',
    palette: 'electricAmethyst',
    speed: 1.0,
    trailDecay: 0.05,
    camera: { rotX: 0.25, rotY: -0.3, panX: 0, panY: 0, zoom: 1.0 },
    params: { a: -1.4, b: 1.6, c: 1.0, d: 0.7 },
    
    equations: [
      { lhs: 'x_{n+1}', rhs: 'sin(a·y_n) + c·cos(a·x_n)' },
      { lhs: 'y_{n+1}', rhs: 'sin(b·x_n) + d·cos(b·y_n)' }
    ],
    
    narrative: 'In 1988, author and IBM researcher Clifford Pickover explored what happens when you feed coordinate values through nested trigonometric sine and cosine functions millions of times. Rather than creating noise, the points settle onto razor-thin manifolds of infinite density.',
    
    visualCue: 'Left-click and drag on the screen to rotate and tilt the smoke sheet in 3D. Notice how the glowing fibers resemble transparent silk gossamer curtains.',
    
    experiment: 'Try this experiment: Gently nudge parameter a by 0.05. Watch the smoke ribbons instantly unravel, twist, and re-crystallize into completely new cosmic filaments.',
    
    physicsBreakdown: 'Trigonometric sine and cosine bound all points strictly within a finite frame, while nonlinear phase shifts create self-folding density ridges.',
    
    realWorldImpact: 'Pioneered algorithms for procedural texture synthesis, steganography (hiding data in visual noise), and galactic stellar cluster modeling.'
  },

  {
    id: 'dejong',
    title: 'Harmonic Silk (Peter de Jong 1991)',
    subtitle: 'Photographic Fractal Complexity from 4 Numbers',
    author: 'Peter de Jong (Digital Artist & Mathematician, 1991)',
    category: '2D Discrete Iterated Map',
    systemType: '2d_map',
    systemId: 'dejong',
    palette: 'cosmicNebula',
    speed: 1.0,
    trailDecay: 0.05,
    camera: { rotX: 0.3, rotY: 0.2, panX: 0, panY: 0, zoom: 1.0 },
    params: { a: 1.4, b: -2.3, c: 2.4, d: -2.1 },
    
    equations: [
      { lhs: 'x_{n+1}', rhs: 'sin(a·y_n) - cos(b·x_n)' },
      { lhs: 'y_{n+1}', rhs: 'sin(c·x_n) - cos(d·y_n)' }
    ],
    
    narrative: 'Peter de Jong simplified Pickover\'s map into independent difference terms. With just 4 floating-point coefficients (a, b, c, d), this map creates astonishing structural depth with photographic gradients that look like illuminated translucent glass sculptures.',
    
    visualCue: 'Rotate the canvas to look at the folds edge-on. The bright white ridges are regions where millions of trajectory iterations converge (caustics of phase space).',
    
    experiment: 'Try this experiment: In the Dynamical Controls drawer, slide parameter b from -2.3 towards -1.5. Watch the folded silk sheet stretch and bloom into a geometric flower.',
    
    physicsBreakdown: 'Because each trigonometric term operates with distinct frequencies (a, b, c, d), the difference terms create non-periodic interference beats.',
    
    realWorldImpact: 'Widely featured in algorithmic generative art exhibitions worldwide and used in studying optical caustics and wave interference fields.'
  },

  {
    id: 'tinkerbell',
    title: 'Fairy Flight (Tinkerbell Map 1998)',
    subtitle: 'The Polynomial Wings of Fluttering Dynamics',
    author: 'Helena E. Nusse & James A. Yorke (1998)',
    category: '2D Discrete Iterated Map',
    systemType: '2d_map',
    systemId: 'tinkerbell',
    palette: 'bioluminescence',
    speed: 1.0,
    trailDecay: 0.05,
    camera: { rotX: 0.15, rotY: -0.2, panX: 0, panY: 0, zoom: 1.0 },
    params: { a: 0.9, b: -0.6013, c: 2.0, d: 0.5 },
    
    equations: [
      { lhs: 'x_{n+1}', rhs: 'x_n² - y_n² + a·x_n + b·y_n' },
      { lhs: 'y_{n+1}', rhs: '2·x_n·y_n + c·x_n + d·y_n' }
    ],
    
    narrative: 'James Yorke (who originally coined the term "Chaos" in mathematics in 1975) and Helena Nusse formulated this quadratic polynomial map. Its trajectory resembles the erratic, fluttering flight path of a fairy (hence the name Tinkerbell).',
    
    visualCue: 'Notice the dense, bright central body and two delicate outward sweeping wings with razor-thin filament edges.',
    
    experiment: 'Try this experiment: Change parameter b from -0.6013 to -0.62. The delicate wings will suddenly tear apart and dissolve into pure chaotic dispersion.',
    
    physicsBreakdown: 'Unlike trigonometric maps, Tinkerbell is purely polynomial (x² - y² and 2xy, identical to complex squaring z -> z²).',
    
    realWorldImpact: 'Directly applied to population biology dynamics (predator-prey oscillations) and non-linear algorithmic cryptography.'
  },

  {
    id: 'ikeda',
    title: 'Laser Cavity Resonator (Ikeda 1979)',
    subtitle: 'Optical Turbulence in High-Power Laser Rings',
    author: 'Kensuke Ikeda (Kyoto University, 1979)',
    category: '2D Discrete Iterated Map',
    systemType: '2d_map',
    systemId: 'ikeda',
    palette: 'cyberpunk',
    speed: 1.0,
    trailDecay: 0.05,
    camera: { rotX: 0.2, rotY: 0.1, panX: 0, panY: 0, zoom: 1.0 },
    params: { u: 0.9, k: 0.4, p: 6.0 },
    
    equations: [
      { lhs: 't_n', rhs: 'k - p / (1 + x_n² + y_n²)' },
      { lhs: 'x_{n+1}', rhs: '1 + u(x_n·cos t_n - y_n·sin t_n)' },
      { lhs: 'y_{n+1}', rhs: 'u(x_n·sin t_n + y_n·cos t_n)' }
    ],
    
    narrative: 'In 1979, physicist Kensuke Ikeda analyzed what happens to high-intensity laser pulses inside a ring optical cavity with mirrors. When light passes through a non-linear dielectric medium, the phase shift depends on its own intensity, creating optical chaos.',
    
    visualCue: 'Look at the concentric swirling arms. They resemble molten glass spinning in a centrifuge or magnetic field lines around a pulsar.',
    
    experiment: 'Try this experiment: Slide parameter u (Laser Cavity Reflection) down to 0.7. The chaotic swirling arms will snap back into calm concentric circles.',
    
    physicsBreakdown: 'u represents mirror reflectivity (attenuation), while the phase shift t = k - p/(1 + r²) creates intensity-dependent refraction.',
    
    realWorldImpact: 'Crucial for optical fiber telecommunications, high-power laser design, and optical quantum computing.'
  },

  {
    id: 'gumowski',
    title: 'Accelerator Waves (Gumowski-Mira 1980)',
    subtitle: 'Particle Stability Inside CERN Synchrotrons',
    author: 'Igor Gumowski & Christian Mira (CERN, 1980)',
    category: '2D Discrete Iterated Map',
    systemType: '2d_map',
    systemId: 'gumowski',
    palette: 'solarFlare',
    speed: 1.0,
    trailDecay: 0.05,
    camera: { rotX: 0.25, rotY: -0.15, panX: 0, panY: 0, zoom: 1.0 },
    params: { alpha: 0.008, beta: 0.05, mu: -0.49 },
    
    equations: [
      { lhs: 'F(x)', rhs: 'μx + 2(1 - μ)x² / (1 + x²)' },
      { lhs: 'x_{n+1}', rhs: 'y_n + α(1 - βy_n²)y_n + F(x_n)' },
      { lhs: 'y_{n+1}', rhs: '-x_n + F(x_{n+1})' }
    ],
    
    narrative: 'Physicists at CERN designing high-energy particle accelerators faced a critical problem: why do particle beams occasionally become unstable and crash into beam pipe walls? Gumowski and Mira discovered these non-invertible maps to model phase stability of relativistic beams.',
    
    visualCue: 'Notice the organic, biological shapes resembling sea-creatures, cellular division, or supersonic shockwaves.',
    
    experiment: 'Try this experiment: Adjust parameter mu (μ) from -0.49 to -0.65. The biological cell shape will explode outward into intricate geometric dendrites.',
    
    physicsBreakdown: 'The non-invertible function F(x) introduces fractional feedback that splits single particle orbits into multi-stable energy islands.',
    
    realWorldImpact: 'Directly used to design particle injection systems at CERN (Large Hadron Collider) and in plasma confinement for fusion energy.'
  },

  {
    id: 'pendulum_butterfly',
    title: 'Diverging Destinies (Double Pendulum Swarm)',
    subtitle: 'Watching 12 Identical Worlds Tear Apart in Real Time',
    author: 'Lagrangian Mechanics Physical Chaos',
    category: 'Physical Dynamical System',
    systemType: 'pendulum',
    systemId: 'double_pendulum',
    palette: 'solarFlare',
    speed: 1.0,
    trailDecay: 0.06,
    pendulumCount: 12,
    perturbation: 0.0001,
    camera: { rotX: 0.1, rotY: 0.0, panX: 0, panY: 0, zoom: 1.0 },
    
    equations: [
      { lhs: 'Lagrangian', rhs: 'L = T - V' },
      { lhs: 'Integrator', rhs: '4th-Order Runge-Kutta System (RK4)' },
      { lhs: 'Initial Offset', rhs: 'Δθ = 0.0001 radians (Lyapunov Divergence)' }
    ],
    
    narrative: 'A single pendulum is the ultimate symbol of order and clockwork predictability. But attach a second pendulum to its tip, and order instantly shatters. Governed strictly by Newton\'s laws with zero randomness, the double pendulum is so sensitive that measuring it disturbs its future.',
    
    visualCue: 'You are currently watching 12 pendulums running simultaneously. They started with an angle difference of just 0.0001 radians (invisible to the human eye). Watch how they stay together for 3 seconds, and then violently split into 12 completely different realities.',
    
    experiment: 'Try this experiment: In Dynamical Controls, change the Swarm Trajectories slider to 15, and set Simulation Speed to 1.5x. Watch the luminous exposure trails paint an intricate portrait of physical chaos.',
    
    physicsBreakdown: 'The kinetic energy T and potential energy V exchange nonlinearly between both bobs through the joint, creating exponential Lyapunov divergence.',
    
    realWorldImpact: 'Essential in robotic locomotion (balancing bipedal humanoids), gymnastic biomechanics, earthquake damping pendulums in skyscrapers, and ocean wave energy harvesters.'
  },

  {
    id: 'bifurcation_cascade',
    title: 'The Universal Route to Chaos (Feigenbaum 1978)',
    subtitle: 'The Universal Constant Hidden in All Living and Physical Systems',
    author: 'Mitchell Feigenbaum (Los Alamos, 1978)',
    category: 'Fractal Bifurcation Cascade',
    systemType: 'bifurcation',
    systemId: 'logistic',
    palette: 'infrared',
    speed: 1.0,
    
    equations: [
      { lhs: 'Logistic Map', rhs: 'x_{n+1} = r · x_n · (1 - x_n)' },
      { lhs: 'Feigenbaum Ratio', rhs: 'δ = lim (r_k - r_{k-1}) / (r_{k+1} - r_k) ≈ 4.6692016' }
    ],
    
    narrative: 'In 1975, physicist Mitchell Feigenbaum discovered something profound: whether you study turbulent water, boiling helium, the beating of a human heart, or animal populations, all systems transition into chaos following the exact same universal number: δ ≈ 4.6692016 (like π in geometry).',
    
    visualCue: 'Look at the diagram from left to right. A single line splits into 2, then 4, then 8, and at r ≈ 3.5699, dissolves into total chaos. Inside the chaotic sea, look for the transparent vertical stripes: these are "islands of order" where stability mysteriously returns!',
    
    experiment: 'Try this experiment: Click and drag horizontally to pan, and scroll your mouse wheel to zoom straight into one of the vertical gap windows. You will find miniature copies of the entire bifurcation tree repeating forever (self-similarity).',
    
    physicsBreakdown: 'As growth parameter r increases, the system undergoes period-doubling pitchfork bifurcations at an exponentially accelerating geometric rate δ.',
    
    realWorldImpact: 'Used in cardiology to predict sudden cardiac arrhythmias, in ecology to manage fisheries and prevent population collapses, and in financial market risk analysis.'
  }
];
