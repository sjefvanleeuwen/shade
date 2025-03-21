# First Application

## Overview
This guide walks you through creating your first application with Shade Engine. By the end, you'll have a 3D scene with interactive elements running on WebGPU.

## Step 1: Project Setup
First, create a new project directory and initialize it:

```bash
mkdir my-shade-app
cd my-shade-app
npm init -y
npm install shade-engine
```

Create an `index.html` file:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>My First Shade Engine App</title>
  <style>
    body, html { margin: 0; height: 100%; overflow: hidden; }
    #canvas { width: 100%; height: 100%; }
  </style>
</head>
<body>
  <canvas id="canvas"></canvas>
  <script type="module" src="main.js"></script>
</body>
</html>
```

## Step 2: Engine Initialization
Create a `main.js` file to initialize the engine:

```javascript
import { ShadeEngine } from 'shade-engine';

async function main() {
  // Create the engine
  const engine = new ShadeEngine({
    canvas: document.getElementById('canvas')
  });
  
  // Initialize engine and wait for GPU setup
  await engine.initialize();
  
  // Create a scene
  const scene = engine.createScene();
  
  // Create a camera
  const camera = engine.createCamera({
    position: [0, 2, 5],
    target: [0, 0, 0],
    fov: 60
  });
  
  // Start the render loop
  engine.start(() => {
    engine.render(scene, camera);
  });
  
  return { engine, scene, camera };
}

// Start the application
const app = main();
```

## Step 3: Adding Objects and Lights
Now let's add some objects to the scene:

```javascript
async function createScene(engine, scene) {
  // Create a floor
  const floor = scene.createEntity();
  floor.addComponent('Transform', {
    position: [0, -0.5, 0],
    scale: [10, 0.1, 10]
  });
  floor.addComponent('MeshRenderer', {
    mesh: engine.primitives.createBox(),
    material: engine.materials.createPBR({
      baseColor: [0.2, 0.2, 0.2],
      roughness: 0.9,
      metallic: 0.1
    })
  });
  
  // Create a cube
  const cube = scene.createEntity();
  cube.addComponent('Transform', {
    position: [0, 0.5, 0]
  });
  cube.addComponent('MeshRenderer', {
    mesh: engine.primitives.createBox(),
    material: engine.materials.createPBR({
      baseColor: [0.8, 0.2, 0.2],
      roughness: 0.3,
      metallic: 0.7
    })
  });
  
  // Add physics to the cube
  cube.addComponent('RigidBody', {
    mass: 1,
    shape: 'box',
    dimensions: [1, 1, 1]
  });
  
  // Add a directional light
  const directionalLight = scene.createEntity();
  directionalLight.addComponent('Transform', {
    position: [5, 10, 5],
    rotation: engine.math.lookAtQuaternion([5, 10, 5], [0, 0, 0], [0, 1, 0])
  });
  directionalLight.addComponent('DirectionalLight', {
    intensity: 5,
    color: [1, 0.9, 0.8],
    castShadows: true,
    shadowMapSize: 2048
  });
  
  // Add an ambient light
  scene.ambientLight = {
    intensity: 0.2,
    color: [0.5, 0.7, 1.0]
  };
  
  return { floor, cube, directionalLight };
}

// Update main function to use our scene setup
async function main() {
  const engine = new ShadeEngine({
    canvas: document.getElementById('canvas')
  });
  
  await engine.initialize();
  const scene = engine.createScene();
  const camera = engine.createCamera({
    position: [0, 2, 5],
    target: [0, 0, 0],
    fov: 60
  });
  
  // Create scene objects
  const sceneObjects = await createScene(engine, scene);
  
  // Animation variables
  let rotation = 0;
  
  // Start the render loop
  engine.start((time, deltaTime) => {
    // Rotate the cube
    rotation += deltaTime * 0.5;
    sceneObjects.cube.getComponent('Transform').rotation = 
      engine.math.fromEuler(0, rotation, 0);
    
    // Render the scene
    engine.render(scene, camera);
  });
  
  return { engine, scene, camera, objects: sceneObjects };
}
```

## Step 4: Adding Interactivity
Let's add user interaction to control the camera:

```javascript
function setupInteraction(engine, camera, cube) {
  // Camera controls
  const controls = engine.createOrbitControls(camera, {
    target: [0, 0, 0],
    distance: 5,
    minDistance: 2,
    maxDistance: 20,
    damping: 0.1
  });
  
  // Click handling
  engine.input.on('click', (event) => {
    // Cast a ray from the camera through the click point
    const ray = engine.physics.createRayFromCamera(camera, event.x, event.y);
    
    // Check if the ray hits the cube
    const hit = engine.physics.rayCast(ray, {
      entities: [cube]
    });
    
    if (hit) {
      // Apply a force to the cube when clicked
      const rigidBody = cube.getComponent('RigidBody');
      rigidBody.applyImpulse([0, 5, 0]);
      
      // Change the cube color
      const renderer = cube.getComponent('MeshRenderer');
      renderer.material.setProperty('baseColor', [
        Math.random(),
        Math.random(),
        Math.random()
      ]);
    }
  });
  
  return controls;
}

// Update main function to include interaction
async function main() {
  // ... previous initialization code ...
  
  // Setup interaction
  const controls = setupInteraction(engine, camera, sceneObjects.cube);
  
  // Start the render loop
  engine.start((time, deltaTime) => {
    // Update controls
    controls.update(deltaTime);
    
    // Update physics
    engine.physics.update(deltaTime);
    
    // Render the scene
    engine.render(scene, camera);
  });
  
  // ... rest of the function ...
}
```

## Step 5: Adding Post-Processing Effects
Finally, let's add some post-processing effects:

```javascript
function setupPostProcessing(engine) {
  const postProcess = engine.createPostProcess();
  
  // Add bloom effect
  postProcess.addEffect('bloom', {
    threshold: 0.7,
    intensity: 0.8,
    radius: 0.4
  });
  
  // Add tone mapping
  postProcess.addEffect('tonemap', {
    method: 'aces',
    exposure: 1.0
  });
  
  // Add anti-aliasing
  postProcess.addEffect('fxaa');
  
  return postProcess;
}

