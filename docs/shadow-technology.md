# Shadow Technology

## Overview
Shade Engine implements multiple shadow techniques that run entirely on the GPU, offering a balance between visual quality and performance. The engine supports dynamic shadows for all light types with configurable quality settings.

## Shadow Map Techniques
- **Cascaded Shadow Maps (CSM)**: Multi-resolution shadow maps for directional lights
- **Percentage Closer Filtering (PCF)**: Soft shadow edges with variable kernel sizes
- **Variance Shadow Maps (VSM)**: Blur-friendly shadow representation for softer shadows
- **Exponential Shadow Maps (ESM)**: Fast approximation with minimal artifacts
- **Contact-Hardening Shadows**: Distance-based shadow softness

## Optimization Strategies
- **Culling Masks**: Per-object shadow casting/receiving flags
- **Resolution Control**: Dynamic resolution based on distance and importance
- **GPU Frustum Splitting**: Compute shader-based cascade partitioning
- **Temporal Stability**: Jittering and history-based stabilization
- **Perspective Shadow Maps**: Warping technique for better use of shadow resolution

## Special Light Types
- **Point Light Shadows**: Omnidirectional shadow maps using cubemaps
- **Spot Light Shadows**: Perspective projections with distance-based filtering
- **Area Light Shadows**: Approximated using multiple samples or PCSS

## Code Example
```wgsl
// Fragment shader shadow sampling with PCF
fn sampleShadowPCF(lightSpacePosition: vec3<f32>, shadowMap: texture_depth_2d, 
                  shadowSampler: sampler_comparison) -> f32 {
    // Convert to UV coordinates
    var shadowCoord = lightSpacePosition.xyz * 0.5 + 0.5;
    
    // Early exit if outside shadow map
    if (shadowCoord.x < 0.0 || shadowCoord.x > 1.0 || 
        shadowCoord.y < 0.0 || shadowCoord.y > 1.0) {
        return 1.0;
    }
    
    // Determine texel size for PCF kernel
    let texelSize = 1.0 / vec2<f32>(textureDimensions(shadowMap, 0));
    
    // Perform PCF filtering
    var shadow = 0.0;
    let pcfRadius = 2;
    
    for (var y = -pcfRadius; y <= pcfRadius; y++) {
        for (var x = -pcfRadius; x <= pcfRadius; x++) {
            let offset = vec2<f32>(f32(x), f32(y)) * texelSize;
            shadow += textureSampleCompare(
                shadowMap,
                shadowSampler,
                shadowCoord.xy + offset,
                shadowCoord.z - 0.001 // Bias to prevent shadow acne
            );
        }
    }
    
    shadow /= f32((pcfRadius * 2 + 1) * (pcfRadius * 2 + 1));
    return shadow;
}
```

## Advanced Features
- **Screen Space Shadows**: Fine detail shadows for small features
- **Ray-Traced Shadow Options**: Integration with WebGPU ray tracing when available
- **Shadow Caching**: Reuse of shadow maps for static objects
- **Filtered Shadow Maps**: Pre-filtered shadow maps for improved quality/performance

## Configuration Example
```javascript
// Configure shadow settings for a directional light
const directionalLight = scene.createEntity();
directionalLight.addComponent('DirectionalLight', {
  castShadows: true,
  shadowMapSize: 2048,
  cascades: 4,
  cascadeDistribution: [0.1, 0.3, 0.6, 1.0],
  filterMode: 'pcf',
  pcfKernelSize: 5,
  stabilization: true,
  biasAdjustment: 0.0005
});

// Configure global shadow settings
engine.renderer.shadows.configure({
  enabled: true,
  defaultMapSize: 1024,
  maxCascadesPerLight: 4,
  autoAdjustCascades: true,
  fadeTransitions: true,
  cullingStrategy: 'frustumAndDistance'
});
```
