export class MathUtils {
    constructor() {
        // Constants
        this.DEG_TO_RAD = Math.PI / 180;
        this.RAD_TO_DEG = 180 / Math.PI;
        this.EPSILON = 1e-6;
    }
    
    // Vector operations
    
    // Add two vectors
    vecAdd(a, b) {
        return [
            a[0] + b[0],
            a[1] + b[1],
            a[2] + b[2]
        ];
    }
    
    // Subtract vector b from a
    vecSubtract(a, b) {
        return [
            a[0] - b[0],
            a[1] - b[1],
            a[2] - b[2]
        ];
    }
    
    // Vector length
    vecLength(v) {
        return Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
    }
    
    // Normalize a vector
    vecNormalize(v) {
        const length = this.vecLength(v);
        if (length < this.EPSILON) return [0, 0, 0];
        
        const invLength = 1 / length;
        return [
            v[0] * invLength,
            v[1] * invLength,
            v[2] * invLength
        ];
    }
    
    // Cross product of two vectors
    vecCross(a, b) {
        return [
            a[1] * b[2] - a[2] * b[1],
            a[2] * b[0] - a[0] * b[2],
            a[0] * b[1] - a[1] * b[0]
        ];
    }
    
    // Dot product of two vectors
    vecDot(a, b) {
        return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
    }
    
    // Quaternion operations
    
    // Create a quaternion from axis and angle
    quaternionFromAxisAngle(axis, angle) {
        const halfAngle = angle * 0.5;
        const s = Math.sin(halfAngle);
        const normalized = this.vecNormalize(axis);
        
        return [
            normalized[0] * s,
            normalized[1] * s,
            normalized[2] * s,
            Math.cos(halfAngle)
        ];
    }
    
    // Rotate a quaternion by another quaternion
    quaternionMultiply(a, b) {
        return [
            a[3] * b[0] + a[0] * b[3] + a[1] * b[2] - a[2] * b[1],
            a[3] * b[1] - a[0] * b[2] + a[1] * b[3] + a[2] * b[0],
            a[3] * b[2] + a[0] * b[1] - a[1] * b[0] + a[2] * b[3],
            a[3] * b[3] - a[0] * b[0] - a[1] * b[1] - a[2] * b[2]
        ];
    }
    
    // Simple helper for the rotating quaternion by axis and angle
    rotateQuaternion(quaternion, axis, angle) {
        const rotation = this.quaternionFromAxisAngle(axis, angle);
        return this.quaternionMultiply(rotation, quaternion);
    }
    
    // Matrix operations
    
    // Create a 4x4 identity matrix
    mat4Identity() {
        return new Float32Array([
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1
        ]);
    }
    
    // Create a 4x4 translation matrix
    mat4Translation(tx, ty, tz) {
        return new Float32Array([
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            tx, ty, tz, 1
        ]);
    }
    
    // Create a perspective projection matrix
    perspective(fovRadians, aspect, near, far) {
        const f = 1.0 / Math.tan(fovRadians / 2);
        const rangeInv = 1.0 / (near - far);
        
        return new Float32Array([
            f / aspect, 0, 0, 0,
            0, f, 0, 0,
            0, 0, (near + far) * rangeInv, -1,
            0, 0, near * far * rangeInv * 2, 0
        ]);
    }
    
    // Create a look-at view matrix
    lookAt(eye, target, up) {
        const zAxis = this.vecNormalize(this.vecSubtract(eye, target));
        const xAxis = this.vecNormalize(this.vecCross(up, zAxis));
        const yAxis = this.vecCross(zAxis, xAxis);
        
        return new Float32Array([
            xAxis[0], yAxis[0], zAxis[0], 0,
            xAxis[1], yAxis[1], zAxis[1], 0,
            xAxis[2], yAxis[2], zAxis[2], 0,
            -this.vecDot(xAxis, eye), -this.vecDot(yAxis, eye), -this.vecDot(zAxis, eye), 1
        ]);
    }
    
    // Additional utility functions can be added as needed
}
