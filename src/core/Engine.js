import { Renderer } from '../render/Renderer.js';
import { Scene } from './Scene.js';
import { Camera } from '../render/Camera.js';
import { Time } from './Time.js';
import { AssetManager } from '../assets/AssetManager.js';
import { Primitives } from '../render/Primitives.js';
import { MaterialLibrary } from '../render/materials/MaterialLibrary.js';
import { MathUtils } from '../utils/math/MathUtils.js';
import { TextureManager } from '../render/textures/TextureManager.js';

export class Engine {
    constructor(options = {}) {
        this.options = {
            canvas: null,
            debug: false,
            vsync: true,
            msaaSamples: 4,
            ...options
        };
        
        this.canvas = this.options.canvas || document.createElement('canvas');
        this.debug = this.options.debug;
        
        // Core systems
        this.renderer = null;
        this.time = new Time();
        this.assets = new AssetManager(this);
        this.math = new MathUtils();
        
        // Resources
        this.primitives = new Primitives(this);
        this.materials = new MaterialLibrary(this);
        this.textures = null; // Will be initialized after renderer
        
        // Animation frame ID for cancellation
        this._animationFrame = null;
        this._lastFrameTime = 0;
        this._running = false;
        
        // State
        this.initialized = false;
    }
    
    async initialize() {
        if (this.initialized) return;
        
        console.log('Initializing Shade Engine...');
        
        try {
            // Initialize the renderer
            this.renderer = new Renderer({
                engine: this,
                canvas: this.canvas,
                msaaSamples: this.options.msaaSamples
            });
            
            await this.renderer.initialize();
            
            // TEMPORARILY DISABLE TextureManager until we fix the issues
            // this.textures = new TextureManager(this);
            
            // Initialize other core systems
            // (Will be expanded as we build more systems)
            
            this.initialized = true;
            console.log('Shade Engine initialized successfully');
            
        } catch (error) {
            console.error('Failed to initialize Shade Engine:', error);
            throw error;
        }
    }
    
    createScene() {
        return new Scene(this);
    }
    
    createCamera(options) {
        return new Camera(this, options);
    }
    
    render(scene, camera) {
        if (!this.initialized) throw new Error('Engine not initialized');
        
        this.renderer.render(scene, camera);
    }
    
    start(callback) {
        if (!this.initialized) throw new Error('Engine not initialized');
        if (this._running) return;
        
        this._running = true;
        this._lastFrameTime = performance.now() / 1000;
        
        const loop = (now) => {
            now /= 1000; // Convert to seconds
            
            const deltaTime = Math.min(now - this._lastFrameTime, 0.1); // Cap at 100ms
            this.time.update(now, deltaTime);
            
            // Log frame time occasionally to verify time is updating
            if (Math.floor(this.time.elapsed * 10) % 100 === 0) {
                console.log(`Time elapsed: ${this.time.elapsed.toFixed(2)}s, Delta: ${deltaTime.toFixed(3)}s`);
            }
            
            if (callback) {
                callback(now, deltaTime);
            }
            
            this._lastFrameTime = now;
            this._animationFrame = requestAnimationFrame(loop);
        };
        
        this._animationFrame = requestAnimationFrame(loop);
    }
    
    stop() {
        if (this._animationFrame) {
            cancelAnimationFrame(this._animationFrame);
            this._animationFrame = null;
        }
        this._running = false;
    }
    
    resize() {
        if (this.renderer) {
            this.renderer.resize();
        }
    }
    
    dispose() {
        this.stop();
        
        if (this.renderer) {
            this.renderer.dispose();
        }
        
        // Dispose other systems as they're implemented
        
        this.initialized = false;
    }
}
