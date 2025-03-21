export class Time {
    constructor() {
        this.now = 0;           // Current time in seconds
        this.delta = 0;         // Time since last frame in seconds
        this.elapsed = 0;       // Total elapsed time in seconds
        this.frameCount = 0;    // Total number of frames
        this.fps = 0;           // Current frames per second
        
        // FPS calculation
        this._fpsUpdateInterval = 0.5; // Update FPS every 0.5 seconds
        this._fpsAccumulator = 0;
        this._frameCountAccumulator = 0;
    }
    
    update(now, deltaTime) {
        this.now = now;
        this.delta = deltaTime;
        this.elapsed += deltaTime;
        this.frameCount++;
        
        // Calculate FPS
        this._fpsAccumulator += deltaTime;
        this._frameCountAccumulator++;
        
        if (this._fpsAccumulator >= this._fpsUpdateInterval) {
            this.fps = this._frameCountAccumulator / this._fpsAccumulator;
            this._fpsAccumulator = 0;
            this._frameCountAccumulator = 0;
        }
    }
    
    // Get time in milliseconds
    getMilliseconds() {
        return this.now * 1000;
    }
    
    // Scale time by a factor (e.g., for slow motion effects)
    scale(factor) {
        this.delta *= factor;
        return this.delta;
    }
    
    // Format elapsed time as string (HH:MM:SS)
    formatElapsed() {
        const hours = Math.floor(this.elapsed / 3600);
        const minutes = Math.floor((this.elapsed % 3600) / 60);
        const seconds = Math.floor(this.elapsed % 60);
        
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
}
