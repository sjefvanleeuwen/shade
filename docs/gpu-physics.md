# GPU Physics System

## Overview
The GPU physics system leverages compute shaders to simulate physics with massive parallelism, enabling orders of magnitude more dynamic objects than traditional CPU-based approaches.

## Core Features
- **Rigid Body Dynamics**: Full 6-DOF rigid body simulation on the GPU
- **Soft Body Physics**: Deformable objects using position-based dynamics
- **Cloth Simulation**: High-fidelity cloth with thousands of constraint points
- **Fluid Dynamics**: SPH-based fluid simulation and interaction
- **Constraint Solver**: Parallel constraint resolution using Jacobi or Gauss-Seidel methods

## Integration with Rendering
- **Zero-Copy Workflow**: Physics data used directly by rendering shaders
- **GPU-Driven Animation**: Physics-based skeletal and mesh deformation
- **Motion Vectors**: Accurate motion data for temporal effects

## Optimization Techniques
- **Spatial Hashing**: GPU-accelerated broad-phase collision detection
- **Substepping**: Variable physics resolution for stable simulation
- **Adaptive Simulation**: Detail levels based on visibility and importance
- **Sleeping Objects**: Automatic deactivation of stable objects

## Gravitational Physics
- **Gravity Fields**: Non-uniform gravity for planets and large objects
- **N-Body Simulation**: Gravitational interaction between multiple bodies
- **Orbital Mechanics**: Keplerian orbits and perturbation calculations
- **Surface Gravity**: Object behavior on curved planetary surfaces
- **Relativistic Effects**: Optional approximations of spacetime distortion

```wgsl
// Compute shader for gravity fields
@compute @workgroup_size(64)
fn applyGravityFields(
    @builtin(global_invocation_id) id: vec3<u32>
) {
    if (id.x >= numBodies) {
        return;
    }
    
    let bodyIndex = id.x;
    var position = bodies[bodyIndex].position;
    var velocity = bodies[bodyIndex].velocity;
    let mass = bodies[bodyIndex].mass;
    
    // Calculate gravitational acceleration from all gravity fields
    var totalAcceleration = vec3<f32>(0.0);
    
    // Process planetary gravity
    for (var i = 0u; i < numPlanets; i++) {
        let planet = planets[i];
        let planetCenter = planet.position;
        let planetMass = planet.mass;
        let planetRadius = planet.radius;
        
        // Vector from body to planet center
        let dirToPlanet = planetCenter - position;
        let distToPlanet = length(dirToPlanet);
        
        // Skip if inside the planet (handled by surface physics)
        if (distToPlanet < planetRadius) {
            continue;
        }
        
        // Calculate gravitational force (F = G * m1 * m2 / r^2)
        // Simplified: we apply acceleration directly (F/m = G * M / r^2)
        let gravitationalConstant = 6.67430e-11;
        let acceleration = gravitationalConstant * planetMass / (distToPlanet * distToPlanet);
        
        // Direction of acceleration is toward planet center
        totalAcceleration += normalize(dirToPlanet) * acceleration;
    }
    
    // Apply acceleration to velocity
    velocity += totalAcceleration * deltaTime;
    
    // Update velocity in storage buffer
    bodies[bodyIndex].velocity = velocity;
}
```

## Code Example for Main Integration
```wgsl
// Compute shader for rigid body integration
@compute @workgroup_size(64)
fn integrateRigidBodies(
    @builtin(global_invocation_id) id: vec3<u32>
) {
    if (id.x >= numBodies) {
        return;
    }
    
    // Load body data
    let bodyIndex = id.x;
    var position = bodies[bodyIndex].position;
    var velocity = bodies[bodyIndex].velocity;
    var orientation = bodies[bodyIndex].orientation;
    var angularVelocity = bodies[bodyIndex].angularVelocity;
    
    // Apply forces
    let totalForce = calculateForces(bodyIndex);
    let mass = bodies[bodyIndex].mass;
    let invMass = select(0.0, 1.0 / mass, mass > 0.0);
    
    // Integrate linear motion
    velocity += totalForce * invMass * deltaTime;
    position += velocity * deltaTime;
    
    // Integrate angular motion
    // ... angular integration code ...
    
    // Store updated state
    bodies[bodyIndex].position = position;
    bodies[bodyIndex].velocity = velocity;
    bodies[bodyIndex].orientation = orientation;
    bodies[bodyIndex].angularVelocity = angularVelocity;
}
```

## Planetary Physics
- **Surface Movement**: Physics on curved planetary surfaces
- **Local vs Global Coordinates**: Coordinate systems for high-precision physics
- **Atmosphere Simulation**: Aerodynamic effects within planetary atmospheres
- **Orbital Prediction**: Trajectory calculation for space navigation
- **Terrain Interaction**: Physics-based interaction with deformable planet terrain

```javascript
// Configure planetary physics
engine.physics.configurePlanetaryPhysics({
  planets: [
    {
      body: earth,
      gravitationalConstant: 6.67430e-11,
      surfaceGravity: 9.81,
      atmosphericDensity: {
        enabled: true,
        seaLevelDensity: 1.225, // kg/m³
        scaleHeight: 8500       // meters
      },
      surfaceContact: {
        friction: 0.6,
        restitution: 0.3,
        dynamicTerrainCollision: true
      }
    }
  ],
  spacePhysics: {
    enabled: true,
    solarRadiationPressure: true,
    dragModels: true
  },
  precisionModel: 'doubleLocalized', // Use double precision in local reference frames
  updateFrequency: 60 // Physics updates per second
});

// Apply thrust to a spacecraft in orbit
spacecraftEntity.getComponent('OrbitalBody').applyThrust({
  direction: [0, 1, 0], // Local coordinates
  force: 1000,          // Newtons
  duration: 30          // Seconds
});
```
