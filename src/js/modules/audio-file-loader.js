// Audio File Loader Module
// Handles loading and decoding audio files for playback

export class AudioFileLoader {
    constructor(audioContext, analyser, gainNode) {
        this.audioContext = audioContext;
        this.analyser = analyser;
        this.gainNode = gainNode;
        this.audioBuffer = null;
        this.audioSource = null;
        this.isPlaying = false;
        this.currentFileIndex = -1;
        this.audioFiles = [];
        this.startTime = 0;
        this.pauseTime = 0;
        this.manualStop = false;
        
        // Callbacks
        this.onFileLoaded = null;
        this.onPlaybackStateChanged = null;
        this.onError = null;
        
        // Initialize fs if available
        this.fs = null;
        if (typeof window !== 'undefined' && window.require) {
            try {
                this.fs = window.require('fs');
            } catch (e) {
                console.warn('Failed to load fs module:', e);
            }
        }
    }
    
    /**
     * Set the audio files array
     */
    setAudioFiles(files) {
        this.audioFiles = files || [];
    }
    
    /**
     * Load an audio file by index
     */
    async loadFile(index) {
        console.log('[AudioFileLoader] Loading file at index:', index);
        console.log('[AudioFileLoader] Current audioFiles length:', this.audioFiles.length);
        
        // Sync with window.audioFiles if available (in case files were loaded after initialization)
        if (typeof window !== 'undefined' && window.audioFiles && Array.isArray(window.audioFiles)) {
            if (window.audioFiles.length !== this.audioFiles.length) {
                console.log('[AudioFileLoader] Syncing files from window.audioFiles (length:', window.audioFiles.length, ')');
                this.setAudioFiles(window.audioFiles);
            }
        }
        
        // Validate index
        if (index < 0 || index >= this.audioFiles.length) {
            const error = new Error(`Invalid file index: ${index} (available: 0-${this.audioFiles.length - 1})`);
            console.error('[AudioFileLoader]', error.message);
            console.error('[AudioFileLoader] audioFiles:', this.audioFiles);
            if (this.onError) this.onError(error);
            throw error;
        }
        
        // Check dependencies
        if (!this.audioContext) {
            const error = new Error('Audio context not available');
            console.error('[AudioFileLoader]', error.message);
            if (this.onError) this.onError(error);
            throw error;
        }
        
        if (!this.fs) {
            const error = new Error('File system module not available');
            console.error('[AudioFileLoader]', error.message);
            if (this.onError) this.onError(error);
            throw error;
        }
        
        // Stop current playback if any
        if (this.audioSource && this.isPlaying) {
            this.manualStop = true;
            try {
                this.audioSource.stop();
            } catch (e) {
                console.warn('[AudioFileLoader] Error stopping audio source:', e);
            }
            this.isPlaying = false;
            if (this.onPlaybackStateChanged) {
                this.onPlaybackStateChanged(false);
            }
        }
        
        this.currentFileIndex = index;
        const file = this.audioFiles[index];
        
        if (!file || !file.path) {
            const error = new Error('Invalid file object');
            console.error('[AudioFileLoader]', error.message, file);
            if (this.onError) this.onError(error);
            throw error;
        }
        
        console.log('[AudioFileLoader] Loading file:', file.name, 'from path:', file.path);
        
        try {
            // Check if file exists
            if (!this.fs.existsSync(file.path)) {
                throw new Error('File does not exist: ' + file.path);
            }
            
            // Read file
            console.log('[AudioFileLoader] Reading file...');
            const buffer = this.fs.readFileSync(file.path);
            console.log('[AudioFileLoader] File read successfully, size:', buffer.length, 'bytes');
            
            // Warn about suspiciously small files
            if (buffer.length < 50000) { // Less than 50KB
                console.warn('[AudioFileLoader] Warning: File is very small (' + buffer.length + ' bytes), may be corrupted');
            }
            
            // Convert to ArrayBuffer
            const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
            console.log('[AudioFileLoader] ArrayBuffer created, byteLength:', arrayBuffer.byteLength);
            
            // Decode audio data
            console.log('[AudioFileLoader] Decoding audio data...');
            this.audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
            console.log('[AudioFileLoader] Audio loaded successfully:', this.audioBuffer.duration, 'seconds');
            
            // Reset pause time
            this.pauseTime = 0;
            
            // Notify that file is loaded
            if (this.onFileLoaded) {
                this.onFileLoaded({
                    file: file,
                    index: index,
                    duration: this.audioBuffer.duration,
                    buffer: this.audioBuffer
                });
            }
            
            return {
                file: file,
                index: index,
                duration: this.audioBuffer.duration,
                buffer: this.audioBuffer
            };
            
        } catch (error) {
            console.error('[AudioFileLoader] Error loading audio:', error);
            if (this.onError) {
                this.onError(error);
            }
            throw error;
        }
    }
    
