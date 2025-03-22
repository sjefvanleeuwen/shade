import { MeshRenderer } from './MeshRenderer.js';

export class Renderer {
    constructor(options) {
        this.engine = options.engine;
        this.canvas = options.canvas;
        this.msaaSamples = options.msaaSamples || 4;
        
        // WebGPU objects
        this.adapter = null;
        this.device = null;
        this.context = null;
        this.format = null;
        
        // Frame resources
        this.depthTexture = null;
        this.depthTextureView = null;
    }
    
    async initialize() {
        try {
            // Get WebGPU adapter
            this.adapter = await navigator.gpu.requestAdapter({
                powerPreference: 'high-performance'
            });
            
            if (!this.adapter) {
                throw new Error('WebGPU adapter not found');
            }
            
            // Request device
            this.device = await this.adapter.requestDevice({
                requiredFeatures: [],
                requiredLimits: {}
            });
            
            // Set up device error handling
            this.device.addEventListener('uncapturederror', (event) => {
                console.error('WebGPU device error:', event.error);
            });
            
            // Configure canvas context
            this.context = this.canvas.getContext('webgpu');
            this.format = navigator.gpu.getPreferredCanvasFormat();
            
            // Configure context
            this.configureContext();
            
            // Create initial resources
            this.createDepthTexture();
            
            // Load shaders
            await this.createBasicPipeline();
            
            console.log('Renderer initialized successfully');
            return true;
            
        } catch (error) {
            console.error('Failed to initialize renderer:', error);
            throw error;
        }
    }
    
    configureContext() {
        this.context.configure({
            device: this.device,
            format: this.format,
            alphaMode: 'premultiplied',
            usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC
        });
    }
    
    createDepthTexture() {
        const depthTextureDesc = {
            size: [this.canvas.width, this.canvas.height, 1],
            dimension: '2d',
            format: 'depth24plus',
            usage: GPUTextureUsage.RENDER_ATTACHMENT
        };
        
        this.depthTexture = this.device.createTexture(depthTextureDesc);
        this.depthTextureView = this.depthTexture.createView();
    }
    
