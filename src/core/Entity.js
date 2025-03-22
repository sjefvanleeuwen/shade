import { MeshRenderer } from '../render/MeshRenderer.js';
import { Rotator } from '../components/Rotator.js';

export class Entity {
    constructor(scene, id, name) {
        this.scene = scene;
        this.id = id;
        this.name = name;
        this.components = new Map();
        this.active = true;
    }
    
    addComponent(type, properties = {}) {
        // First check if the engine has a component factory for this type
        if (this.scene.engine.componentFactories && this.scene.engine.componentFactories.has(type)) {
            const factory = this.scene.engine.componentFactories.get(type);
            const component = factory(this, properties);
            this.components.set(type, component);
            return component;
        }
        
        // If no factory exists, create specific component instances based on type
        let component;
        
        switch (type) {
            case 'Transform':
                component = {
                    type,
                    entity: this,
                    position: properties.position || [0, 0, 0],
                    rotation: properties.rotation || [0, 0, 0, 1], // Quaternion
                    scale: properties.scale || [1, 1, 1],
                    rotationMatrix: [
                        1, 0, 0, 0,
                        0, 1, 0, 0,
                        0, 0, 1, 0,
                        0, 0, 0, 1
                    ], // Identity matrix by default
                    ...properties
                };
                break;
                
            case 'MeshRenderer':
                component = new MeshRenderer(this, {
                    mesh: properties.mesh,
                    material: properties.material
                });
                break;
                
            case 'Rotator':
                component = new Rotator(this, {
                    axis: properties.axis || [0, 1, 0],
                    speed: properties.speed || 1.0
                });
                break;
                
            case 'DirectionalLight':
                component = {
                    type,
                    entity: this,
                    color: properties.color || [1, 1, 1],
                    intensity: properties.intensity || 1.0,
                    ...properties
                };
                break;
                
            default:
                // Generic component
                component = {
                    type,
                    entity: this,
                    ...properties
                };
        }
        
        this.components.set(type, component);
        return component;
    }
    
    getComponent(type) {
        return this.components.get(type);
    }
    
    hasComponent(type) {
        return this.components.has(type);
    }
    
    removeComponent(type) {
        const component = this.getComponent(type);
        if (component) {
            // Call component disposal if it exists
            if (component.dispose) {
                component.dispose();
            }
            this.components.delete(type);
        }
    }
    
    update(deltaTime) {
        if (!this.active) return;
        
        // Update all components
        for (const component of this.components.values()) {
            if (component.update) {
                component.update(deltaTime);
            }
        }
    }
    
    setActive(active) {
        this.active = active;
    }
    
    dispose() {
        // Remove all components
        for (const type of this.components.keys()) {
            this.removeComponent(type);
        }
        this.components.clear();
    }
}
