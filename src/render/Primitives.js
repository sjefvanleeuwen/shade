export class Primitives {
    constructor(engine) {
        this.engine = engine;
        
        // Cache for created primitive meshes
        this.cache = new Map();
    }
    
    createBox(options = {}) {
        const key = 'box_' + JSON.stringify(options);
        
        if (this.cache.has(key)) {
            return this.cache.get(key);
        }
        
        const width = options.width || 1;
        const height = options.height || 1;
        const depth = options.depth || 1;
        
        const w = width / 2;
        const h = height / 2;
        const d = depth / 2;
        
        // Create vertex data
        // Format: x, y, z, nx, ny, nz, u, v
        const vertices = new Float32Array([
            // Front face
            -w, -h,  d,  0,  0,  1,  0, 1, // bottom-left
             w, -h,  d,  0,  0,  1,  1, 1, // bottom-right
             w,  h,  d,  0,  0,  1,  1, 0, // top-right
            -w,  h,  d,  0,  0,  1,  0, 0, // top-left
            
            // Back face
             w, -h, -d,  0,  0, -1,  0, 1, // bottom-left
            -w, -h, -d,  0,  0, -1,  1, 1, // bottom-right
            -w,  h, -d,  0,  0, -1,  1, 0, // top-right
             w,  h, -d,  0,  0, -1,  0, 0, // top-left
            
            // Top face
            -w,  h,  d,  0,  1,  0,  0, 1, // bottom-left
             w,  h,  d,  0,  1,  0,  1, 1, // bottom-right
             w,  h, -d,  0,  1,  0,  1, 0, // top-right
            -w,  h, -d,  0,  1,  0,  0, 0, // top-left
            
            // Bottom face
            -w, -h, -d,  0, -1,  0,  0, 1, // bottom-left
             w, -h, -d,  0, -1,  0,  1, 1, // bottom-right
             w, -h,  d,  0, -1,  0,  1, 0, // top-right
            -w, -h,  d,  0, -1,  0,  0, 0, // top-left
            
            // Right face
             w, -h,  d,  1,  0,  0,  0, 1, // bottom-left
             w, -h, -d,  1,  0,  0,  1, 1, // bottom-right
             w,  h, -d,  1,  0,  0,  1, 0, // top-right
             w,  h,  d,  1,  0,  0,  0, 0, // top-left
            
            // Left face
            -w, -h, -d, -1,  0,  0,  0, 1, // bottom-left
            -w, -h,  d, -1,  0,  0,  1, 1, // bottom-right
            -w,  h,  d, -1,  0,  0,  1, 0, // top-right
            -w,  h, -d, -1,  0,  0,  0, 0  // top-left
        ]);
        
        // Triangle indices (6 faces * 2 triangles * 3 vertices = 36 indices)
        const indices = new Uint16Array([
            0,  1,  2,  0,  2,  3,  // front
            4,  5,  6,  4,  6,  7,  // back
            8,  9,  10, 8,  10, 11, // top
            12, 13, 14, 12, 14, 15, // bottom
            16, 17, 18, 16, 18, 19, // right
            20, 21, 22, 20, 22, 23  // left
        ]);
        
        // Create GPU buffers
        const device = this.engine.renderer.device;
        
        const vertexBuffer = device.createBuffer({
            size: vertices.byteLength,
            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
            mappedAtCreation: true
        });
        new Float32Array(vertexBuffer.getMappedRange()).set(vertices);
        vertexBuffer.unmap();
        
        const indexBuffer = device.createBuffer({
            size: indices.byteLength,
            usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
            mappedAtCreation: true
        });
        new Uint16Array(indexBuffer.getMappedRange()).set(indices);
        indexBuffer.unmap();
        
        // Create mesh object
        const box = {
            type: 'box',
            vertexBuffer,
            indexBuffer,
            vertexCount: vertices.length / 8, // 8 components per vertex
            indexCount: indices.length,
            vertexBufferLayout: {
                arrayStride: 8 * 4, // 8 floats per vertex, 4 bytes per float
                attributes: [
                    { // position
                        shaderLocation: 0,
                        offset: 0,
                        format: 'float32x3'
                    },
                    { // normal
                        shaderLocation: 1,
                        offset: 3 * 4, // after position
                        format: 'float32x3'
                    },
                    { // uv
                        shaderLocation: 2,
                        offset: 6 * 4, // after position and normal
                        format: 'float32x2'
                    }
                ]
            }
        };
        
        this.cache.set(key, box);
        return box;
    }
    
    createSphere(options = {}) {
        const key = 'sphere_' + JSON.stringify(options);
        
        if (this.cache.has(key)) {
            return this.cache.get(key);
        }
        
        // Simple placeholder sphere
        const sphere = {
            type: 'sphere',
            radius: options.radius || 1,
            segments: options.segments || 32,
            // This would normally contain vertex and index data
            data: {
                vertices: new Float32Array(0), // Will be filled in real implementation
                indices: new Uint16Array(0)    // Will be filled in real implementation
            }
        };
        
        this.cache.set(key, sphere);
        return sphere;
    }
    
    createPlane(options = {}) {
        const key = 'plane_' + JSON.stringify(options);
        
        if (this.cache.has(key)) {
            return this.cache.get(key);
        }
        
        // Simple placeholder plane
        const plane = {
            type: 'plane',
            width: options.width || 1,
            height: options.height || 1,
            // This would normally contain vertex and index data
            data: {
                vertices: new Float32Array(12), // 4 vertices * 3 components
                indices: new Uint16Array(6)     // 2 triangles * 3 indices
            }
        };
        
        this.cache.set(key, plane);
        return plane;
    }
    
    // Additional primitive types would be added here
    
    dispose() {
        // Clean up GPU resources
        for (const mesh of this.cache.values()) {
            if (mesh.vertexBuffer) mesh.vertexBuffer.destroy();
            if (mesh.indexBuffer) mesh.indexBuffer.destroy();
        }
        this.cache.clear();
    }
}
