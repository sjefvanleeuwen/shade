import { Renderer } from '../render/Renderer.js';
import { Scene } from './Scene.js';
import { Camera } from '../render/Camera.js';
import { Time } from './Time.js';
import { AssetManager } from '../assets/AssetManager.js';
import { Primitives } from '../render/Primitives.js';
import { MaterialLibrary } from '../render/materials/MaterialLibrary.js';
import { MathUtils } from '../utils/math/MathUtils.js';
import { TextureManager } from '../render/textures/TextureManager.js';
import { AudioManager } from '../audio/AudioManager.js';
import { GameManager } from '../game/GameManager.js';
import { MenuState } from '../game/states/MenuState.js';
import { GameplayState } from '../game/states/GameplayState.js';
import { CubemapMaterial } from '../render/materials/CubemapMaterial.js';
import { StandardMaterial } from '../render/materials/StandardMaterial.js';

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
        this.audio = null;
        this.game = null;
        
        // Resources
        this.primitives = new Primitives(this);
        this.materials = new MaterialLibrary(this);
        this.textures = null; // Will be initialized after renderer
        
        // Material classes
        this.CubemapMaterial = CubemapMaterial;
        this.StandardMaterial = StandardMaterial;
        
        // Animation frame ID for cancellation
        this._animationFrame = null;
        this._lastFrameTime = 0;
        this._running = false;
        
        // State
        this.initialized = false;
        
        // Component registration system
        this.componentFactories = new Map();
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
            
            // Initialize TextureManager
            this.textures = new TextureManager(this);
            
            // Initialize Audio
            this.audio = new AudioManager(this);
            
            // Initialize Game Manager
            this.game = new GameManager(this);
            
            // Register game states
            this.registerGameStates();
            
            // Load initial assets
            await this.loadInitialAssets();
            
            this.initialized = true;
            console.log('Shade Engine initialized successfully');
            
        } catch (error) {
            console.error('Failed to initialize Shade Engine:', error);
            throw error;
        }
    }
    
    registerGameStates() {
        if (!this.game) return;
        
        this.game.registerState('menu', MenuState);
        this.game.registerState('gameplay', GameplayState);
        // Register more states as needed
    }
    
    async loadInitialAssets() {
        // Load minimal required assets for the game to start
        if (this.audio) {
            try {
                // Load essential sounds
                await this.audio.loadSound('hit', 'assets/sounds/hit.mp3');
                await this.audio.loadSound('collect', 'assets/sounds/collect.mp3');
                await this.audio.loadSound('gameOver', 'assets/sounds/gameOver.mp3');
                await this.audio.loadSound('levelComplete', 'assets/sounds/levelComplete.mp3');
                
                // Load music
                await this.audio.loadMusic('menu', 'assets/music/menu.mp3');
                await this.audio.loadMusic('gameplay', 'assets/music/gameplay.mp3');
                
                console.log('Audio assets loaded successfully');
            } catch (error) {
                console.warn('Failed to load some audio assets:', error);
                // Continue even if audio fails
            }
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
        
        const loop = async (now) => {
            now /= 1000; // Convert to seconds
            
            const deltaTime = Math.min(now - this._lastFrameTime, 0.1); // Cap at 100ms
            this.time.update(now, deltaTime);
            
            // Log frame time occasionally to verify time is updating
            if (Math.floor(this.time.elapsed * 10) % 100 === 0) {
                console.log(`Time elapsed: ${this.time.elapsed.toFixed(2)}s, Delta: ${deltaTime.toFixed(3)}s`);
            }
            
            // Process any pending game state changes
            if (this.game) {
                await this.game.processStateChange();
            }
            
            if (callback) {
                callback(now, deltaTime);
            }
            
            this._lastFrameTime = now;
            this._animationFrame = requestAnimationFrame(loop);
        };
        
        this._animationFrame = requestAnimationFrame(loop);
    }
    
    startGame(initialState = 'menu') {
        if (!this.game) {
            console.error('Game manager not initialized');
            return false;
        }
        
        // Schedule the initial state change
        this.game.scheduleStateChange(initialState);
        
        // Start the engine loop if not already running
        if (!this._running) {
            this.start((time, deltaTime) => {
                // Update game manager
                if (this.game) {
                    this.game.update(deltaTime);
                }
            });
        }
        
        return true;
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
    
    registerComponent(type, factory) {
        if (typeof factory !== 'function') {
            console.error(`Component factory for ${type} must be a function`);
            return false;
        }
        
        this.componentFactories.set(type, factory);
        console.log(`Registered component type: ${type}`);
        return true;
    }
    
    dispose() {
        this.stop();
        
        if (this.renderer) {
            this.renderer.dispose();
        }
        
        // Dispose other systems as they're implemented
        if (this.audio) {
            this.audio.dispose();
        }
        
        if (this.game) {
            this.game.dispose();
        }
        
        if (this.textures) {
            this.textures.dispose();
        }
        
        if (this.primitives) {
            this.primitives.dispose();
        }
        
        if (this.materials) {
            this.materials.dispose();
        }
        
        this.initialized = false;
    }
}
