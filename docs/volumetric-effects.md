# Volumetric Effects

## Overview
Volumetric effects create the illusion of participating media in 3D space, such as fog, clouds, smoke, and light rays. Shade Engine implements these effects using compute shaders and advanced rendering techniques to achieve realistic atmospheric phenomena with high performance.

## Core Volumetric Techniques
- **Ray Marching**: Sampling along view rays through volumes
- **Light Scattering**: Simulating light interaction with particles
- **Noise-Based Generation**: Creating natural-looking volume patterns
- **Temporal Integration**: Accumulating samples over multiple frames
- **View-Adaptive Sampling**: Detail concentration where visually important

## Atmospheric Effects
- **Global Fog**: Distance-based scene fogging
- **Volumetric Fog**: True 3D fog with light interaction
- **Light Shafts**: Crepuscular rays and god rays
- **Sky Rendering**: Physically-based atmosphere simulation
- **Time of Day**: Dynamic lighting changes throughout a day cycle

## Cloud Systems
- **Volumetric Clouds**: 3D raymarched cloud formations
- **Cloud Dynamics**: Wind effects and cloud evolution
- **Cloud Lighting**: Realistic self-shadowing and silver lining
- **Cloud Types**: Various cloud forms (cumulus, stratus, cirrus)
- **Weather Simulation**: Changing cloud patterns based on weather

## Code Example
```wgsl
// Fragment shader for volumetric light scattering
@fragment
fn volumetricLightFs(
    @builtin(position) fragCoord: vec4<f32>,
    @location(0) rayOrigin: vec3<f32>,
    @location(1) rayDir: vec3<f32>,
    @location(2) screenUV: vec2<f32>
) -> @location(0) vec4<f32> {
    // Get scene depth from depth buffer
    let sceneDepth = getSceneDepth(screenUV);
    
    // Calculate ray length based on scene depth
    let rayLength = min(sceneDepth, maxRayLength);
    
    // Ray marching parameters
    let stepSize = rayLength / float(numSteps);
    var accumulatedLight = vec3<f32>(0.0);
    var transmittance = 1.0;
    
    // Current position along the ray
    var currentPos = rayOrigin;
    
    // Raymarch through the volume
    for (var i = 0; i < numSteps; i++) {
        // Sample the density field at this position
        let density = sampleDensityField(currentPos);
        
        // Skip empty space
        if (density > 0.0) {
            // Get light contribution at this sample
            let lightContribution = calculateLightContribution(currentPos, density);
            
            // Calculate extinction for this step
            let extinction = density * stepSize * extinctionFactor;
            
            // Add light contribution attenuated by current transmittance
            accumulatedLight += lightContribution * transmittance * (1.0 - exp(-extinction));
            
            // Update transmittance
            transmittance *= exp(-extinction);
            
            // Early exit if almost fully occluded
            if (transmittance < 0.01) {
                break;
            }
        }
        
        // Move along the ray
        currentPos += rayDir * stepSize;
    }
    
    // Composite with scene
    return vec4<f32>(accumulatedLight, 1.0 - transmittance);
}
```

## Volumetric Effect API
```javascript
// Create a global volumetric fog system
const volumetricFog = engine.fx.createVolumetric({
  type: 'fog',
  resolution: [160, 90, 128], // 3D volume resolution
  temporalFiltering: true,
  temporalFilterStrength: 0.95,
  frustumAligned: true,
  parameters: {
    baseHeight: 0,
    height: 100,
    density: 0.05,
    scattering: 0.2,
    absorption: 0.1,
    anisotropy: 0.3,
    color: [0.9, 0.95, 1.0],
    heightFalloff: 0.1,
    noiseScale: 0.01,
    noiseIntensity: 0.3,
    windDirection: [1, 0, 0],
    windSpeed: 0.5
  }
});

// Create volumetric clouds
const volumetricClouds = engine.fx.createVolumetric({
  type: 'clouds',
  lowResolution: [128, 64, 32],
  highResolution: [256, 128, 64],
  dynamicResolution: true,
  earthRadius: 6371000,
  atmosphereRadius: 6471000,
  cloudLayerStart: 1500,
  cloudLayerThickness: 1500,
  renderDistance: 20000,
  parameters: {
    coverage: 0.6,
    cloudType: 0.5, // 0=stratus, 1=cumulus
    precipitation: 0.0,
    eccentricity: 0.7,
    detailScale: 5.0,
    windSpeed: 30.0,
    windDirection: [1, 0, 0],
    ambientLight: 0.2,
    sunLight: 1.0,
    densityMultiplier: 0.3,
    qualitySteps: 128,
    blueNoise: true
  }
});

// Create volumetric light shafts
const lightShafts = engine.fx.createVolumetric({
  type: 'lightShafts',
  enabled: true,
  resolution: 0.5, // Half resolution
  samples: 64,
  maxDistance: 200,
  density: 0.1,
  decay: 0.95,
  weight: 0.5,
  exposure: 0.2,
  lights: ['directionalLight1', 'spotLight2']
});

// Update volumetric effects
engine.onUpdate(deltaTime => {
  // Update based on weather system
  volumetricClouds.setParameter('coverage', weatherSystem.cloudCoverage);
  volumetricClouds.setParameter('precipitation', weatherSystem.rainfall);
  
  // Update fog based on time of day
  const timeOfDay = dayNightCycle.getTimeNormalized(); // 0-1
  if (timeOfDay < 0.25) { // Dawn
    volumetricFog.setParameter('color', [0.9, 0.7, 0.6]);
    volumetricFog.setParameter('density', 0.08);
  } else if (timeOfDay < 0.75) { // Day
    volumetricFog.setParameter('color', [0.9, 0.95, 1.0]);
    volumetricFog.setParameter('density', 0.03);
  } else { // Dusk/Night
    volumetricFog.setParameter('color', [0.5, 0.5, 0.7]);
    volumetricFog.setParameter('density', 0.1);
  }
});
```

## Local Volumetric Effects
- **Smoke and Fire**: Realistic combustion simulation
- **Explosion Effects**: Dynamic expansion and dissipation
- **Breath and Steam**: Temperature-based condensation
- **Dust and Particles**: Small-scale atmospheric effects
- **Water Spray**: Mist and water particle visualization

## Performance Optimizations
- **Froxel-Based Rendering**: Frustum-aligned voxel optimization
- **Temporal Reprojection**: Accumulating samples across frames
- **Adaptive Sampling**: Concentration of detail where needed
- **Depth-Aware Marching**: Skip occluded volume segments
- **Low-Resolution Upsampling**: Processing at reduced resolution

## Integration with Global Illumination
- **Volumetric Global Illumination**: Light scattering through volumes
- **Light Probes**: Capturing volumetric lighting information
- **Volumetric Shadows**: Proper shadowing within volumes
- **Multiple Scattering Approximation**: Realistic light diffusion
- **Emissive Volumes**: Light emission from volumetric elements
