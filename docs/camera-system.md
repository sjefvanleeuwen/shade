# Camera System

## Overview
The camera system in Shade Engine provides flexible ways to view and navigate 3D worlds. With multiple camera types, control schemes, and advanced features, the system supports everything from simple applications to complex cinematic sequences and VR experiences.

## Camera Types
- **Perspective Camera**: Standard 3D view with depth perspective
- **Orthographic Camera**: 2D-style view without perspective distortion
- **Physical Camera**: Realistic camera with physical properties (focal length, aperture, etc.)
- **Panoramic Camera**: 360° view for environmental captures
- **Stereoscopic Camera**: Dual-camera setup for VR/AR applications

## Control Schemes
- **Orbit Controls**: Rotating around a target point with zoom
- **First-Person Controls**: Direct movement and rotation for first-person perspective
- **Third-Person Controls**: Following a character with configurable offsets
- **Path Controls**: Camera movement along predefined paths
- **Fly Controls**: Free-form movement in 3D space
- **Planetary Controls**: Surface and orbital navigation around planetary bodies

## Core Features
- **Frustum Culling**: Automatic view frustum calculation for rendering optimization
- **Transitions**: Smooth interpolation between camera positions and settings
- **Look-At Targeting**: Automatic orientation toward specific objects or points
- **Screen-to-World Projection**: Converting between screen and world coordinates
- **World-to-Screen Projection**: Converting world positions to screen space

## Code Example: Basic Camera Setup
```javascript
// Create a perspective camera
const camera = engine.createCamera({
  type: 'perspective',
  position: [0, 5, 10],
  target: [0, 0, 0],
  fov: 60,
  nearPlane: 0.1,
  farPlane: 1000,
  aspectRatio: 'auto' // Will use canvas dimensions
});

// Create an orthographic camera
const uiCamera = engine.createCamera({
  type: 'orthographic',
  position: [0, 0, 10],
  size: 20, // Height in world units
  nearPlane: 0.1,
  farPlane: 100
});

// Apply camera to rendering
engine.render(scene, camera);
```

## Camera Controls
```javascript
// Create orbit controls
const orbitControls = engine.createOrbitControls(camera, {
  target: [0, 0, 0],
  minDistance: 2,
  maxDistance: 20,
  minPolarAngle: 0.1, // Radians
  maxPolarAngle: Math.PI - 0.1,
  enableDamping: true,
  dampingFactor: 0.05,
  rotateSpeed: 1.0,
  zoomSpeed: 1.0,
  enablePan: true,
  panSpeed: 1.0
});

// Create first-person controls
const fpControls = engine.createFirstPersonControls(camera, {
  lookSpeed: 0.1,
  moveSpeed: 5.0,
  jumpHeight: 1.0,
  gravity: 9.8,
  enableHeadBob: true,
  headBobFrequency: 2.0,
  headBobAmplitude: 0.1
});

// Create third-person controls
const tpControls = engine.createThirdPersonControls(camera, {
  target: playerEntity,
  distance: 5,
  offsetY: 2,
  rotateSpeed: 0.5,
  damping: true,
  collisionDetection: true,
  autoAdjustPitch: true
});

// Update controls in render loop
engine.onUpdate((deltaTime) => {
  orbitControls.update(deltaTime);
  // Render scene with updated camera
  engine.render(scene, camera);
});
```

## Advanced Camera Settings
```javascript
// Configure post-processing for a camera
camera.setPostProcessing({
  dof: {
    enabled: true,
    focusDistance: 10,
    focalLength: 50,
    aperture: 2.8,
    bokehShape: 'hexagonal'
  },
  colorGrading: {
    enabled: true,
    temperature: 6500,
    tint: 0,
    contrast: 1.1,
    saturation: 1.2
  },
  vignette: {
    enabled: true,
    intensity: 0.2,
    smoothness: 0.3,
    color: [0, 0, 0]
  }
});

// Setup physics-based camera shake
camera.addShake({
  trauma: 0.5, // 0 to 1, intensity of shake
  traumaDecay: 1.0, // How quickly trauma reduces
  frequency: 25, // Oscillations per second
  amplitudeGain: 1.0, // Multiplier for shake amplitude
  rotationGain: 1.0, // Multiplier for rotational shake
  positionGain: 0.5 // Multiplier for positional shake
});
```

