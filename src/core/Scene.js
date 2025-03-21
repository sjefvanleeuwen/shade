import { Entity } from './Entity.js';

export class Scene {
    constructor(engine) {
        this.engine = engine;
        this.entities = new Map();
        this.nextEntityId = 1;
        
        // Lighting and environment
        this.ambientLight = {
            color: [0.1, 0.1, 0.1],
            intensity: 0.5
        };
        
        // Spatial structure for scene organization
        this.spatialStructure = null; // Will be implemented later
    }
    
    createEntity(name = '') {
        const id = this.nextEntityId++;
        const entity = new Entity(this, id, name || `Entity_${id}`);
        this.entities.set(id, entity);
        return entity;
    }
    
    getEntity(id) {
        return this.entities.get(id);
    }
    
    removeEntity(id) {
        const entity = this.getEntity(id);
        if (entity) {
            entity.dispose();
            this.entities.delete(id);
        }
    }
    
    getEntitiesByComponent(componentType) {
        const result = [];
        for (const entity of this.entities.values()) {
            if (entity.hasComponent(componentType)) {
                result.push(entity);
            }
        }
        return result;
    }
    
    update(deltaTime) {
        // Update all entities
        for (const entity of this.entities.values()) {
            entity.update(deltaTime);
        }
        
        // Force update all MeshRenderers directly to ensure they update
        const meshEntities = this.getEntitiesByComponent('MeshRenderer');
        for (const entity of meshEntities) {
            const meshRenderer = entity.getComponent('MeshRenderer');
            if (meshRenderer && meshRenderer.update) {
                meshRenderer.update(deltaTime);
            }
        }
        
        // Update spatial structure if needed
        if (this.spatialStructure) {
            this.spatialStructure.update();
        }
    }
    
    dispose() {
        // Dispose all entities
        for (const entity of this.entities.values()) {
            entity.dispose();
        }
        this.entities.clear();
        
        // Dispose spatial structure
        if (this.spatialStructure) {
            this.spatialStructure.dispose();
            this.spatialStructure = null;
        }
    }
}
