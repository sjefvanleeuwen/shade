// Minimal WebGPU cube rotation using a shader-based rotation

async function init() {
  // Create and append canvas
  const canvas = document.createElement('canvas');
  canvas.width = 600;
  canvas.height = 600;
  document.body.appendChild(canvas);
  
  if (!navigator.gpu) {
    console.error("WebGPU not supported");
    return;
  }
  
  // Request adapter and check for null
  const adapter = await navigator.gpu.requestAdapter();
  if (!adapter) {
      console.error("Failed to get GPU adapter. Ensure your browser supports WebGPU and it is enabled.");
      return;
  }
  
  const device = await adapter.requestDevice();
  
  // Configure canvas context
  const context = canvas.getContext('webgpu');
  const format = navigator.gpu.getPreferredCanvasFormat();
  context.configure({
    device,
    format,
    alphaMode: 'opaque'
  });
  
  const depthTexture = device.createTexture({
    size: [canvas.width, canvas.height],
    format: 'depth24plus',
    usage: GPUTextureUsage.RENDER_ATTACHMENT,
  });
  
  // Load texture
  const textureResponse = await fetch('../assets/textures/test.png');
  if (!textureResponse.ok) {
    console.error("Failed to load texture");
    return;
  }
  
  const textureData = await textureResponse.blob();
  const textureImageBitmap = await createImageBitmap(textureData);
  
  // Create texture on GPU
  const cubeTexture = device.createTexture({
    size: [textureImageBitmap.width, textureImageBitmap.height, 1],
    format: 'rgba8unorm',
    usage: GPUBufferUsage.TEXTURE_BINDING | GPUBufferUsage.COPY_DST | GPUBufferUsage.RENDER_ATTACHMENT
  });
  
  // Copy image data to texture
  device.queue.copyExternalImageToTexture(
    { source: textureImageBitmap },
    { texture: cubeTexture },
    [textureImageBitmap.width, textureImageBitmap.height]
  );
  
  // Create sampler
  const sampler = device.createSampler({
    magFilter: 'linear',
    minFilter: 'linear',
    addressModeU: 'repeat',
    addressModeV: 'repeat'
  });
  
  // Update shader to handle textures
  const shaderCode = `
struct Uniforms {
  time: f32,
  viewProjection: mat4x4<f32>,
};

@binding(0) @group(0) var<uniform> uniforms : Uniforms;
@binding(1) @group(0) var texSampler : sampler;
@binding(2) @group(0) var colorTexture : texture_2d<f32>;

struct VertexInput {
  @location(0) position : vec3<f32>,
  @location(1) color : vec3<f32>,
  @location(2) uv : vec2<f32>,
};

struct VertexOutput {
  @builtin(position) Position : vec4<f32>,
  @location(0) fragColor : vec3<f32>,
  @location(1) fragUV : vec2<f32>,
};

fn rotationMatrix(angle: f32) -> mat4x4<f32> {
  let c = cos(angle);
  let s = sin(angle);
  return mat4x4<f32>(
    vec4<f32>(c, 0.0, s, 0.0),
    vec4<f32>(0.0, 1.0, 0.0, 0.0),
    vec4<f32>(-s, 0.0, c, 0.0),
    vec4<f32>(0.0, 0.0, 0.0, 1.0)
  );
}

@vertex
fn vertexMain(input: VertexInput) -> VertexOutput {
  var output: VertexOutput;
  let angle = uniforms.time;
  
  // Apply rotation first
  let rot = rotationMatrix(angle);
  let rotatedPosition = rot * vec4<f32>(input.position, 1.0);
  
  // Then apply view-projection for proper 3D transformation
  output.Position = uniforms.viewProjection * rotatedPosition;
  output.fragColor = input.color;
  output.fragUV = input.uv;
  return output;
}

@fragment
fn fragmentMain(input: VertexOutput) -> @location(0) vec4<f32> {
  // Sample the texture and blend with vertex color
  let texColor = textureSample(colorTexture, texSampler, input.fragUV);
  return vec4<f32>(input.fragColor * texColor.rgb, texColor.a);
}
`;
  
  const shaderModule = device.createShaderModule({ code: shaderCode });
  
  // Update cube vertices to include UVs
  const vertices = new Float32Array([
    // positions          // colors           // uvs
    -0.5, -0.5, -0.5,     1, 0, 0,            0, 0,
     0.5, -0.5, -0.5,     0, 1, 0,            1, 0,
     0.5,  0.5, -0.5,     0, 0, 1,            1, 1,
    -0.5,  0.5, -0.5,     1, 1, 0,            0, 1,
    
    -0.5, -0.5,  0.5,     1, 0, 1,            0, 0,
     0.5, -0.5,  0.5,     0, 1, 1,            1, 0,
     0.5,  0.5,  0.5,     1, 1, 1,            1, 1,
    -0.5,  0.5,  0.5,     0, 0, 0,            0, 1
  ]);
  
  // Indices for 12 triangles (36 indices)
  const indices = new Uint16Array([
     0, 1, 2,  0, 2, 3, // back
     4, 6, 5,  4, 7, 6, // front
     4, 5, 1,  4, 1, 0, // bottom
     3, 2, 6,  3, 6, 7, // top
     1, 5, 6,  1, 6, 2, // right
     4, 0, 3,  4, 3, 7  // left
  ]);
  
  // Create GPU buffers
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
  
  // Create a uniform buffer with both time and perspective matrix
  const uniformBufferSize = 16 * 5; // 4x4 matrix + 1 float for time
  const uniformBuffer = device.createBuffer({
    size: uniformBufferSize,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
  });
  
  // Create a bind group layout and bind group
  const bindGroupLayout = device.createBindGroupLayout({
    entries: [
      {
        binding: 0,
        visibility: GPUShaderStage.VERTEX,
        buffer: { type: 'uniform' }
      },
      {
        binding: 1,
        visibility: GPUShaderStage.FRAGMENT,
        sampler: {}
      },
      {
        binding: 2,
        visibility: GPUShaderStage.FRAGMENT,
        texture: {}
      }
    ]
  });
  const bindGroup = device.createBindGroup({
    layout: bindGroupLayout,
    entries: [
      {
        binding: 0,
        resource: { buffer: uniformBuffer }
      },
      {
        binding: 1,
        resource: sampler
      },
      {
        binding: 2,
        resource: cubeTexture.createView()
      }
    ]
  });
  
  // Create pipeline layout & render pipeline
  const pipelineLayout = device.createPipelineLayout({
    bindGroupLayouts: [bindGroupLayout]
  });
  const pipeline = device.createRenderPipeline({
    layout: pipelineLayout,
    vertex: {
      module: shaderModule,
      entryPoint: 'vertexMain',
      buffers: [{
        arrayStride: 8 * 4, // 8 floats per vertex (position, color, uv)
        attributes: [
          { shaderLocation: 0, offset: 0, format: 'float32x3' },
          { shaderLocation: 1, offset: 3 * 4, format: 'float32x3' },
          { shaderLocation: 2, offset: 6 * 4, format: 'float32x2' }
        ]
      }]
    },
    fragment: {
      module: shaderModule,
      entryPoint: 'fragmentMain',
      targets: [{ format }]
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
  
  let startTime = performance.now();
  
  function frame() {
    const now = performance.now();
    const elapsedTime = (now - startTime) / 1000;
    
    // Create perspective projection matrix
    const aspect = canvas.width / canvas.height;
    const projectionMatrix = createPerspectiveMatrix(60 * Math.PI / 180, aspect, 0.1, 100.0);
    
    // Create a simple view matrix - pull back on Z to see the cube
    const viewMatrix = createViewMatrix([0, 0, 3], [0, 0, 0], [0, 1, 0]);
    
    // Combine into view-projection matrix
    const viewProjectionMatrix = multiplyMatrices(projectionMatrix, viewMatrix);
    
    // Create uniform data with time and view-projection matrix
    const uniformData = new Float32Array(5 * 4);
    uniformData[0] = elapsedTime; // Time at offset 0
    uniformData.set(viewProjectionMatrix, 4); // Matrix at offset 4
    
    // Upload uniform data
    device.queue.writeBuffer(uniformBuffer, 0, uniformData);
    
    const commandEncoder = device.createCommandEncoder();
    const textureView = context.getCurrentTexture().createView();
    
    // Updated render pass descriptor with depth attachment
    const renderPass = commandEncoder.beginRenderPass({
      colorAttachments: [{
        view: textureView,
        clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 },
        loadOp: 'clear',
        storeOp: 'store'
      }],
      depthStencilAttachment: {
        view: depthTexture.createView(),
        depthClearValue: 1.0,
        depthLoadOp: 'clear',
        depthStoreOp: 'store'
      }
    });
    
    renderPass.setPipeline(pipeline);
    renderPass.setBindGroup(0, bindGroup);
    renderPass.setVertexBuffer(0, vertexBuffer);
    renderPass.setIndexBuffer(indexBuffer, 'uint16');
    renderPass.drawIndexed(indices.length);
    renderPass.end();
    
    device.queue.submit([commandEncoder.finish()]);
    requestAnimationFrame(frame);
  }
  
  requestAnimationFrame(frame);
}

// Helper functions for matrix creation
function createPerspectiveMatrix(fovY, aspect, near, far) {
  const f = 1.0 / Math.tan(fovY / 2);
  
  return new Float32Array([
    f / aspect, 0, 0, 0,
    0, f, 0, 0,
    0, 0, (far + near) / (near - far), -1,
    0, 0, (2 * far * near) / (near - far), 0
  ]);
}

function createViewMatrix(eye, target, up) {
  // Simplified lookAt matrix creation
  const zAxis = normalize(subtractVectors(eye, target));
  const xAxis = normalize(crossProduct(up, zAxis));
  const yAxis = crossProduct(zAxis, xAxis);
  
  return new Float32Array([
    xAxis[0], yAxis[0], zAxis[0], 0,
    xAxis[1], yAxis[1], zAxis[1], 0,
    xAxis[2], yAxis[2], zAxis[2], 0,
    -dot(xAxis, eye), -dot(yAxis, eye), -dot(zAxis, eye), 1
  ]);
}

function multiplyMatrices(a, b) {
  const result = new Float32Array(16);
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      let sum = 0;
      for (let k = 0; k < 4; k++) {
        sum += a[i + k * 4] * b[k + j * 4];
      }
      result[i + j * 4] = sum;
    }
  }
  return result;
}

// Vector helpers
function subtractVectors(a, b) {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

function normalize(v) {
  const length = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
  return [v[0] / length, v[1] / length, v[2] / length];
}

function crossProduct(a, b) {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0]
  ];
}

function dot(a, b) {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

init();
