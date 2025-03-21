# Post-Processing Effects

## Overview
The post-processing system provides screen-space visual effects that enhance the rendered image. Effects are implemented as modular, configurable passes that can be chained together in a flexible post-processing pipeline.

## Core Effects
- **Tone Mapping**: HDR to LDR conversion (ACES, Reinhard, Uncharted 2)
- **Bloom**: Bright spot extraction and blurring for glow effects
- **Depth of Field**: Camera-like focus effects based on depth
- **Motion Blur**: Object and camera motion visualization
- **Screen Space Ambient Occlusion (SSAO)**: Contact shadowing approximation
- **Screen Space Reflections (SSR)**: Dynamic reflections from screen-space data
- **Temporal Anti-Aliasing (TAA)**: Jittered sampling with history reconstruction

## Advanced Effects
- **Color Grading**: LUT-based color transformation
- **Film Grain**: Procedural noise overlay for cinematic looks
- **Chromatic Aberration**: Color separation for lens simulation
- **Vignetting**: Darkened screen corners
- **Lens Distortion**: Barrel and pincushion distortion effects
- **Outline Detection**: Object highlighting and cartoon effects

## Pipeline Architecture
- **Effect Nodes**: Individual GPU-accelerated effect implementations
- **Render Targets**: Smart render target allocation and reuse
- **Adaptive Resolution**: Dynamic resolution scaling for expensive effects
- **Effect Groups**: Logical organization of effects with shared parameters

## Performance Considerations
- **Half-Precision Processing**: Using 16-bit formats for compatible effects
- **Mip-Chain Utilization**: Optimal downsampling for multi-resolution effects
- **Compute Shader Implementations**: Faster alternatives to fragment shaders
- **Temporal Accumulation**: Amortizing effect cost over multiple frames

## Code Example
```wgsl
// Bloom threshold and combine fragment shader
@fragment
fn fragmentMain(
    @location(0) texCoord: vec2<f32>
) -> @location(0) vec4<f32> {
    // Sample scene color
    let sceneColor = textureSample(sceneTexture, texSampler, texCoord);
    
    // Sample bloom texture (already processed through multiple blur passes)
    let bloom = textureSample(bloomTexture, texSampler, texCoord);
    
    // Calculate scene luminance
    let luminance = dot(sceneColor.rgb, vec3<f32>(0.299, 0.587, 0.114));
    
    // Apply threshold and soft knee
    let threshold = uniforms.bloomThreshold;
    let knee = uniforms.bloomKnee * threshold;
    let soft = luminance - threshold + knee;
    let contribution = max(soft, 0.0) * soft / (2.0 * knee + 0.00001);
    let contribution = max(luminance - threshold, 0.0);
    
    // Combine bloom with scene color
    let bloomIntensity = uniforms.bloomIntensity;
    var finalColor = sceneColor.rgb + bloom.rgb * bloomIntensity;
    
    return vec4<f32>(finalColor, sceneColor.a);
}
```

## Setup API
```javascript
// Create a post-processing stack
const postProcess = engine.createPostProcess();

// Add effects with configuration
postProcess.addEffect('bloom', {
  threshold: 1.0,
  intensity: 0.8,
  knee: 0.5,
  radius: 0.4,
  quality: 'medium',  // 'low', 'medium', 'high'
  mipCount: 6
});

postProcess.addEffect('ssao', {
  radius: 0.5,
  bias: 0.025,
  intensity: 1.0,
  quality: 'medium',
  blurPasses: 2
});

postProcess.addEffect('tonemap', {
  method: 'aces',  // 'aces', 'reinhard', 'uncharted2', 'filmic'
  exposure: 1.0,
  contrast: 1.0,
  saturation: 1.0
});

// Apply the post-processing to rendering
engine.render(scene, camera, {
  postProcess: postProcess
});
```

## Customization
```javascript
// Create a custom post-processing effect
postProcess.createCustomEffect({
  name: 'pixelate',
  fragment: `
    @fragment
    fn fragmentMain(@location(0) texCoord: vec2<f32>) -> @location(0) vec4<f32> {
      let pixelSize = vec2<f32>(uniforms.pixelWidth, uniforms.pixelHeight);
      let uv = floor(texCoord / pixelSize) * pixelSize;
      return textureSample(inputTexture, texSampler, uv);
    }
  `,
  uniforms: {
    pixelWidth: 0.01,
    pixelHeight: 0.01
  }
});
```