    async createBasicPipeline() {
        // Instead of fetching the shader, we'll use an inline WGSL shader
        const shaderCode = `
        // Shader with GPU-accelerated rotation

        // Vertex shader
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

        struct CameraUniforms {
            viewProjection: mat4x4<f32>,
        };

        struct ModelUniforms {
            model: mat4x4<f32>,
            rotationAxis: vec3<f32>,
            rotationSpeed: f32,
            time: f32,
        };

        struct MaterialUniforms {
            color: vec4<f32>,
        };

        @group(0) @binding(0) var<uniform> camera: CameraUniforms;
        @group(1) @binding(0) var<uniform> model: ModelUniforms;
        @group(2) @binding(0) var<uniform> material: MaterialUniforms;

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
            
            // Apply model transformation (translation & scale)
            let worldPosition = model.model * vec4<f32>(rotatedPosition, 1.0);
            output.position = camera.viewProjection * worldPosition;
            
            // Pass along rotated normal
            output.normal = rotatedNormal;
            
            // Pass through UVs
            output.uv = input.uv;
            
            return output;
        }

        @fragment
        fn fragmentMain(input: VertexOutput) -> @location(0) vec4<f32> {
            // Simple colored material
            return material.color;
        }`;

        // Create shader module
        const shaderModule = this.device.createShaderModule({
            label: 'Basic Shader',
            code: shaderCode
        });
        
        // Create a bind group layout for the camera
        const cameraBindGroupLayout = this.device.createBindGroupLayout({
            entries: [
                {
                    binding: 0,
                    visibility: GPUShaderStage.VERTEX,
                    buffer: { type: 'uniform' }
                }
            ]
        });
        
        // Create a bind group layout for the model
        const modelBindGroupLayout = this.device.createBindGroupLayout({
            entries: [
                {
                    binding: 0,
                    visibility: GPUShaderStage.VERTEX,
                    buffer: { type: 'uniform' }
                }
            ]
        });
        
        // Create a bind group layout for the material
        const materialBindGroupLayout = this.device.createBindGroupLayout({
            entries: [
                {
                    binding: 0,
                    visibility: GPUShaderStage.FRAGMENT,
                    buffer: { type: 'uniform' }
                }
            ]
        });
        
        // Create the pipeline layout
        const pipelineLayout = this.device.createPipelineLayout({
            bindGroupLayouts: [cameraBindGroupLayout, modelBindGroupLayout, materialBindGroupLayout]
        });
        
        // Create the render pipeline
        this.basicPipeline = this.device.createRenderPipeline({
            layout: pipelineLayout,
            vertex: {
                module: shaderModule,
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
                module: shaderModule,
                entryPoint: 'fragmentMain',
                targets: [
                    {
                        format: this.format
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
        
        // Create camera uniform buffer
        this.cameraUniformBuffer = this.device.createBuffer({
            size: 16 * 4, // 4x4 matrix
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });
        
        // Create camera bind group
        this.cameraBindGroup = this.device.createBindGroup({
            layout: cameraBindGroupLayout,
            entries: [
                {
                    binding: 0,
                    resource: { buffer: this.cameraUniformBuffer }
                }
            ]
        });
        
        // Store bind group layouts for use by mesh renderers
        this.bindGroupLayouts = {
            model: modelBindGroupLayout,
            material: materialBindGroupLayout
        };
    }
    
    updateCameraUniforms(camera) {
        // Simple perspective projection
        const aspect = this.canvas.width / this.canvas.height;
        const fov = camera.fov * (Math.PI / 180); // convert to radians
        const near = camera.nearPlane;
        const far = camera.farPlane;
        
        const f = 1.0 / Math.tan(fov / 2);
        
        // Basic perspective matrix
        const projMatrix = new Float32Array([
            f / aspect, 0, 0, 0,
            0, f, 0, 0,
            0, 0, far / (near - far), -1,
            0, 0, (near * far) / (near - far), 0
        ]);
        
        // Simple view matrix
        const pos = camera.position;
        const target = camera.target;
        
        // Calculate view direction (simplified look-at)
        const zAxis = [
            pos[0] - target[0],
            pos[1] - target[1],
            pos[2] - target[2]
        ];
        
        // Normalize z axis
        const zLen = Math.sqrt(zAxis[0] * zAxis[0] + zAxis[1] * zAxis[1] + zAxis[2] * zAxis[2]);
        zAxis[0] /= zLen;
        zAxis[1] /= zLen;
        zAxis[2] /= zLen;
        
        // Assume up is [0,1,0] and compute x axis
        const xAxis = [
            zAxis[2],
            0,
            -zAxis[0]
        ];
        
        // Normalize x axis
        const xLen = Math.sqrt(xAxis[0] * xAxis[0] + xAxis[1] * xAxis[1] + xAxis[2] * xAxis[2]);
        if (xLen > 0.0001) {
            xAxis[0] /= xLen;
            xAxis[1] /= xLen;
            xAxis[2] /= xLen;
        } else {
            // Handle the case where camera is looking straight up/down
            xAxis[0] = 1;
            xAxis[1] = 0;
            xAxis[2] = 0;
        }
        
        // Compute y axis (cross product)
        const yAxis = [
            zAxis[1] * xAxis[2] - zAxis[2] * xAxis[1],
            zAxis[2] * xAxis[0] - zAxis[0] * xAxis[2],
            zAxis[0] * xAxis[1] - zAxis[1] * xAxis[0]
        ];
        
        // Create view matrix (transposed rotation + translation)
        const viewMatrix = new Float32Array([
            xAxis[0], yAxis[0], zAxis[0], 0,
            xAxis[1], yAxis[1], zAxis[1], 0,
            xAxis[2], yAxis[2], zAxis[2], 0,
            -(xAxis[0] * pos[0] + xAxis[1] * pos[1] + xAxis[2] * pos[2]),
            -(yAxis[0] * pos[0] + yAxis[1] * pos[1] + yAxis[2] * pos[2]),
            -(zAxis[0] * pos[0] + zAxis[1] * pos[1] + zAxis[2] * pos[2]),
            1
        ]);
        
        // Compute view-projection matrix (multiply projection by view)
        // This is a simplified matrix multiplication
        const viewProjectionMatrix = new Float32Array(16);
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                let sum = 0;
                for (let k = 0; k < 4; k++) {
                    sum += projMatrix[i + k * 4] * viewMatrix[k + j * 4];
                }
                viewProjectionMatrix[i + j * 4] = sum;
            }
        }
        
        // Upload to GPU
        this.device.queue.writeBuffer(
            this.cameraUniformBuffer,
            0,
            viewProjectionMatrix
        );
    }
    
    resize() {
        // Check if canvas size has changed
        const width = this.canvas.clientWidth * window.devicePixelRatio;
        const height = this.canvas.clientHeight * window.devicePixelRatio;
        
        if (this.canvas.width !== width || this.canvas.height !== height) {
            this.canvas.width = width;
            this.canvas.height = height;
            
            // Recreate depth texture
            if (this.depthTexture) {
                this.depthTexture.destroy();
            }
            this.createDepthTexture();
            
            return true;
        }
        
        return false;
    }
    
    render(scene, camera) {
        // Ensure canvas size is up to date
        this.resize();
        
        // Always update the scene before rendering
        scene.update(this.engine.time.delta);
        
        // Update camera uniforms
        this.updateCameraUniforms(camera);
        
        try {
            // Get current texture and validate
            const currentTexture = this.context.getCurrentTexture();
            if (!currentTexture) {
                console.error("No current texture available.");
                return;
            }
            const colorTextureView = currentTexture.createView();
            if (!this.depthTextureView) {
                console.error("Depth texture view is invalid.");
                return;
            }
            
            // Create command encoder with label
            const commandEncoder = this.device.createCommandEncoder({ label: 'Main Command Encoder' });
            
            // Create render pass descriptor
            const renderPassDesc = {
                colorAttachments: [
                    {
                        view: colorTextureView,
                        clearValue: { r: 0.1, g: 0.1, b: 0.1, a: 1.0 },
                        loadOp: 'clear',
                        storeOp: 'store'
                    }
                ],
                depthStencilAttachment: {
                    view: this.depthTextureView,
                    depthClearValue: 1.0,
                    depthLoadOp: 'clear',
                    depthStoreOp: 'store'
                }
            };
            
            // Begin render pass
            const passEncoder = commandEncoder.beginRenderPass(renderPassDesc);
            
            // Set viewport
            passEncoder.setViewport(
                0, 0,
                this.canvas.width, this.canvas.height,
                0, 1
            );
            
            // Set scissor rect
            passEncoder.setScissorRect(
                0, 0,
                this.canvas.width, this.canvas.height
            );
            
            // Set pipeline
            passEncoder.setPipeline(this.basicPipeline);
            
            // Set camera bind group
            passEncoder.setBindGroup(0, this.cameraBindGroup);
            
            // Render meshes
            const meshEntities = scene.getEntitiesByComponent('MeshRenderer');
            
            for (const entity of meshEntities) {
                const meshRenderer = entity.getComponent('MeshRenderer');
                const transform = entity.getComponent('Transform');
                
                if (!meshRenderer || !meshRenderer.mesh || !meshRenderer.material) {
                    continue;
                }
                
                // Check material type to use the appropriate pipeline and bind groups
                if (meshRenderer.material.type === 'cubemap' || meshRenderer.material.type === 'standard') {
                    // Update the model uniforms in the material
                    meshRenderer.material.updateModelUniforms(transform);
                    
                    // Use the material's pipeline and bind groups
                    if (meshRenderer.material.pipeline) {
                        passEncoder.setPipeline(meshRenderer.material.pipeline);
                        passEncoder.setBindGroup(0, this.cameraBindGroup);
                        passEncoder.setBindGroup(1, meshRenderer.material.modelBindGroup);
                        passEncoder.setBindGroup(2, meshRenderer.material.bindGroup);
                    } else {
                        console.error(`${meshRenderer.material.type} material has no pipeline`);
                        continue;
                    }
                } else {
                    // Regular built-in material - update as normal
                    meshRenderer.updateModelUniforms(transform);
                    
                    // Set up standard pipeline
                    passEncoder.setPipeline(this.basicPipeline);
                    passEncoder.setBindGroup(0, this.cameraBindGroup);
                    passEncoder.setBindGroup(1, meshRenderer.modelBindGroup);
                    passEncoder.setBindGroup(2, meshRenderer.materialBindGroup);
                }
                
                // Set vertex buffer
                passEncoder.setVertexBuffer(0, meshRenderer.mesh.vertexBuffer);
                
                // Set index buffer
                passEncoder.setIndexBuffer(meshRenderer.mesh.indexBuffer, 'uint16');
                
                // Draw
                passEncoder.drawIndexed(meshRenderer.mesh.indexCount);
            }
            
            // End render pass
            passEncoder.end();
            
            // Finish and validate command buffer
            const commandBuffer = commandEncoder.finish();
            console.log("Command buffer finished", commandBuffer);
            this.device.queue.submit([commandBuffer]);
            
        } catch (error) {
            console.error("Render pass error:", error);
        }
    }
    
    dispose() {
        if (this.depthTexture) {
            this.depthTexture.destroy();
            this.depthTexture = null;
            this.depthTextureView = null;
        }
    }
}
