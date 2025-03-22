import { GameState } from '../GameState.js';

export class GameplayState extends GameState {
    constructor(gameManager, params = {}) {
        super(gameManager, params);
        
        // Game objects
        this.player = null;
        this.obstacles = [];
        this.collectibles = [];
        
        // Game settings
        this.level = gameManager.level;
        this.score = gameManager.score;
        this.lives = gameManager.lives;
        
        // Game state
        this.gameOver = false;
        this.paused = false;
    }
    
    async enter() {
        super.enter();
        
        // Create game UI
        this.createGameUI();
        
        // Create level
        await this.createLevel();
        
        // Create player
        await this.createPlayer();
        
        // Set up camera
        this.setupCamera();
        
        // Set up input handlers
        this.setupInput();
        
        // Start audio
        if (this.engine.audio) {
            this.engine.audio.playMusic('gameplay', { 
                fadeInDuration: 2.0 
            });
        }
    }
    
    createGameUI() {
        // Score display
        this.gameManager.createUI('scoreDisplay', {
            text: `Score: ${this.score}`,
            style: {
                top: '10px',
                left: '10px',
                color: 'white',
                fontSize: '1.2em',
                textShadow: '0 0 5px black'
            }
        });
        
        // Lives display
        this.gameManager.createUI('livesDisplay', {
            text: `Lives: ${this.lives}`,
            style: {
                top: '10px',
                right: '10px',
                color: 'white',
                fontSize: '1.2em',
                textShadow: '0 0 5px black'
            }
        });
        
        // Level display
        this.gameManager.createUI('levelDisplay', {
            text: `Level: ${this.level}`,
            style: {
                top: '40px',
                left: '10px',
                color: 'white',
                fontSize: '1.2em',
                textShadow: '0 0 5px black'
            }
        });
        
        // Pause menu (hidden initially)
        this.gameManager.createUI('pauseMenu', {
            style: {
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                background: 'rgba(0, 0, 0, 0.7)',
                padding: '20px',
                borderRadius: '10px',
                display: 'none',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '15px'
            }
        });
        
        const pauseMenu = document.getElementById('pauseMenu');
        
        // Add pause menu items
        const resumeButton = document.createElement('button');
        resumeButton.textContent = 'Resume Game';
        resumeButton.onclick = () => this.togglePause();
        
        const menuButton = document.createElement('button');
        menuButton.textContent = 'Return to Menu';
        menuButton.onclick = () => this.gameManager.changeState('menu');
        
        pauseMenu.appendChild(resumeButton);
        pauseMenu.appendChild(menuButton);
        
        // Game over screen (hidden initially)
        this.gameManager.createUI('gameOverScreen', {
            style: {
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                background: 'rgba(0, 0, 0, 0.8)',
                padding: '30px',
                borderRadius: '10px',
                display: 'none',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '20px'
            }
        });
        
        const gameOverScreen = document.getElementById('gameOverScreen');
        
        const gameOverTitle = document.createElement('h1');
        gameOverTitle.textContent = 'Game Over';
        gameOverTitle.style.color = 'white';
        
        const finalScore = document.createElement('h2');
        finalScore.id = 'finalScore';
        finalScore.textContent = `Final Score: ${this.score}`;
        finalScore.style.color = 'white';
        
        const restartButton = document.createElement('button');
        restartButton.textContent = 'Play Again';
        restartButton.onclick = () => this.restartGame();
        
        const menuButton2 = document.createElement('button');
        menuButton2.textContent = 'Main Menu';
        menuButton2.onclick = () => this.gameManager.changeState('menu');
        
        gameOverScreen.appendChild(gameOverTitle);
        gameOverScreen.appendChild(finalScore);
        gameOverScreen.appendChild(restartButton);
        gameOverScreen.appendChild(menuButton2);
    }
    
