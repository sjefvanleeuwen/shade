# Planetary Rendering

## Overview
Shade Engine supports rendering and simulation of large-scale planetary bodies, from small asteroids to full-sized planets. The planetary system handles curved surfaces, global navigation, atmospheric effects, and the unique challenges of rendering at vastly different scales.

## Planetary Representation
- **Curved Surface Generation**: Spherical or ellipsoidal terrain generation
- **Layered Structure**: Core, mantle, crust, ocean, and atmosphere simulation
- **Quadtree/Octree Planetary LOD**: Level of detail management for planetary surfaces
- **Procedural Details**: Surface features generated at multiple scales

## Core Technologies
- **Spherical Coordinate Systems**: Navigation and positioning on curved surfaces
- **Curved Surface Physics**: Gravity fields and object interaction on planets
- **Horizon Culling**: Visibility determination considering planetary curvature
- **Scale Management**: Handling precision issues with planetary-scale coordinates
- **Planetary Atmosphere**: Atmospheric scattering and volumetric cloud systems

## Implementation Approaches
- **Unified Sphere**: Classic spherical planet representation with height fields
- **Cube-to-Sphere Mapping**: Six-face cube projected onto a sphere for simpler UV mapping
- **CDLOD (Continuous Distance Level of Detail)**: Smooth LOD transitions across vast distances
- **Patch-Based System**: Planet surface divided into manageable terrain patches
- **Clipmap-Based Approach**: Concentric rings of detail centered on the viewer

## Code Example
```wgsl
// Compute shader for planet LOD selection
@compute @workgroup_size(8, 8, 1)
fn planetLODSelection(
    @builtin(global_invocation_id) id: vec3<u32>
) {
    if (id.x >= patchGridSize || id.y >= patchGridSize) {
        return;
    }
    
    // Get patch information
    let patchIndex = id.y * patchGridSize + id.x;
    let patchCenter = patchCenters[patchIndex];
    let patchRadius = patchRadii[patchIndex];
    
    // Calculate distance to camera
    let distanceToCamera = distance(patchCenter, cameraPosition) - patchRadius;
    
    // Consider planet curvature for horizon culling
    let planetCenter = vec3<f32>(0.0, 0.0, 0.0); // Assuming planet at origin
    let cameraToPlanetCenter = planetCenter - cameraPosition;
    let distToPlanetCenter = length(cameraToPlanetCenter);
    let planetRadius = planetParameters.radius;
    
    // Horizon culling - determine if patch is beyond the horizon
    let patchToPlanetCenter = planetCenter - patchCenter;
    let cameraToPatchDir = normalize(patchCenter - cameraPosition);
    let cameraToCenter = normalize(cameraToPlanetCenter);
    let horizonCosAngle = sqrt(1.0 - (planetRadius * planetRadius) / (distToPlanetCenter * distToPlanetCenter));
    let patchCosAngle = dot(cameraToCenter, cameraToPatchDir);
    
    // Skip if patch is beyond horizon and not in space
    if (patchCosAngle < horizonCosAngle && distToPlanetCenter > planetRadius) {
        patchVisibility[patchIndex] = 0u;
        return;
    }
    
    // Calculate LOD level based on distance
    let lodLevel = calculateLODLevel(distanceToCamera, planetParameters.lodDistances);
    
    // Store results
    patchLODs[patchIndex] = lodLevel;
    patchVisibility[patchIndex] = 1u;
    
    // Setup morph factor for smooth transitions
    let lodDistance = planetParameters.lodDistances[lodLevel];
    let nextLodDistance = planetParameters.lodDistances[min(lodLevel + 1u, planetParameters.numLodLevels - 1u)];
    let morphFactor = calculateMorphFactor(distanceToCamera, lodDistance, nextLodDistance);
    patchMorphFactors[patchIndex] = morphFactor;
}
```

