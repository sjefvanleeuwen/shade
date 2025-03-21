// Import orbit controls
import { OrbitControls } from '../camera/OrbitControls.js';

export class Camera {
    constructor(engine, options = {}) {
        this.engine = engine;
        
        // Camera properties
        this.type = options.type || 'perspective';
        this.position = options.position || [0, 0, 5];
        this.target = options.target || [0, 0, 0];
        this.up = options.up || [0, 1, 0];
        
        // Perspective camera properties
        this.fov = options.fov || 60; // degrees
        this.aspectRatio = options.aspectRatio || 'auto';
        this.nearPlane = options.nearPlane || 0.1;
        this.farPlane = options.farPlane || 1000;
        
        // Orthographic camera properties
        this.size = options.size || 10;
        
        // Viewport
        this.viewport = options.viewport || null; // null = full canvas
        
        // Matrix cache
        this.viewMatrix = new Float32Array(16);
        this.projectionMatrix = new Float32Array(16);
        this.viewProjectionMatrix = new Float32Array(16);
        
        // Frustum data
        this.frustumPlanes = new Array(6).fill().map(() => new Float32Array(4));
        
        // Flags
        this.viewDirty = true;
        this.projectionDirty = true;

        // Controls
        this.controls = null;
    }
    
    setPosition(x, y, z) {
        this.position[0] = x;
        this.position[1] = y;
        this.position[2] = z;
        this.viewDirty = true;
    }
    
    setTarget(x, y, z) {
        this.target[0] = x;
        this.target[1] = y;
        this.target[2] = z;
        this.viewDirty = true;
    }
    
    lookAt(x, y, z) {
        this.target[0] = x;
        this.target[1] = y;
        this.target[2] = z;
        this.viewDirty = true;
    }
    
    getViewMatrix() {
        if (this.viewDirty) {
            this.updateViewMatrix();
        }
        return this.viewMatrix;
    }
    
    getProjectionMatrix() {
        if (this.projectionDirty) {
            this.updateProjectionMatrix();
        }
        return this.projectionMatrix;
    }
    
    getViewProjectionMatrix() {
        const view = this.getViewMatrix();
        const projection = this.getProjectionMatrix();
        
        // Multiply projection * view
        // This is a simplified matrix multiplication - in production we'd use a proper math library
        // TODO: Replace with proper matrix multiplication using MathUtils
        
        return this.viewProjectionMatrix;
    }
    
    updateViewMatrix() {
        // In a real implementation, we'd use a proper math library
        // For now, we'll assume the matrix is updated for demonstration
        
        // TODO: Implement proper view matrix calculation using MathUtils
        // this.viewMatrix = this.engine.math.lookAt(this.position, this.target, this.up);
        
        this.viewDirty = false;
    }
    
    updateProjectionMatrix() {
        // Calculate aspect ratio if auto
        let aspect = this.aspectRatio;
        if (aspect === 'auto') {
            const canvas = this.engine.canvas;
            aspect = canvas.width / canvas.height;
        }
        
        if (this.type === 'perspective') {
            // TODO: Implement proper perspective matrix calculation using MathUtils
            // this.projectionMatrix = this.engine.math.perspective(
            //     this.fov * (Math.PI / 180), // convert to radians
            //     aspect,
            //     this.nearPlane,
            //     this.farPlane
            // );
        } else if (this.type === 'orthographic') {
            const halfSize = this.size / 2;
            const halfWidth = halfSize * aspect;
            const halfHeight = halfSize;
            
            // TODO: Implement proper orthographic matrix calculation using MathUtils
            // this.projectionMatrix = this.engine.math.orthographic(
            //     -halfWidth, halfWidth,
            //     -halfHeight, halfHeight,
            //     this.nearPlane,
            //     this.farPlane
            // );
        }
        
        this.projectionDirty = false;
    }
    
    updateFrustum() {
        // Extract frustum planes from view-projection matrix
        // TODO: Implement frustum extraction
    }
    
    resize() {
        if (this.aspectRatio === 'auto') {
            this.projectionDirty = true;
        }
    }

    createOrbitControls(options = {}) {
        // Dispose any existing controls
        if (this.controls) {
            this.controls.dispose();
        }
        
        // Create new orbit controls
        this.controls = new OrbitControls(this, options);
        return this.controls;
    }

    update(deltaTime) {
        // Update controls if they exist
        if (this.controls) {
            this.controls.update(deltaTime);
        }
        
        // Mark matrices as dirty
        this.viewDirty = true;
    }
}