    async createLevel() {
        // Create floor
        const floor = this.scene.createEntity();
        floor.addComponent('Transform', {
            position: [0, -1, 0],
            scale: [20, 0.2, 20]
        });
        
        // Add a MeshRenderer with standard material
        const floorMaterial = new this.engine.StandardMaterial(this.engine);
        await floorMaterial.initPromise;
        
        // Load a texture for the floor
        const response = await fetch('assets/textures/floor.png');
        const blob = await response.blob();
        const bitmap = await createImageBitmap(blob);
        
        const floorTexture = {
            gpuTexture: this.engine.renderer.device.createTexture({
                size: [bitmap.width, bitmap.height, 1],
                format: 'rgba8unorm',
                usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT
            }),
            sampler: this.engine.renderer.device.createSampler({
                magFilter: 'linear',
                minFilter: 'linear',
                addressModeU: 'repeat',
                addressModeV: 'repeat'
            }),
            width: bitmap.width,
            height: bitmap.height
        };
        
        this.engine.renderer.device.queue.copyExternalImageToTexture(
            { source: bitmap },
            { texture: floorTexture.gpuTexture },
            [bitmap.width, bitmap.height]
        );
        
        floorMaterial.setTexture(floorTexture);
        
        floor.addComponent('MeshRenderer', {
            mesh: this.engine.primitives.createBox(),
            material: floorMaterial
        });
        
        // Add physics and collision
        floor.addComponent('Physics', {
            mass: 0, // Static body
            isKinematic: true
        });
        
        floor.addComponent('Collision', {
            shape: 'box',
            size: [20, 0.2, 20]
        });
        
        // Create obstacles based on level
        const obstacleCount = 5 + this.level * 2; // More obstacles for higher levels
        
        for (let i = 0; i < obstacleCount; i++) {
            await this.createObstacle();
        }
        
        // Create collectibles
        const collectibleCount = 5 + this.level; // More collectibles for higher levels
        
        for (let i = 0; i < collectibleCount; i++) {
            await this.createCollectible();
        }
    }
    
    async createObstacle() {
        // Random position within level bounds
        const x = (Math.random() - 0.5) * 18;
        const z = (Math.random() - 0.5) * 18;
        
        // Ensure not too close to player start position
        if (Math.abs(x) < 2 && Math.abs(z) < 2) {
            return this.createObstacle(); // Try again
        }
        
        const obstacle = this.scene.createEntity();
        obstacle.addComponent('Transform', {
            position: [x, 0.5, z],
            scale: [1, 1, 1]
        });
        
        // Add a MeshRenderer with cubemap material
        const obstacleMaterial = new this.engine.CubemapMaterial(this.engine);
        await obstacleMaterial.initPromise;
        
        // Load a texture for the obstacle
        const response = await fetch('assets/textures/obstacle.png');
        const blob = await response.blob();
        const bitmap = await createImageBitmap(blob);
        
        const obstacleTexture = {
            gpuTexture: this.engine.renderer.device.createTexture({
                size: [bitmap.width, bitmap.height, 1],
                format: 'rgba8unorm',
                usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT
            }),
            sampler: this.engine.renderer.device.createSampler({
                magFilter: 'linear',
                minFilter: 'linear',
                addressModeU: 'repeat',
                addressModeV: 'repeat'
            }),
            width: bitmap.width,
            height: bitmap.height
        };
        
        this.engine.renderer.device.queue.copyExternalImageToTexture(
            { source: bitmap },
            { texture: obstacleTexture.gpuTexture },
            [bitmap.width, bitmap.height]
        );
        
        obstacleMaterial.setTexture(obstacleTexture);
        
        obstacle.addComponent('MeshRenderer', {
            mesh: this.engine.primitives.createBox(),
            material: obstacleMaterial
        });
        
        // Add slow rotation
        obstacle.addComponent('Rotator', {
            axis: [Math.random(), Math.random(), Math.random()],
            speed: 0.2 + Math.random() * 0.3
        });
        
        // Add physics and collision
        obstacle.addComponent('Physics', {
            mass: 0, // Static body
            isKinematic: true
        });
        
        obstacle.addComponent('Collision', {
            shape: 'box',
            size: [1, 1, 1],
            onCollisionEnter: (other) => {
                if (other.entity === this.player) {
                    this.handleObstacleCollision();
                }
            }
        });
        
        this.obstacles.push(obstacle);
        return obstacle;
    }
    
