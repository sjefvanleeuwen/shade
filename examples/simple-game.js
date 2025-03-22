import { Engine } from '../src/core/Engine.js';
import { Physics } from '../src/components/Physics.js';
import { Input } from '../src/components/Input.js';
import { Collision } from '../src/components/Collision.js';

// Register physics components with engine
function registerComponents(engine) {
    // Register component factories with the engine
    engine.registerComponent('Physics', (entity, options) => new Physics(entity, options));
    engine.registerComponent('Input', (entity, options) => new Input(entity, options));
    engine.registerComponent('Collision', (entity, options) => new Collision(entity, options));
}

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
        
        // Register game components
        registerComponents(engine);
        
        // Wait for engine initialization
        await engine.initialize();
        
        // Start the game (it will begin with the menu state)
        engine.startGame();
        
        // Stats display update
        engine.start((time, deltaTime) => {
            stats.textContent = `FPS: ${Math.round(1 / deltaTime)} | Time: ${time.toFixed(1)}s`;
        });
        
    } catch (error) {
        console.error('Game initialization failed:', error);
        document.body.innerHTML = `<div class="error"><h2>Initialization Failed</h2><p>${error.message}</p></div>`;
    }
}

// Start the application
main();
