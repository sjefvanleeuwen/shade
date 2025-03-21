export class TextureManager {
    constructor(engine) {
        this.engine = engine;
        this.device = engine.renderer.device;
        this.textures = new Map();
        this.samplers = new Map();
        this.defaultSampler = null;
        this.nextId = 1;
        
        this._createDefaultSamplers();
    }
    
    _createDefaultSamplers() {
        // Create commonly used samplers
        this.defaultSampler = this.createSampler({
            addressModeU: 'repeat',
            addressModeV: 'repeat',
            magFilter: 'linear',
            minFilter: 'linear',
            mipmapFilter: 'linear'
        });
        
        this.samplers.set('default', this.defaultSampler);
        
        this.samplers.set('clamp', this.createSampler({
            addressModeU: 'clamp-to-edge',
            addressModeV: 'clamp-to-edge',
            magFilter: 'linear',
            minFilter: 'linear'
        }));
        
        this.samplers.set('nearest', this.createSampler({
            magFilter: 'nearest',
            minFilter: 'nearest'
        }));
    }
    
    async load(path, options = {}) {
        // Check if texture is already loaded
        if (this.textures.has(path)) {
            return this.textures.get(path);
        }
        
        try {
            // Load the image
            const response = await fetch(path);
            const blob = await response.blob();
            const bitmap = await createImageBitmap(blob);
            
            // Create the texture
            const texture = this.createFromBitmap(bitmap, options);
            texture.path = path;
            
            // Store in cache
            this.textures.set(path, texture);
            
            return texture;
        } catch (error) {
            console.error(`Failed to load texture: ${path}`, error);
            throw error;
        }
    }
    
    createFromBitmap(bitmap, options = {}) {
        const id = this.nextId++;
        const format = options.format || 'rgba8unorm';
        
        // Create GPU texture
        const gpuTexture = this.device.createTexture({
            label: options.label || `texture_${id}`,
            size: [bitmap.width, bitmap.height, 1],
            format: format,
            usage: GPUTextureUsage.TEXTURE_BINDING | 
                   GPUTextureUsage.COPY_DST |
                   GPUTextureUsage.RENDER_ATTACHMENT,
            mipLevelCount: options.generateMipmaps ? Math.floor(Math.log2(Math.max(bitmap.width, bitmap.height))) + 1 : 1
        });
        
        // Copy image data to texture
        this.device.queue.copyExternalImageToTexture(
            { source: bitmap },
            { texture: gpuTexture },
            [bitmap.width, bitmap.height]
        );
        
        // Create texture object
        const texture = {
            id,
            gpuTexture,
            width: bitmap.width,
            height: bitmap.height,
            format,
            sampler: options.sampler || this.defaultSampler,
            type: options.type || 'texture2d',
            generateMipmaps: options.generateMipmaps || false
        };
        
        return texture;
    }
    
    createSampler(options = {}) {
        const sampler = this.device.createSampler({
            addressModeU: options.addressModeU || 'repeat',
            addressModeV: options.addressModeV || 'repeat',
            addressModeW: options.addressModeW || 'repeat',
            magFilter: options.magFilter || 'linear',
            minFilter: options.minFilter || 'linear',
            mipmapFilter: options.mipmapFilter || 'linear',
            maxAnisotropy: options.maxAnisotropy || 1
        });
        
        return sampler;
    }
    
    // Creates a bind group for a texture with a cubemap shader
    createCubemapBindGroup(texture, pipeline) {
        return this.device.createBindGroup({
            layout: pipeline.getBindGroupLayout(2), // Group 2 is for textures
            entries: [
                {
                    binding: 0,
                    resource: texture.sampler
                },
                {
                    binding: 1,
                    resource: texture.gpuTexture.createView()
                }
            ]
        });
    }
    
    dispose() {
        // Clean up GPU resources
        for (const texture of this.textures.values()) {
            if (texture.gpuTexture) {
                texture.gpuTexture.destroy();
            }
        }
        
        this.textures.clear();
    }
}
