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
}