## Camera Animations
```javascript
// Create a camera path
const cameraPath = engine.createCameraPath({
  points: [
    { position: [0, 5, 10], target: [0, 0, 0], fov: 60, duration: 0 },
    { position: [10, 3, 0], target: [0, 0, 0], fov: 50, duration: 2 },
    { position: [0, 2, -10], target: [0, 1, 0], fov: 40, duration: 3 },
    { position: [-5, 8, 5], target: [0, 0, 0], fov: 30, duration: 2 }
  ],
  interpolation: 'cubic',
  loop: false,
  tension: 0.5
});

// Play the camera animation
cameraPath.play({
  onComplete: () => {
    console.log('Camera animation completed');
    
    // Transition to another camera
    engine.transitionToCamera(gameplayCamera, {
      duration: 1.5,
      easing: 'easeInOutQuad',
      onComplete: () => {
        cameraPath.stop();
      }
    });
  },
  onUpdate: (progress) => {
    // Custom logic during camera animation
    updateUserInterface(progress);
  }
});
```

## Special Camera Types

### Cinematic Camera
```javascript
const cinematicCamera = engine.createCinematicCamera({
  sensorSize: '35mm',
  focalLength: 50,
  aperture: 2.8,
  shutterSpeed: 1/60,
  iso: 800,
  anamorphicRatio: 2.0,
  filmGrain: 0.3,
  vignetteIntensity: 0.4,
  lensSurfaceFlare: true
});
```

### VR Camera
```javascript
const vrCamera = engine.createVRCamera({
  ipd: 0.064, // Inter-pupillary distance in meters
  fov: 110,
  nearPlane: 0.05,
  farPlane: 1000,
  trackingSpace: 'local', // 'local' or 'bounded'
  standingPosition: [0, 1.6, 0] // User's height
});

// Enter VR mode
engine.enterVR(vrCamera).then(() => {
  console.log('VR session started');
}).catch(error => {
  console.error('VR session failed to start', error);
});
```

## Multi-Camera Setups
```javascript
// Create a split-screen setup
const leftCamera = engine.createCamera({
  type: 'perspective',
  position: [5, 5, 5],
  target: [0, 0, 0],
  viewport: { x: 0, y: 0, width: 0.5, height: 1.0 } // Left half of screen
});

const rightCamera = engine.createCamera({
  type: 'perspective',
  position: [-5, 5, 5],
  target: [0, 0, 0],
  viewport: { x: 0.5, y: 0, width: 0.5, height: 1.0 } // Right half of screen
});

// Render with multiple cameras
engine.renderMultiple(scene, [leftCamera, rightCamera]);
```

## Camera Utilities
```javascript
// Ray casting from camera
const ray = camera.createRay(screenX, screenY);
const hit = engine.physics.rayCast(ray, {
  maxDistance: 100,
  layerMask: 0xFF,
  ignoreEntities: [playerEntity]
});

if (hit) {
  console.log(`Hit entity ${hit.entity.name} at distance ${hit.distance}`);
}

// Screen to world position
const worldPos = camera.screenToWorldPoint(screenX, screenY, depth);

// World to screen position
const screenPos = camera.worldToScreenPoint(worldPosition);
if (screenPos.z > 0) { // Object is in front of camera
  console.log(`Object is at screen position ${screenPos.x}, ${screenPos.y}`);
}
```

## Integration with Other Systems

### Culling System Integration
```javascript
// Camera automatically provides frustum for culling
engine.renderer.setActiveFrustum(camera.frustum);

// Manual frustum extraction for custom culling
const frustumPlanes = camera.extractFrustumPlanes();
customCullingSystem.updateFrustum(frustumPlanes);
```

### Audio Integration
```javascript
// Attach audio listener to camera
camera.attachAudioListener();

// Automatic audio system integration
engine.audio.setListenerFromCamera(camera);
```

### Physics Integration
```javascript
// Create a physical camera controller
const physicalCamera = engine.createPhysicalCameraController(camera, {
  mass: 80,
  height: 1.8,
  radius: 0.4,
  stepHeight: 0.5,
  input: {
    forward: 'w',
    backward: 's',
    left: 'a',
    right: 'd',
    jump: 'space'
  }
});

// Update in render loop
engine.onUpdate(() => {
  physicalCamera.update();
});
```

## Performance Considerations
- **Culling Optimization**: Efficient frustum extraction for visibility determination
- **Camera-Based LOD**: Automatic detail level adjustment based on camera distance
- **Multi-Threading**: Camera updates can run on worker threads when not input-dependent
- **Render Target Sizing**: Dynamic render resolution based on performance metrics
- **Occlusion Culling**: Camera-driven occlusion systems for complex scenes