    async createCollectible() {
        // Random position within level bounds
        const x = (Math.random() - 0.5) * 18;
        const z = (Math.random() - 0.5) * 18;
        
        // Ensure not too close to player start position
        if (Math.abs(x) < 2 && Math.abs(z) < 2) {
            return this.createCollectible(); // Try again
        }
        
        const collectible = this.scene.createEntity();
        collectible.addComponent('Transform', {
            position: [x, 0.5, z],
            scale: [0.5, 0.5, 0.5]
        });
        
        // Add a MeshRenderer with standard material
        const collectibleMaterial = new this.engine.StandardMaterial(this.engine);
        await collectibleMaterial.initPromise;
        
        // Load a texture for the collectible
        const response = await fetch('assets/textures/collectible.png');
        const blob = await response.blob();
        const bitmap = await createImageBitmap(blob);
        
        const collectibleTexture = {
            gpuTexture: this.engine.renderer.device.createTexture({
                size: [bitmap.width, bitmap.height, 1],
                format: 'rgba8unorm',
                usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT
            }),
            sampler: this.engine.renderer.device.createSampler({
                magFilter: 'linear',
                minFilter: 'linear',
                addressModeU: 'repeat',
                addressModeV: 'repeat'
            }),
            width: bitmap.width,
            height: bitmap.height
        };
        
        this.engine.renderer.device.queue.copyExternalImageToTexture(
            { source: bitmap },
            { texture: collectibleTexture.gpuTexture },
            [bitmap.width, bitmap.height]
        );
        
        collectibleMaterial.setTexture(collectibleTexture);
        
        collectible.addComponent('MeshRenderer', {
            mesh: this.engine.primitives.createBox(),
            material: collectibleMaterial
        });
        
        // Add rotation and bobbing animation
        collectible.addComponent('Rotator', {
            axis: [0, 1, 0],
            speed: 1.0
        });
        
        // Add collision as trigger
        collectible.addComponent('Collision', {
            shape: 'box',
            size: [0.5, 0.5, 0.5],
            isTrigger: true,
            onCollisionEnter: (other) => {
                if (other.entity === this.player) {
                    this.collectItem(collectible);
                }
            }
        });
        
        this.collectibles.push(collectible);
        return collectible;
    }
    
    async createPlayer() {
        this.player = this.scene.createEntity();
        this.player.addComponent('Transform', {
            position: [0, 0.5, 0],
            scale: [0.5, 0.5, 0.5]
        });
        
        // Add a MeshRenderer with standard material
        const playerMaterial = new this.engine.StandardMaterial(this.engine);
        await playerMaterial.initPromise;
        
        // Load a texture for the player
        const response = await fetch('assets/textures/player.png');
        const blob = await response.blob();
        const bitmap = await createImageBitmap(blob);
        
        const playerTexture = {
            gpuTexture: this.engine.renderer.device.createTexture({
                size: [bitmap.width, bitmap.height, 1],
                format: 'rgba8unorm',
                usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT
            }),
            sampler: this.engine.renderer.device.createSampler({
                magFilter: 'linear',
                minFilter: 'linear',
                addressModeU: 'repeat',
                addressModeV: 'repeat'
            }),
            width: bitmap.width,
            height: bitmap.height
        };
        
        this.engine.renderer.device.queue.copyExternalImageToTexture(
            { source: bitmap },
            { texture: playerTexture.gpuTexture },
            [bitmap.width, bitmap.height]
        );
        
        playerMaterial.setTexture(playerTexture);
        
        this.player.addComponent('MeshRenderer', {
            mesh: this.engine.primitives.createBox(),
            material: playerMaterial
        });
        
        // Add physics
        this.player.addComponent('Physics', {
            mass: 1,
            useGravity: true,
            drag: 0.5,
            velocity: [0, 0, 0]
        });
        
        // Add collision
        this.player.addComponent('Collision', {
            shape: 'box',
            size: [0.5, 0.5, 0.5]
        });
        
        // Add input controller
        this.player.addComponent('Input', {
            moveSpeed: 5.0,
            jumpForce: 8.0
        });
    }
    
    setupCamera() {
        // Third-person follow camera
        this.camera.setPosition(0, 3, 5);
        this.camera.lookAt(0, 0, 0);
        
        // Create orbit controls
        this.cameraControls = this.camera.createOrbitControls({
            target: [0, 0, 0],
            minDistance: 3,
            maxDistance: 10,
            minPolarAngle: 0.1,
            maxPolarAngle: Math.PI / 2 - 0.1,
            enableDamping: true,
            dampingFactor: 0.1
        });
    }
    
    setupInput() {
        // Pause game on ESC key
        this.keyDownHandler = (event) => {
            if (event.key === 'Escape') {
                this.togglePause();
            }
        };
        
        window.addEventListener('keydown', this.keyDownHandler);
    }
    
    togglePause() {
        this.paused = !this.paused;
        
        // Show/hide pause menu
        document.getElementById('pauseMenu').style.display = this.paused ? 'flex' : 'none';
        
        // Pause/resume game logic
        if (this.paused) {
            // Pause audio
            if (this.engine.audio) {
                this.engine.audio.setMasterVolume(0.2);
            }
        } else {
            // Resume audio
            if (this.engine.audio) {
                this.engine.audio.setMasterVolume(1.0);
            }
        }
    }
    
