# Terrain Generation

## Overview
The terrain system in Shade Engine provides tools for creating, rendering, and interacting with large-scale landscapes. Using GPU acceleration, the engine supports both procedural generation and artist-crafted terrains with high performance and visual fidelity.

## Terrain Representation
- **Height Field**: Elevation-based terrain with height maps
- **Voxel Terrain**: Volumetric terrain supporting overhangs and caves
- **Hybrid Approaches**: Combined techniques for detail and performance
- **Mesh Terrains**: Arbitrary mesh-based landscapes for specific designs
- **Planet-Scale Terrain**: Spherical terrain for entire worlds with seamless wrapping (see [Planetary Rendering](c:\source\shade\docs\planetary-rendering.md))

## GPU-Accelerated Generation
- **Procedural Algorithms**: Noise-based terrain synthesis with compute shaders
- **Erosion Simulation**: Hydraulic and thermal erosion for natural landforms
- **Feature Generation**: Mountains, rivers, canyons, and other formations
- **Biome Definition**: Climate and attribute-based terrain variation
- **Runtime Generation**: Dynamic terrain creation during gameplay

## Rendering Techniques
- **Adaptive Tessellation**: Dynamic detail based on distance and features
- **Virtual Texturing**: Efficient handling of large texture datasets
- **Triplanar Mapping**: Artifact-free texturing on steep slopes
- **Material Blending**: Smooth transitions between different terrain types
- **Detail Mapping**: Multi-scale surface detail for close-up views

## Code Example
```wgsl
// Compute shader for procedural terrain generation using noise
@compute @workgroup_size(16, 16)
fn generateTerrain(
    @builtin(global_invocation_id) id: vec3<u32>
) {
    if (id.x >= terrainSize || id.y >= terrainSize) {
        return;
    }
    
    let x = f32(id.x);
    let y = f32(id.y);
    let worldX = x * worldScale + worldOffset.x;
    let worldY = y * worldScale + worldOffset.y;
    
    // Multiple octaves of fractal noise
    var elevation = 0.0;
    var amplitude = 1.0;
    var frequency = baseFrequency;
    var persistence = 0.5;
    
    for (var i = 0u; i < octaves; i++) {
        let noiseValue = simplex2d(worldX * frequency, worldY * frequency);
        elevation += noiseValue * amplitude;
        amplitude *= persistence;
        frequency *= 2.0;
    }
    
    // Apply ridged noise for mountains
    if (useMountains != 0u) {
        let mountainNoise = abs(simplex2d(worldX * mountainFrequency, worldY * mountainFrequency));
        let ridged = 1.0 - mountainNoise;
        let mountains = pow(ridged, 4.0) * mountainHeight;
        elevation = mix(elevation, elevation + mountains, mountainMask(worldX, worldY));
    }
    
    // Apply erosion
    if (useErosion != 0u) {
        elevation = applyErosion(elevation, id.x, id.y);
    }
    
    // Store in height map and calculate normals
    heightMap[id.y * terrainSize + id.x] = elevation;
    
    // Calculate normals (simplified - would normally use neighbors)
    storageBarrier();
    
    // Fetch neighboring heights
    let left = heightMap[id.y * terrainSize + max(id.x, 1u) - 1u];
    let right = heightMap[id.y * terrainSize + min(id.x + 1u, terrainSize - 1u)];
    let top = heightMap[max(id.y, 1u) - 1u * terrainSize + id.x];
    let bottom = heightMap[min(id.y + 1u, terrainSize - 1u) * terrainSize + id.x];
    
    // Calculate normal
    let normal = normalize(vec3<f32>(
        left - right,
        2.0 * worldScale,
        top - bottom
    ));
    
    // Store normal
    normalMap[id.y * terrainSize + id.x] = packNormal(normal);
}
```

