import { Engine } from './src/core/Engine.js';
import { CubemapMaterial } from './src/render/materials/CubemapMaterial.js';
import { StandardMaterial } from './src/render/materials/StandardMaterial.js';
// Import TextureManager directly to ensure it's available
import { TextureManager } from './src/render/textures/TextureManager.js';

async function main() {
    const canvas = document.getElementById('canvas');
    const stats = document.getElementById('stats');
    
    // Check for WebGPU support
    if (!navigator.gpu) {
        document.body.innerHTML = '<div class="error"><h2>WebGPU Not Supported</h2><p>Your browser does not support WebGPU. Please try a browser that supports WebGPU, such as Chrome 113+ or Edge 113+.</p></div>';
        return;
    }
    
    try {
        // Initialize the engine
        const engine = new Engine({
            canvas,
            debug: true
        });
        
        // Wait for engine initialization
        await engine.initialize();
        
        // Create a simple scene with a rotating cube
        const scene = engine.createScene();
        
        // Create a camera slightly further back for better view
        const camera = engine.createCamera({
            position: [0, 1, 5],
            target: [0, 0, 0],
            fov: 60
        });
        
        // Add orbit controls to the camera
        const orbitControls = camera.createOrbitControls({
            target: [0, 0, 0],
            minDistance: 2,
            maxDistance: 20,
            enableDamping: true,
            dampingFactor: 0.05,
            rotateSpeed: 1.0,
            zoomSpeed: 1.0,
            panSpeed: 0.5,
            autoRotate: false
        });
        
        // Load a texture manually without the TextureManager
        const response = await fetch('assets/textures/test.png');
        const blob = await response.blob();
        const bitmap = await createImageBitmap(blob);
        
        const cubeTexture = {
            gpuTexture: engine.renderer.device.createTexture({
                size: [bitmap.width, bitmap.height, 1],
                format: 'rgba8unorm',
                usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT
            }),
            sampler: engine.renderer.device.createSampler({
                magFilter: 'linear',
                minFilter: 'linear',
                addressModeU: 'repeat',
                addressModeV: 'repeat'
            }),
            width: bitmap.width,
            height: bitmap.height
        };
        
        engine.renderer.device.queue.copyExternalImageToTexture(
            { source: bitmap },
            { texture: cubeTexture.gpuTexture },
            [bitmap.width, bitmap.height]
        );
        
        // Create the first cube with cubemap material
        const cube1 = scene.createEntity();
        cube1.addComponent('Transform', {
            position: [-1.5, 0, 0],
            scale: [1, 1, 1]
        });
        
        // Create and initialize the cubemap material
        const cubemapMaterial = new CubemapMaterial(engine);
        await cubemapMaterial.initPromise;
        cubemapMaterial.setTexture(cubeTexture);
        
        // Add mesh renderer with the cubemap material
        cube1.addComponent('MeshRenderer', {
            mesh: engine.primitives.createBox(),
            material: cubemapMaterial
        });
        
        // Add Rotator component
        cube1.addComponent('Rotator', {
            axis: [0, 1, 0],
            speed: 0.5  // 0.5 radians per second
        });
        
        // Create the second cube with standard UV material
        const cube2 = scene.createEntity();
        cube2.addComponent('Transform', {
            position: [1.5, 0, 0],
            scale: [1, 1, 1]
        });
        
        // Create and initialize the standard material
        const standardMaterial = new StandardMaterial(engine);
        await standardMaterial.initPromise;
        standardMaterial.setTexture(cubeTexture);
        
        // Add mesh renderer with the standard material
        cube2.addComponent('MeshRenderer', {
            mesh: engine.primitives.createBox(),
            material: standardMaterial
        });
        
        // Add Rotator component to second cube too
        cube2.addComponent('Rotator', {
            axis: [0, 1, 0],
            speed: 0.5  // 0.5 radians per second
        });
        
        // Add a light
        const light = scene.createEntity();
        light.addComponent('Transform', {
            position: [5, 5, 5]
        });
        light.addComponent('DirectionalLight', {
            color: [1, 1, 1],
            intensity: 1.0
        });
        
        // Start the render loop
        engine.start((time, deltaTime) => {
            // Update stats
            stats.textContent = `FPS: ${Math.round(1 / deltaTime)} | Time: ${time.toFixed(1)}s`;
            
            // Update camera (will update orbit controls)
            camera.update(deltaTime);
            
            // Update the scene - this will update all components including our Rotator
            scene.update(deltaTime);
            
            // Render the scene
            engine.render(scene, camera);
        });
        
        // Export to global for debugging
        window.engine = engine;
        window.scene = scene;
        window.camera = camera;
        
    } catch (error) {
        console.error('Engine initialization failed:', error);
        document.body.innerHTML = `<div class="error"><h2>Initialization Failed</h2><p>${error.message}</p></div>`;
    }
}

// Start the application
main();
