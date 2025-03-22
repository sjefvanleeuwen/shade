export class Physics {
    constructor(entity, options = {}) {
        this.entity = entity;
        this.scene = entity.scene;
        this.engine = this.scene.engine;
        
        // Basic physics properties
        this.mass = options.mass || 1.0;
        this.useGravity = options.useGravity !== undefined ? options.useGravity : true;
        this.isKinematic = options.isKinematic || false;
        this.isTrigger = options.isTrigger || false;
        
        // Movement properties
        this.velocity = options.velocity || [0, 0, 0];
        this.angularVelocity = options.angularVelocity || [0, 0, 0];
        this.drag = options.drag || 0.1;
        this.angularDrag = options.angularDrag || 0.05;
        
        // Collision detection
        this.collisionShape = options.collisionShape || 'box';
        this.collisionSize = options.collisionSize || [1, 1, 1];
        
        console.log(`Created Physics component for entity ${entity.id}`);
    }
    
    applyForce(force, worldPoint = null) {
        // Simple force application - just modifies velocity directly for now
        this.velocity[0] += force[0] / this.mass;
        this.velocity[1] += force[1] / this.mass;
        this.velocity[2] += force[2] / this.mass;
    }
    
    applyImpulse(impulse) {
        // Instantaneous change in velocity
        this.velocity[0] += impulse[0] / this.mass;
        this.velocity[1] += impulse[1] / this.mass;
        this.velocity[2] += impulse[2] / this.mass;
    }
    
    update(deltaTime) {
        if (this.isKinematic) return; // Kinematic bodies are not affected by physics
        
        const transform = this.entity.getComponent('Transform');
        if (!transform) return;
        
        // Apply gravity
        if (this.useGravity) {
            this.velocity[1] -= 9.8 * deltaTime; // Simple gravity
        }
        
        // Apply drag
        this.velocity[0] *= (1 - this.drag * deltaTime);
        this.velocity[1] *= (1 - this.drag * deltaTime);
        this.velocity[2] *= (1 - this.drag * deltaTime);
        
        // Update position based on velocity
        transform.position[0] += this.velocity[0] * deltaTime;
        transform.position[1] += this.velocity[1] * deltaTime;
        transform.position[2] += this.velocity[2] * deltaTime;
        
        // TODO: Add collision detection and response
    }
    
    dispose() {
        // Clean up resources if needed
    }
}
