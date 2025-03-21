# Shader Development

## Overview
Shade Engine uses WebGPU's WGSL shader language for all GPU operations. The shader system provides tools for developing, optimizing, and debugging shaders with a streamlined workflow.

## Shader Architecture
- **Shader Modules**: Reusable shader components
- **Shader Libraries**: Collections of utility functions and constants
- **Pipeline Cache**: Automatic pipeline state object management
- **Hot Reloading**: Development-time shader recompilation

## WGSL Shader Types
- **Vertex Shaders**: Geometry transformation and attribute preparation
- **Fragment Shaders**: Color and lighting computation
- **Compute Shaders**: General-purpose parallel computation
- **Mesh Shaders**: (When supported) Advanced geometry processing
- **Ray Tracing Shaders**: (When supported) Ray intersection and shading

## Shader Features
- **Include System**: Modular shader composition
- **Permutation Generation**: Automatic variant creation for feature toggles
- **Uniform Binding**: Simplified uniform and storage buffer management
- **Texture Binding**: Optimized texture access with automatic layout
- **Shader Reflection**: Automatic extraction of shader inputs/outputs

## Code Example: Material Shader
```wgsl
// Import common utilities
#include "shaders/common/math.wgsl"
#include "shaders/common/brdf.wgsl"
#include "shaders/common/sampling.wgsl"

// Shader inputs
struct VertexInput {
    @location(0) position: vec3<f32>,
    @location(1) normal: vec3<f32>,
    @location(2) texCoord: vec2<f32>,
    @location(3) tangent: vec4<f32>
};

struct VertexOutput {
    @builtin(position) position: vec4<f32>,
    @location(0) worldPos: vec3<f32>,
    @location(1) normal: vec3<f32>,
    @location(2) texCoord: vec2<f32>,
    @location(3) tangent: vec3<f32>,
    @location(4) bitangent: vec3<f32>
};

// Uniform bindings
@group(0) @binding(0) var<uniform> viewProjection: mat4x4<f32>;
@group(0) @binding(1) var<uniform> worldMatrix: mat4x4<f32>;
@group(0) @binding(2) var<uniform> normalMatrix: mat3x3<f32>;

@group(1) @binding(0) var<uniform> material: MaterialUniforms;
@group(1) @binding(1) var albedoTexture: texture_2d<f32>;
@group(1) @binding(2) var normalTexture: texture_2d<f32>;
@group(1) @binding(3) var metallicRoughnessTexture: texture_2d<f32>;
@group(1) @binding(4) var textureSampler: sampler;

// Vertex shader
@vertex
fn vertexMain(input: VertexInput) -> VertexOutput {
    var output: VertexOutput;
    
    // Transform position
    let worldPosition = worldMatrix * vec4<f32>(input.position, 1.0);
    output.position = viewProjection * worldPosition;
    output.worldPos = worldPosition.xyz;
    
    // Transform normal vectors
    output.normal = normalize(normalMatrix * input.normal);
    output.tangent = normalize(normalMatrix * input.tangent.xyz);
    output.bitangent = normalize(cross(output.normal, output.tangent) * input.tangent.w);
    
    // Pass through texture coordinates
    output.texCoord = input.texCoord;
    
    return output;
}

// Fragment shader
@fragment
fn fragmentMain(input: VertexOutput) -> @location(0) vec4<f32> {
    // Sample material textures
    let albedo = textureSample(albedoTexture, textureSampler, input.texCoord).rgb;
    let normalMap = textureSample(normalTexture, textureSampler, input.texCoord).rgb;
    let metallicRoughness = textureSample(metallicRoughnessTexture, textureSampler, input.texCoord);
    
    // Extract material properties
    let metallic = metallicRoughness.b * material.metallicFactor;
    let roughness = metallicRoughness.g * material.roughnessFactor;
    
    // Calculate tangent space normal
    let tangentNormal = normalize(normalMap * 2.0 - 1.0);
    
    // Create TBN matrix
    let tbn = mat3x3<f32>(
        input.tangent,
        input.bitangent,
        input.normal
    );
    
    // Transform normal from tangent to world space
    let worldNormal = normalize(tbn * tangentNormal);
    
    // Calculate lighting (simplified)
    let viewDir = normalize(camera.position - input.worldPos);
    let color = calculatePBRLighting(
        input.worldPos,
        worldNormal,
        viewDir,
        albedo,
        metallic,
        roughness,
        material.emissiveFactor
    );
    
    return vec4<f32>(color, 1.0);
}
```

## Custom Shader API
```javascript
// Create a custom shader
const waterShader = engine.shaders.create({
  name: 'water',
  source: `
    // Water vertex and fragment shaders
    // ...shader code...
  `,
  includes: ['common/math.wgsl', 'common/noise.wgsl'],
  uniforms: {
    waveHeight: 1.0,
    waveSpeed: 2.0,
    waveScale: 3.0,
    time: 0
  }
});

// Create a material using the shader
const waterMaterial = engine.materials.createCustom({
  shader: waterShader,
  uniforms: {
    waveHeight: 0.5,
    waveSpeed: 1.5
  },
  textures: {
    normalMap: engine.textures.load('water_normal.ktx2'),
    foamTexture: engine.textures.load('water_foam.ktx2')
  }
});

// Update shader uniforms each frame
engine.onUpdate(time => {
  waterMaterial.setUniform('time', time);
});
```

## Shader Debugging
- **Shader Validation**: Automatic checking for WGSL syntax and semantic errors
- **GPU Capture**: Integration with browser GPU inspection tools
- **Debug Visualization**: Custom views of intermediate shader results
- **Performance Analysis**: Shader profiling and optimization suggestions

## Visual Shader Editor
```javascript
// Create a node-based shader
const customEffect = engine.shaders.createVisual('customEffect');

// Add nodes
const timeNode = customEffect.addNode('Time');
const sinNode = customEffect.addNode('Math.Sin');
const multiplyNode = customEffect.addNode('Math.Multiply');
const colorNode = customEffect.addNode('Color');
const outputNode = customEffect.addNode('FragmentOutput');

// Connect nodes
timeNode.outputs.time.connectTo(sinNode.inputs.value);
sinNode.outputs.result.connectTo(multiplyNode.inputs.a);
colorNode.outputs.color.connectTo(multiplyNode.inputs.b);
multiplyNode.outputs.result.connectTo(outputNode.inputs.color);

// Set node parameters
colorNode.setParameter('color', [1.0, 0.5, 0.2, 1.0]);

// Export to WGSL
const generatedCode = customEffect.exportWGSL();
```

## Advanced Shader Techniques
- **Shader Instancing**: Parameter variation without shader recompilation
- **Feature Detection**: Automatic shader adaptation to WebGPU capabilities
- **Code Generation**: Templates and macros for complex shader logic
- **Shader Optimization**: Automatic optimization passes for complex shaders
