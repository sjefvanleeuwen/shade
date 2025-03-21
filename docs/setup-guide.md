# Setup Guide

## Overview
This guide will help you set up and configure Shade Engine for your WebGPU project. Follow these steps to get started with developing high-performance 3D applications.

## Requirements
- **Browser**: Chrome 113+, Edge 113+, or other browser with WebGPU support
- **Hardware**: GPU with WebGPU compatibility
- **Development Environment**: Node.js 14+ and npm/yarn for build tools

## Installation

### NPM Package
```bash
npm install shade-engine
```

### CDN Link
```html
<script src="https://cdn.shade-engine.dev/shade-engine-1.0.0.min.js"></script>
```

### Manual Download
1. Download the latest release from the [official repository](https://github.com/shade-engine/shade-engine)
2. Include the library in your project

## Basic Setup

### HTML Structure
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Shade Engine App</title>
  <style>
    body, html { 
      margin: 0; 
      padding: 0; 
      overflow: hidden; 
      width: 100%; 
      height: 100%;
    }
    #renderCanvas {
      width: 100%;
      height: 100%;
      display: block;
    }
  </style>
</head>
<body>
  <canvas id="renderCanvas"></canvas>
  <script type="module" src="app.js"></script>
</body>
</html>
```

### JavaScript Initialization
```javascript
import { ShadeEngine } from 'shade-engine';

async function initializeEngine() {
  // Check for WebGPU support
  if (!navigator.gpu) {
    document.body.innerHTML = '<h1>WebGPU is not supported in your browser</h1>';
    return;
  }

  // Initialize the engine
  const engine = new ShadeEngine({
    canvas: document.getElementById('renderCanvas'),
    vsync: true,
    msaaSamples: 4,
    preferredFormat: 'hdr'
  });

  // Wait for engine initialization
  await engine.initialize();

  // Create a scene
  const scene = engine.createScene();
  
  // Create a camera
  const camera = engine.createCamera({
    type: 'perspective',
    fov: 60,
    near: 0.1,
    far: 1000,
    position: [0, 5, 10],
    target: [0, 0, 0]
  });
  
  // Create a basic entity
  const entity = scene.createEntity();
  entity.addComponent('Transform', {
    position: [0, 0, 0],
    rotation: [0, 0, 0, 1],
    scale: [1, 1, 1]
  });
  
  // Add a cube mesh
  entity.addComponent('MeshRenderer', {
    mesh: engine.primitives.createBox(),
    material: engine.materials.createBasic({ color: [1, 0, 0] })
  });
  
  // Add a light
  const light = scene.createEntity();
  light.addComponent('Transform', {
    position: [5, 10, 5]
  });
  light.addComponent('DirectionalLight', {
    intensity: 1.0,
    color: [1, 1, 1],
    castShadows: true
  });

  // Start the render loop
  engine.start((time, deltaTime) => {
    // Rotate the cube
    const transform = entity.getComponent('Transform');
    transform.rotation = engine.math.rotateQuaternion(
      transform.rotation, 
      [0, 1, 0], 
      deltaTime
    );
    
    // Render the scene
    engine.render(scene, camera);
  });
}

initializeEngine().catch(error => {
  console.error('Failed to initialize Shade Engine:', error);
  document.body.innerHTML = `<h1>Error: ${error.message}</h1>`;
});
```

## Configuration Options

| Option | Description | Default |
|--------|-------------|---------|
| `canvas` | The HTML canvas element | Required |
| `vsync` | Enable vertical sync | `true` |
| `msaaSamples` | Multi-sample anti-aliasing samples (0, 1, 4) | `1` |
| `preferredFormat` | Color format ('srgb', 'hdr') | `'srgb'` |
| `powerPreference` | GPU power preference ('default', 'high-performance', 'low-power') | `'default'` |
| `depthFormat` | Depth buffer format | `'depth24plus'` |
| `enableProfiling` | Enable performance profiling | `false` |
| `maxTextureSize` | Maximum texture dimension | `4096` |

## Troubleshooting

### Common Issues
- **WebGPU Not Available**: Ensure you're using a compatible browser and GPU
- **Context Lost**: Handle device loss with the `engine.on('contextlost', callback)` event
- **Performance Issues**: Check the performance panel in `engine.debug.showPerformance()`

### Diagnostic Tools
```javascript
// Enable the debug layer
engine.debug.enable();

// Show performance metrics
engine.debug.showPerformance({
  position: 'top-right',
  showFPS: true,
  showMemory: true,
  showDrawCalls: true
});

// Inspect GPU buffers
engine.debug.inspectBuffer('vertices', someVertexBuffer);
```
