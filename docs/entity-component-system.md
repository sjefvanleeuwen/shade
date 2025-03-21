# Entity Component System

## Overview
The Shade Engine uses a data-oriented Entity Component System (ECS) for game object representation. This architecture is designed to optimize for cache locality and enable massive parallelism on both CPU and GPU.

## Core Concepts
- **Entities**: Lightweight identifiers that group components together
- **Components**: Pure data containers with no behavior
- **Systems**: Logic that processes components of specific types
- **Queries**: Efficient filtering to find entities with specific component combinations
- **Archetypes**: Storage optimization grouping entities with identical component layouts

## GPU Integration
- **Component Buffers**: Direct GPU access to component data
- **GPU Systems**: Compute shader implementations of ECS systems
- **Change Detection**: Efficient tracking of modified components
- **Command Buffers**: Batched entity operations executed in parallel

## Performance Features
- **Sparse Sets**: Memory-efficient component storage
- **Structural Changes**: Batched entity/component creation and deletion
- **Parallel Iteration**: Lock-free processing of component data
- **Component Packing**: Memory layout optimization for related components

## Reactive Systems
- **Event Dispatching**: Component change notifications
- **Reactive Queries**: Dynamic entity sets based on component presence
- **Tagging**: Zero-memory markers for entity classification

## Code Example
```javascript
// Define components
engine.registerComponent('Transform', {
  position: [0, 0, 0],
  rotation: [0, 0, 0, 1],
  scale: [1, 1, 1]
});

engine.registerComponent('RigidBody', {
  mass: 1.0,
  velocity: [0, 0, 0],
  angularVelocity: [0, 0, 0],
  isKinematic: false
});

engine.registerComponent('Model', {
  mesh: null,
  materials: []
});

// Create an entity
const entity = engine.createEntity();
engine.addComponent(entity, 'Transform', {
  position: [10, 5, 0]
});
engine.addComponent(entity, 'RigidBody', {
  mass: 5.0
});
engine.addComponent(entity, 'Model', {
  mesh: engine.assets.getMesh('character')
});

// Define a system
engine.registerSystem('PhysicsUpdate', ['Transform', 'RigidBody'], (entities) => {
  for (const entity of entities) {
    const transform = entity.getComponent('Transform');
    const rigidBody = entity.getComponent('RigidBody');
    
    // Update position based on velocity
    transform.position[0] += rigidBody.velocity[0] * deltaTime;
    transform.position[1] += rigidBody.velocity[1] * deltaTime;
    transform.position[2] += rigidBody.velocity[2] * deltaTime;
    
    // Apply gravity
    if (!rigidBody.isKinematic) {
      rigidBody.velocity[1] -= 9.8 * deltaTime;
    }
  }
});

// GPU system example
engine.registerGPUSystem('ParticleUpdate', ['Position', 'Velocity'], {
  computeShader: 'shaders/particle_update.wgsl',
  workgroupSize: [64, 1, 1]
});
```