// Update main function to include post-processing
async function main() {
  // ... previous initialization code ...
  
  // Setup post-processing
  const postProcess = setupPostProcessing(engine);
  
  // Start the render loop
  engine.start((time, deltaTime) => {
    // ... previous update code ...
    
    // Render with post-processing
    engine.render(scene, camera, {
      postProcess: postProcess
    });
  });
  
  // ... rest of the function ...
}
```

## Complete Application
Your complete `main.js` should look like this:

```javascript
import { ShadeEngine } from 'shade-engine';

async function createScene(engine, scene) {
  // Create a floor
  const floor = scene.createEntity();
  floor.addComponent('Transform', {
    position: [0, -0.5, 0],
    scale: [10, 0.1, 10]
  });
  floor.addComponent('MeshRenderer', {
    mesh: engine.primitives.createBox(),
    material: engine.materials.createPBR({
      baseColor: [0.2, 0.2, 0.2],
      roughness: 0.9,
      metallic: 0.1
    })
  });
  
  // Create a cube
  const cube = scene.createEntity();
  cube.addComponent('Transform', {
    position: [0, 0.5, 0]
  });
  cube.addComponent('MeshRenderer', {
    mesh: engine.primitives.createBox(),
    material: engine.materials.createPBR({
      baseColor: [0.8, 0.2, 0.2],
      roughness: 0.3,
      metallic: 0.7
    })
  });
  
  // Add physics to the cube
  cube.addComponent('RigidBody', {
    mass: 1,
    shape: 'box',
    dimensions: [1, 1, 1]
  });
  
  // Add a directional light
  const directionalLight = scene.createEntity();
  directionalLight.addComponent('Transform', {
    position: [5, 10, 5],
    rotation: engine.math.lookAtQuaternion([5, 10, 5], [0, 0, 0], [0, 1, 0])
  });
  directionalLight.addComponent('DirectionalLight', {
    intensity: 5,
    color: [1, 0.9, 0.8],
    castShadows: true,
    shadowMapSize: 2048
  });
  
  // Add an ambient light
  scene.ambientLight = {
    intensity: 0.2,
    color: [0.5, 0.7, 1.0]
  };
  
  return { floor, cube, directionalLight };
}

function setupInteraction(engine, camera, cube) {
  // Camera controls
  const controls = engine.createOrbitControls(camera, {
    target: [0, 0, 0],
    distance: 5,
    minDistance: 2,
    maxDistance: 20,
    damping: 0.1
  });
  
  // Click handling
  engine.input.on('click', (event) => {
    // Cast a ray from the camera through the click point
    const ray = engine.physics.createRayFromCamera(camera, event.x, event.y);
    
    // Check if the ray hits the cube
    const hit = engine.physics.rayCast(ray, {
      entities: [cube]
    });
    
    if (hit) {
      // Apply a force to the cube when clicked
      const rigidBody = cube.getComponent('RigidBody');
      rigidBody.applyImpulse([0, 5, 0]);
      
      // Change the cube color
      const renderer = cube.getComponent('MeshRenderer');
      renderer.material.setProperty('baseColor', [
        Math.random(),
        Math.random(),
        Math.random()
      ]);
    }
  });
  
  return controls;
}

function setupPostProcessing(engine) {
  const postProcess = engine.createPostProcess();
  
  // Add bloom effect
  postProcess.addEffect('bloom', {
    threshold: 0.7,
    intensity: 0.8,
    radius: 0.4
  });
  
  // Add tone mapping
  postProcess.addEffect('tonemap', {
    method: 'aces',
    exposure: 1.0
  });
  
  // Add anti-aliasing
  postProcess.addEffect('fxaa');
  
  return postProcess;
}

async function main() {
  // Create the engine
  const engine = new ShadeEngine({
    canvas: document.getElementById('canvas')
  });
  
  // Initialize engine and wait for GPU setup
  await engine.initialize();
  
  // Create a scene
  const scene = engine.createScene();
  
  // Create a camera
  const camera = engine.createCamera({
    position: [0, 2, 5],
    target: [0, 0, 0],
    fov: 60
  });
  
  // Create scene objects
  const sceneObjects = await createScene(engine, scene);
  
  // Setup interaction
  const controls = setupInteraction(engine, camera, sceneObjects.cube);
  
  // Setup post-processing
  const postProcess = setupPostProcessing(engine);
  
  // Start the render loop
  engine.start((time, deltaTime) => {
    // Update controls
    controls.update(deltaTime);
    
    // Update physics
    engine.physics.update(deltaTime);
    
    // Render the scene
    engine.render(scene, camera, {
      postProcess: postProcess
    });
  });
  
  return { engine, scene, camera, objects: sceneObjects };
}

// Start the application
const app = main();

// Expose app to console for debugging
window.app = app;
```

## Next Steps
Congratulations on creating your first Shade Engine application! From here, you can:

1. **Add More Objects**: Import 3D models using `engine.assets.loadModel()`
2. **Add More Interaction**: Implement game mechanics and controls
3. **Optimize Performance**: Use instancing for repeated geometry
4. **Experiment with Shaders**: Create custom materials and effects
5. **Implement Game Logic**: Add scoring, objectives, or AI

Check out the other documentation pages for more detailed information on each aspect of the engine.
