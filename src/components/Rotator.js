export class Rotator {
    constructor(entity, options = {}) {
        this.entity = entity;
        this.axis = options.axis || [0, 1, 0]; // Y-axis by default
        this.speed = options.speed || 1.0;     // radians per second
        
        // Normalize axis
        const length = Math.sqrt(
            this.axis[0] * this.axis[0] + 
            this.axis[1] * this.axis[1] + 
            this.axis[2] * this.axis[2]
        );
        
        if (length > 0) {
            this.axis[0] /= length;
            this.axis[1] /= length;
            this.axis[2] /= length;
        }
        
        console.log(`Created GPU-accelerated Rotator: axis=${this.axis}, speed=${this.speed}`);
        
        // Apply rotation properties to the MeshRenderer to use shader-based rotation
        const meshRenderer = this.entity.getComponent('MeshRenderer');
        if (meshRenderer) {
            meshRenderer.setRotationProperties(this.axis, this.speed);
        }
    }
    
    update(deltaTime) {
        // No updates needed here - rotation happens in the shader via MeshRenderer
    }
}
