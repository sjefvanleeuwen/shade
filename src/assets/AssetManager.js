export class AssetManager {
    constructor(engine) {
        this.engine = engine;
        this.assets = new Map();
        this.loaders = new Map();
        this.pendingLoads = new Map();
    }
    
    // Register a loader for a specific asset type
    registerLoader(type, loader) {
        this.loaders.set(type, loader);
    }
    
    // Load an asset with automatic type detection
    async load(path, options = {}) {
        // If already loaded, return the asset
        if (this.assets.has(path)) {
            return this.assets.get(path);
        }
        
        // If already loading, return the pending promise
        if (this.pendingLoads.has(path)) {
            return this.pendingLoads.get(path);
        }
        
        // Determine asset type from extension
        const extension = path.split('.').pop().toLowerCase();
        let type;
        
        switch (extension) {
            case 'png':
            case 'jpg':
            case 'jpeg':
            case 'webp':
            case 'ktx2':
                type = 'texture';
                break;
            case 'glb':
            case 'gltf':
            case 'obj':
                type = 'model';
                break;
            case 'mp3':
            case 'wav':
            case 'ogg':
                type = 'audio';
                break;
            default:
                throw new Error(`Unknown asset type for extension: ${extension}`);
        }
        
        // Check if we have a loader for this type
        if (!this.loaders.has(type)) {
            throw new Error(`No loader registered for asset type: ${type}`);
        }
        
        // Create a load promise
        const loadPromise = new Promise(async (resolve, reject) => {
            try {
                // In a real implementation, this would use the appropriate loader
                console.log(`Loading ${type} asset: ${path}`);
                
                // Simulate loading delay
                await new Promise(r => setTimeout(r, 100));
                
                // Create a placeholder asset based on type
                let asset;
                
                if (type === 'texture') {
                    asset = { 
                        type: 'texture',
                        path,
                        width: 512,
                        height: 512,
                        format: 'rgba8unorm'
                    };
                } else if (type === 'model') {
                    asset = {
                        type: 'model',
                        path,
                        meshes: [],
                        materials: []
                    };
                } else if (type === 'audio') {
                    asset = {
                        type: 'audio',
                        path,
                        duration: 0
                    };
                }
                
                // Store and return the asset
                this.assets.set(path, asset);
                this.pendingLoads.delete(path);
                resolve(asset);
                
            } catch (error) {
                this.pendingLoads.delete(path);
                reject(error);
            }
        });
        
        // Store the pending load
        this.pendingLoads.set(path, loadPromise);
        
        return loadPromise;
    }
    
    // Get an already loaded asset
    get(path) {
        return this.assets.get(path);
    }
    
    // Unload an asset to free resources
    unload(path) {
        if (this.assets.has(path)) {
            // In a real implementation, this would clean up GPU resources
            console.log(`Unloading asset: ${path}`);
            this.assets.delete(path);
        }
    }
    
    // Unload all assets
    unloadAll() {
        for (const path of this.assets.keys()) {
            this.unload(path);
        }
    }
    
    dispose() {
        this.unloadAll();
        this.loaders.clear();
        this.pendingLoads.clear();
    }
}
