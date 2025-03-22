export class AudioManager {
    constructor(engine) {
        this.engine = engine;
        
        // Initialize audio context
        this.context = new (window.AudioContext || window.webkitAudioContext)();
        
        // Audio resources
        this.sounds = new Map();
        this.music = new Map();
        
        // Master volume controls
        this.masterGain = this.context.createGain();
        this.masterGain.connect(this.context.destination);
        
        // Volume group controls
        this.soundGain = this.context.createGain();
        this.musicGain = this.context.createGain();
        
        this.soundGain.connect(this.masterGain);
        this.musicGain.connect(this.masterGain);
        
        // Default volumes
        this.setMasterVolume(1.0);
        this.setSoundVolume(1.0);
        this.setMusicVolume(0.7);
        
        // Audio state
        this.currentMusic = null;
        this.activeSounds = new Map();
        this.nextSoundId = 1;
        
        console.log('Audio manager initialized');
    }
    
    // Load a sound effect
    async loadSound(name, url) {
        try {
            const response = await fetch(url);
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await this.context.decodeAudioData(arrayBuffer);
            
            this.sounds.set(name, audioBuffer);
            console.log(`Loaded sound: ${name}`);
            return true;
        } catch (error) {
            console.error(`Failed to load sound ${name}:`, error);
            return false;
        }
    }
    
    // Load background music
    async loadMusic(name, url) {
        try {
            const response = await fetch(url);
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await this.context.decodeAudioData(arrayBuffer);
            
            this.music.set(name, audioBuffer);
            console.log(`Loaded music: ${name}`);
            return true;
        } catch (error) {
            console.error(`Failed to load music ${name}:`, error);
            return false;
        }
    }
    
    // Play a sound effect
    playSound(name, options = {}) {
        const sound = this.sounds.get(name);
        if (!sound) {
            console.warn(`Sound not found: ${name}`);
            return -1;
        }
        
        // Resume audio context if it's suspended (needed for browsers that block autoplay)
        this.resumeAudioContext();
        
        // Create sound source
        const source = this.context.createBufferSource();
        source.buffer = sound;
        
        // Create gain node for this specific sound
        const gainNode = this.context.createGain();
        gainNode.gain.value = options.volume !== undefined ? options.volume : 1.0;
        
        // Create optional 3D panner
        let outputNode = gainNode;
        if (options.position) {
            const panner = this.context.createPanner();
            panner.panningModel = 'HRTF';
            panner.distanceModel = 'inverse';
            panner.refDistance = 1;
            panner.maxDistance = 100;
            panner.rolloffFactor = 1;
            
            panner.positionX.value = options.position[0];
            panner.positionY.value = options.position[1];
            panner.positionZ.value = options.position[2];
            
            // Connect source to panner to gain
            source.connect(panner);
            panner.connect(gainNode);
            outputNode = panner;
        } else {
            // Connect source directly to gain
            source.connect(gainNode);
        }
        
        // Connect to sound group
        gainNode.connect(this.soundGain);
        
        // Configure playback
        source.loop = options.loop || false;
        if (options.playbackRate) {
            source.playbackRate.value = options.playbackRate;
        }
        
        // Start playback
        const startTime = options.delay ? this.context.currentTime + options.delay : this.context.currentTime;
        source.start(startTime, options.offset || 0);
        
        // Generate ID for this sound instance
        const soundId = this.nextSoundId++;
        
        // Store active sound
        this.activeSounds.set(soundId, {
            source,
            gain: gainNode,
            panner: outputNode !== gainNode ? outputNode : null,
            name,
            startTime
        });
        
        // Set up ended callback
        source.onended = () => {
            this.activeSounds.delete(soundId);
            if (options.onEnded) {
                options.onEnded();
            }
        };
        
        return soundId;
    }
    
    // Play background music with crossfade
    playMusic(name, options = {}) {
        const music = this.music.get(name);
        if (!music) {
            console.warn(`Music not found: ${name}`);
            return false;
        }
        
        // Resume audio context
        this.resumeAudioContext();
        
        // Fade out current music if any
        if (this.currentMusic) {
            const fadeOutDuration = options.fadeOutDuration || 1.0;
            this.currentMusic.gain.gain.linearRampToValueAtTime(0, this.context.currentTime + fadeOutDuration);
            
            setTimeout(() => {
                this.currentMusic.source.stop();
                this.currentMusic = null;
            }, fadeOutDuration * 1000);
        }
        
        // Create music source
        const source = this.context.createBufferSource();
        source.buffer = music;
        source.loop = options.loop !== undefined ? options.loop : true;
        
        // Create gain node for fading
        const gainNode = this.context.createGain();
        source.connect(gainNode);
        gainNode.connect(this.musicGain);
        
        // Start with zero volume and fade in
        const fadeInDuration = options.fadeInDuration || 1.0;
        gainNode.gain.setValueAtTime(0, this.context.currentTime);
        gainNode.gain.linearRampToValueAtTime(1, this.context.currentTime + fadeInDuration);
        
        // Start playback
        source.start();
        
        // Store current music
        this.currentMusic = {
            source,
            gain: gainNode,
            name
        };
        
        return true;
    }
    
    // Stop a specific sound
    stopSound(soundId, fadeOutDuration = 0) {
        const sound = this.activeSounds.get(soundId);
        if (!sound) return false;
        
        if (fadeOutDuration > 0) {
            // Fade out
            sound.gain.gain.linearRampToValueAtTime(0, this.context.currentTime + fadeOutDuration);
            
            // Stop after fade out
            setTimeout(() => {
                if (this.activeSounds.has(soundId)) {
                    sound.source.stop();
                    this.activeSounds.delete(soundId);
                }
            }, fadeOutDuration * 1000);
        } else {
            // Stop immediately
            sound.source.stop();
            this.activeSounds.delete(soundId);
        }
        
        return true;
    }
    
    // Stop all sounds
    stopAllSounds(fadeOutDuration = 0) {
        for (const soundId of this.activeSounds.keys()) {
            this.stopSound(soundId, fadeOutDuration);
        }
    }
    
    // Stop current music
    stopMusic(fadeOutDuration = 1.0) {
        if (!this.currentMusic) return;
        
        if (fadeOutDuration > 0) {
            // Fade out
            this.currentMusic.gain.gain.linearRampToValueAtTime(0, this.context.currentTime + fadeOutDuration);
            
            // Stop after fade out
            setTimeout(() => {
                if (this.currentMusic) {
                    this.currentMusic.source.stop();
                    this.currentMusic = null;
                }
            }, fadeOutDuration * 1000);
        } else {
            // Stop immediately
            this.currentMusic.source.stop();
            this.currentMusic = null;
        }
    }
    
    // Update 3D sound position
    updateSoundPosition(soundId, position) {
        const sound = this.activeSounds.get(soundId);
        if (!sound || !sound.panner) return false;
        
        sound.panner.positionX.value = position[0];
        sound.panner.positionY.value = position[1];
        sound.panner.positionZ.value = position[2];
        
        return true;
    }
    
    // Set listener position for 3D audio
    setListenerPosition(position, forward, up) {
        this.context.listener.positionX.value = position[0];
        this.context.listener.positionY.value = position[1];
        this.context.listener.positionZ.value = position[2];
        
        if (forward && up) {
            this.context.listener.forwardX.value = forward[0];
            this.context.listener.forwardY.value = forward[1];
            this.context.listener.forwardZ.value = forward[2];
            this.context.listener.upX.value = up[0];
            this.context.listener.upY.value = up[1];
            this.context.listener.upZ.value = up[2];
        }
    }
    
    // Set listener from camera
    setListenerFromCamera(camera) {
        const position = camera.position;
        const target = camera.target;
        
        // Calculate forward vector
        const forward = [
            target[0] - position[0],
            target[1] - position[1],
            target[2] - position[2]
        ];
        
        // Normalize
        const length = Math.sqrt(forward[0]**2 + forward[1]**2 + forward[2]**2);
        forward[0] /= length;
        forward[1] /= length;
        forward[2] /= length;
        
        // Up vector
        const up = [0, 1, 0];
        
        this.setListenerPosition(position, forward, up);
    }
    
    // Set volume levels
    setMasterVolume(volume) {
        this.masterGain.gain.value = Math.max(0, Math.min(1, volume));
    }
    
    setSoundVolume(volume) {
        this.soundGain.gain.value = Math.max(0, Math.min(1, volume));
    }
    
    setMusicVolume(volume) {
        this.musicGain.gain.value = Math.max(0, Math.min(1, volume));
    }
    
    // Resume audio context (for browsers that block autoplay)
    resumeAudioContext() {
        if (this.context.state === 'suspended') {
            this.context.resume().then(() => {
                console.log('Audio context resumed');
            });
        }
    }
    
    dispose() {
        // Stop all sounds
        this.stopAllSounds();
        this.stopMusic(0);
        
        // Close audio context
        if (this.context.state !== 'closed') {
            this.context.close();
        }
    }
}
