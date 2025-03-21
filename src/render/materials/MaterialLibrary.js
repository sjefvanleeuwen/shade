export class MaterialLibrary {
    constructor(engine) {
        this.engine = engine;
        this.materials = new Map();
        this.nextId = 1;
    }
    
    createBasic(options = {}) {
        const id = this.nextId++;
        const material = {
            id,
            type: 'basic',
            color: options.color || [1, 1, 1],
            wireframe: options.wireframe || false,
            transparent: options.transparent || false,
            opacity: options.opacity !== undefined ? options.opacity : 1.0,
            
            // In a full implementation, this would contain shader info, pipeline state, etc.
            _updatePipeline: function() {
                // This would create/update the WebGPU pipeline for this material
                console.log('Updating pipeline for basic material', this.id);
            }
        };
        
        this.materials.set(id, material);
        return material;
    }
    
    createPBR(options = {}) {
        const id = this.nextId++;
        const material = {
            id,
            type: 'pbr',
            baseColor: options.baseColor || [1, 1, 1],
            metallic: options.metallic !== undefined ? options.metallic : 0.0,
            roughness: options.roughness !== undefined ? options.roughness : 0.5,
            normalScale: options.normalScale || 1.0,
            emissive: options.emissive || [0, 0, 0],
            emissiveIntensity: options.emissiveIntensity || 0.0,
            transparent: options.transparent || false,
            opacity: options.opacity !== undefined ? options.opacity : 1.0,
            
            // In a full implementation, this would handle textures and more complex properties
            _updatePipeline: function() {
                // This would create/update the WebGPU pipeline for this material
                console.log('Updating pipeline for PBR material', this.id);
            }
        };
        
        this.materials.set(id, material);
        return material;
    }
    
    get(id) {
        return this.materials.get(id);
    }
    
    dispose() {
        // Clean up WebGPU resources
        this.materials.clear();
    }
}
