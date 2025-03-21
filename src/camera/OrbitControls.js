export class OrbitControls {
    constructor(camera, options = {}) {
        this.camera = camera;
        this.engine = camera.engine;
        this.canvas = this.engine.canvas;
        
        // Target point to orbit around
        this.target = options.target || [0, 0, 0];
        
        // Distance constraints
        this.minDistance = options.minDistance || 1;
        this.maxDistance = options.maxDistance || 100;
        
        // Angle constraints (in radians)
        this.minPolarAngle = options.minPolarAngle || 0.1;
        this.maxPolarAngle = options.maxPolarAngle || Math.PI - 0.1;
        this.minAzimuthAngle = options.minAzimuthAngle || -Infinity;
        this.maxAzimuthAngle = options.maxAzimuthAngle || Infinity;
        
        // Speed settings
        this.rotateSpeed = options.rotateSpeed || 1.0;
        this.zoomSpeed = options.zoomSpeed || 1.0;
        this.panSpeed = options.panSpeed || 1.0;
        
        // Smooth damping
        this.enableDamping = options.enableDamping !== undefined ? options.enableDamping : true;
        this.dampingFactor = options.dampingFactor || 0.05;
        
        // State
        this.spherical = { radius: 0, phi: 0, theta: 0 };
        this.sphericalDelta = { radius: 0, phi: 0, theta: 0 };
        this.scale = 1;
        this.panOffset = [0, 0, 0];
        this.zoomChanged = false;
        
        // Features
        this.enableZoom = options.enableZoom !== undefined ? options.enableZoom : true;
        this.enableRotate = options.enableRotate !== undefined ? options.enableRotate : true;
        this.enablePan = options.enablePan !== undefined ? options.enablePan : true;
        this.autoRotate = options.autoRotate || false;
        this.autoRotateSpeed = options.autoRotateSpeed || 2.0; // 30 seconds per orbit
        
        // Mouse button mappings
        this.mouseButtons = {
            LEFT: options.mouseButtons?.LEFT || 'ROTATE',
            MIDDLE: options.mouseButtons?.MIDDLE || 'DOLLY',
            RIGHT: options.mouseButtons?.RIGHT || 'PAN'
        };
        
        // Touch actions
        this.touches = {
            ONE: options.touches?.ONE || 'ROTATE',
            TWO: options.touches?.TWO || 'DOLLY_PAN'
        };
        
        // Mouse state
        this.mouseState = {
            leftDown: false,
            rightDown: false,
            middleDown: false,
            x: 0,
            y: 0
        };
        
        // Initialize
        this.updateSphericalFromCamera();
        this.setupEvents();
    }
    
    // Convert camera position to spherical coordinates relative to target
    updateSphericalFromCamera() {
        const position = this.camera.position;
        const target = this.target;
        
        // Calculate offset from target to camera
        const offset = [
            position[0] - target[0],
            position[1] - target[1],
            position[2] - target[2]
        ];
        
        // Update spherical coordinates
        this.spherical.radius = Math.sqrt(
            offset[0] * offset[0] + 
            offset[1] * offset[1] + 
            offset[2] * offset[2]
        );
        
        // Calculate phi (polar angle from y-axis, 0-π)
        this.spherical.phi = Math.acos(Math.min(Math.max(offset[1] / this.spherical.radius, -1), 1));
        
        // Calculate theta (azimuthal angle in x-z plane, 0-2π)
        this.spherical.theta = Math.atan2(offset[0], offset[2]);
    }
    
    // Update camera position from spherical coordinates
    updateCameraFromSpherical() {
        const radius = this.spherical.radius;
        const phi = this.spherical.phi;
        const theta = this.spherical.theta;
        
        // Apply radius, phi, and theta
        const sinPhiRadius = radius * Math.sin(phi);
        
        // Calculate new position in Cartesian coordinates
        const position = [
            sinPhiRadius * Math.sin(theta),
            radius * Math.cos(phi),
            sinPhiRadius * Math.cos(theta)
        ];
        
        // Add target position and any pan offset
        position[0] += this.target[0] + this.panOffset[0];
        position[1] += this.target[1] + this.panOffset[1];
        position[2] += this.target[2] + this.panOffset[2];
        
        // Update camera
        this.camera.setPosition(position[0], position[1], position[2]);
        this.camera.lookAt(this.target[0], this.target[1], this.target[2]);
    }
    
    setupEvents() {
        // Mouse events
        this.canvas.addEventListener('mousedown', this.onMouseDown.bind(this));
        this.canvas.addEventListener('mousemove', this.onMouseMove.bind(this));
        this.canvas.addEventListener('mouseup', this.onMouseUp.bind(this));
        this.canvas.addEventListener('wheel', this.onMouseWheel.bind(this));
        
        // Touch events
        this.canvas.addEventListener('touchstart', this.onTouchStart.bind(this));
        this.canvas.addEventListener('touchmove', this.onTouchMove.bind(this));
        this.canvas.addEventListener('touchend', this.onTouchEnd.bind(this));
        
        // Context menu (prevent right-click menu)
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    }
    
    onMouseDown(event) {
        event.preventDefault();
        
        switch (event.button) {
            case 0: // Left mouse button
                this.mouseState.leftDown = true;
                break;
            case 1: // Middle mouse button
                this.mouseState.middleDown = true;
                break;
            case 2: // Right mouse button
                this.mouseState.rightDown = true;
                break;
        }
        
        this.mouseState.x = event.clientX;
        this.mouseState.y = event.clientY;
    }
    
    onMouseMove(event) {
        event.preventDefault();
        
        const deltaX = event.clientX - this.mouseState.x;
        const deltaY = event.clientY - this.mouseState.y;
        
        this.mouseState.x = event.clientX;
        this.mouseState.y = event.clientY;
        
        if (this.mouseState.leftDown && this.mouseButtons.LEFT === 'ROTATE' && this.enableRotate) {
            this.handleRotate(deltaX, deltaY);
        } else if (this.mouseState.middleDown && this.mouseButtons.MIDDLE === 'DOLLY' && this.enableZoom) {
            this.handleZoom(-deltaY);
        } else if (this.mouseState.rightDown && this.mouseButtons.RIGHT === 'PAN' && this.enablePan) {
            this.handlePan(deltaX, deltaY);
        }
    }
    
    onMouseUp(event) {
        switch (event.button) {
            case 0: // Left mouse button
                this.mouseState.leftDown = false;
                break;
            case 1: // Middle mouse button
                this.mouseState.middleDown = false;
                break;
            case 2: // Right mouse button
                this.mouseState.rightDown = false;
                break;
        }
    }
    
    onMouseWheel(event) {
        event.preventDefault();
        
        if (!this.enableZoom) return;
        
        let delta = 0;
        if (event.deltaY) {
            // Firefox
            delta = -event.deltaY * 0.01;
        } else if (event.wheelDelta) {
            // WebKit / Opera / Explorer 9
            delta = event.wheelDelta * 0.0005;
        } else if (event.detail) {
            // Firefox
            delta = -event.detail * 0.01;
        }
        
        this.handleZoom(delta * this.zoomSpeed);
    }
    
    // Basic touch event handlers (can be expanded for more complex gestures)
    onTouchStart(event) {
        event.preventDefault();
        
        switch (event.touches.length) {
            case 1: // One finger (rotate)
                if (this.touches.ONE === 'ROTATE' && this.enableRotate) {
                    this.mouseState.leftDown = true;
                    this.mouseState.x = event.touches[0].clientX;
                    this.mouseState.y = event.touches[0].clientY;
                }
                break;
            case 2: // Two fingers (pinch to zoom)
                if (this.touches.TWO === 'DOLLY_PAN' && this.enableZoom) {
                    // Calculate distance between touch points
                    const dx = event.touches[0].clientX - event.touches[1].clientX;
                    const dy = event.touches[0].clientY - event.touches[1].clientY;
                    this.touchZoomDistance = Math.sqrt(dx * dx + dy * dy);
                }
                break;
        }
    }
    
    onTouchMove(event) {
        event.preventDefault();
        
        switch (event.touches.length) {
            case 1: // One finger (rotate)
                if (this.touches.ONE === 'ROTATE' && this.enableRotate && this.mouseState.leftDown) {
                    const deltaX = event.touches[0].clientX - this.mouseState.x;
                    const deltaY = event.touches[0].clientY - this.mouseState.y;
                    
                    this.mouseState.x = event.touches[0].clientX;
                    this.mouseState.y = event.touches[0].clientY;
                    
                    this.handleRotate(deltaX, deltaY);
                }
                break;
            case 2: // Two fingers (pinch to zoom)
                if (this.touches.TWO === 'DOLLY_PAN' && this.enableZoom) {
                    // Calculate current distance between touch points
                    const dx = event.touches[0].clientX - event.touches[1].clientX;
                    const dy = event.touches[0].clientY - event.touches[1].clientY;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    // Calculate delta
                    const delta = (this.touchZoomDistance - distance) * 0.01;
                    this.touchZoomDistance = distance;
                    
                    this.handleZoom(-delta);
                }
                break;
        }
    }
    
    onTouchEnd(event) {
        this.mouseState.leftDown = false;
    }
    
    handleRotate(deltaX, deltaY) {
        // Calculate how much to rotate based on mouse movement
        const element = this.canvas;
        
        // Adjust for screen size to make rotation speed consistent
        this.sphericalDelta.theta -= 2 * Math.PI * deltaX / element.clientWidth * this.rotateSpeed;
        this.sphericalDelta.phi -= 2 * Math.PI * deltaY / element.clientHeight * this.rotateSpeed;
    }
    
    handleZoom(delta) {
        if (delta > 0) {
            this.scale /= Math.pow(0.95, this.zoomSpeed);
        } else if (delta < 0) {
            this.scale *= Math.pow(0.95, this.zoomSpeed);
        }
        
        this.zoomChanged = true;
    }
    
    handlePan(deltaX, deltaY) {
        const element = this.canvas;
        const distance = this.spherical.radius;
        
        // Adjust for screen size
        deltaX = deltaX * (distance * 2) / element.clientWidth;
        deltaY = deltaY * (distance * 2) / element.clientHeight;
        
        // Get camera's local coordinate system
        const forward = [
            this.target[0] - this.camera.position[0],
            this.target[1] - this.camera.position[1],
            this.target[2] - this.camera.position[2]
        ];
        
        // Normalize
        const len = Math.sqrt(forward[0] * forward[0] + forward[1] * forward[1] + forward[2] * forward[2]);
        forward[0] /= len;
        forward[1] /= len;
        forward[2] /= len;
        
        // Assuming Y is up
        const up = [0, 1, 0];
        
        // Calculate right vector as cross product of forward and up
        const right = [
            forward[1] * up[2] - forward[2] * up[1],
            forward[2] * up[0] - forward[0] * up[2],
            forward[0] * up[1] - forward[1] * up[0]
        ];
        
        // Apply panning offset
        this.panOffset[0] += right[0] * deltaX * this.panSpeed - forward[0] * deltaY * this.panSpeed;
        this.panOffset[1] += right[1] * deltaX * this.panSpeed - forward[1] * deltaY * this.panSpeed;
        this.panOffset[2] += right[2] * deltaX * this.panSpeed - forward[2] * deltaY * this.panSpeed;
    }
    
    update(deltaTime = 0.016) {
        // Apply auto-rotation if enabled
        if (this.autoRotate) {
            this.sphericalDelta.theta -= 2 * Math.PI / 60 / 60 * this.autoRotateSpeed * deltaTime;
        }
        
        // Apply spherical delta
        this.spherical.theta += this.sphericalDelta.theta;
        this.spherical.phi += this.sphericalDelta.phi;
        
        // Restrict phi (polar angle) to avoid going below/above the poles
        this.spherical.phi = Math.max(this.minPolarAngle, Math.min(this.maxPolarAngle, this.spherical.phi));
        
        // Restrict theta (azimuthal angle)
        this.spherical.theta = Math.max(this.minAzimuthAngle, Math.min(this.maxAzimuthAngle, this.spherical.theta));
        
        // Apply damping
        if (this.enableDamping) {
            this.sphericalDelta.theta *= (1 - this.dampingFactor);
            this.sphericalDelta.phi *= (1 - this.dampingFactor);
        } else {
            this.sphericalDelta.theta = 0;
            this.sphericalDelta.phi = 0;
        }
        
        // Apply zoom
        if (this.zoomChanged) {
            this.spherical.radius /= this.scale;
            
            // Restrict distance
            this.spherical.radius = Math.max(this.minDistance, Math.min(this.maxDistance, this.spherical.radius));
            
            this.scale = 1;
            this.zoomChanged = false;
        }
        
        // Update camera position
        this.updateCameraFromSpherical();
        
        // Reset pan offset with damping
        if (this.enableDamping) {
            this.panOffset[0] *= (1 - this.dampingFactor);
            this.panOffset[1] *= (1 - this.dampingFactor);
            this.panOffset[2] *= (1 - this.dampingFactor);
        } else {
            this.panOffset[0] = 0;
            this.panOffset[1] = 0;
            this.panOffset[2] = 0;
        }
    }
    
    setTarget(targetPosition) {
        this.target = targetPosition;
        this.updateSphericalFromCamera();
    }
    
    setPosition(position) {
        this.camera.setPosition(position[0], position[1], position[2]);
        this.updateSphericalFromCamera();
    }
    
    dispose() {
        // Remove event listeners
        this.canvas.removeEventListener('mousedown', this.onMouseDown);
        this.canvas.removeEventListener('mousemove', this.onMouseMove);
        this.canvas.removeEventListener('mouseup', this.onMouseUp);
        this.canvas.removeEventListener('wheel', this.onMouseWheel);
        this.canvas.removeEventListener('touchstart', this.onTouchStart);
        this.canvas.removeEventListener('touchmove', this.onTouchMove);
        this.canvas.removeEventListener('touchend', this.onTouchEnd);
        this.canvas.removeEventListener('contextmenu', this.onContextMenu);
    }
}