## JavaScript API
```javascript
// Create a procedural terrain
const terrain = engine.terrain.create({
  size: 1024,            // Grid resolution
  worldSize: 2048,       // Size in world units
  heightRange: 200,      // Maximum height
  lodLevels: 8,          // Number of detail levels
  lodTransitionDistance: 50,
  chunkSize: 64,         // Size of each terrain chunk
  materials: [
    {
      name: 'grass',
      albedoMap: engine.textures.load('terrain/grass_albedo.ktx2'),
      normalMap: engine.textures.load('terrain/grass_normal.ktx2'),
      roughnessMap: engine.textures.load('terrain/grass_roughness.ktx2'),
      tiling: 20
    },
    {
      name: 'rock',
      albedoMap: engine.textures.load('terrain/rock_albedo.ktx2'),
      normalMap: engine.textures.load('terrain/rock_normal.ktx2'),
      roughnessMap: engine.textures.load('terrain/rock_roughness.ktx2'),
      tiling: 15
    },
    {
      name: 'sand',
      albedoMap: engine.textures.load('terrain/sand_albedo.ktx2'),
      normalMap: engine.textures.load('terrain/sand_normal.ktx2'),
      roughnessMap: engine.textures.load('terrain/sand_roughness.ktx2'),
      tiling: 25
    }
  ],
  generator: {
    type: 'noise',
    seed: 12345,
    octaves: 6,
    persistence: 0.5,
    lacunarity: 2.0,
    scale: 0.001,
    features: {
      mountains: {
        enabled: true,
        height: 120,
        frequency: 0.0005,
        roughness: 0.7
      },
      erosion: {
        enabled: true,
        iterations: 1000,
        strength: 0.15
      },
      rivers: {
        enabled: true,
        count: 5,
        width: 10,
        depth: 5
      }
    }
  }
});

// Generate the terrain
await terrain.generate();

// Paint terrain layers
terrain.paintMaterial({
  material: 'grass',
  brush: {
    size: 20,
    hardness: 0.7,
    strength: 1.0
  },
  mask: 'slope',
  maskRange: [0, 30] // Degrees
});

// Sculpt terrain
terrain.sculpt({
  operation: 'raise',
  brush: {
    position: [512, 0, 512],
    size: 50,
    falloff: 'smooth',
    strength: 0.2
  }
});

// Runtime terrain modification
engine.onUpdate(() => {
  // Example: Create crater on explosion
  if (explosion) {
    terrain.deform({
      position: explosion.position,
      operation: 'crater',
      radius: explosion.radius * 2,
      depth: explosion.power * 0.5,
      rimHeight: explosion.power * 0.2,
      updateCollision: true
    });
  }
});
```

## Physics Integration
- **Collision Representation**: Optimized terrain collision handling
- **Dynamic Updates**: Efficient collision updates after terrain modification
- **GPU Collision Detection**: Accelerated ray-terrain intersection tests
- **Terrain Destruction**: Physics-driven terrain deformation
- **Vehicle System Integration**: Specialized handling for vehicle movement

## Streaming and Level of Detail
- **Quadtree/Octree Management**: Hierarchical terrain organization
- **Distance-Based LOD**: Detail reduction based on camera distance
- **View-Dependent Tessellation**: Detail concentration in visible areas
- **Progressive Mesh Techniques**: Continuous LOD transitions
- **Streaming System**: Progressive loading of terrain data during gameplay
- **Planetary LOD**: Special LOD techniques for curved planetary surfaces

## Advanced Features
- **Terrain Brushes**: Tools for artistic terrain sculpting and painting
- **Procedural Decorations**: Automatic placement of vegetation and details
- **Weather Effects**: Dynamic snow accumulation, muddy terrain after rain
- **Terrain Analysis**: Slope, height, and curvature analysis for gameplay purposes
- **Instanced Detail Rendering**: Efficient grass and small detail visualization

## Planetary Integration
- **Spherical Terrain**: Mapping height fields onto spherical surfaces
- **Pole Handling**: Special techniques to avoid distortion at poles
- **Continuous Spherical LOD**: Smooth transitions on curved surfaces
- **Planet to Local Mapping**: Converting between planetary and local coordinates
- **Multi-Scale Generation**: Creating detail from planetary scale to centimeter precision

For full planetary rendering capabilities, see the [Planetary Rendering](c:\source\shade\docs\planetary-rendering.md) documentation.