    /**
     * Play the loaded audio
     */
    play() {
        if (!this.audioBuffer) {
            console.warn('[AudioFileLoader] No audio buffer loaded');
            return false;
        }
        
        if (this.isPlaying) {
            console.warn('[AudioFileLoader] Already playing');
            return false;
        }
        
        try {
            // Create new audio source
            this.audioSource = this.audioContext.createBufferSource();
            this.audioSource.buffer = this.audioBuffer;
            
            // Connect audio source -> dbGainNode -> analyser -> gainNode -> destination
            // dbGainNode affects visualizer intensity, gainNode affects output volume
            // Check if dbGainNode is available (from window or passed in)
            const dbGainNode = window.dbGainNode || null;
            
            if (dbGainNode) {
                // Connect through dbGainNode first (affects visualizer)
                this.audioSource.connect(dbGainNode);
                if (this.analyser) {
                    dbGainNode.connect(this.analyser);
                    if (this.gainNode && this.gainNode !== this.analyser) {
                        this.analyser.connect(this.gainNode);
                        this.gainNode.connect(this.audioContext.destination);
                    } else {
                        // No gainNode, connect analyser directly to destination
                        this.analyser.connect(this.audioContext.destination);
                    }
                } else {
                    // No analyser, connect dbGainNode -> gainNode -> destination
                    if (this.gainNode) {
                        dbGainNode.connect(this.gainNode);
                        this.gainNode.connect(this.audioContext.destination);
                    } else {
                        dbGainNode.connect(this.audioContext.destination);
                    }
                }
            } else if (this.gainNode) {
                // Fallback: no dbGainNode, use old connection
                this.audioSource.connect(this.gainNode);
                if (this.analyser && this.analyser !== this.gainNode) {
                    this.gainNode.connect(this.analyser);
                    this.analyser.connect(this.audioContext.destination);
                } else {
                    this.gainNode.connect(this.audioContext.destination);
                }
            } else if (this.analyser) {
                // No gain node, connect source -> analyser -> destination
                this.audioSource.connect(this.analyser);
                this.analyser.connect(this.audioContext.destination);
            } else {
                // No gain or analyser, connect directly to destination
                this.audioSource.connect(this.audioContext.destination);
            }
            
            // Handle when audio ends
            this.audioSource.onended = () => {
                if (!this.manualStop) {
                    this.isPlaying = false;
                    if (this.onPlaybackStateChanged) {
                        this.onPlaybackStateChanged(false);
                    }
                }
                this.manualStop = false;
            };
            
            // Start playback from pause position or beginning
            const offset = this.pauseTime || 0;
            this.audioSource.start(0, offset);
            this.startTime = this.audioContext.currentTime - offset;
            this.pauseTime = 0;
            
            this.isPlaying = true;
            if (this.onPlaybackStateChanged) {
                this.onPlaybackStateChanged(true);
            }
            
            console.log('[AudioFileLoader] Playback started');
            return true;
            
        } catch (error) {
            console.error('[AudioFileLoader] Error starting playback:', error);
            if (this.onError) {
                this.onError(error);
            }
            return false;
        }
    }
    
    /**
     * Pause the current playback
     */
    pause() {
        if (!this.isPlaying || !this.audioSource) {
            return false;
        }
        
        try {
            // Calculate current playback time
            this.pauseTime = this.audioContext.currentTime - this.startTime;
            
            // Stop the source
            this.audioSource.stop();
            this.audioSource = null;
            
            this.isPlaying = false;
            if (this.onPlaybackStateChanged) {
                this.onPlaybackStateChanged(false);
            }
            
            console.log('[AudioFileLoader] Playback paused at:', this.pauseTime, 'seconds');
            return true;
            
        } catch (error) {
            console.error('[AudioFileLoader] Error pausing playback:', error);
            return false;
        }
    }
    
    /**
     * Stop playback and reset
     */
    stop() {
        this.manualStop = true;
        if (this.audioSource) {
            try {
                this.audioSource.stop();
            } catch (e) {
                // Ignore errors when stopping
            }
            this.audioSource = null;
        }
        this.isPlaying = false;
        this.pauseTime = 0;
        if (this.onPlaybackStateChanged) {
            this.onPlaybackStateChanged(false);
        }
    }
    
    /**
     * Get current playback time
     */
    getCurrentTime() {
        if (!this.audioBuffer) return 0;
        if (this.isPlaying && this.audioSource) {
            return Math.max(0, this.audioContext.currentTime - this.startTime);
        }
        return this.pauseTime || 0;
    }
    
    /**
     * Get duration of loaded file
     */
    getDuration() {
        return this.audioBuffer ? this.audioBuffer.duration : 0;
    }
    
    /**
     * Seek to a specific time
     */
    seekTo(time) {
        if (!this.audioBuffer) return false;
        
        const wasPlaying = this.isPlaying;
        
        // Stop current playback
        if (this.audioSource) {
            try {
                this.audioSource.stop();
            } catch (e) {
                // Ignore errors
            }
            this.audioSource = null;
        }
        
        // Set pause time
        this.pauseTime = Math.max(0, Math.min(time, this.audioBuffer.duration));
        
        // Resume if was playing
        if (wasPlaying) {
            return this.play();
        }
        
        return true;
    }
    
    /**
     * Set playback rate
     */
    setPlaybackRate(rate) {
        if (this.audioSource) {
            this.audioSource.playbackRate.value = rate;
        }
    }
}

// Export singleton instance creator
let loaderInstance = null;

export function createAudioFileLoader(audioContext, analyser, gainNode) {
    if (loaderInstance) {
        return loaderInstance;
    }
    
    loaderInstance = new AudioFileLoader(audioContext, analyser, gainNode);
    
    // Export to window for compatibility
    if (typeof window !== 'undefined') {
        window.audioFileLoader = loaderInstance;
        
        // Create wrapper function for compatibility with existing code
        // This will replace the placeholder function
        const wasPlaceholder = window.loadAudioFile && 
            window.loadAudioFile.toString().includes('called before initialization');
        
        window.loadAudioFile = async function(index) {
            return loaderInstance.loadFile(index);
        };
        
        console.log('[AudioFileLoader] Exported to window.audioFileLoader and window.loadAudioFile');
        console.log('[AudioFileLoader] Replaced placeholder:', wasPlaceholder);
        console.log('[AudioFileLoader] window.loadAudioFile type:', typeof window.loadAudioFile);
    }
    
    return loaderInstance;
}

// Export default
export default AudioFileLoader;

