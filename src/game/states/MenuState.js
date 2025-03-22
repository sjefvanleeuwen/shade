import { GameState } from '../GameState.js';

export class MenuState extends GameState {
    constructor(gameManager, params = {}) {
        super(gameManager, params);
        
        // Menu options
        this.menuOptions = [
            { id: 'start', text: 'Start Game', action: () => this.startGame() },
            { id: 'options', text: 'Options', action: () => this.showOptions() },
            { id: 'credits', text: 'Credits', action: () => this.showCredits() }
        ];
        
        this.selectedOption = 0;
    }
    
    async enter() {
        super.enter();
        
        // Create menu UI
        this.createMenuUI();
        
        // Create a background scene
        await this.createBackground();
        
        // Set up input handlers
        this.setupInput();
    }
    
    createMenuUI() {
        // Create title
        this.gameManager.createUI('menuTitle', {
            text: 'My Awesome WebGPU Game',
            style: {
                top: '10%',
                left: '50%',
                transform: 'translateX(-50%)',
                fontSize: '2.5em',
                color: 'white',
                textAlign: 'center',
                textShadow: '0 0 10px rgba(0,0,255,0.7)'
            }
        });
        
        // Create menu container
        const menuContainer = this.gameManager.createUI('menuContainer', {
            style: {
                top: '40%',
                left: '50%',
                transform: 'translateX(-50%)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '20px'
            }
        });
        
        // Create menu options
        this.menuOptions.forEach((option, index) => {
            const button = document.createElement('div');
            button.textContent = option.text;
            button.className = 'menu-option';
            button.id = `menu-${option.id}`;
            
            // Style the button
            Object.assign(button.style, {
                padding: '10px 30px',
                fontSize: '1.5em',
                color: 'white',
                background: index === this.selectedOption ? 'rgba(0, 100, 255, 0.7)' : 'rgba(0, 0, 0, 0.5)',
                borderRadius: '5px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
            });
            
            // Add event listeners
            button.addEventListener('click', () => {
                this.selectOption(index);
                option.action();
            });
            
            button.addEventListener('mouseover', () => {
                this.selectOption(index);
            });
            
            menuContainer.appendChild(button);
        });
        
        // Add footer
        this.gameManager.createUI('menuFooter', {
            text: '© 2023 Shade Engine - WebGPU Powered',
            style: {
                bottom: '5%',
                left: '50%',
                transform: 'translateX(-50%)',
                color: 'rgba(255, 255, 255, 0.5)',
                fontSize: '0.8em'
            }
        });
    }
    
    async createBackground() {
        // Create a rotating cube as background
        const cube = this.scene.createEntity();
        cube.addComponent('Transform', {
            position: [0, 0, 0],
            scale: [1, 1, 1]
        });
        
        // Create a standard material with the texture
        const standardMaterial = new this.engine.StandardMaterial(this.engine);
        await standardMaterial.initPromise;
        
        // Load a texture manually
        const response = await fetch('assets/textures/menu_background.png');
        const blob = await response.blob();
        const bitmap = await createImageBitmap(blob);
        
        const menuTexture = {
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
            { texture: menuTexture.gpuTexture },
            [bitmap.width, bitmap.height]
        );
        
        standardMaterial.setTexture(menuTexture);
        
        // Add mesh renderer with the standard material
        cube.addComponent('MeshRenderer', {
            mesh: this.engine.primitives.createBox(),
            material: standardMaterial
        });
        
        // Add slow rotation
        cube.addComponent('Rotator', {
            axis: [0, 1, 0.3],
            speed: 0.2
        });
        
        // Position camera
        this.camera.setPosition(0, 0, 4);
        this.camera.lookAt(0, 0, 0);
        
        // Add orbit controls with limits
        const orbitControls = this.camera.createOrbitControls({
            enableZoom: false,
            enablePan: false,
            rotateSpeed: 0.1,
            autoRotate: true,
            autoRotateSpeed: 0.5
        });
    }
    
    setupInput() {
        // Keyboard navigation
        this.keyDownHandler = (event) => {
            switch (event.key) {
                case 'ArrowUp':
                    this.selectOption(this.selectedOption - 1);
                    break;
                case 'ArrowDown':
                    this.selectOption(this.selectedOption + 1);
                    break;
                case 'Enter':
                    this.menuOptions[this.selectedOption].action();
                    break;
            }
        };
        
        window.addEventListener('keydown', this.keyDownHandler);
    }
    
    selectOption(index) {
        // Ensure index is within bounds
        const newIndex = Math.max(0, Math.min(this.menuOptions.length - 1, index));
        
        // Skip if already selected
        if (newIndex === this.selectedOption) return;
        
        // Update previous selection
        const prevElement = document.getElementById(`menu-${this.menuOptions[this.selectedOption].id}`);
        if (prevElement) {
            prevElement.style.background = 'rgba(0, 0, 0, 0.5)';
        }
        
        // Update new selection
        this.selectedOption = newIndex;
        const newElement = document.getElementById(`menu-${this.menuOptions[this.selectedOption].id}`);
        if (newElement) {
            newElement.style.background = 'rgba(0, 100, 255, 0.7)';
        }
    }
    
    startGame() {
        this.gameManager.changeState('gameplay');
    }
    
    showOptions() {
        this.gameManager.changeState('options');
    }
    
    showCredits() {
        this.gameManager.changeState('credits');
    }
    
    update(deltaTime) {
        super.update(deltaTime);
        
        // Menu-specific updates here
    }
    
    exit() {
        // Remove event listeners
        window.removeEventListener('keydown', this.keyDownHandler);
        
        // Remove UI elements
        this.gameManager.removeUI('menuTitle');
        this.gameManager.removeUI('menuContainer');
        this.gameManager.removeUI('menuFooter');
        
        super.exit();
    }
}
