# Texture Compression

## Overview
Efficient texture compression is essential for managing memory usage and optimizing asset delivery in WebGPU applications. Shade Engine supports multiple GPU-native compression formats and provides tools for optimal texture processing.

## Supported Formats
- **KTX2/Basis Universal**: Cross-platform supercompressed textures
- **BCn/DXT**: DirectX texture compression formats (BC1/DXT1, BC3/DXT5, etc.)
- **ASTC**: Advanced Scalable Texture Compression (for compatible hardware)
- **ETC2/EAC**: Ericsson Texture Compression (for mobile GPU support)
- **WebP**: For UI elements and non-GPU-native compression

## Format Selection System
- **Automatic Format Detection**: Optimal format selection based on content type
- **Quality Presets**: Balanced, high-quality, and performance-optimized settings
- **Hardware Adaptation**: Format fallbacks based on device capabilities
- **Content-Aware Compression**: Different strategies for normal maps, HDR, etc.

## Mipmap Generation
- **High-Quality Filtering**: Kaiser filters for sharper mipmaps
- **Normal Map Preservation**: Specialized filtering for normal maps
- **Mipmap Streaming**: Progressive loading from low to high resolution
- **Custom Base Level**: Optimized starting mipmap level for different device tiers

## Code Example
```javascript
// Configure texture compression settings
engine.textures.setCompressionOptions({
  defaultFormat: 'auto', // 'auto', 'ktx2', 'bc3', 'astc', 'etc2'
  qualityLevel: 'balanced', // 'performance', 'balanced', 'quality'
  normalMapCompression: 'high', // Special handling for normal maps
  forceGPUOptimizedFormat: true,
  mipmapFilter: 'kaiser',
  generateMipmaps: true,
  textureArrays: true, // Use texture arrays when possible
  fallbackChain: ['astc', 'bc3', 'etc2', 'uncompressed']
});

// Load a texture with specific settings
const texture = engine.textures.load('textures/brick_diffuse.ktx2', {
  addressModeU: 'repeat',
  addressModeV: 'repeat',
  minFilter: 'linear-mipmap-linear',
  magFilter: 'linear',
  anisotropy: 16,
  srgb: true,
  premultiplyAlpha: false,
  priority: 'high'
});

// Create a compressed texture from raw data
const rawTexture = engine.textures.createFromPixels({
  width: 1024,
  height: 1024,
  format: 'rgba8unorm',
  data: pixelData,
  compress: true,
  compressionFormat: 'ktx2',
  generateMipmaps: true
});

// Apply texture compression to an existing texture
const compressedTexture = engine.textures.compress(originalTexture, {
  format: 'bc7',
  quality: 'high',
  mipmaps: true
});
```

## Texture Arrays and Atlases
- **Array Generation**: Efficient packing of similar textures
- **Atlas Packing**: Intelligent texture atlas creation
- **Border Padding**: Proper handling of texture filtering at edges
- **Channels Packing**: Combining multiple maps in different channels
- **Virtual Texturing**: Streaming for extremely large textures

## Memory Management
- **Streaming System**: Progressive loading of texture data
- **Resolution Scaling**: Dynamic adjustment based on device capabilities
- **Texture Pool**: Resource reuse and lifecycle management
- **Cache Optimization**: Intelligent caching of compressed textures
- **Memory Budget**: Automatic management within memory constraints

## Preprocessing Pipeline
- **Texture Analysis**: Content-based format recommendation
- **Batch Processing**: Efficient handling of multiple textures
- **Compression Previews**: Visual quality comparison tools
- **CI/CD Integration**: Automated texture processing in build pipelines
- **Format Conversion**: Automatic conversion from source formats

## Advanced Features
- **HDR Compression**: Efficient handling of high dynamic range textures
- **Cubemap Optimization**: Specialized handling for environment maps
- **Texture Transcoding**: Runtime format conversion for compatibility
- **Texture Synthesis**: Procedural expansion of texture data
- **Detail Texturing**: Multi-scale texturing with minimal memory impact
