export class Input {
    constructor(entity, options = {}) {
        this.entity = entity;
        this.scene = entity.scene;
        this.engine = this.scene.engine;
        
        // Configuration
        this.moveSpeed = options.moveSpeed || 5.0;
        this.jumpForce = options.jumpForce || 10.0;
        this.rotationSpeed = options.rotationSpeed || 2.0;
        
        // Key mappings
        this.keys = {
            forward: options.keys?.forward || 'w',
            backward: options.keys?.backward || 's',
            left: options.keys?.left || 'a',
            right: options.keys?.right || 'd',
            jump: options.keys?.jump || ' '  // Space
        };
        
        // Input state
        this.inputState = {
            forward: false,
            backward: false,
            left: false,
            right: false,
            jump: false,
            mouseX: 0,
            mouseY: 0,
            mouseDeltaX: 0,
            mouseDeltaY: 0
        };
        
        // Setup event listeners
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Store bound methods for later removal
        this.boundKeyDown = this.handleKeyDown.bind(this);
        this.boundKeyUp = this.handleKeyUp.bind(this);
        this.boundMouseMove = this.handleMouseMove.bind(this);
        
        // Add event listeners
        window.addEventListener('keydown', this.boundKeyDown);
        window.addEventListener('keyup', this.boundKeyUp);
        this.engine.canvas.addEventListener('mousemove', this.boundMouseMove);
        
        // Lock mouse pointer for first-person controls if requested
        if (this.engine.canvas.requestPointerLock) {
            this.engine.canvas.addEventListener('click', () => {
                this.engine.canvas.requestPointerLock();
            });
        }
    }
    
    handleKeyDown(event) {
        this.updateInputStateFromKey(event.key.toLowerCase(), true);
    }
    
    handleKeyUp(event) {
        this.updateInputStateFromKey(event.key.toLowerCase(), false);
    }
    
    handleMouseMove(event) {
        // Update mouse position
        this.inputState.mouseX = event.clientX;
        this.inputState.mouseY = event.clientY;
        
        // Handle pointer lock for FPS-style camera control
        if (document.pointerLockElement === this.engine.canvas) {
            this.inputState.mouseDeltaX = event.movementX;
            this.inputState.mouseDeltaY = event.movementY;
        } else {
            this.inputState.mouseDeltaX = 0;
            this.inputState.mouseDeltaY = 0;
        }
    }
    
    updateInputStateFromKey(key, isPressed) {
        // Map key to action
        switch (key) {
            case this.keys.forward:
                this.inputState.forward = isPressed;
                break;
            case this.keys.backward:
                this.inputState.backward = isPressed;
                break;
            case this.keys.left:
                this.inputState.left = isPressed;
                break;
            case this.keys.right:
                this.inputState.right = isPressed;
                break;
            case this.keys.jump:
                this.inputState.jump = isPressed;
                break;
        }
    }
    
    update(deltaTime) {
        const transform = this.entity.getComponent('Transform');
        const physics = this.entity.getComponent('Physics');
        
        if (!transform) return;
        
        // Calculate movement direction in local space
        let moveX = 0;
        let moveZ = 0;
        
        if (this.inputState.forward) moveZ -= 1;
        if (this.inputState.backward) moveZ += 1;
        if (this.inputState.left) moveX -= 1;
        if (this.inputState.right) moveX += 1;
        
        // Normalize if moving diagonally
        if (moveX !== 0 && moveZ !== 0) {
            const length = Math.sqrt(moveX * moveX + moveZ * moveZ);
            moveX /= length;
            moveZ /= length;
        }
        
        // Apply movement based on component type
        if (physics) {
            // Physics-based movement
            physics.velocity[0] = moveX * this.moveSpeed;
            physics.velocity[2] = moveZ * this.moveSpeed;
            
            // Handle jumping
            if (this.inputState.jump && Math.abs(physics.velocity[1]) < 0.1) {
                physics.velocity[1] = this.jumpForce;
            }
        } else {
            // Direct transform movement
            transform.position[0] += moveX * this.moveSpeed * deltaTime;
            transform.position[2] += moveZ * this.moveSpeed * deltaTime;
        }
        
        // Handle rotation from mouse input
        if (this.inputState.mouseDeltaX !== 0) {
            // TODO: Apply rotation based on mouse delta
        }
        
        // Reset mouse delta after using it
        this.inputState.mouseDeltaX = 0;
        this.inputState.mouseDeltaY = 0;
    }
    
    dispose() {
        // Remove event listeners
        window.removeEventListener('keydown', this.boundKeyDown);
        window.removeEventListener('keyup', this.boundKeyUp);
        this.engine.canvas.removeEventListener('mousemove', this.boundMouseMove);
    }
}
