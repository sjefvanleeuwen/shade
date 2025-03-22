export class GameManager {
    constructor(engine) {
        this.engine = engine;
        this.currentState = null;
        this.states = new Map();
        this.nextStateId = null;
        
        // Game-specific resources
        this.score = 0;
        this.level = 1;
        this.lives = 3;
        
        // UI elements
        this.uiElements = new Map();
        
        console.log('Game manager initialized');
    }
    
    // Register a game state
    registerState(id, stateClass) {
        this.states.set(id, stateClass);
    }
    
    // Update to handle async state changes
    async changeState(stateId, params = {}) {
        if (!this.states.has(stateId)) {
            console.error(`Game state not found: ${stateId}`);
            return false;
        }
        
        // Exit current state if exists
        if (this.currentState) {
            this.currentState.exit();
        }
        
        // Create and enter new state
        const StateClass = this.states.get(stateId);
        this.currentState = new StateClass(this, params);
        await this.currentState.enter();
        
        // Clear the next state to prevent double transitions
        this.nextStateId = null;
        this.nextStateParams = null;
        
        return true;
    }
    
    // Modified update to handle async state changes
    update(deltaTime) {
        // If there's a pending state change, do nothing
        // The change will be handled by the engine's game loop
        if (this.nextStateId) {
            return;
        }
        
        // Update current state
        if (this.currentState) {
            this.currentState.update(deltaTime);
        }
    }
    
    // Schedule a state change for next update
    scheduleStateChange(stateId, params = {}) {
        this.nextStateId = stateId;
        this.nextStateParams = params;
    }
    
    // Check if a state change is pending and process it
    async processStateChange() {
        if (this.nextStateId) {
            const stateId = this.nextStateId;
            const params = this.nextStateParams;
            
            // Clear pending state change
            this.nextStateId = null;
            this.nextStateParams = null;
            
            // Perform the state change
            await this.changeState(stateId, params);
            return true;
        }
        return false;
    }
    
    // Create UI element
    createUI(id, options = {}) {
        // Create element
        const element = document.createElement(options.type || 'div');
        element.id = id;
        
        // Apply styles
        Object.assign(element.style, {
            position: 'absolute',
            fontFamily: 'Arial, sans-serif',
            ...options.style
        });
        
        // Set content
        if (options.text) {
            element.textContent = options.text;
        }
        
        // Add to document
        document.body.appendChild(element);
        
        // Store reference
        this.uiElements.set(id, element);
        
        return element;
    }
    
    // Update UI element
    updateUI(id, options = {}) {
        const element = this.uiElements.get(id);
        if (!element) return false;
        
        // Update text
        if (options.text !== undefined) {
            element.textContent = options.text;
        }
        
        // Update styles
        if (options.style) {
            Object.assign(element.style, options.style);
        }
        
        // Update visibility
        if (options.visible !== undefined) {
            element.style.display = options.visible ? 'block' : 'none';
        }
        
        return true;
    }
    
    // Remove UI element
    removeUI(id) {
        const element = this.uiElements.get(id);
        if (!element) return false;
        
        document.body.removeChild(element);
        this.uiElements.delete(id);
        
        return true;
    }
    
    // Change score
    addScore(points) {
        this.score += points;
        return this.score;
    }
    
    // Change lives
    addLives(lives) {
        this.lives += lives;
        return this.lives;
    }
    
    // Reset game
    reset() {
        this.score = 0;
        this.level = 1;
        this.lives = 3;
    }
    
    // Clean up resources
    dispose() {
        // Exit current state
        if (this.currentState) {
            this.currentState.exit();
            this.currentState = null;
        }
        
        // Clear all UI
        for (const id of this.uiElements.keys()) {
            this.removeUI(id);
        }
    }
}
