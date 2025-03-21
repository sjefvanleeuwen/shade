# Particle Systems

## Overview
The Shade Engine particle system leverages GPU compute shaders to simulate and render millions of particles with minimal CPU overhead. All particle logic, physics, and rendering are executed directly on the GPU.

## Core Features
- **GPU-Based Simulation**: Full lifecycle management on the GPU
- **Massive Particle Counts**: Support for millions of particles
- **Dynamic Parameters**: Time-varying behavior through parameter curves
- **Force Fields**: Directional, radial, vortex, and custom force influences
- **Collision Response**: Interaction with scene geometry and physics objects
- **Sorting and Depth**: Correct transparency handling with minimal overhead

## Particle Properties
- **Physical Properties**: Position, velocity, rotation, scale, mass
- **Visual Properties**: Color, opacity, texture coordinates, lighting response
- **Lifetime Properties**: Age, max lifetime, spawn rate, burst patterns
- **Custom Attributes**: User-defined properties for custom behaviors

## Rendering Techniques
- **Billboard Rendering**: Camera-facing quads with optional stretching
- **Trail Rendering**: History-based motion trails
- **Mesh Particles**: Instanced mesh rendering for complex shapes
- **Soft Particles**: Depth-based edge softening for better integration
- **Particle Lighting**: Optional PBR response for physically-based particles

## Code Example
```wgsl
// Compute shader for particle simulation
@compute @workgroup_size(64)
fn simulateParticles(
    @builtin(global_invocation_id) id: vec3<u32>
) {
    if (id.x >= numParticles) {
        return;
    }
    
    let index = id.x;
    var particle = particles[index];
    
    // Skip inactive particles
    if (particle.active == 0u) {
        // Potential particle spawning logic
        if (shouldSpawnParticle(index)) {
            initializeParticle(&particle, index);
        }
        particles[index] = particle;
        return;
    }
    
    // Update age and check if particle should die
    particle.age += deltaTime;
    if (particle.age >= particle.lifetime) {
        particle.active = 0u;
        particles[index] = particle;
        return;
    }
    
    // Calculate normalized lifetime progress
    let lifeProgress = particle.age / particle.lifetime;
    
    // Apply forces
    var acceleration = vec3<f32>(0.0, -gravity, 0.0);
    
    // Apply external forces
    for (var i = 0u; i < numForceFields; i++) {
        acceleration += calculateForceFieldEffect(particle, forceFields[i]);
    }
    
    // Integrate motion
    particle.velocity += acceleration * deltaTime;
    particle.position += particle.velocity * deltaTime;
    
    // Update rotation
    particle.rotation += particle.rotationRate * deltaTime;
    
    // Update scale based on curve
    particle.scale = sampleCurve(scaleCurve, lifeProgress) * particle.baseScale;
    
    // Update color based on gradient
    particle.color = sampleGradient(colorGradient, lifeProgress);
    
    // Handle collisions if enabled
    if (enableCollisions != 0u) {
        handleCollisions(&particle);
    }
    
    // Store updated particle
    particles[index] = particle;
}
```

## Emitter Configuration
```javascript
// Create a particle system
const particleSystem = engine.createParticleSystem({
  maxParticles: 100000,
  emissionRate: 5000,
  emissionShape: 'sphere',
  emissionRadius: 0.5,
  particleLifetime: [1.0, 3.0],  // Random range
  texture: engine.textures.load('particle.ktx2'),
  blendMode: 'additive',
  startScale: [0.1, 0.2],
  endScale: [0.01, 0.05],
  startColor: [1.0, 0.5, 0.2, 1.0],
  endColor: [0.5, 0.2, 0.1, 0.0],
  startVelocity: {
    type: 'radial',
    speed: [1.0, 5.0]
  },
  forces: [
    {
      type: 'directional',
      direction: [0, -1, 0],
      strength: 9.8
    },
    {
      type: 'vortex',
      position: [0, 1, 0],
      axis: [0, 1, 0],
      strength: 2.0,
      radius: 5.0
    }
  ],
  collision: {
    enabled: true,
    radius: 0.1,
    restitution: 0.6,
    friction: 0.2
  },
  sorting: 'distance',
  renderMode: 'billboard',
  lighting: {
    enabled: true,
    receiveShadows: false,
    emissiveStrength: 2.0
  }
});

// Attach the particle system to an entity
const emitter = scene.createEntity();
emitter.addComponent('Transform', {
  position: [0, 2, 0]
});
emitter.addComponent('ParticleEmitter', particleSystem);

// Control the emission
particleSystem.start();
// Later...
particleSystem.stop({
  immediate: false  // Let existing particles finish their lifetime
});
```

## Advanced Techniques
- **GPU Particle Level-of-Detail**: Adaptive detail based on distance
- **Particle Skinning**: Integration with skeletal animation
- **Fluid Particles**: SPH fluid simulation with particle representation
- **Particle Feedback**: Reading back summary data for gameplay events
- **Instanced Sub-Emitters**: Child particles spawned from parent particles
