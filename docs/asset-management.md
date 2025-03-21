# Asset Loading and Management

## Overview
The asset management system provides efficient loading, preprocessing, and runtime access to all resources used by the engine. It supports asynchronous loading, streaming, and intelligent caching to optimize resource usage.

## Supported Asset Types
- **3D Models**: glTF, GLB, OBJ with automatic optimization
- **Textures**: KTX2, PNG, JPEG, HDR with mipmap generation
- **Materials**: Material definitions with shader variants
- **Animations**: Skeletal and morph target animations
- **Audio**: Spatial audio clips and ambient sounds
- **Shaders**: WGSL shader modules and pipelines
- **Scenes**: Complete scene hierarchies and prefabs

## Asset Loading Pipeline
- **Discovery**: Automatic and manual asset registration
- **Loading**: Async loading with prioritization and dependencies
- **Processing**: GPU-accelerated asset preparation when possible
- **Optimization**: Automatic format conversion and size optimization
- **Caching**: Multi-level cache system for processed assets

## Memory Management
- **Streaming**: Progressive loading of high-resolution assets
- **LOD Management**: Automatic level-of-detail selection
- **Garbage Collection**: Reference counting and automatic unloading
- **Memory Budgets**: Per-category memory limits with eviction policies
- **Preloading**: Background loading of anticipated assets

## Code Example
```javascript
// Configure the asset manager
engine.assets.configure({
  basePath: 'assets/',
  cacheSize: 512, // MB
  preprocessorWorkers: 4,
  convertFormats: true,
  autoMipmaps: true
});

// Load individual assets
const modelPromise = engine.assets.load('models/character.glb', {
  generateLODs: true,
  priority: 'high'
});

// Load a material with textures
const materialPromise = engine.assets.loadMaterial('materials/metal.json', {
  loadTextures: true
});

// Access an asset after loading
modelPromise.then(model => {
  const character = scene.createEntity();
  character.addComponent('Model', {
    model: model
  });
});

// Load a complete prefab with all dependencies
engine.assets.loadPrefab('prefabs/vehicle.json')
  .then(prefab => {
    const instance = prefab.instantiate(scene);
    instance.transform.position = [0, 0, 10];
  });

// Preload a group of assets
engine.assets.preloadGroup('level1', [
  'models/environment.glb',
  'textures/environment/',
  'audio/ambient.mp3'
]).then(() => {
  console.log('Level 1 assets ready');
});

// Unload assets when no longer needed
engine.assets.unloadGroup('level1');
```

## Asset Bundles
- **Bundle Creation**: Packaging related assets together
- **Compression**: Bundle-level compression for reduced download size
- **Dependency Resolution**: Automatic handling of shared dependencies
- **Versioning**: Support for asset updates and patching

## Runtime Asset Generation
- **Procedural Meshes**: Dynamic creation of 3D geometry
- **Render Targets as Textures**: Camera output as reusable textures
- **Material Instances**: Runtime parameter variations
- **Asset Composition**: Creating new assets by combining existing ones

## Advanced Features
- **Hot Reloading**: Development-time asset changes without restart
- **Asset Validation**: Automated checking for errors and optimization opportunities
- **Remote Asset Serving**: Streaming from CDN or custom servers
- **Progressive Enhancement**: Fallbacks for low-end devices

## Example: Asset Bundle Loading
```javascript
// Define bundle manifest
const levelBundle = {
  name: 'forest-level',
  assets: [
    {type: 'model', path: 'models/terrain.glb'},
    {type: 'model', path: 'models/trees/*.glb'},
    {type: 'texture', path: 'textures/terrain/*.ktx2'},
    {type: 'audio', path: 'audio/forest_ambient.mp3'},
    {type: 'prefab', path: 'prefabs/forest_creatures.json'}
  ],
  options: {
    compression: 'brotli',
    chunkSize: '2MB',
    priority: 'high'
  }
};

// Load the bundle with progress tracking
const bundleLoader = engine.assets.loadBundle(levelBundle);

bundleLoader.onProgress(progress => {
  loadingBar.progress = progress.loaded / progress.total;
  statusText.textContent = `Loading: ${progress.assetName}`;
});

bundleLoader.onComplete(() => {
  startLevel();
});

// Access bundle assets after loading
const tree = engine.assets.get('models/trees/pine.glb');
```