    handleObstacleCollision() {
        // Player hit an obstacle
        this.lives--;
        
        // Update UI
        this.gameManager.updateUI('livesDisplay', {
            text: `Lives: ${this.lives}`
        });
        
        // Play sound
        if (this.engine.audio) {
            this.engine.audio.playSound('hit');
        }
        
        // Check if game over
        if (this.lives <= 0) {
            this.gameOver = true;
            this.showGameOver();
        } else {
            // Reset player position
            const transform = this.player.getComponent('Transform');
            transform.position = [0, 0.5, 0];
            
            // Reset player velocity
            const physics = this.player.getComponent('Physics');
            physics.velocity = [0, 0, 0];
        }
    }
    
    collectItem(collectible) {
        // Add score
        this.score += 100;
        
        // Update UI
        this.gameManager.updateUI('scoreDisplay', {
            text: `Score: ${this.score}`
        });
        
        // Play sound
        if (this.engine.audio) {
            this.engine.audio.playSound('collect');
        }
        
        // Remove collectible
        const index = this.collectibles.indexOf(collectible);
        if (index >= 0) {
            this.collectibles.splice(index, 1);
        }
        
        this.scene.removeEntity(collectible.id);
        
        // Check if level complete
        if (this.collectibles.length === 0) {
            this.completeLevel();
        }
    }
    
    completeLevel() {
        // Level complete
        this.level++;
        
        // Update game manager level
        this.gameManager.level = this.level;
        
        // Play sound
        if (this.engine.audio) {
            this.engine.audio.playSound('levelComplete');
        }
        
        // Progress to next level
        this.gameManager.changeState('gameplay', {
            level: this.level,
            score: this.score,
            lives: this.lives
        });
    }
    
    showGameOver() {
        // Show game over screen
        document.getElementById('gameOverScreen').style.display = 'flex';
        document.getElementById('finalScore').textContent = `Final Score: ${this.score}`;
        
        // Play sound
        if (this.engine.audio) {
            this.engine.audio.stopMusic(2.0);
            this.engine.audio.playSound('gameOver');
        }
    }
    
    restartGame() {
        // Reset game
        this.gameManager.reset();
        
        // Start new game
        this.gameManager.changeState('gameplay');
    }
    
    update(deltaTime) {
        // Skip updates if paused or game over
        if (this.paused || this.gameOver) {
            // Still render the scene
            super.update(deltaTime);
            return;
        }
        
        // Update game objects
        
        // Update player and camera
        if (this.player) {
            const transform = this.player.getComponent('Transform');
            
            // Update camera target to follow player
            if (transform && this.cameraControls) {
                this.cameraControls.setTarget(transform.position);
            }
        }
        
        // Check for collectibles falling off the world
        for (let i = this.collectibles.length - 1; i >= 0; i--) {
            const collectible = this.collectibles[i];
            const transform = collectible.getComponent('Transform');
            
            if (transform && transform.position[1] < -10) {
                // Remove collectible
                this.collectibles.splice(i, 1);
                this.scene.removeEntity(collectible.id);
            }
        }
        
        // Update collectible animations (bobbing)
        for (const collectible of this.collectibles) {
            const transform = collectible.getComponent('Transform');
            if (transform) {
                // Simple bobbing motion
                transform.position[1] = 0.5 + Math.sin(performance.now() / 500) * 0.2;
            }
        }
        
        // Update UI
        this.gameManager.updateUI('scoreDisplay', {
            text: `Score: ${this.score}`
        });
        
        // Render the scene
        super.update(deltaTime);
    }
    
    exit() {
        // Remove event listeners
        window.removeEventListener('keydown', this.keyDownHandler);
        
        // Remove UI elements
        this.gameManager.removeUI('scoreDisplay');
        this.gameManager.removeUI('livesDisplay');
        this.gameManager.removeUI('levelDisplay');
        this.gameManager.removeUI('pauseMenu');
        this.gameManager.removeUI('gameOverScreen');
        
        // Update game manager with final stats
        this.gameManager.score = this.score;
        this.gameManager.level = this.level;
        this.gameManager.lives = this.lives;
        
        // Stop game audio
        if (this.engine.audio) {
            this.engine.audio.stopMusic(1.0);
        }
        
        super.exit();
    }
}
