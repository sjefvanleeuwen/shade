export class StandardMaterial {
    constructor(engine, options = {}) {
        this.engine = engine;
        this.device = engine.renderer.device;
        this.id = options.id || `standard_${Math.floor(Math.random() * 10000)}`;
        this.type = 'standard';
        this.texture = null;
        this.bindGroup = null;
        this.modelBindGroup = null;
        this.pipeline = null;
        
        // Create model uniform buffer
        this.modelUniformBuffer = this.device.createBuffer({
            size: 24 * 4, // 24 floats (16 for matrix, 4 for rotation, 4 for padding)
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });
        
        // Flag to track initialization
        this.initialized = false;
        this.initPromise = null;
        
        // Start loading the shader immediately
        this.initPromise = this.loadShader();
        
        // Set the texture if provided, but after initialization
        if (options.texture) {
            this.initPromise.then(() => {
                this.setTexture(options.texture);
            });
        }
    }
    
    async loadShader() {
        try {
            // Inline shader for standard UV-based texturing
            const shaderCode = `
struct CameraUniforms {
    viewProjection: mat4x4<f32>,
};

struct ModelUniforms {
    model: mat4x4<f32>,
    rotationAxis: vec3<f32>,
    rotationSpeed: f32,
    time: f32,
};

@group(0) @binding(0) var<uniform> camera: CameraUniforms;
@group(1) @binding(0) var<uniform> model: ModelUniforms;
@group(2) @binding(0) var textureSampler: sampler;
@group(2) @binding(1) var colorTexture: texture_2d<f32>;

struct VertexInput {
    @location(0) position: vec3<f32>,
    @location(1) normal: vec3<f32>,
    @location(2) uv: vec2<f32>,
};

struct VertexOutput {
    @builtin(position) position: vec4<f32>,
    @location(0) normal: vec3<f32>,
    @location(1) uv: vec2<f32>,
};

// Helper function to create a rotation matrix around an axis
fn rotationMatrix(axis: vec3<f32>, angle: f32) -> mat4x4<f32> {
    let c = cos(angle);
    let s = sin(angle);
    let t = 1.0 - c;
    let x = axis.x;
    let y = axis.y;
    let z = axis.z;
    
    return mat4x4<f32>(
        vec4<f32>(t*x*x + c,   t*x*y - s*z, t*x*z + s*y, 0.0),
        vec4<f32>(t*x*y + s*z, t*y*y + c,   t*y*z - s*x, 0.0),
        vec4<f32>(t*x*z - s*y, t*y*z + s*x, t*z*z + c,   0.0),
        vec4<f32>(0.0,         0.0,         0.0,         1.0)
    );
}

@vertex
fn vertexMain(input: VertexInput) -> VertexOutput {
    var output: VertexOutput;
    
    // Calculate dynamic rotation based on time and speed
    let angle = model.time * model.rotationSpeed;
    var rotatedPosition = input.position;
    var rotatedNormal = input.normal;
    
    // Only rotate if speed is not zero
    if (model.rotationSpeed != 0.0) {
        let rotMat = rotationMatrix(model.rotationAxis, angle);
        
        // Apply rotation to position
        rotatedPosition = (rotMat * vec4<f32>(input.position, 1.0)).xyz;
        
        // Apply rotation to normal
        rotatedNormal = (rotMat * vec4<f32>(input.normal, 0.0)).xyz;
    }
    
    // Apply model transformation
    let worldPosition = model.model * vec4<f32>(rotatedPosition, 1.0);
    
    // Complete the final position transformation for rendering
    output.position = camera.viewProjection * worldPosition;
    
    // Pass along normal and UV for standard texturing
    output.normal = rotatedNormal;
    output.uv = input.uv;
    
    return output;
}

@fragment
fn fragmentMain(input: VertexOutput) -> @location(0) vec4<f32> {
    // Simple texture lookup with provided UVs
    let texColor = textureSample(colorTexture, textureSampler, input.uv);
    return texColor;
}`;
            
            // Create the shader module
            this.shaderModule = this.device.createShaderModule({
                label: "Standard Material Shader",
                code: shaderCode
            });
            
            // Create the pipeline for this material
            this.createPipeline();
            
            this.initialized = true;
            console.log("Standard shader initialized successfully");
            
        } catch (error) {
            console.error("Failed to initialize standard shader:", error);
            throw error;
        }
    }
    
    createPipeline() {
        // Create bind group layouts
        const cameraBindGroupLayout = this.device.createBindGroupLayout({
            entries: [{
                binding: 0,
                visibility: GPUShaderStage.VERTEX,
                buffer: { type: 'uniform' }
            }]
        });
        
        const modelBindGroupLayout = this.device.createBindGroupLayout({
            entries: [{
                binding: 0,
                visibility: GPUShaderStage.VERTEX,
                buffer: { type: 'uniform' }
            }]
        });
        
        const textureBindGroupLayout = this.device.createBindGroupLayout({
            entries: [
                {
                    binding: 0,
                    visibility: GPUShaderStage.FRAGMENT,
                    sampler: {}
                },
                {
                    binding: 1,
                    visibility: GPUShaderStage.FRAGMENT,
                    texture: {}
                }
            ]
        });
        
        // Create pipeline layout
        const pipelineLayout = this.device.createPipelineLayout({
            bindGroupLayouts: [
                cameraBindGroupLayout,
                modelBindGroupLayout,
                textureBindGroupLayout
            ]
        });
        
        // Store layouts for later use
        this.bindGroupLayouts = {
            camera: cameraBindGroupLayout,
            model: modelBindGroupLayout,
            texture: textureBindGroupLayout
        };
        
        const format = this.engine.renderer.format;
        
        // Create the render pipeline
        this.pipeline = this.device.createRenderPipeline({
            layout: pipelineLayout,
            vertex: {
                module: this.shaderModule,
                entryPoint: 'vertexMain',
                buffers: [
                    {
                        arrayStride: 8 * 4, // 8 floats per vertex
                        attributes: [
                            { // position
                                shaderLocation: 0,
                                offset: 0,
                                format: 'float32x3'
                            },
                            { // normal
                                shaderLocation: 1,
                                offset: 3 * 4,
                                format: 'float32x3'
                            },
                            { // uv
                                shaderLocation: 2,
                                offset: 6 * 4,
                                format: 'float32x2'
                            }
                        ]
                    }
                ]
            },
            fragment: {
                module: this.shaderModule,
                entryPoint: 'fragmentMain',
                targets: [
                    {
                        format: format
                    }
                ]
            },
            primitive: {
                topology: 'triangle-list',
                cullMode: 'back'
            },
            depthStencil: {
                depthWriteEnabled: true,
                depthCompare: 'less',
                format: 'depth24plus'
            }
        });
        
        // Create the model bind group now that we have a pipeline
        this.createModelBindGroup();
    }
    
    createModelBindGroup() {
        if (!this.pipeline || !this.modelUniformBuffer) return;
        
        // Create model bind group (for bind group 1)
        this.modelBindGroup = this.device.createBindGroup({
            layout: this.bindGroupLayouts.model,
            entries: [{
                binding: 0,
                resource: { buffer: this.modelUniformBuffer }
            }]
        });
        
        console.log("Created model bind group for standard material:", this.modelBindGroup);
    }
    
    setTexture(texture) {
        this.texture = texture;
        
        // If not initialized yet, store texture and apply after init
        if (!this.initialized) {
            console.log("Deferring texture setup until shader is ready");
            return;
        }
        
        // If we have a pipeline and texture, create the bind group
        if (this.pipeline && this.texture) {
            // Create bind group layout to match the shader expectations
            this.bindGroup = this.device.createBindGroup({
                layout: this.bindGroupLayouts.texture,
                entries: [
                    {
                        binding: 0,
                        resource: texture.sampler
                    },
                    {
                        binding: 1,
                        resource: texture.gpuTexture.createView()
                    }
                ]
            });
            
            console.log("Created texture bind group for standard material:", this.bindGroup);
        } else {
            console.warn("Cannot create texture bind group: pipeline or texture is missing");
        }
    }
    
    // Update model uniforms with current transform and time
    updateModelUniforms(transform) {
        if (!this.modelUniformBuffer) return;
        
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
        
        // Get rotation component if available
        const rotator = transform.entity.getComponent('Rotator');
        const rotationAxis = rotator ? rotator.axis : [0, 1, 0];
        const rotationSpeed = rotator ? rotator.speed : 0.5;
        
        // Set rotation parameters
        uniformData[16] = rotationAxis[0];
        uniformData[17] = rotationAxis[1];
        uniformData[18] = rotationAxis[2];
        uniformData[19] = rotationSpeed;
        
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
    
    dispose() {
        // Clean up resources
        this.texture = null;
        this.bindGroup = null;
        
        if (this.modelUniformBuffer) {
            this.modelUniformBuffer.destroy();
            this.modelUniformBuffer = null;
        }
        
        this.modelBindGroup = null;
        this.pipeline = null;
    }
}
