// Base class for game states
export class GameState {
    constructor(gameManager, params = {}) {
        this.gameManager = gameManager;
        this.engine = gameManager.engine;
        this.scene = null;
        this.camera = null;
        this.params = params;
    }
    
    // Made enter method async to allow derived classes to use await
    async enter() {
        console.log(`Entering game state: ${this.constructor.name}`);
        
        // Create scene
        this.scene = this.engine.createScene();
        
        // Create camera
        this.camera = this.engine.createCamera({
            position: [0, 1, 5],
            target: [0, 0, 0],
            fov: 60
        });
    }
    
    // Update state
    update(deltaTime) {
        // Basic update - override in subclasses
        
        // Update camera
        if (this.camera) {
            this.camera.update(deltaTime);
        }
        
        // Render scene
        if (this.scene && this.camera) {
            this.engine.render(this.scene, this.camera);
        }
    }
    
    // Called when exiting this state
    exit() {
        console.log(`Exiting game state: ${this.constructor.name}`);
        
        // Clean up resources
        if (this.scene) {
            this.scene.dispose();
            this.scene = null;
        }
    }
}
