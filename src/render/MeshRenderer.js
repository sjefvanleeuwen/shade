export class MeshRenderer {
    constructor(entity, options = {}) {
        this.entity = entity;
        this.scene = entity.scene;
        this.engine = this.scene.engine;
        this.device = this.engine.renderer.device;
        
        this.mesh = options.mesh || null;
        this.material = options.material || null;
        
        // Buffer for model matrix, rotation axis, speed, and time
        this.modelUniformBuffer = this.device.createBuffer({
            size: 24 * 4, // 24 floats × 4 bytes = 96 bytes (with padding for alignment)
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });
        
        this.materialUniformBuffer = this.device.createBuffer({
            size: 4 * 4, // vec4 color
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });
        
        // Default rotation properties
        this.rotationAxis = [0, 1, 0];  // Y-axis by default
        this.rotationSpeed = 0.0;       // No rotation by default
        
        // Update material uniforms
        this.updateMaterialUniforms();
    }
    
    // Set rotation properties from Rotator component
    setRotationProperties(axis, speed) {
        this.rotationAxis = axis;
        this.rotationSpeed = speed;
    }
    
    updateMaterialUniforms() {
        if (!this.material) return;
        
        const colorArray = new Float32Array(4);
        
        if (this.material.type === 'basic') {
            colorArray[0] = this.material.color[0] || 1.0;
            colorArray[1] = this.material.color[1] || 1.0;
            colorArray[2] = this.material.color[2] || 1.0;
            colorArray[3] = this.material.opacity || 1.0;
        }
        
        this.device.queue.writeBuffer(this.materialUniformBuffer, 0, colorArray);
    }
    
    updateModelUniforms(transform) {
        // Create a translation & scaling matrix
        const scale = transform.scale || [1, 1, 1];
        const modelMatrix = new Float32Array([
            scale[0], 0,        0,        0,
            0,        scale[1], 0,        0,
            0,        0,        scale[2], 0,
            transform.position[0], transform.position[1], transform.position[2], 1
        ]);
        
        // Create uniform buffer with model matrix and rotation data
        const uniformData = new Float32Array(24); // 96 bytes with padding
        
        // Set model matrix (16 floats)
        uniformData.set(modelMatrix, 0);
        
        // Set rotation parameters
        uniformData[16] = this.rotationAxis[0];
        uniformData[17] = this.rotationAxis[1];
        uniformData[18] = this.rotationAxis[2];
        uniformData[19] = this.rotationSpeed;
        
        // Set current time
        uniformData[20] = performance.now() / 1000;
        
        // Padding for alignment (3 floats)
        uniformData[21] = 0;
        uniformData[22] = 0;
        uniformData[23] = 0;
        
        // Write to GPU
        this.device.queue.writeBuffer(
            this.modelUniformBuffer,
            0,
            uniformData
        );
    }
    
    update(deltaTime) {
        const transform = this.entity.getComponent('Transform');
        if (transform) {
            this.updateModelUniforms(transform);
        }
    }
    
    dispose() {
        if (this.modelUniformBuffer) {
            this.modelUniformBuffer.destroy();
            this.modelUniformBuffer = null;
        }
        
        if (this.materialUniformBuffer) {
            this.materialUniformBuffer.destroy();
            this.materialUniformBuffer = null;
        }
    }
}
