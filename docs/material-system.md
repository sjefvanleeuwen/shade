# Material System

## Overview
The material system in Shade Engine provides a flexible framework for representing surface properties and shader variations. Materials define how surfaces interact with light and other environmental factors, controlling visual appearance across the engine.

## Core Material Types

### Standard Material
The `StandardMaterial` provides physically-based rendering with standard UV texture mapping:
- **Albedo/Base Color**: Surface color or texture
- **Normal Mapping**: Surface detail without geometry
- **Roughness**: Micro-surface variation control
- **Metallic**: Metal vs. non-metal properties
- **Emissive**: Self-illumination properties
- **Opacity**: Transparency control

### Cubemap Material
The `CubemapMaterial` enables environment mapping using a single 2D texture projected as a cubemap:
- **Texture Projection**: Dynamic projection of 2D textures onto 3D surfaces
- **Environment Reflection**: Simulating reflective surfaces
- **Flexible Mapping**: Different projection modes for various effects

### PBR Material
The Physically-Based Rendering material provides realistic lighting across different lighting conditions:
- **Energy Conservation**: Physically accurate light interaction
- **Microfacet Theory**: Accurate microsurface modeling
- **Fresnel Effects**: View-dependent reflection
- **Specular vs. Metallic Workflows**: Support for both industry standards

### Specialized Materials
- **Terrain Material**: Multi-layer blending for landscape rendering
- **Skin Material**: Sub-surface scattering for organic surfaces
- **Cloth Material**: Anisotropic shading models for fabrics
- **Water Material**: Dynamic surface simulation and optical effects

## Architecture

```mermaid
classDiagram
    class Material {
        +id: string
        +type: string
        +pipeline: GPURenderPipeline
        +bindGroup: GPUBindGroup
        +modelBindGroup: GPUBindGroup
        +updateModelUniforms(transform)
        +dispose()
    }
    
    class BaseMaterial {
        +color: vec3
        +opacity: float
        +wireframe: boolean
    }
    
    class StandardMaterial {
        +texture: Texture
        +normalMap: Texture
        +roughnessMap: Texture
        +metallicMap: Texture
        +uvTransform: mat3
        +setTexture(texture)
        +createPipeline()
    }
    
    class CubemapMaterial {
        +texture: Texture
        +reflection: float
        +textureMatrix: mat4
        +setTexture(texture)
        +createPipeline()
    }
    
    class PBRMaterial {
        +baseColor: vec3
        +metallic: float
        +roughness: float
        +normalScale: float
        +emissive: vec3
        +occlusion: float
        +createPipeline()
    }
    
    class MaterialLibrary {
        +materials: Map
        +createBasic()
        +createPBR()
        +get(id)
        +dispose()
    }
    
    Material <|-- BaseMaterial
    BaseMaterial <|-- StandardMaterial
    Material <|-- CubemapMaterial
    Material <|-- PBRMaterial
    MaterialLibrary o-- Material
```

## Shader Architecture
Materials integrate directly with the shader system, using WebGPU shader modules:

```mermaid
flowchart TD
    A[Material Definition] --> B[Shader Compilation]
    B --> C[Pipeline Creation]
    C --> D[Bind Group Setup]
    
    E[Vertex Shader] --> B
    F[Fragment Shader] --> B
    G[Material Parameters] --> D
    H[Textures] --> D
    
    subgraph Rendering
        I[Material Instance] --> J[Draw Call]
        D --> I
    end
```

## Material Pipeline Integration

Materials encapsulate complete render pipeline states including:
- Shader modules for vertex and fragment stages
- Blend states for transparency
- Depth/stencil configuration
- Binding layouts for uniforms and textures
- Sampler configurations

## Uniform Buffer Layout

### Model Uniforms (Group 1, Binding 0)
