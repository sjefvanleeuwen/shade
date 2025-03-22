export class Collision {
    constructor(entity, options = {}) {
        this.entity = entity;
        this.scene = entity.scene;
        this.engine = this.scene.engine;
        
        // Collision properties
        this.shape = options.shape || 'box';
        this.size = options.size || [1, 1, 1];
        this.offset = options.offset || [0, 0, 0];
        this.isTrigger = options.isTrigger || false;
        
        // Collision state
        this.isColliding = false;
        this.collidingWith = new Set();
        
        // Collision callbacks
        this.onCollisionEnter = options.onCollisionEnter || null;
        this.onCollisionStay = options.onCollisionStay || null;
        this.onCollisionExit = options.onCollisionExit || null;
        
        console.log(`Created Collision component for entity ${entity.id}`);
    }
    
    // Check collision against another collider
    checkCollision(other) {
        if (this.shape === 'box' && other.shape === 'box') {
            return this.checkBoxBoxCollision(other);
        }
        // Add other shape combinations as needed
        return false;
    }
    
    checkBoxBoxCollision(other) {
        const transformA = this.entity.getComponent('Transform');
        const transformB = other.entity.getComponent('Transform');
        
        if (!transformA || !transformB) return false;
        
        // Calculate world positions with offsets
        const posA = [
            transformA.position[0] + this.offset[0],
            transformA.position[1] + this.offset[1],
            transformA.position[2] + this.offset[2]
        ];
        
        const posB = [
            transformB.position[0] + other.offset[0],
            transformB.position[1] + other.offset[1],
            transformB.position[2] + other.offset[2]
        ];
        
        // Calculate half sizes
        const halfSizeA = [
            this.size[0] * transformA.scale[0] / 2,
            this.size[1] * transformA.scale[1] / 2,
            this.size[2] * transformA.scale[2] / 2
        ];
        
        const halfSizeB = [
            other.size[0] * transformB.scale[0] / 2,
            other.size[1] * transformB.scale[1] / 2,
            other.size[2] * transformB.scale[2] / 2
        ];
        
        // Check for overlap in all three axes
        return (
            Math.abs(posA[0] - posB[0]) < (halfSizeA[0] + halfSizeB[0]) &&
            Math.abs(posA[1] - posB[1]) < (halfSizeA[1] + halfSizeB[1]) &&
            Math.abs(posA[2] - posB[2]) < (halfSizeA[2] + halfSizeB[2])
        );
    }
    
    update(deltaTime) {
        // Get all entities with collision components
        const collisionEntities = this.scene.getEntitiesByComponent('Collision');
        
        // Track entities we're currently colliding with this frame
        const currentCollisions = new Set();
        
        // Check collision against all other colliders
        for (const otherEntity of collisionEntities) {
            // Skip self
            if (otherEntity === this.entity) continue;
            
            const otherCollider = otherEntity.getComponent('Collision');
            
            if (this.checkCollision(otherCollider)) {
                // We have a collision
                currentCollisions.add(otherEntity.id);
                
                if (!this.collidingWith.has(otherEntity.id)) {
                    // New collision
                    if (this.onCollisionEnter) {
                        this.onCollisionEnter(otherEntity);
                    }
                } else {
                    // Ongoing collision
                    if (this.onCollisionStay) {
                        this.onCollisionStay(otherEntity);
                    }
                }
            }
        }
        
        // Check for ended collisions
        for (const entityId of this.collidingWith) {
            if (!currentCollisions.has(entityId)) {
                // Collision ended
                if (this.onCollisionExit) {
                    const otherEntity = this.scene.getEntity(entityId);
                    if (otherEntity) {
                        this.onCollisionExit(otherEntity);
                    }
                }
            }
        }
        
        // Update collision state
        this.isColliding = currentCollisions.size > 0;
        this.collidingWith = currentCollisions;
    }
    
    dispose() {
        // Clean up any resources if needed
    }
}