## JavaScript API
```javascript
// Create a planetary body
const earth = engine.createPlanet({
  radius: 6371000, // meters
  atmosphereHeight: 100000, // meters
  oceanLevel: -1, // Below surface (none for Earth)
  rotationPeriod: 24, // hours
  baseTextures: {
    albedo: engine.textures.load('planets/earth/albedo.ktx2'),
    normal: engine.textures.load('planets/earth/normal.ktx2'),
    heightMap: engine.textures.load('planets/earth/height.ktx2'),
    roughness: engine.textures.load('planets/earth/roughness.ktx2')
  },
  heightScale: 20000, // Height map amplification
  generator: {
    type: 'procedural',
    seed: 12345,
    detailNoise: true,
    features: {
      continents: true,
      mountains: true,
      oceans: false,
      craters: false,
      rivers: true
    },
    biomes: [
      {
        name: 'mountains',
        elevationRange: [0.7, 1.0],
        roughness: 0.8,
        materials: ['rockSnow', 'rock']
      },
      {
        name: 'plains',
        elevationRange: [0.3, 0.7],
        roughness: 0.3,
        materials: ['grass', 'dirt']
      },
      {
        name: 'beaches',
        elevationRange: [0.15, 0.3],
        roughness: 0.1,
        materials: ['sand']
      }
      // Additional biomes...
    ]
  },
  atmosphere: {
    enabled: true,
    rayleighScattering: [5.802, 13.558, 33.1],
    mieScattering: 3.996,
    mieDirection: 0.8,
    innerRadius: 6371000, // Earth surface
    outerRadius: 6471000, // Atmosphere boundary
    sunIntensity: 20
  },
  clouds: {
    enabled: true,
    coverage: 0.5,
    altitude: 5000,
    thickness: 3000,
    density: 0.3,
    precipitation: 0.2,
    windSpeed: 30,
    windDirection: [1, 0, 0]
  },
  lod: {
    technique: 'quadtree',
    maxLevels: 20,
    distanceRatio: 2.0, // Each LOD level has twice the range of the previous
    patchResolution: 64, // Grid size per patch
    morphing: true // Smooth LOD transitions
  }
});

// Configure camera for planetary rendering
camera.configurePlanetaryView({
  nearPlane: 1.0, // Very close near plane
  farPlane: 10000000, // Very far plane for space
  logarithmicDepthBuffer: true, // Handle vastly different scales
  zUpOnSurface: true, // Maintain "up" relative to planet surface
  heightOffset: 1.8, // Camera height when on surface
  atmosphericScattering: true // Enable atmospheric rendering
});

// Create planetary orbit
const orbit = engine.createOrbit({
  centralBody: earth,
  semiMajorAxis: 7371000, // 1000km above surface
  eccentricity: 0.0, // Circular orbit
  inclination: 45, // Degrees
  revolutionPeriod: 90 // Minutes
});

// Place camera in orbit
camera.attachToOrbit(orbit, {
  position: 0, // Position along orbit (0-1)
  lookAt: 'centralBody', // Look at Earth
  autoRotate: true // Follow orbit automatically
});

// Teleport player to planet surface
player.teleportToPlanet(earth, {
  latitude: 45.0, // Degrees north
  longitude: -122.0, // Degrees west
  altitude: 100, // Meters above surface
  alignToSurface: true // Orient player with surface normal as "up"
});
```

## Rendering System Integration
- **Multi-Scale Rendering**: Different techniques at different distances
- **Planetary Impostor**: Simplified representation for extreme distances
- **Space Background**: Star field and distant celestial objects
- **Orbital Mechanics**: Calculation of object trajectories in space
- **Day/Night Cycle**: Dynamic lighting based on position relative to stars

## Navigation and Gameplay
- **Planetary Coordinates**: Converting between Cartesian and spherical coordinates
- **Surface Movement**: Walking/driving on curved planetary surfaces
- **Orbital Movement**: Spacecraft navigation in planetary orbit
- **Atmospheric Flight**: Aerodynamics within planetary atmospheres
- **Seamless Transitions**: Moving from surface to orbit to space

## Scale Considerations
- **Floating-Point Precision**: Handling coordinate precision at planetary scales
- **Relative Coordinates**: Local coordinate systems for precision-sensitive operations
- **LOD Scales**: Managing level of detail across 6+ orders of magnitude
- **Physics Scales**: Adapting physics simulation for planetary gravity and scale
- **View Ranges**: Handling vastly different view distances from surface to space

## Advanced Features
- **Multi-Planet Systems**: Star systems with multiple planets
- **Interplanetary Travel**: Moving between planetary bodies
- **Planetary Deformation**: Runtime modification of planetary surfaces
- **Procedural Ecosystems**: Biome-based planetary life simulation
- **Weather Systems**: Global and local weather patterns
