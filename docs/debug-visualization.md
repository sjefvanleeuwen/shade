# Debug Visualization

## Overview
Debug visualization tools in Shade Engine provide real-time visual feedback about internal engine states, helping developers identify issues, optimize performance, and understand complex systems. These tools can be toggled at runtime without requiring code changes or rebuilds.

## Core Visualization Types
- **Physics Debug**: Colliders, contact points, and forces
- **Rendering Debug**: Materials, UVs, and shader issues
- **Performance Metrics**: FPS, draw calls, and memory usage
- **Animation Debug**: Skeletons, blend weights, and trajectories
- **Spatial Debug**: Partitioning structures and query results

## Visualization API
- **Debug Primitives**: Lines, shapes, and text
- **Debug Gizmos**: Manipulators and visual helpers
- **Debug Overlays**: Fullscreen information layers
- **Debug Regions**: Time-based event visualization
- **Debug Persistence**: Logging visual data over time

## Code Example
```javascript
// Enable the debug layer
engine.debug.enable({
  physics: true,
  rendering: true,
  animation: false,
  performance: true
});

// Create persistent debug primitives
const debugDrawer = engine.debug.createDrawer({
  persistent: true,
  throughWalls: true,
  space: 'world' // 'world', 'screen', 'local'
});

// Draw debug primitives
debugDrawer.drawLine(startPos, endPos, [1, 0, 0, 1]); // Red line
debugDrawer.drawSphere(position, 1.0, [0, 1, 0, 0.5]); // Green semi-transparent sphere
debugDrawer.drawBox(position, size, rotation, [0, 0, 1, 1]); // Blue box
debugDrawer.drawText(position, "Debug Info", {
  color: [1, 1, 1, 1],
  size: 14,
  alignment: 'center',
  billboarded: true
});

// Draw one-frame debug primitives
engine.onUpdate(() => {
  // Only shown for one frame
  engine.debug.drawArrow(entityA.position, entityB.position, [1, 1, 0, 1]);
  
  // Draw the path
  const pathPoints = aiSystem.getAgentPath(agent);
  engine.debug.drawPath(pathPoints, [0, 1, 1, 1], {
    lineWidth: 2,
    showPoints: true,
    pointSize: 0.2
  });
});

// Configure physics debug visualization
engine.debug.physics.configure({
  colliders: true,
  contactPoints: true,
  joints: true,
  forces: true,
  aabbs: false,
  centerOfMass: true,
  constraints: true,
  sleepState: true,
  colorMode: 'material' // 'material', 'velocity', 'island', 'type'
});

// Show performance metrics
engine.debug.showPerformance({
  position: 'top-right',
  graphs: true,
  detailed: true,
  history: 300, // frames
  metrics: [
    'fps',
    'frametime',
    'drawCalls',
    'triangles',
    'gpuMemory',
    'cpuMemory'
  ]
});

// Debug specific entity
const debugComponent = entity.addComponent('DebugVisualizer', {
  showSkeleton: true,
  showBounds: true,
  showPath: true,
  showVelocity: true,
  showStates: true
});

// Create a debug event region
engine.debug.beginRegion('AI Pathfinding', [0.8, 0.2, 0.8, 0.5]);
aiSystem.findPath(start, end);
engine.debug.endRegion();
```

## Physics Visualization
- **Collision Shapes**: Visual representation of physics colliders
- **Contact Points**: Impact locations and normal directions
- **Constraint Visualization**: Joints, constraints, and limits
- **Force Visualization**: Direction and magnitude of physics forces
- **Velocity Display**: Direction and speed indicators
- **Physics Queries**: Raycasts, sweeps, and overlap test visualization

## Rendering Visualization
- **Wireframe Mode**: Mesh edge visualization
- **Overdraw Heat Map**: Pixel shader load visualization
- **Material Complexity**: Shader instruction count visualization
- **Texture Usage**: Mip level and texture memory visualization
- **Lighting Debug**: Light influence and shadow cascade visualization
- **Screen-Space Effects**: Visualization of post-processing stages

## Animation Debugging
- **Skeleton Visualization**: Bone hierarchy display
- **Animation Weights**: Blend contribution visualization
- **Trajectory Prediction**: Future motion path display
- **Animation Events**: Timeline and trigger points
- **IK Targets**: Inverse kinematics goal visualization
- **Muscle System**: Physics-based animation forces

## Performance Visualization
- **Frame Timing**: Detailed breakdown of CPU/GPU time
- **GPU Profiling**: Shader and draw call timing
- **Memory Usage**: Allocation tracking and visualization
- **Asset Loading**: Streaming status and priorities
- **Culling Results**: Visibility determination visualization
- **System Load**: Per-system resource consumption

## Integration with External Tools
- **Remote Debugging**: Network-based debug visualization
- **Timeline Recording**: Capturing debug data for offline analysis
- **Screenshot Capture**: High-resolution debug image export
- **Comparison Tools**: Before/after visualization for changes
- **Debug Console**: Command-based debugging interface
- **State Snapshots**: Engine state capture and inspection
