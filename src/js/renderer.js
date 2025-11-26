import { setSettings } from './visualizers/base.js';
import { SpectraVisualizer } from './visualizers/spectra.js';
import { WaveformVisualizer } from './visualizers/waveform.js';
import { FrequencyBarsVisualizer } from './visualizers/frequency-bars.js';
import { CircularVisualizer } from './visualizers/circular.js';
import { ParticleVisualizer } from './visualizers/particle.js';
import { SpectrumVisualizer } from './visualizers/spectrum.js';
import { RadialBarsVisualizer } from './visualizers/radial-bars.js';
import { WaveRingsVisualizer } from './visualizers/wave-rings.js';
import { OscilloscopeVisualizer } from './visualizers/oscilloscope.js';
import { KaleidoscopeVisualizer } from './visualizers/kaleidoscope.js';
import { DnaHelixVisualizer } from './visualizers/dna-helix.js';
import { StarfieldVisualizer } from './visualizers/starfield.js';
import { TunnelVisualizer } from './visualizers/tunnel.js';
import { FireworksVisualizer } from './visualizers/fireworks.js';
import { PlasmaVisualizer } from './visualizers/plasma.js';
import { MatrixVisualizer } from './visualizers/matrix.js';
import { NebulaVisualizer } from './visualizers/nebula.js';
import { EqualizerVisualizer } from './visualizers/equalizer.js';
import { VortexVisualizer } from './visualizers/vortex.js';
import { AmethystSpectrumVisualizer } from './visualizers/amethyst-spectrum.js';
import { FileManager } from './modules/file-manager.js';
import { DiscordRPC } from './modules/discord-rpc.js';
import { BPMDetector } from './modules/bpm-detector.js';
import { KeyDetector } from './modules/key-detector.js';
import { SpotifyIntegration } from './modules/spotify-integration.js';
import { AlbumArtManager } from './modules/album-art.js';
import { PresetManager } from './modules/preset-manager.js';
import { VolumeHistoryVisualizer } from './modules/volume-history.js';
import { VisualizerManager } from './modules/visualizer-manager.js';
import { createAudioFileLoader } from './modules/audio-file-loader.js';

console.log('[RENDERER] Starting renderer.js execution...');
console.log('[RENDERER] VisualizerManager imported:', typeof VisualizerManager !== 'undefined' ? '✓' : '✗');
console.log('[RENDERER] window.require available:', typeof window !== 'undefined' && typeof window.require === 'function');
console.log('[RENDERER] All imports loaded successfully');
console.log('Renderer process loaded!');

// Pre-export loadAudioFile placeholder to prevent "not available" errors
// Will be replaced with actual function when defined
window.loadAudioFile = async function(index) {
    console.warn('loadAudioFile called before initialization, waiting...');
    // Wait a bit and try again
    await new Promise(resolve => setTimeout(resolve, 100));
    if (typeof window.loadAudioFile === 'function' && window.loadAudioFile.toString().includes('loadAudioFile called before')) {
        // Still the placeholder, wait more
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    if (typeof window.loadAudioFile === 'function' && !window.loadAudioFile.toString().includes('loadAudioFile called before')) {
        return window.loadAudioFile(index);
    }
    throw new Error('Audio file loader not initialized yet');
};
console.log('[RENDERER] All imports loaded successfully');
console.log('Renderer process loaded!');

// Global error handlers
window.addEventListener('error', (event) => {
    console.error('Global error caught:', event.error);
    console.error('Error message:', event.message);
    console.error('Error stack:', event.error?.stack);
    event.preventDefault();
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    event.preventDefault();
});

// CommonJS requires (Node.js modules)
// Use window.require in Electron renderer process (works with ES modules)
let path = null;
if (typeof window !== 'undefined' && window.require) {
  try {
    path = window.require('path');
  } catch (e) {
    console.warn('Failed to load path module:', e);
  }
}

// Fallback path object for non-Electron environments (Vite dev server)
if (!path) {
  path = {
    sep: '/', // Default to Unix-style separator
    join: (...parts) => parts.filter(p => p).join('/'),
    resolve: (...parts) => '/' + parts.filter(p => p).join('/')
  };
  console.log('Using fallback path module (running in Vite dev server)');
}

// Audio variables (declare first)
// Create module instances
const fileManager = new FileManager();
const discordRPC = new DiscordRPC();
const bpmDetector = new BPMDetector();
const keyDetector = new KeyDetector();
const spotify = new SpotifyIntegration();
const albumArtManager = new AlbumArtManager();
const presetManager = new PresetManager();
// VolumeHistoryVisualizer is now initialized by Vue component (AudioPlayer.vue)
// Don't initialize here as the canvas doesn't exist yet
let volumeHistoryVisualizer = null;

// Gain control state
let currentGainDB = 0;
const gainDisplay = document.getElementById('gainDisplay');
const gainUpBtn = document.getElementById('gainUpBtn');
const gainDownBtn = document.getElementById('gainDownBtn');

// Load saved gain
const savedGain = localStorage.getItem('audioGainDB');
if (savedGain !== null) {
    currentGainDB = parseFloat(savedGain);
    if (gainDisplay) gainDisplay.textContent = `${currentGainDB > 0 ? '+' : ''}${currentGainDB}dB`;
}

// Gain button handlers
if (gainUpBtn) {
    gainUpBtn.addEventListener('click', () => {
        currentGainDB += 3;
        if (currentGainDB > 24) currentGainDB = 24; // Max +24dB
        applyGain();
    });
}

if (gainDownBtn) {
    gainDownBtn.addEventListener('click', () => {
        currentGainDB -= 3;
        if (currentGainDB < -24) currentGainDB = -24; // Min -24dB
        applyGain();
    });
}

function applyGain() {
    // Update display
    if (gainDisplay) {
        gainDisplay.textContent = `${currentGainDB > 0 ? '+' : ''}${currentGainDB}dB`;
    }

    // Apply to audio (dB to linear: gain = 10^(dB/20))
    const linearGain = Math.pow(10, currentGainDB / 20);

    // Apply to window.dbGainNode if it exists (for external audio)
    // Note: dbGainNode is declared later, so use window.dbGainNode first
    if (window.dbGainNode) {
        window.dbGainNode.gain.value = linearGain;
        console.log('Applied dB gain:', currentGainDB, 'dB (linear:', linearGain, ')');
    }
    
    // Also apply to local dbGainNode if it exists (for local audio)
    // This will be available after audio context is created
    // Use window.dbGainNode instead to avoid temporal dead zone issues

    // Save to localStorage
    localStorage.setItem('audioGainDB', currentGainDB.toString());
}

// Apply saved gain when audio is ready (always apply to ensure sync)
setTimeout(() => {
    applyGain();
}, 1000);

// Metadata cache
const metadataCache = new Map();

// Performance monitoring
let performanceStats = {
    fps: 0,
    memory: 0,
    gpu: 'N/A'
};

let currentStatusMessage = 'No audio source';

// Update status with performance info
function updateStatusWithPerf(message) {
    currentStatusMessage = message;
    const memoryMB = performanceStats.memory.toFixed(0);
    const fps = performanceStats.fps;
    statusText.textContent = `${message} | ${fps} FPS | ${memoryMB} MB`;
}

// Monitor performance metrics
let lastFrameTime = performance.now();
let frameCount = 0;
let fpsUpdateInterval = null;

function startPerformanceMonitoring() {
    // Update FPS and memory every second
    fpsUpdateInterval = setInterval(() => {
        // Calculate FPS
        performanceStats.fps = frameCount;
        frameCount = 0;

        // Get memory usage (if available)
        if (performance.memory) {
            performanceStats.memory = performance.memory.usedJSHeapSize / 1048576; // Convert to MB
        }

        // Update status display
        updateStatusWithPerf(currentStatusMessage);
    }, 1000);
}

// Count frames for FPS calculation
function countFrame() {
    frameCount++;
}

// Setup Spotify BPM callback
spotify.onBPMReceived = (tempo) => {
    bpmDetector.setBPM(tempo);
    detectedBPM = bpmDetector.getBPM();
    updateBPMDisplay();
    console.log('Spotify track BPM:', detectedBPM);
};

// Helper function for parsing filenames (uses fileManager)
function parseFileName(filename) {
    return fileManager.parseFileName(filename);
}

// === External audio bridge (YouTube) ===
window.audioManager = {
    externalAudio: null,
    externalAudioSource: null,
    setAudioSource(mediaElement, providedCtx = null) {
        try {
            // Use provided context or existing renderer audioContext, or create one
            const ctx = providedCtx || window.audioContext || new (window.AudioContext || window.webkitAudioContext)();
            window.audioContext = ctx;

            // Ensure analyser & gain exist (reuse renderer globals if present)
            if (!window.analyser) {
                window.analyser = ctx.createAnalyser();
                window.analyser.fftSize = 2048;
            }
            analyser = window.analyser;

            // Create separate analyser for volume history (affected by dB gain)
            if (!window.volumeHistoryAnalyser) {
                window.volumeHistoryAnalyser = ctx.createAnalyser();
                window.volumeHistoryAnalyser.fftSize = 2048;
            }
            volumeHistoryAnalyser = window.volumeHistoryAnalyser;

            // Create dB gain node for visualizer control
            if (!window.dbGainNode) {
                window.dbGainNode = ctx.createGain();
            }
            // Always apply the current gain value (use currentGainDB which is already synced)
            window.dbGainNode.gain.value = Math.pow(10, currentGainDB / 20);
            dbGainNode = window.dbGainNode;

            if (!window.gainNode) {
                window.gainNode = ctx.createGain();
                // Use saved volume or provided volume, default to 1.0
                const savedVolume = parseFloat(localStorage.getItem('audioVolume')) || volume || 1.0;
                window.gainNode.gain.value = savedVolume;
            }
            gainNode = window.gainNode;

            // Clean previous source
            if (this.externalAudioSource) {
                try { this.externalAudioSource.disconnect(); } catch (e) { /* ignore */ }
            }

            this.externalAudio = mediaElement;
            this.externalAudioSource = ctx.createMediaElementSource(mediaElement);
            // Connect main visualizer: source → dbGainNode → analyser → gainNode → destination
            // dbGainNode affects visualizer intensity, gainNode affects output volume
            this.externalAudioSource.connect(dbGainNode);
            dbGainNode.connect(analyser);
            analyser.connect(gainNode);
            gainNode.connect(ctx.destination);

            // Connect volume history: source → dbGain → volumeHistoryAnalyser (also affected by dB gain)
            // Share the same dbGainNode output for volume history
            dbGainNode.connect(volumeHistoryAnalyser);

            // Start volume history visualizer with its own analyser
            volumeHistoryVisualizer.updateAnalyser(volumeHistoryAnalyser);
            volumeHistoryVisualizer.start();

            // Hook element events to update UI & progress
            const onPlay = () => {
                isPlaying = true;
    syncStateToWindow();
                if (playBtn) playBtn.disabled = true;
                if (pauseBtn) pauseBtn.disabled = false;
                updateDiscordPresence();
                animate(); // ensure visualizer loop runs
            };
            const onPause = () => {
                isPlaying = false;
    syncStateToWindow();
                if (playBtn) playBtn.disabled = false;
                if (pauseBtn) pauseBtn.disabled = true;
                updateDiscordPresence();
            };
            const onTime = () => {
                const currentTime = mediaElement.currentTime || 0;
                const duration = mediaElement.duration || 0;
                if (currentTimeEl) currentTimeEl.textContent = formatTime(currentTime);
                if (durationEl) durationEl.textContent = formatTime(duration);
                if (progressFill && progressHandle && duration > 0) {
                    const pct = Math.min((currentTime / duration) * 100, 100);
                    progressFill.style.width = `${pct}%`;
                    progressHandle.style.left = `${pct}%`;
                }
            };
            const onEnded = () => {
                isPlaying = false;
    syncStateToWindow();
                if (playBtn) playBtn.disabled = false;
                if (pauseBtn) pauseBtn.disabled = true;
                updateFileSelection();
                updateDiscordPresence();
            };

            // Remove previous listeners if any
            try {
                mediaElement.removeEventListener('play', mediaElement.__onPlay);
                mediaElement.removeEventListener('pause', mediaElement.__onPause);
                mediaElement.removeEventListener('timeupdate', mediaElement.__onTime);
                mediaElement.removeEventListener('ended', mediaElement.__onEnded);
            } catch (e) { }

            mediaElement.__onPlay = onPlay;
            mediaElement.__onPause = onPause;
            mediaElement.__onTime = onTime;
            mediaElement.__onEnded = onEnded;

            mediaElement.addEventListener('play', onPlay);
            mediaElement.addEventListener('pause', onPause);
            mediaElement.addEventListener('timeupdate', onTime);
            mediaElement.addEventListener('ended', onEnded);

            statusText.textContent = 'YouTube audio connected - visualizations enabled!';
            return true;
        } catch (err) {
            console.error('audioManager.setAudioSource error:', err);
            return false;
        }
    },

    clear() {
        if (this.externalAudio) {
            try {
                this.externalAudio.pause();
                if (this.externalAudioSource) this.externalAudioSource.disconnect();
            } catch (e) { /* ignore */ }
            this.externalAudio = null;
            this.externalAudioSource = null;
        }
    }
};

let audioBuffer = null;
let audioSource = null;
let isPlaying = false;
let currentFolder = '';
let audioFiles = []; // Will be synced with fileManager.audioFiles
window.audioFiles = audioFiles; // Export to window for Vue components

// Sync audio files to loader when they change
function syncAudioFilesToLoader() {
    if (audioFileLoader) {
        audioFileLoader.setAudioFiles(audioFiles);
    }
}
let currentFileIndex = -1;
window.currentFileIndex = currentFileIndex; // Export to window for Vue components
window.isPlaying = isPlaying; // Export to window for Vue components

// Export to window for Vue components
window.fileManager = fileManager;
window.albumArtManager = albumArtManager;
window.metadataCache = metadataCache;
window.parseFileName = parseFileName;
// loadAudioFile will be exported after it's defined (see line ~1811)

// Helper function to sync state to window for Vue components
function syncStateToWindow() {
  window.isPlaying = isPlaying;
  window.currentFileIndex = currentFileIndex;
  window.audioFiles = audioFiles;
  window.currentFolder = currentFolder;
  // Also sync to AudioFileLoader
  syncAudioFilesToLoader();
}
let searchQuery = '';
let startTime = 0;
let pauseTime = 0;
let animationFrameId = null;
let fpsCap = null; // null = unlimited, number = target FPS
let fpsCapLastFrameTime = 0; // For FPS capping timing
let shuffleMode = false;
let repeatMode = 'off'; // 'off', 'one', 'all'
let playbackRate = 1.0;
// Load saved volume from localStorage
let volume = parseFloat(localStorage.getItem('audioVolume')) || 1.0;
let gainNode = null;
let playbackQueue = [];
let manualStop = false; // Flag to distinguish manual stop from natural end

// Folder scanning settings
let includeSubfolders = localStorage.getItem('includeSubfolders') === 'true' || false;

// Canvas is now managed by Vue component (VisualizerCanvas.vue)
// Get canvas reference if it exists, otherwise it will be set by Vue component
let canvas = document.getElementById('visualizer');
let ctx = null;
if (canvas) {
    ctx = canvas.getContext('2d', {
        alpha: false,           // Disable alpha for better performance
        desynchronized: true,   // Reduce latency, allow GPU to work ahead
        willReadFrequently: false,  // We're not reading pixels, only drawing
        colorSpace: 'srgb'      // Explicit color space for better performance
    });
    
    if (ctx) {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
    }
}

// Create audio context
const audioContext = new AudioContext();
window.audioContext = audioContext; // Export to window for Vue components
console.log('AudioContext created:', audioContext.state);
console.log('✓ window.audioContext exported:', !!window.audioContext);
console.log('Canvas 2D context created with GPU acceleration hints');
console.log('Note: 2D canvas is primarily CPU-bound. For better GPU usage, use 3D visualizers (DNA Helix, Tunnel).');

// Create gain node for dB control (affects visualizers)
// Note: currentGainDB is already loaded from localStorage above
let dbGainNode = audioContext.createGain();
// Initialize with currentGainDB value (which was loaded from localStorage if available)
dbGainNode.gain.value = Math.pow(10, currentGainDB / 20);
window.dbGainNode = dbGainNode; // Make available globally

// Create gain node for volume control (affects output only)
gainNode = audioContext.createGain();
gainNode.gain.value = volume; // Use saved volume

// Create analyser node for main visualizer (not affected by dB gain)
var analyser = audioContext.createAnalyser();
analyser.fftSize = 2048; // Must be power of 2 (256, 512, 1024, 2048, etc.)
analyser.smoothingTimeConstant = 0.8; // 0-1, higher = smoother
window.analyser = analyser; // Export to window for Vue components
console.log('AnalyserNode created - fftSize:', analyser.fftSize, 'smoothing:', analyser.smoothingTimeConstant);
console.log('✓ window.analyser exported:', !!window.analyser);

// Create separate analyser for volume history (affected by dB gain)
var volumeHistoryAnalyser = audioContext.createAnalyser();
volumeHistoryAnalyser.fftSize = 2048;
volumeHistoryAnalyser.smoothingTimeConstant = 0.8;
console.log('VolumeHistoryAnalyserNode created');
window.volumeHistoryAnalyser = volumeHistoryAnalyser; // Make available globally

// Initialize AudioFileLoader
let audioFileLoader = null;
try {
    console.log('[RENDERER] Creating AudioFileLoader...');
    audioFileLoader = createAudioFileLoader(audioContext, analyser, gainNode);
    console.log('✓ AudioFileLoader created:', !!audioFileLoader);
    
    // Sync audio files
    audioFileLoader.setAudioFiles(audioFiles);
    
    // Verify export
    console.log('✓ window.loadAudioFile after init:', typeof window.loadAudioFile);
    console.log('✓ window.audioFileLoader after init:', typeof window.audioFileLoader);
    const isPlaceholder = window.loadAudioFile && window.loadAudioFile.toString().includes('called before initialization');
    console.log('✓ Is placeholder?', isPlaceholder);
    
    // Store reference for later callback setup (after UI elements are available)
    window._audioFileLoader = audioFileLoader;
    
    // Callbacks will be set up after UI elements are available (see setupAudioFileLoaderCallbacks function)
} catch (e) {
    console.error('✗ Failed to initialize AudioFileLoader:', e);
    console.error('Error details:', e.message);
    if (e.stack) console.error('Stack:', e.stack);
}

// Create data arrays for analysis
const bufferLength = analyser.frequencyBinCount; // Half of fftSize
const timeDomainData = new Uint8Array(bufferLength); // For waveform (0-255)
const frequencyData = new Uint8Array(bufferLength); // For frequency bars (0-255)
console.log('Data arrays created - bufferLength:', bufferLength);
console.log('About to get UI elements...');

// Get UI elements
const playBtn = document.getElementById('playBtn');
const pauseBtn = document.getElementById('pauseBtn');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const shuffleBtn = document.getElementById('shuffleBtn');
const repeatBtn = document.getElementById('repeatBtn');
const volumeSlider = document.getElementById('volumeSlider');
const volumeValue = document.getElementById('volumeValue');
const speedSelect = document.getElementById('speedSelect');
const queueBtn = document.getElementById('queueBtn');
const queuePanel = document.getElementById('queuePanel');
const closeQueueBtn = document.getElementById('closeQueueBtn');
const queueList = document.getElementById('queueList');
const visualizerSelect = document.getElementById('visualizerSelect');
const statusText = document.getElementById('status');
const settingsToggle = document.getElementById('settingsToggle');
const settingsPanel = document.getElementById('settingsPanel');
const browseFolderBtn = document.getElementById('browseFolderBtn');
const fileBrowser = document.getElementById('fileBrowser');
const folderPath = document.getElementById('folderPath');
const searchInput = document.getElementById('searchInput');
const fileCount = document.getElementById('fileCount');
const currentTimeEl = document.getElementById('currentTime');
const fullscreenBtn = document.getElementById('fullscreenBtn');
const canvasContainer = document.getElementById('canvasContainer');
const durationEl = document.getElementById('duration');
const progressBar = document.getElementById('progressBar');
const progressFill = document.getElementById('progressFill');
const progressHandle = document.getElementById('progressHandle');

console.log('Got all UI elements, about to get settings elements...');

// Set up AudioFileLoader callbacks now that UI elements are available
function setupAudioFileLoaderCallbacks(loader) {
    if (!loader) {
        console.warn('[RENDERER] No loader provided to setupAudioFileLoaderCallbacks');
        return;
    }
    
    console.log('[RENDERER] Setting up AudioFileLoader callbacks...');
    
    loader.onFileLoaded = (data) => {
        console.log('[RENDERER] onFileLoaded callback triggered for:', data.file.name);
        audioBuffer = data.buffer;
        currentFileIndex = data.index;
        syncStateToWindow();
        
        // Update UI if elements exist
        if (statusText) {
            statusText.textContent = `${data.file.name} (${data.duration.toFixed(1)}s)`;
        }
        if (playBtn) {
            playBtn.disabled = false;
            console.log('[RENDERER] Play button enabled');
        }
        if (pauseBtn) pauseBtn.disabled = true;
        if (durationEl) durationEl.textContent = formatTime(data.duration);
        if (currentTimeEl) currentTimeEl.textContent = '0:00';
        if (progressFill) progressFill.style.width = '0%';
        if (progressHandle) progressHandle.style.left = '0%';
        
        // Reset and analyze BPM
        if (bpmDetector) {
            bpmDetector.reset();
            updateBPMDisplay();
            analyzeBPM(data.buffer);
        }
        
        // Reset and analyze Key
        if (keyDetector) {
            keyDetector.reset();
            updateKeyDisplay();
            analyzeKey(data.buffer);
        }
        
        // Update now playing
        updateNowPlaying(data.file.name, data.file.path);
        
        // Update UI
        updateFileSelection();
        updateDiscordPresence();
        
        // Update audio store for Vue components
        // The store is managed by Vue/Pinia, so we'll update it via a custom event
        // or by directly setting window properties that Vue components watch
        try {
            const file = audioFiles[data.index];
            if (file) {
                // Dispatch custom event for Vue components to listen to
                const event = new CustomEvent('audio-file-loaded', {
                    detail: {
                        file: file,
                        index: data.index,
                        duration: data.duration,
                        buffer: data.buffer
                    }
                });
                window.dispatchEvent(event);
                
                // Also try to update window.audioStore if it exists
                if (window.audioStore) {
                    window.audioStore.setCurrentIndex(data.index);
                    const metadata = metadataCache.get(file.path);
                    if (metadata) {
                        window.audioStore.title = metadata.title || file.name;
                        window.audioStore.artist = metadata.artist || '';
                    } else {
                        const parsed = parseFileName(file.name);
                        window.audioStore.title = parsed.title;
                        window.audioStore.artist = parsed.artist || '';
                    }
                }
            }
        } catch (e) {
            console.warn('[RENDERER] Could not update audio store:', e);
        }
        
        console.log('[RENDERER] onFileLoaded callback completed');
    };
    
    loader.onPlaybackStateChanged = (playing) => {
        console.log('[RENDERER] onPlaybackStateChanged:', playing);
        isPlaying = playing;
        syncStateToWindow();
        if (playBtn) playBtn.disabled = playing;
        if (pauseBtn) pauseBtn.disabled = !playing;
        updateFileSelection();
        updateDiscordPresence();
        
        // Update audio store
        try {
            if (window.audioStore) {
                window.audioStore.setPlaying(playing);
            }
        } catch (e) {
            console.warn('[RENDERER] Could not update audio store:', e);
        }
    };
    
    loader.onError = (error) => {
        console.error('[RENDERER] AudioFileLoader error:', error);
        if (statusText) {
            statusText.textContent = 'Error loading file: ' + error.message;
        }
        if (playBtn) playBtn.disabled = true;
        if (pauseBtn) pauseBtn.disabled = true;
    };
    
    console.log('[RENDERER] AudioFileLoader callbacks configured');
}

// Set up callbacks if loader is already initialized
if (window._audioFileLoader) {
    setupAudioFileLoaderCallbacks(window._audioFileLoader);
}

// Settings UI elements (already declared above, just get the inputs)
const settingsContent = document.getElementById('settingsContent');
const primaryColorInput = document.getElementById('primaryColor');
const lineWidthInput = document.getElementById('lineWidth');
const smoothingInput = document.getElementById('smoothing');
const sensitivityInput = document.getElementById('sensitivity');
const bgColorInput = document.getElementById('bgColor');
const mirrorEffectInput = document.getElementById('mirrorEffect');

console.log('Got settings elements, about to create settings object...');

// Settings object
const settings = {
    primaryColor: '#00ff88',
    lineWidth: 2,
    smoothing: 0.8,
    sensitivity: 1.0,
    bgColor: '#000000',
    mirrorEffect: false,
    beatDetection: true,
    beatFlashIntensity: 0.3,
    beatFlashDuration: 0.92,
    gpuAcceleration: true,
    albumArtBackground: true,
    albumArtBlur: 20,
    albumArtOpacity: 0.3
};

// Share settings with visualizers
console.log('About to call setSettings...');
setSettings(settings);
console.log('setSettings called successfully');
console.log('About to declare beat detection variables...');

// Beat detection variables
let beatValue = 0;
const beatDecay = 0.95; // Decay rate for beat flash effect

// BPM detection (now handled by bpmDetector module)
let detectedBPM = 0; // Keep for backward compatibility

// Show notification toast
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 20px;
        background: ${type === 'success' ? 'rgba(0, 255, 136, 0.9)' : 'rgba(255, 68, 68, 0.9)'};
        color: ${type === 'success' ? '#000' : '#fff'};
        border-radius: 4px;
        font-size: 14px;
        font-weight: 500;
        z-index: 10000;
        animation: slideIn 0.3s ease;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

console.log('About to define formatTime function...');

// Format time in MM:SS
function formatTime(seconds) {
    if (!isFinite(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

console.log('formatTime function defined successfully');
console.log('About to define detectBeat function...');

// Beat detection using BPM timing (wrapper for bpmDetector module)
function detectBeat() {
    const result = bpmDetector.detectBeat(settings, isPlaying, audioContext, startTime);
    beatValue = bpmDetector.getBeatValue(); // Sync for backward compatibility
    return result;
}

// Analyze BPM using web-audio-beat-detector library (wrapper)
async function analyzeBPM(audioBuffer) {
    const result = await bpmDetector.analyze(audioBuffer);
    detectedBPM = result.bpm; // Sync for backward compatibility
    updateBPMDisplay();
}

// Analyze musical key
async function analyzeKey(audioBuffer) {
    const result = await keyDetector.analyze(audioBuffer);
    updateKeyDisplay();
}

// Update BPM display
function updateBPMDisplay() {
    const bpmDisplay = document.getElementById('bpmDisplay');
    if (bpmDisplay) {
        const bpm = bpmDetector.getBPM();
        if (bpm > 0) {
            bpmDisplay.textContent = `${bpm} BPM`;
            console.log('BPM updated:', bpm);
        } else {
            bpmDisplay.textContent = '-- BPM';
        }
    }
}

// Update Key display
function updateKeyDisplay() {
    const keyDisplay = document.getElementById('keyDisplay');
    if (keyDisplay) {
        const useCamelot = settings.useCamelotNotation !== false; // Default to true
        const keyString = keyDetector.getKeyDisplay(useCamelot);
        if (keyString && keyString !== '--') {
            keyDisplay.textContent = keyString;
            console.log('Key updated:', keyString, useCamelot ? '(Camelot)' : '(Standard)');
        } else {
            keyDisplay.textContent = '--';
        }
    }
}

// Update now playing display
async function updateNowPlaying(filename, filePath = null) {
    const nowPlayingTitle = document.getElementById('nowPlayingTitle');
    const nowPlayingArtist = document.getElementById('nowPlayingArtist');
    const nowPlayingArt = document.getElementById('nowPlayingArt');

    if (nowPlayingTitle && nowPlayingArtist) {
        // Show placeholder from filename first
        const parsed = parseFileName(filename);
        nowPlayingTitle.textContent = parsed.title;
        nowPlayingArtist.textContent = parsed.hasArtist ? parsed.artist : '';

        // Load metadata if we have a file path
        if (filePath) {
            let metadata = metadataCache.get(filePath);

            if (!metadata) {
                metadata = await ipcRenderer.invoke('extract-metadata', filePath);
                metadataCache.set(filePath, metadata);
            }

            // Update with metadata
            const title = metadata.title || parsed.title;
            const artist = metadata.artist;
            const album = metadata.album;

            nowPlayingTitle.textContent = title;

            if (artist && album) {
                nowPlayingArtist.textContent = `${artist} • ${album}`;
            } else if (artist) {
                nowPlayingArtist.textContent = artist;
            } else if (album) {
                nowPlayingArtist.textContent = album;
            } else {
                nowPlayingArtist.textContent = '';
            }
        }
    }

    // Update album art in now playing section
    if (nowPlayingArt && filePath && settings.albumArtBackground) {
        albumArtManager.extractAlbumArt(filePath).then(artUrl => {
            if (artUrl) {
                nowPlayingArt.innerHTML = `<img src="${artUrl}" alt="Album art">`;
            } else {
                nowPlayingArt.innerHTML = '<svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="#00ff88" stroke-width="2"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>';
            }
        });
    }
}

// Update Discord Rich Presence (wrapper for discordRPC module)
async function updateDiscordPresence() {
    const currentFile = currentFileIndex >= 0 && audioFiles.length > 0 ? audioFiles[currentFileIndex] : null;

    // Get metadata if we have a current file
    let metadata = null;
    if (currentFile) {
        metadata = metadataCache.get(currentFile.path);
        if (!metadata) {
            metadata = await ipcRenderer.invoke('extract-metadata', currentFile.path);
            metadataCache.set(currentFile.path, metadata);
        }
    }

    // Wait for async updatePresence to complete (it fetches cover art)
    await discordRPC.updatePresence({
        visualizerName: window.visualizerManager?.getCurrent()?.name || 'Waveform',
        currentFile: currentFile,
        isPlaying: isPlaying,
        audioBuffer: audioBuffer,
        audioContext: audioContext,
        startTime: startTime,
        parseFileName: parseFileName,
        metadata: metadata
    });
}

// Update progress bar
function updateProgress() {
    // External audio (YouTube)
    if (window.audioManager && window.audioManager.externalAudio) {
        const audioEl = window.audioManager.externalAudio;
        if (!audioEl) return;
        const currentTimeVal = audioEl.currentTime || 0;
        const durationVal = audioEl.duration || 0;
        if (currentTimeEl) currentTimeEl.textContent = formatTime(currentTimeVal);
        if (durationEl) durationEl.textContent = formatTime(durationVal);
        if (progressFill && progressHandle && durationVal > 0) {
            const progress = Math.min((currentTimeVal / durationVal) * 100, 100);
            progressFill.style.width = `${progress}%`;
            progressHandle.style.left = `${progress}%`;
        }
        return;
    }

    if (!audioBuffer || !isPlaying) return;

    const currentTime = audioContext.currentTime - startTime;
    const duration = audioBuffer.duration;
    const progress = Math.min((currentTime / duration) * 100, 100);

    progressFill.style.width = `${progress}%`;
    progressHandle.style.left = `${progress}%`;
    currentTimeEl.textContent = formatTime(currentTime);

    if (currentTime >= duration) {
        // Song ended
        isPlaying = false;
    syncStateToWindow();
        playBtn.disabled = false;
        pauseBtn.disabled = true;
        updateFileSelection();
        progressFill.style.width = '0%';
        progressHandle.style.left = '0%';
        currentTimeEl.textContent = '0:00';
    }
}

// ===== PLAYBACK CONTROLS =====
console.log('Reached PLAYBACK CONTROLS section...');
// Note: These controls are now handled by Vue components (AudioPlayer.vue)
// Only attach listeners if elements exist (for backward compatibility)

// Previous track
if (prevBtn) {
prevBtn.addEventListener('click', () => {
    if (audioFiles.length === 0) return;

    const wasPlaying = isPlaying;
    const currentTime = isPlaying ? (audioContext.currentTime - startTime) : 0;

    // If more than 3 seconds into song, restart it
    if (currentTime > 3 && audioBuffer) {
        loadAudioFile(currentFileIndex);
    } else {
        // Go to previous track
        let prevIndex = currentFileIndex - 1;
        if (prevIndex < 0) {
            prevIndex = audioFiles.length - 1; // Wrap to last song
        }
        loadAudioFile(prevIndex);
    }

    // Auto-play if was playing
    if (wasPlaying) {
        setTimeout(() => playBtn.click(), 100);
    }
});

// Next track
if (nextBtn) {
nextBtn.addEventListener('click', () => {
    playNextTrack();
});

function playNextTrack() {
    if (audioFiles.length === 0) return;

    let nextIndex;
    if (shuffleMode) {
        // Random track
        nextIndex = Math.floor(Math.random() * audioFiles.length);
        // Avoid playing same song twice in a row
        if (nextIndex === currentFileIndex && audioFiles.length > 1) {
            nextIndex = (nextIndex + 1) % audioFiles.length;
        }
    } else {
        nextIndex = currentFileIndex + 1;
        if (nextIndex >= audioFiles.length) {
            if (repeatMode === 'all') {
                nextIndex = 0; // Loop to first song
            } else {
                return; // End of playlist
            }
        }
    }

    loadAudioFile(nextIndex).then(() => {
        setTimeout(() => playBtn?.click(), 100);
    });
}
}

// Shuffle toggle
if (shuffleBtn) {
shuffleBtn.addEventListener('click', () => {
    shuffleMode = !shuffleMode;
    shuffleBtn.classList.toggle('active', shuffleMode);
    shuffleBtn.title = shuffleMode ? 'Shuffle On' : 'Shuffle Off';
    console.log('Shuffle:', shuffleMode);
});
}

// Repeat toggle
if (repeatBtn) {
repeatBtn.addEventListener('click', () => {
    const modes = ['off', 'all', 'one'];
    const currentIndex = modes.indexOf(repeatMode);
    repeatMode = modes[(currentIndex + 1) % modes.length];

    repeatBtn.classList.toggle('active', repeatMode !== 'off');

    if (repeatMode === 'off') {
        repeatBtn.title = 'Repeat Off';
        repeatBtn.querySelector('svg').innerHTML = '<path d="M17 1l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="M7 23l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>';
    } else if (repeatMode === 'all') {
        repeatBtn.title = 'Repeat All';
        repeatBtn.querySelector('svg').innerHTML = '<path d="M17 1l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="M7 23l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>';
    } else {
        repeatBtn.title = 'Repeat One';
        repeatBtn.querySelector('svg').innerHTML = '<path d="M17 1l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="M7 23l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/><text x="12" y="16" text-anchor="middle" font-size="10" fill="currentColor">1</text>';
    }

    console.log('Repeat mode:', repeatMode);
});
}

// Volume control
if (volumeSlider) {
    // Load saved volume on startup
    const savedVolume = parseFloat(localStorage.getItem('audioVolume'));
    if (savedVolume !== null && !isNaN(savedVolume)) {
        volume = savedVolume;
        const savedVolumePercent = Math.round(volume * 100);
        volumeSlider.value = savedVolumePercent;
        if (volumeValue) {
            volumeValue.textContent = `${savedVolumePercent}%`;
        }
        volumeSlider.style.setProperty('--volume-percent', `${savedVolumePercent}%`);
        if (gainNode) {
            gainNode.gain.value = volume;
        }
    }

    volumeSlider.addEventListener('input', (e) => {
        volume = e.target.value / 100;
        gainNode.gain.value = volume;
        volumeValue.textContent = `${e.target.value}%`;
        // Update CSS variable for gradient
        volumeSlider.style.setProperty('--volume-percent', `${e.target.value}%`);
        // Save to localStorage
        localStorage.setItem('audioVolume', volume.toString());
    });
}

// Speed control
if (speedSelect) {
speedSelect.addEventListener('change', (e) => {
    playbackRate = parseFloat(e.target.value);
    if (audioSource) {
        audioSource.playbackRate.value = playbackRate;
    }
    console.log('Playback speed:', playbackRate);
});

// Initialize custom speed select
createCustomSelect(speedSelect);
}

// Queue panel toggle
if (queueBtn) {
    queueBtn.addEventListener('click', () => {
        console.log('Queue button clicked');
        queuePanel.classList.toggle('hidden');
        if (!queuePanel.classList.contains('hidden')) {
            updateQueueDisplay();
        }
    });
    console.log('Queue button handler attached');
} else {
    console.error('Queue button not found!');
}

if (closeQueueBtn) {
    closeQueueBtn.addEventListener('click', () => {
        queuePanel.classList.add('hidden');
    });
} else {
    console.error('Close queue button not found!');
}

// Fullscreen toggle
if (fullscreenBtn && canvasContainer) {
    fullscreenBtn.addEventListener('click', () => {
        canvasContainer.classList.toggle('fullscreen');

        // Update button icon based on state
        const isFullscreen = canvasContainer.classList.contains('fullscreen');
        fullscreenBtn.innerHTML = isFullscreen
            ? '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/></svg>'
            : '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>';

        fullscreenBtn.title = isFullscreen ? 'Exit Fullscreen' : 'Toggle Fullscreen';

        // Resize canvas when toggling fullscreen
        if (window.visualizerManager && window.visualizerManager.getCurrent()) {
            setTimeout(() => {
                window.visualizerManager.getCurrent().resize();
            }, 100);
        }
    });

    // ESC key to exit fullscreen
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && canvasContainer.classList.contains('fullscreen')) {
            canvasContainer.classList.remove('fullscreen');
            fullscreenBtn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>';
            fullscreenBtn.title = 'Toggle Fullscreen';

            if (window.visualizerManager && window.visualizerManager.getCurrent()) {
                setTimeout(() => {
                    window.visualizerManager.getCurrent().resize();
                }, 100);
            }
        }
    });
}

// Update queue display
function updateQueueDisplay() {
    if (audioFiles.length === 0) {
        queueList.innerHTML = '<div class="empty-state">No songs in queue</div>';
        return;
    }

    queueList.innerHTML = '';
    audioFiles.forEach((file, index) => {
        const queueItem = document.createElement('div');
        queueItem.className = 'queue-item';
        if (index === currentFileIndex) {
            queueItem.classList.add('current');
        }

        // Create elements
        const numberSpan = document.createElement('span');
        numberSpan.className = 'queue-item-number';
        numberSpan.textContent = index + 1;

        // Album art icon
        const iconSpan = document.createElement('span');
        iconSpan.className = 'file-icon';
        iconSpan.style.width = '40px';
        iconSpan.style.height = '40px';
        iconSpan.style.flexShrink = '0';

        // Try to load album art
        if (settings.albumArtBackground) {
            albumArtManager.extractAlbumArt(file.path).then(artUrl => {
                if (artUrl) {
                    iconSpan.innerHTML = `<img src="${artUrl}" alt="Album art" style="width: 100%; height: 100%; object-fit: cover; border-radius: 3px;">`;
                } else {
                    iconSpan.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>';
                }
            });
        } else {
            iconSpan.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>';
        }

        const contentDiv = document.createElement('div');
        contentDiv.className = 'file-content';

        const titleDiv = document.createElement('div');
        titleDiv.className = 'file-title';
        const parsed = parseFileName(file.name);
        titleDiv.textContent = parsed.title; // Temporary

        const artistDiv = document.createElement('div');
        artistDiv.className = 'file-artist';
        artistDiv.style.display = 'none';

        contentDiv.appendChild(titleDiv);
        contentDiv.appendChild(artistDiv);
        queueItem.appendChild(numberSpan);
        queueItem.appendChild(iconSpan);
        queueItem.appendChild(contentDiv);

        // Load metadata asynchronously
        (async () => {
            let metadata = metadataCache.get(file.path);

            if (!metadata) {
                metadata = await ipcRenderer.invoke('extract-metadata', file.path);
                metadataCache.set(file.path, metadata);
            }

            const title = metadata.title || parsed.title;
            const artist = metadata.artist;
            const album = metadata.album;

            titleDiv.textContent = title;

            if (artist || album) {
                if (artist && album) {
                    artistDiv.textContent = `${artist} • ${album}`;
                } else if (artist) {
                    artistDiv.textContent = artist;
                } else {
                    artistDiv.textContent = album;
                }
                artistDiv.style.display = 'block';
            }
        })();

        queueItem.addEventListener('click', () => {
            loadAudioFile(index);
            if (!isPlaying) {
                setTimeout(() => playBtn.click(), 100);
            }
            queuePanel.classList.add('hidden');
        });

        queueList.appendChild(queueItem);
    });
}

// Seek to position
progressBar.addEventListener('click', (e) => {
    const rect = progressBar.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));

    // If external audio (YouTube)
    if (window.audioManager && window.audioManager.externalAudio) {
        const audioEl = window.audioManager.externalAudio;
        const duration = audioEl.duration || 0;
        if (duration > 0) {
            audioEl.currentTime = percent * duration;
            // UI will update via timeupdate listener
        }
        return;
    }

    if (!audioBuffer) return;

    const seekTime = percent * audioBuffer.duration;

    if (isPlaying && audioSource) {
        // Stop current playback
        manualStop = true; // Set flag before stopping
        audioSource.stop();

        // Create new source at seek position
        audioSource = audioContext.createBufferSource();
        audioSource.buffer = audioBuffer;
        audioSource.playbackRate.value = playbackRate;

        // Connect main visualizer: source → dbGainNode → analyser → gainNode → destination
        // dbGainNode affects visualizer intensity, gainNode affects output volume
        audioSource.connect(dbGainNode);
        dbGainNode.connect(analyser);
        analyser.connect(gainNode);
        gainNode.connect(audioContext.destination);

        // Connect volume history: dbGainNode → volumeHistoryAnalyser (also affected by dB gain)
        // Share the same dbGainNode output for volume history
        dbGainNode.connect(volumeHistoryAnalyser);

        // Handle when audio ends (same as play button)
        audioSource.onended = () => {
            // Check if this was a manual stop
            if (manualStop) {
                manualStop = false;
                return;
            }

            // Natural end of song
            if (repeatMode === 'one') {
                loadAudioFile(currentFileIndex).then(() => {
                    setTimeout(() => playBtn.click(), 100);
                });
            } else if (repeatMode === 'all' || (currentFileIndex < audioFiles.length - 1) || shuffleMode) {
                playNextTrack();
            } else {
                isPlaying = false;
    syncStateToWindow();
                updateStatusWithPerf('Ended');
                playBtn.disabled = false;
                pauseBtn.disabled = true;
                updateFileSelection();
                progressFill.style.width = '0%';
                progressHandle.style.left = '0%';
                currentTimeEl.textContent = '0:00';
            }
        };

        audioSource.start(0, seekTime);
        startTime = audioContext.currentTime - seekTime;
    } else {
        const progress = percent * 100;
        progressFill.style.width = `${progress}%`;
        progressHandle.style.left = `${progress}%`;
        currentTimeEl.textContent = formatTime(seekTime);
        pauseTime = seekTime;
    }
});



// ===== FILE BROWSER =====
let fs = null;
let ipcRenderer = null;
try {
    if (window.require) {
        fs = window.require('fs');
        ipcRenderer = window.require('electron').ipcRenderer;
    }
} catch (e) {
    console.warn('Failed to require fs or electron modules:', e);
}
// path already required at top

// Browse folder button
if (browseFolderBtn) {
    browseFolderBtn.addEventListener('click', async () => {
        console.log('Browse folder button clicked');
        ipcRenderer.send('open-folder-dialog');
    });
}

// Include subfolders checkbox
const includeSubfoldersCheckbox = document.getElementById('includeSubfoldersCheckbox');
if (includeSubfoldersCheckbox) {
    // Set initial state from fileManager
    includeSubfoldersCheckbox.checked = fileManager.includeSubfolders;

    includeSubfoldersCheckbox.addEventListener('change', (e) => {
        fileManager.setIncludeSubfolders(e.target.checked);
        console.log('Include subfolders:', e.target.checked);

        // Reload current folder if one is loaded
        if (currentFolder) {
            const result = fileManager.loadFolder(currentFolder);
            if (result.success) {
                audioFiles = result.files;
                syncAudioFilesToLoader();
                renderFileList();
                fileCount.textContent = `${result.count} song${result.count !== 1 ? 's' : ''}`;
            }
        }
    });
}

// Receive folder path from main process
ipcRenderer.on('folder-selected', (event, folderPath) => {
    console.log('Received folder path:', folderPath);
    if (folderPath) {
        const result = fileManager.loadFolder(folderPath);
        if (result.success) {
            audioFiles = result.files;
            syncAudioFilesToLoader();
            currentFolder = folderPath;
            updateFolderPath(folderPath);
            renderFileList();
            fileCount.textContent = `${result.count} song${result.count !== 1 ? 's' : ''}`;
            prevBtn.disabled = result.count === 0;
            nextBtn.disabled = result.count === 0;
        } else {
            fileBrowser.innerHTML = `<div class="empty-state">Error loading folder<br><small>${result.error}</small></div>`;
        }
    } else {
        console.log('No folder path received');
    }
});

// Menu event listeners
ipcRenderer.on('menu-open-folder', () => {
    browseFolderBtn.click();
});

ipcRenderer.on('menu-open-settings', () => {
    openSettingsModal();
});

ipcRenderer.on('menu-play-pause', () => {
    if (isPlaying) {
        pauseBtn.click();
    } else {
        playBtn.click();
    }
});

ipcRenderer.on('menu-next-track', () => {
    nextBtn.click();
});

ipcRenderer.on('menu-prev-track', () => {
    prevBtn.click();
});

ipcRenderer.on('menu-shuffle', () => {
    shuffleBtn.click();
});

ipcRenderer.on('menu-repeat', () => {
    repeatBtn.click();
});

// Settings Modal Functions
const settingsModal = document.getElementById('settingsModal');
const closeSettingsBtn = document.getElementById('closeSettingsBtn');

function openSettingsModal() {
    settingsModal.classList.remove('hidden');
}

function closeSettingsModal() {
    settingsModal.classList.add('hidden');
}

if (closeSettingsBtn) {
    closeSettingsBtn.addEventListener('click', closeSettingsModal);
}

// Settings category switching
function switchSettingsCategory(categoryName) {
    // Update active state
    const settingsCategories = document.querySelectorAll('.settings-category');
    settingsCategories.forEach(cat => {
        if (cat.getAttribute('data-category') === categoryName) {
            cat.classList.add('active');
        } else {
            cat.classList.remove('active');
        }
    });

    // Show/hide corresponding settings section
    const allSections = document.querySelectorAll('.settings-section[data-category]');
    allSections.forEach(section => {
        if (section.getAttribute('data-category') === categoryName) {
            section.style.display = 'block';
        } else {
            section.style.display = 'none';
        }
    });
}

const settingsCategories = document.querySelectorAll('.settings-category');
settingsCategories.forEach(category => {
    category.addEventListener('click', () => {
        const categoryName = category.getAttribute('data-category');
        switchSettingsCategory(categoryName);
    });
});

// Close on overlay click
if (settingsModal) {
    settingsModal.querySelector('.settings-modal-overlay')?.addEventListener('click', closeSettingsModal);
}

// Close on Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !settingsModal.classList.contains('hidden')) {
        closeSettingsModal();
    }
});

// Canvas Resolution Settings
const canvasResolutionSelect = document.getElementById('canvasResolution');
const customResolutionContainer = document.getElementById('customResolutionContainer');
const customWidthInput = document.getElementById('customWidth');
const customHeightInput = document.getElementById('customHeight');
const applyCustomResolutionBtn = document.getElementById('applyCustomResolution');

// Load saved resolution
const savedResolution = localStorage.getItem('canvasResolution') || '1280x720';
if (canvasResolutionSelect) {
    const isCustom = !['800x400', '1200x600', '1600x800', '1920x1080', '2560x1440', '3840x2160'].includes(savedResolution);
    if (isCustom) {
        canvasResolutionSelect.value = 'custom';
        customResolutionContainer.style.display = 'block';
        const [w, h] = savedResolution.split('x');
        customWidthInput.value = w;
        customHeightInput.value = h;
    } else {
        canvasResolutionSelect.value = savedResolution;
    }

    // Apply saved resolution on load
    const [width, height] = savedResolution.split('x').map(Number);
    canvas.width = width;
    canvas.height = height;
}

// Handle resolution change
if (canvasResolutionSelect) {
    canvasResolutionSelect.addEventListener('change', (e) => {
        const value = e.target.value;

        if (value === 'custom') {
            customResolutionContainer.style.display = 'block';
        } else {
            customResolutionContainer.style.display = 'none';
            const [width, height] = value.split('x').map(Number);
            applyCanvasResolution(width, height);
            localStorage.setItem('canvasResolution', value);
        }
    });

    // Initialize custom dropdown for resolution selector
    createCustomSelect(canvasResolutionSelect);
}

// Apply custom resolution
if (applyCustomResolutionBtn) {
    applyCustomResolutionBtn.addEventListener('click', () => {
        const width = parseInt(customWidthInput.value);
        const height = parseInt(customHeightInput.value);

        if (width < 400 || width > 7680 || height < 200 || height > 4320) {
            alert('Please enter valid dimensions:\nWidth: 400-7680\nHeight: 200-4320');
            return;
        }

        applyCanvasResolution(width, height);
        localStorage.setItem('canvasResolution', `${width}x${height}`);
    });
}

function applyCanvasResolution(width, height) {
    if (!canvas) return;
    canvas.width = width;
    canvas.height = height;

    // Reinitialize all visualizers with new canvas size
    if (window.visualizerManager) {
        window.visualizerManager.visualizers.forEach(viz => {
            if (viz.init) {
                viz.init(canvas, ctx);
            }
        });

        // Trigger resize on current visualizer
        const current = window.visualizerManager.getCurrent();
        if (current && current.resize) {
            current.resize();
        }
    }

    console.log(`Canvas resolution changed to ${width}x${height}`);
}

// Update visualizer tweaks panel
function updateTweaksPanel() {
    const tweaksContent = document.getElementById('visualizerTweaksContent');
    if (!tweaksContent) return;

    const visualizer = window.visualizerManager?.getCurrent();
    if (!visualizer) return;

    const customSettings = visualizer.getCustomSettings();

    if (customSettings.length === 0) {
        tweaksContent.innerHTML = '<p class="empty-tweaks">No custom settings for this visualizer</p>';
        return;
    }

    tweaksContent.innerHTML = '';

    customSettings.forEach(setting => {
        const settingItem = document.createElement('div');
        settingItem.className = 'setting-item';

        if (setting.type === 'range') {
            const label = document.createElement('label');
            label.innerHTML = `${setting.label}: <span id="tweak${setting.key}Value">${setting.value}</span>`;

            const input = document.createElement('input');
            input.type = 'range';
            input.min = setting.min;
            input.max = setting.max;
            input.step = setting.step || 1;
            input.value = setting.value;
            input.addEventListener('input', (e) => {
                visualizer.updateSetting(setting.key, parseFloat(e.target.value));
                document.getElementById(`tweak${setting.key}Value`).textContent = e.target.value;
            });

            settingItem.appendChild(label);
            settingItem.appendChild(input);
        } else if (setting.type === 'select') {
            const label = document.createElement('label');
            label.textContent = setting.label + ':';

            const select = document.createElement('select');
            select.id = `tweak${setting.key}Select`;
            setting.options.forEach(opt => {
                const option = document.createElement('option');
                option.value = opt;
                option.textContent = opt.charAt(0).toUpperCase() + opt.slice(1);
                if (opt === setting.value) option.selected = true;
                select.appendChild(option);
            });
            select.addEventListener('change', (e) => {
                visualizer.updateSetting(setting.key, e.target.value);
            });

            settingItem.appendChild(label);
            settingItem.appendChild(select);

            // Create custom select after appending to DOM
            setTimeout(() => {
                createCustomSelect(select);
            }, 0);
        } else if (setting.type === 'checkbox') {
            const label = document.createElement('label');
            label.className = 'checkbox-label';
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.checked = setting.value;
            checkbox.addEventListener('change', (e) => {
                visualizer.updateSetting(setting.key, e.target.checked);
            });
            const span = document.createElement('span');
            span.textContent = setting.label;
            label.appendChild(checkbox);
            label.appendChild(span);
            settingItem.appendChild(label);
        }

        tweaksContent.appendChild(settingItem);
    });
}

// Recursively scan folder for audio files
// Update folder path display
function updateFolderPath(folderPathStr) {
    if (!folderPathStr) return;

    const pathParts = folderPathStr.split(path.sep).filter(part => part);
    if (pathParts.length === 0) return;

    folderPath.innerHTML = '';

    const homeSpan = document.createElement('span');
    homeSpan.className = 'path-segment';

    const svgIcon = '<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" style="vertical-align: middle; margin-right: 4px;"><path d="M1.75 1A1.75 1.75 0 000 2.75v10.5C0 14.216.784 15 1.75 15h12.5A1.75 1.75 0 0016 13.25v-8.5A1.75 1.75 0 0014.25 3H7.5a.25.25 0 01-.2-.1l-.9-1.2C6.07 1.26 5.55 1 5 1H1.75z"/></svg>';
    const folderName = pathParts[pathParts.length - 1];

    homeSpan.innerHTML = svgIcon;
    const textNode = document.createTextNode(folderName);
    homeSpan.appendChild(textNode);

    folderPath.appendChild(homeSpan);
}

// Render file list
function renderFileList() {
    if (audioFiles.length === 0) {
        fileBrowser.innerHTML = '<div class="empty-state">No audio files found in this folder</div>';
        return;
    }

    // Filter files based on search query
    const filteredFiles = audioFiles.filter((file, index) => {
        if (!searchQuery) return true;

        const parsed = parseFileName(file.name);
        const searchLower = searchQuery.toLowerCase();

        return parsed.title.toLowerCase().includes(searchLower) ||
            parsed.artist.toLowerCase().includes(searchLower) ||
            file.name.toLowerCase().includes(searchLower);
    });

    fileBrowser.innerHTML = '';

    if (filteredFiles.length === 0) {
        fileBrowser.innerHTML = '<div class="empty-state">No songs match your search</div>';
        return;
    }

    // Check if we should group by folders
    const groupedFolders = fileManager.getGroupedFiles();

    if (groupedFolders && groupedFolders.length > 1) {
        // Render with folder grouping
        renderGroupedFileList(filteredFiles, groupedFolders);
    } else {
        // Render flat list
        renderFlatFileList(filteredFiles);
    }
}

function renderFlatFileList(filteredFiles) {
    filteredFiles.forEach((file) => {
        const index = audioFiles.indexOf(file);
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        fileItem.dataset.index = index;

        // Create file item HTML with artist and title
        const iconSpan = document.createElement('span');
        iconSpan.className = 'file-icon';

        // Try to load album art for this file
        if (settings.albumArtBackground) {
            albumArtManager.extractAlbumArt(file.path).then(artUrl => {
                if (artUrl) {
                    iconSpan.innerHTML = `<img src="${artUrl}" alt="Album art" style="width: 100%; height: 100%; object-fit: cover; border-radius: 3px;">`;
                } else {
                    iconSpan.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>';
                }
            });
        } else {
            iconSpan.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>';
        }

        const contentDiv = document.createElement('div');
        contentDiv.className = 'file-content';

        // Create placeholder elements
        const titleDiv = document.createElement('div');
        titleDiv.className = 'file-title';
        titleDiv.textContent = parseFileName(file.name).title; // Temporary
        contentDiv.appendChild(titleDiv);

        const artistDiv = document.createElement('div');
        artistDiv.className = 'file-artist';
        artistDiv.style.display = 'none'; // Hide until we have data
        contentDiv.appendChild(artistDiv);

        fileItem.appendChild(iconSpan);
        fileItem.appendChild(contentDiv);

        // Load metadata asynchronously
        (async () => {
            // Check cache first
            let metadata = metadataCache.get(file.path);

            if (!metadata) {
                // Extract and cache metadata
                metadata = await ipcRenderer.invoke('extract-metadata', file.path);
                metadataCache.set(file.path, metadata);
            }

            // Use metadata if available, otherwise fall back to filename parsing
            const title = metadata.title || parseFileName(file.name).title;
            const artist = metadata.artist;
            const album = metadata.album;

            titleDiv.textContent = title;

            // Show artist and album if available
            if (artist || album) {
                if (artist && album) {
                    artistDiv.textContent = `${artist} • ${album}`;
                } else if (artist) {
                    artistDiv.textContent = artist;
                } else {
                    artistDiv.textContent = album;
                }
                artistDiv.style.display = 'block';
            }
        })();

        fileItem.addEventListener('click', () => {
            console.log('File item clicked, index:', index, 'file:', filteredFiles[index]);
            const wasPlaying = isPlaying;
            loadAudioFile(index).then(() => {
                console.log('loadAudioFile completed successfully');
                // Auto-play if something was already playing
                if (wasPlaying) {
                    setTimeout(() => playBtn.click(), 100);
                }
            }).catch(error => {
                console.error('Error in file click handler:', error);

                // Show user-friendly error message
                let errorMsg = 'Error loading file';
                if (error.message.includes('decode')) {
                    errorMsg = 'Unable to decode audio - file may be corrupted';
                } else if (error.message.includes('not exist')) {
                    errorMsg = 'File not found';
                }

                statusText.textContent = errorMsg;

                // Show alert for corrupted files
                if (error.message.includes('decode')) {
                    alert(`Cannot play this file:\n\n${filteredFiles[index].name}\n\nThe file appears to be corrupted or in an unsupported format.`);
                }
            });
        });

        fileBrowser.appendChild(fileItem);
    });
}

function renderGroupedFileList(filteredFiles, groupedFolders) {
    // Group filtered files by folder
    const filesByFolder = new Map();
    const mainFolderPath = fileManager.getCurrentFolder();

    filteredFiles.forEach(file => {
        const folderPath = window.require('path').dirname(file.path);
        if (!filesByFolder.has(folderPath)) {
            filesByFolder.set(folderPath, []);
        }
        filesByFolder.get(folderPath).push(file);
    });

    // Render each folder group
    groupedFolders.forEach(folder => {
        const folderFiles = filesByFolder.get(folder.path);
        if (!folderFiles || folderFiles.length === 0) return;

        const isMainFolder = folder.path === mainFolderPath;

        if (isMainFolder) {
            // Render files without folder header (flat list)
            folderFiles.forEach(file => {
                const index = audioFiles.indexOf(file);
                const fileItem = createFileItem(file, index, filteredFiles, false);
                fileBrowser.appendChild(fileItem);
            });
        } else {
            // Create folder header for subfolders
            const folderHeader = document.createElement('div');
            folderHeader.className = 'folder-header';
            folderHeader.innerHTML = `
                <svg class="folder-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                </svg>
                <span class="folder-name">${folder.name}</span>
                <span class="folder-count">${folderFiles.length} songs</span>
                <svg class="folder-toggle" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="6 9 12 15 18 9"/>
                </svg>
            `;

            // Create folder content container
            const folderContent = document.createElement('div');
            folderContent.className = 'folder-content';

            // Add files to folder
            folderFiles.forEach(file => {
                const index = audioFiles.indexOf(file);
                const fileItem = createFileItem(file, index, filteredFiles, true);
                folderContent.appendChild(fileItem);
            });

            // Toggle folder collapse
            folderHeader.addEventListener('click', () => {
                folderHeader.classList.toggle('collapsed');
                folderContent.classList.toggle('collapsed');
            });

            fileBrowser.appendChild(folderHeader);
            fileBrowser.appendChild(folderContent);
        }
    });
}

function createFileItem(file, index, filteredFiles, isInSubfolder = false) {
    const fileItem = document.createElement('div');
    fileItem.className = isInSubfolder ? 'file-item subfolder-item' : 'file-item';
    fileItem.dataset.index = index;

    // Create file item HTML with artist and title
    const iconSpan = document.createElement('span');
    iconSpan.className = 'file-icon';

    // Try to load album art for this file
    if (settings.albumArtBackground) {
        albumArtManager.extractAlbumArt(file.path).then(artUrl => {
            if (artUrl) {
                iconSpan.innerHTML = `<img src="${artUrl}" alt="Album art" style="width: 100%; height: 100%; object-fit: cover; border-radius: 3px;">`;
            } else {
                iconSpan.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>';
            }
        });
    } else {
        iconSpan.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>';
    }

    const contentDiv = document.createElement('div');
    contentDiv.className = 'file-content';

    // Create placeholder elements
    const titleDiv = document.createElement('div');
    titleDiv.className = 'file-title';
    titleDiv.textContent = parseFileName(file.name).title; // Temporary
    contentDiv.appendChild(titleDiv);

    const artistDiv = document.createElement('div');
    artistDiv.className = 'file-artist';
    artistDiv.style.display = 'none'; // Hide until we have data
    contentDiv.appendChild(artistDiv);

    fileItem.appendChild(iconSpan);
    fileItem.appendChild(contentDiv);

    // Load metadata asynchronously
    (async () => {
        // Check cache first
        let metadata = metadataCache.get(file.path);

        if (!metadata) {
            // Extract and cache metadata
            metadata = await ipcRenderer.invoke('extract-metadata', file.path);
            metadataCache.set(file.path, metadata);
        }

        // Use metadata if available, otherwise fall back to filename parsing
        const title = metadata.title || parseFileName(file.name).title;
        const artist = metadata.artist;
        const album = metadata.album;

        titleDiv.textContent = title;

        // Show artist and album if available
        if (artist || album) {
            if (artist && album) {
                artistDiv.textContent = `${artist} • ${album}`;
            } else if (artist) {
                artistDiv.textContent = artist;
            } else {
                artistDiv.textContent = album;
            }
            artistDiv.style.display = 'block';
        }
    })();

    fileItem.addEventListener('click', () => {
        console.log('File item clicked, index:', index, 'file:', filteredFiles[index]);
        const wasPlaying = isPlaying;
        loadAudioFile(index).then(() => {
            console.log('loadAudioFile completed successfully');
            // Auto-play if something was already playing
            if (wasPlaying) {
                setTimeout(() => playBtn.click(), 100);
            }
        }).catch(error => {
            console.error('Error in file click handler:', error);

            // Show user-friendly error message
            let errorMsg = 'Error loading file';
            if (error.message.includes('decode')) {
                errorMsg = 'Unable to decode audio - file may be corrupted';
            } else if (error.message.includes('not exist')) {
                errorMsg = 'File not found';
            }

            statusText.textContent = errorMsg;

            // Show alert for corrupted files
            if (error.message.includes('decode')) {
                alert(`Cannot play this file:\n\n${filteredFiles[index].name}\n\nThe file appears to be corrupted or in an unsupported format.`);
            }
        });
    });

    return fileItem;
}

// Search input handler
searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value;
    renderFileList();
    updateFileSelection();
});

// Load audio file - use AudioFileLoader if available
async function loadAudioFile(index) {
    console.log('[RENDERER] loadAudioFile called with index:', index);
    
    // Use new AudioFileLoader if available
    if (audioFileLoader) {
        console.log('[RENDERER] Using AudioFileLoader');
        return audioFileLoader.loadFile(index);
    }
    
    // Fallback to old implementation (should not be reached if loader is initialized)
    console.warn('[RENDERER] AudioFileLoader not available, using fallback implementation');
    console.log('audioFiles length:', audioFiles.length);
    console.log('fs available:', typeof fs !== 'undefined');
    console.log('audioContext available:', typeof audioContext !== 'undefined');

    if (index < 0 || index >= audioFiles.length) {
        console.error('Invalid index:', index, 'audioFiles.length:', audioFiles.length);
        const error = new Error(`Invalid file index: ${index} (available: 0-${audioFiles.length - 1})`);
        if (statusText) statusText.textContent = 'Error: Invalid file index';
        throw error;
    }

    // Check if fs is available
    if (typeof fs === 'undefined') {
        console.error('fs module not available');
        if (statusText) statusText.textContent = 'Error: File system not available';
        throw new Error('File system module not available');
    }

    // Check if audioContext is available
    if (typeof audioContext === 'undefined') {
        console.error('audioContext not available');
        if (statusText) statusText.textContent = 'Error: Audio context not available';
        throw new Error('Audio context not available');
    }

    // Stop current playback if any
    if (audioSource && isPlaying) {
        manualStop = true; // Set flag before stopping
        try {
            audioSource.stop();
        } catch (e) {
            console.warn('Error stopping audio source:', e);
        }
        isPlaying = false;
    syncStateToWindow();
    }

    currentFileIndex = index;
    syncStateToWindow();
    const file = audioFiles[index];

    if (!file || !file.path) {
        console.error('Invalid file object:', file);
        if (statusText) statusText.textContent = 'Error: Invalid file';
        throw new Error('Invalid file object');
    }

    updateStatusWithPerf('Loading');
    console.log('Loading file:', file.name, 'from path:', file.path);

    try {
        // Check if file exists
        if (!fs.existsSync(file.path)) {
            throw new Error('File does not exist: ' + file.path);
        }

        console.log('Reading file...');
        // Read file
        const buffer = fs.readFileSync(file.path);
        console.log('File read successfully, size:', buffer.length, 'bytes');

        // Warn about suspiciously small files (likely corrupted)
        if (buffer.length < 500000) { // Less than 500KB
            console.warn('Warning: File is very small (' + buffer.length + ' bytes), may be corrupted');
        }

        const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
        console.log('ArrayBuffer created, byteLength:', arrayBuffer.byteLength);

        // Decode audio data
        console.log('Decoding audio data...');
        audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        console.log('Audio loaded successfully:', audioBuffer.duration, 'seconds');

        statusText.textContent = `${file.name} (${audioBuffer.duration.toFixed(1)}s)`;
        playBtn.disabled = false;
        pauseBtn.disabled = true;

        // Reset time display
        durationEl.textContent = formatTime(audioBuffer.duration);
        currentTimeEl.textContent = '0:00';
        progressFill.style.width = '0%';
        progressHandle.style.left = '0%';
        pauseTime = 0;

        // Reset and analyze BPM
        bpmDetector.reset();
        updateBPMDisplay();
        analyzeBPM(audioBuffer); // Async analysis in background

        // Reset and analyze Key
        keyDetector.reset();
        updateKeyDisplay();
        analyzeKey(audioBuffer); // Async analysis in background

        // Update now playing display with album art
        updateNowPlaying(file.name, file.path);

        // Album art is now shown in file list icons

        // Update UI
        updateFileSelection();
        updateDiscordPresence();

    } catch (error) {
        console.error('Error loading audio:', error);
        statusText.textContent = 'Error loading file: ' + error.message;
        playBtn.disabled = true;
        pauseBtn.disabled = true;
        throw error; // Re-throw so the promise chain knows it failed
    }
}

// Export loadAudioFile to window now that it's defined
// This MUST happen for the app to work - replace the placeholder
console.log('[RENDERER] Attempting to export loadAudioFile...');
console.log('[RENDERER] loadAudioFile type:', typeof loadAudioFile);
if (typeof loadAudioFile === 'function') {
    const wasPlaceholder = window.loadAudioFile && window.loadAudioFile.toString().includes('called before initialization');
    window.loadAudioFile = loadAudioFile;
    console.log('✓ window.loadAudioFile exported (replaced placeholder):', typeof window.loadAudioFile === 'function');
    console.log('  - Was placeholder:', wasPlaceholder);
} else {
    console.error('✗ loadAudioFile is not a function! Type:', typeof loadAudioFile);
    // Keep placeholder if real function failed
    if (!window.loadAudioFile || window.loadAudioFile.toString().includes('called before initialization')) {
        console.warn('Keeping placeholder loadAudioFile');
    }
}

// Update file selection UI
function updateFileSelection() {
    const fileItems = fileBrowser.querySelectorAll('.file-item');
    fileItems.forEach((item) => {
        item.classList.remove('selected', 'playing');
        const itemIndex = parseInt(item.dataset.index);
        if (itemIndex === currentFileIndex) {
            item.classList.add(isPlaying ? 'playing' : 'selected');
        }
    });
}

// Play button handler
if (playBtn) {
playBtn.addEventListener('click', () => {
    // If an external media element is connected (YouTube)
    if (window.audioManager && window.audioManager.externalAudio) {
        window.audioManager.externalAudio.play().catch(err => {
            console.warn('Failed to play external audio:', err);
        });
        return;
    }

    if (!audioBuffer) return;

    // Resume audio context if suspended
    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }

    // Stop current source if playing
    if (audioSource) {
        audioSource.stop();
    }

    // Create new source node
    audioSource = audioContext.createBufferSource();
    audioSource.buffer = audioBuffer;
    audioSource.playbackRate.value = playbackRate;

    // Connect main visualizer: source → dbGainNode → analyser → gainNode → destination
    // dbGainNode affects visualizer intensity, gainNode affects output volume
    audioSource.connect(dbGainNode);
    dbGainNode.connect(analyser);
    analyser.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Connect volume history: dbGainNode → volumeHistoryAnalyser (also affected by dB gain)
    // Share the same dbGainNode output for volume history
    dbGainNode.connect(volumeHistoryAnalyser);
    // volumeHistoryAnalyser doesn't need to connect to destination, it's just for analysis

    console.log('Audio graph connected: main visualizer (source → dbGainNode → analyser → gainNode → destination), volume history (dbGainNode → volumeHistoryAnalyser)');

    // Start volume history visualizer with its own analyser
    volumeHistoryVisualizer.updateAnalyser(volumeHistoryAnalyser);
    volumeHistoryVisualizer.start();

    // Handle when audio ends
    audioSource.onended = () => {
        // Check if this was a manual stop (pause/load new file)
        if (manualStop) {
            manualStop = false; // Reset flag
            return; // Don't auto-play next track
        }

        // Natural end of song
        if (repeatMode === 'one') {
            // Repeat current song
            loadAudioFile(currentFileIndex).then(() => {
                setTimeout(() => playBtn.click(), 100);
            });
        } else if (repeatMode === 'all' || (currentFileIndex < audioFiles.length - 1) || shuffleMode) {
            // Play next track
            playNextTrack();
        } else {
            // End of playlist
            isPlaying = false;
    syncStateToWindow();
            statusText.textContent = 'Playback ended';
            playBtn.disabled = false;
            pauseBtn.disabled = true;
            updateFileSelection();
            progressFill.style.width = '0%';
            progressHandle.style.left = '0%';
            currentTimeEl.textContent = '0:00';
            console.log('Playback ended');
        }
    };

    // Start playback from pause position or beginning
    const offset = pauseTime || 0;
    audioSource.start(0, offset);
    startTime = audioContext.currentTime - offset;
    pauseTime = 0;

    isPlaying = true;
    syncStateToWindow();
    updateStatusWithPerf('Playing');
    playBtn.disabled = true;
    pauseBtn.disabled = false;
    console.log('Playback started');

    // Update file selection UI
    updateFileSelection();

    // Update Discord presence
    updateDiscordPresence();

    // Start visualization (animation loop runs continuously)
    // Note: animate() is called here, but it's defined later in the file
    // This will work because function declarations are hoisted
    if (typeof animate === 'function') {
        animate();
    } else {
        console.warn('animate() not yet defined, will be called when available');
    }
});
}

// Pause button handler
if (pauseBtn) {
pauseBtn.addEventListener('click', () => {
    if (window.audioManager && window.audioManager.externalAudio) {
        window.audioManager.externalAudio.pause();
        return;
    }

    if (audioSource && isPlaying) {
        manualStop = true; // Set flag before stopping
        audioSource.stop();
        pauseTime = audioContext.currentTime - startTime;
        isPlaying = false;
    syncStateToWindow();
        updateStatusWithPerf('Paused');
        playBtn.disabled = false;
        pauseBtn.disabled = true;
        updateFileSelection();
        updateDiscordPresence();
        console.log('Playback paused at', pauseTime);
    }
});
}

// ===== VISUALIZER ARCHITECTURE =====
console.log('Reached VISUALIZER ARCHITECTURE section, about to define Visualizer base class...');

// Base Visualizer class
class Visualizer {
    constructor(name) {
        this.name = name;
        this.settings = {};
    }

    init(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
    }

    update(timeDomainData, frequencyData) {
        // Override in subclasses
    }

    draw() {
        // Override in subclasses
    }

    // Return custom settings for this visualizer
    getCustomSettings() {
        return []; // Override in subclasses to return array of setting definitions
    }

    // Update visualizer-specific setting
    updateSetting(key, value) {
        this.settings[key] = value;
    }
}

// Waveform Visualizer
console.log('Reached end of file browser code, about to create VisualizerManager instance...');
console.log('VisualizerManager class available:', typeof VisualizerManager !== 'undefined' ? '✓' : '✗');

// Create visualizer manager and register visualizers
try {
    if (typeof VisualizerManager === 'undefined') {
        throw new Error('VisualizerManager class is not defined. Import may have failed.');
    }
    const visualizerManager = new VisualizerManager();
    window.visualizerManager = visualizerManager; // Export to window for Vue components
    console.log('✓ window.visualizerManager exported:', !!window.visualizerManager);
    
    visualizerManager.register(new SpectraVisualizer());
    visualizerManager.register(new WaveformVisualizer());
    visualizerManager.register(new FrequencyBarsVisualizer());
    visualizerManager.register(new CircularVisualizer());
    visualizerManager.register(new ParticleVisualizer());
    visualizerManager.register(new SpectrumVisualizer());
    visualizerManager.register(new RadialBarsVisualizer());
    visualizerManager.register(new WaveRingsVisualizer());
    visualizerManager.register(new OscilloscopeVisualizer());
    visualizerManager.register(new KaleidoscopeVisualizer());
    visualizerManager.register(new DnaHelixVisualizer());
    visualizerManager.register(new StarfieldVisualizer());
    visualizerManager.register(new TunnelVisualizer());
    visualizerManager.register(new FireworksVisualizer());
    visualizerManager.register(new PlasmaVisualizer());
    visualizerManager.register(new MatrixVisualizer());
    visualizerManager.register(new NebulaVisualizer());
    visualizerManager.register(new EqualizerVisualizer());
    visualizerManager.register(new VortexVisualizer());
    visualizerManager.register(new AmethystSpectrumVisualizer());
    
    // Initialize all visualizers with canvas context (if canvas exists)
    // Note: Canvas is now managed by Vue component, so this might be null initially
    if (canvas && ctx) {
        visualizerManager.visualizers.forEach(viz => {
            try {
                viz.init(canvas, ctx);
            } catch (e) {
                console.warn('Failed to initialize visualizer:', viz.name, e);
            }
        });
    } else {
        console.log('Canvas not available yet - visualizers will be initialized by Vue component');
    }

    visualizerManager.setActive('Spectra');
    
    // Populate visualizer dropdown now that they're registered
    try {
        populateVisualizerSelect();
    } catch (e) {
        console.warn('populateVisualizerSelect failed (expected if DOM not ready):', e);
    }
} catch (e) {
    console.error('Error initializing VisualizerManager:', e);
    console.error('Error stack:', e.stack);
    // Try to create a minimal visualizerManager as fallback
    try {
        // Fallback: define inline if import failed
        if (typeof VisualizerManager === 'undefined') {
            console.warn('VisualizerManager import failed, using fallback definition');
            class VisualizerManager {
                constructor() {
                    this.visualizers = new Map();
                    this.currentVisualizer = null;
                }
                register(visualizer) {
                    this.visualizers.set(visualizer.name, visualizer);
                    console.log(`Registered visualizer: ${visualizer.name}`);
                }
                setActive(name) {
                    const visualizer = this.visualizers.get(name);
                    if (visualizer) {
                        this.currentVisualizer = visualizer;
                        console.log(`Active visualizer: ${name}`);
                        return true;
                    }
                    return false;
                }
                update(timeDomainData, frequencyData) {
                    if (this.currentVisualizer) {
                        this.currentVisualizer.update(timeDomainData, frequencyData);
                    }
                }
                draw() {
                    if (this.currentVisualizer) {
                        this.currentVisualizer.draw();
                    }
                }
                getCurrent() {
                    return this.currentVisualizer;
                }
                getCurrentName() {
                    return this.currentVisualizer ? this.currentVisualizer.name : null;
                }
                get(name) {
                    return this.visualizers.get(name);
                }
                getVisualizerNames() {
                    return Array.from(this.visualizers.keys());
                }
            }
            const visualizerManager = new VisualizerManager();
            window.visualizerManager = visualizerManager;
            console.log('✓ Fallback VisualizerManager created');
        } else {
            // Import succeeded but instantiation failed
            window.visualizerManager = null;
        }
    } catch (fallbackError) {
        console.error('Failed to create fallback VisualizerManager:', fallbackError);
        window.visualizerManager = null;
    }
}

// Final confirmation that all globals are set
console.log('✓ renderer.js initialization complete');
console.log('  - window.audioContext:', !!window.audioContext);
console.log('  - window.analyser:', !!window.analyser);
console.log('  - window.visualizerManager:', !!window.visualizerManager);
console.log('  - window.audioManager:', !!window.audioManager);
console.log('  - window.loadAudioFile:', typeof window.loadAudioFile === 'function');

// Main animation loop
console.log('Defining animate function...');
function animate() {
    requestAnimationFrame(animate);

    // Apply FPS cap if set
    if (fpsCap !== null) {
        const now = performance.now();
        const frameInterval = 1000 / fpsCap; // milliseconds per frame
        const elapsed = now - fpsCapLastFrameTime;

        if (elapsed < frameInterval) {
            // Skip this frame to maintain FPS cap
            return;
        }

        fpsCapLastFrameTime = now - (elapsed % frameInterval); // Maintain consistent timing
    }

    // Count frame for FPS calculation
    countFrame();

    // Get audio data
    analyser.getByteTimeDomainData(timeDomainData);
    analyser.getByteFrequencyData(frequencyData);

    // Detect beats
    const isBeat = detectBeat(frequencyData);

    // Apply beat flash effect to canvas
    if (settings.beatDetection && beatValue > 0.1) {
        const flashIntensity = beatValue * settings.beatFlashIntensity;
        canvas.style.filter = `brightness(${1 + flashIntensity})`;
    } else {
        canvas.style.filter = 'brightness(1)';
    }

    // Update and draw current visualizer
    visualizerManager.update(timeDomainData, frequencyData);
    visualizerManager.draw();

    // Update progress bar
    updateProgress();
}

// Removed microphone and desktop audio features - focus on file playback

// Visualizer selector handler
visualizerSelect.addEventListener('change', (event) => {
    const selectedName = event.target.value;
    if (visualizerManager.setActive(selectedName)) {
        console.log(`Switched to ${selectedName} visualizer`);
        updateCustomSettings();
        updateDiscordPresence();
    }
});

// Preset buttons (setup after visualizerManager is created)
const savePresetBtn = document.getElementById('savePresetBtnPanel');
const loadPresetBtn = document.getElementById('loadPresetBtnPanel');

if (savePresetBtn) {
    savePresetBtn.addEventListener('click', async () => {
        const visualizer = visualizerManager.getCurrent();
        if (!visualizer) {
            showNotification('No visualizer active', 'error');
            return;
        }

        const visualizerSettings = visualizer.settings || {};
        const presetName = presetManager.generatePresetName(visualizer.name);

        const preset = presetManager.createPreset(visualizer.name, visualizerSettings, settings);
        const result = await presetManager.exportPreset(preset, presetName);

        if (result.success) {
            showNotification('Preset saved successfully!', 'success');
        } else {
            showNotification('Failed to save preset: ' + result.error, 'error');
        }
    });
}

if (loadPresetBtn) {
    loadPresetBtn.addEventListener('click', async () => {
        const result = await presetManager.importPreset();

        if (result.success) {
            // Apply the preset
            const applyResult = presetManager.applyPreset(
                result.preset,
                {
                    getCurrentVisualizerName: () => {
                        const viz = visualizerManager.getCurrent();
                        return viz ? viz.name : null;
                    },
                    getCurrentVisualizer: () => visualizerManager.getCurrent(),
                    switchVisualizer: (name) => {
                        if (visualizerManager.setActive(name)) {
                            // Update dropdown to match
                            if (visualizerSelect) {
                                visualizerSelect.value = name;
                            }
                            updateCustomSettings();
                        }
                    }
                },
                {
                    set: (key, value) => {
                        settings[key] = value;
                        saveSettings();
                    }
                }
            );

            if (applyResult.success) {
                // Reload UI to reflect changes
                loadSettings();
                updateCustomSettings();
                showNotification('Preset loaded successfully!', 'success');
            } else {
                showNotification('Failed to apply preset: ' + applyResult.error, 'error');
            }
        } else if (result.error !== 'Load cancelled') {
            showNotification('Failed to load preset: ' + result.error, 'error');
        }
    });
}

// Update custom settings panel for current visualizer
function updateCustomSettings() {
    // Update both modal and tweaks panel
    updateModalCustomSettings();
    updateTweaksPanel();
}

function updateModalCustomSettings() {
    const customSettingsContainer = document.getElementById('customSettings');
    const customSettingsSection = document.getElementById('customSettingsSection');
    const visualizerCategoryBtn = document.getElementById('visualizerCategoryBtn');

    if (!customSettingsContainer) return;

    const visualizer = visualizerManager.currentVisualizer;
    if (!visualizer) {
        if (visualizerCategoryBtn) visualizerCategoryBtn.style.display = 'none';
        if (customSettingsSection) customSettingsSection.style.display = 'none';
        return;
    }

    const customSettings = visualizer.getCustomSettings();

    if (customSettings.length === 0) {
        customSettingsContainer.innerHTML = '';
        customSettingsContainer.style.display = 'none';
        if (visualizerCategoryBtn) visualizerCategoryBtn.style.display = 'none';
        if (customSettingsSection) customSettingsSection.style.display = 'none';
        return;
    }

    // Show visualizer category button
    if (visualizerCategoryBtn) visualizerCategoryBtn.style.display = 'block';
    if (customSettingsSection) customSettingsSection.style.display = 'block';

    customSettingsContainer.style.display = 'flex';
    customSettingsContainer.innerHTML = '';

    customSettings.forEach(setting => {
        const settingItem = document.createElement('div');
        settingItem.className = 'setting-item';

        if (setting.type === 'range') {
            const label = document.createElement('label');
            label.innerHTML = `${setting.label}: <span id="${setting.key}Value">${setting.value}</span>`;

            const input = document.createElement('input');
            input.type = 'range';
            input.min = setting.min;
            input.max = setting.max;
            input.value = setting.value;
            input.addEventListener('input', (e) => {
                visualizer.updateSetting(setting.key, parseFloat(e.target.value));
                document.getElementById(`${setting.key}Value`).textContent = e.target.value;
            });

            settingItem.appendChild(label);
            settingItem.appendChild(input);
        } else if (setting.type === 'select') {
            const label = document.createElement('label');
            label.textContent = setting.label + ':';

            const select = document.createElement('select');
            select.id = `modal${setting.key}Select`;
            setting.options.forEach(opt => {
                const option = document.createElement('option');
                option.value = opt;
                option.textContent = opt.charAt(0).toUpperCase() + opt.slice(1);
                if (opt === setting.value) option.selected = true;
                select.appendChild(option);
            });
            select.addEventListener('change', (e) => {
                visualizer.updateSetting(setting.key, e.target.value);
            });

            settingItem.appendChild(label);
            settingItem.appendChild(select);

            // Create custom select after appending to DOM
            setTimeout(() => {
                createCustomSelect(select);
            }, 0);
        } else if (setting.type === 'checkbox') {
            const label = document.createElement('label');
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.checked = setting.value;
            checkbox.addEventListener('change', (e) => {
                visualizer.updateSetting(setting.key, e.target.checked);
            });
            label.appendChild(checkbox);
            label.appendChild(document.createTextNode(' ' + setting.label));
            settingItem.appendChild(label);
        }

        customSettingsContainer.appendChild(settingItem);
    });
}

// Populate visualizer dropdown
function populateVisualizerSelect() {
    const names = visualizerManager.getVisualizerNames();
    visualizerSelect.innerHTML = '';
    names.forEach(name => {
        const option = document.createElement('option');
        option.value = name;
        option.textContent = name;
        visualizerSelect.appendChild(option);
    });

    // Initialize custom select
    initCustomVisualizerSelect();
}

// Generic function to create custom select
function createCustomSelect(selectElement) {
    // Check if custom select already exists
    if (selectElement.nextElementSibling && selectElement.nextElementSibling.classList.contains('custom-select')) {
        return; // Already has a custom select, don't create another one
    }
    
    // Create custom select wrapper
    const customSelect = document.createElement('div');
    customSelect.className = 'custom-select';

    // Check if this select should open upwards
    if (selectElement.classList.contains('dropdown-up')) {
        customSelect.classList.add('dropdown-up');
    }

    // Create trigger
    const trigger = document.createElement('div');
    trigger.className = 'custom-select-trigger';
    trigger.textContent = selectElement.options[selectElement.selectedIndex]?.text || selectElement.value;

    // Create options container
    const optionsContainer = document.createElement('div');
    optionsContainer.className = 'custom-select-options';

    // Populate options
    Array.from(selectElement.options).forEach((option, index) => {
        const customOption = document.createElement('div');
        customOption.className = 'custom-select-option';
        customOption.textContent = option.text;
        customOption.dataset.value = option.value;

        if (option.selected) {
            customOption.classList.add('selected');
        }

        // Click handler
        customOption.addEventListener('click', () => {
            // Update native select
            selectElement.selectedIndex = index;
            selectElement.dispatchEvent(new Event('change'));

            // Update trigger
            trigger.textContent = option.text;

            // Update selected class
            optionsContainer.querySelectorAll('.custom-select-option').forEach(opt => {
                opt.classList.remove('selected');
            });
            customOption.classList.add('selected');

            // Close dropdown
            customSelect.classList.remove('open');
        });

        optionsContainer.appendChild(customOption);
    });

    // Toggle dropdown
    trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        customSelect.classList.toggle('open');
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
        if (!customSelect.contains(e.target)) {
            customSelect.classList.remove('open');
        }
    });

    // Assemble
    customSelect.appendChild(trigger);
    customSelect.appendChild(optionsContainer);

    // Insert after native select
    selectElement.parentNode.insertBefore(customSelect, selectElement.nextSibling);
}

// Initialize custom visualizer select
function initCustomVisualizerSelect() {
    createCustomSelect(visualizerSelect);
}

// Export createCustomSelect to window for Vue components
window.createCustomSelect = createCustomSelect;

// Settings panel toggle
if (settingsToggle) {
    settingsToggle.addEventListener('click', () => {
        console.log('Settings button clicked');
        settingsPanel.classList.toggle('hidden');
        if (!settingsPanel.classList.contains('hidden')) {
            updateCustomSettings();
        }
    });
    console.log('Settings button handler attached');
} else {
    console.error('Settings button not found!');
}

// Color theme definitions
const colorThemes = {
    green: {
        primary: '#00ff88',
        primaryHover: '#00dd77',
        primaryDark: '#00cc6a',
        primaryLight: '#33ffaa',
        primaryRgb: '0, 255, 136'
    },
    blue: {
        primary: '#0088ff',
        primaryHover: '#0066dd',
        primaryDark: '#0055cc',
        primaryLight: '#33aaff',
        primaryRgb: '0, 136, 255'
    },
    purple: {
        primary: '#aa00ff',
        primaryHover: '#8800dd',
        primaryDark: '#7700cc',
        primaryLight: '#cc33ff',
        primaryRgb: '170, 0, 255'
    },
    red: {
        primary: '#ff4444',
        primaryHover: '#dd2222',
        primaryDark: '#cc1111',
        primaryLight: '#ff6666',
        primaryRgb: '255, 68, 68'
    },
    orange: {
        primary: '#ff8800',
        primaryHover: '#dd6600',
        primaryDark: '#cc5500',
        primaryLight: '#ffaa33',
        primaryRgb: '255, 136, 0'
    },
    cyan: {
        primary: '#00ffff',
        primaryHover: '#00dddd',
        primaryDark: '#00cccc',
        primaryLight: '#33ffff',
        primaryRgb: '0, 255, 255'
    },
    pink: {
        primary: '#ff00aa',
        primaryHover: '#dd0088',
        primaryDark: '#cc0077',
        primaryLight: '#ff33cc',
        primaryRgb: '255, 0, 170'
    },
    yellow: {
        primary: '#ffff00',
        primaryHover: '#dddd00',
        primaryDark: '#cccc00',
        primaryLight: '#ffff33',
        primaryRgb: '255, 255, 0'
    }
};

// Apply theme to CSS variables
function applyTheme(themeName) {
    const theme = colorThemes[themeName];
    if (!theme) return;

    document.documentElement.style.setProperty('--theme-primary', theme.primary);
    document.documentElement.style.setProperty('--theme-primary-hover', theme.primaryHover);
    document.documentElement.style.setProperty('--theme-primary-dark', theme.primaryDark);
    document.documentElement.style.setProperty('--theme-primary-light', theme.primaryLight);
    document.documentElement.style.setProperty('--theme-primary-rgb', theme.primaryRgb);

    // Also update settings.primaryColor for visualizers
    settings.primaryColor = theme.primary;
    saveSettings();
}

// Color theme selector
const colorThemeSelect = document.getElementById('colorTheme');
const customColorContainer = document.getElementById('customColorContainer');
// primaryColorInput is already declared above (line 413)

if (colorThemeSelect) {
    // Load saved theme
    const savedTheme = localStorage.getItem('colorTheme') || 'green';
    colorThemeSelect.value = savedTheme;
    applyTheme(savedTheme);

    // Show custom color picker if custom theme is selected
    if (savedTheme === 'custom') {
        customColorContainer.style.display = 'block';
        const savedCustomColor = localStorage.getItem('customPrimaryColor') || '#00ff88';
        if (primaryColorInput) {
            primaryColorInput.value = savedCustomColor;
            applyCustomColor(savedCustomColor);
        }
    }

    colorThemeSelect.addEventListener('change', (e) => {
        const themeName = e.target.value;
        localStorage.setItem('colorTheme', themeName);

        if (themeName === 'custom') {
            customColorContainer.style.display = 'block';
            const savedCustomColor = localStorage.getItem('customPrimaryColor') || settings.primaryColor || '#00ff88';
            if (primaryColorInput) {
                primaryColorInput.value = savedCustomColor;
                applyCustomColor(savedCustomColor);
            }
        } else {
            customColorContainer.style.display = 'none';
            applyTheme(themeName);
        }
        
        // Update custom select trigger text if it exists (don't create a new one)
        const customSelect = colorThemeSelect.nextElementSibling;
        if (customSelect && customSelect.classList.contains('custom-select')) {
            const trigger = customSelect.querySelector('.custom-select-trigger');
            if (trigger) {
                trigger.textContent = colorThemeSelect.options[colorThemeSelect.selectedIndex]?.text || colorThemeSelect.value;
            }
        }
    });

    // Initialize custom select (only if it doesn't exist)
    createCustomSelect(colorThemeSelect);
}

// Apply custom color
function applyCustomColor(color) {
    // Calculate hover/dark/light variants
    const rgb = hexToRgb(color);
    if (!rgb) return;

    const hover = rgbToHex(Math.max(0, rgb.r - 34), Math.max(0, rgb.g - 34), Math.max(0, rgb.b - 34));
    const dark = rgbToHex(Math.max(0, rgb.r - 51), Math.max(0, rgb.g - 51), Math.max(0, rgb.b - 51));
    const light = rgbToHex(Math.min(255, rgb.r + 51), Math.min(255, rgb.g + 51), Math.min(255, rgb.b + 51));

    document.documentElement.style.setProperty('--theme-primary', color);
    document.documentElement.style.setProperty('--theme-primary-hover', hover);
    document.documentElement.style.setProperty('--theme-primary-dark', dark);
    document.documentElement.style.setProperty('--theme-primary-light', light);
    document.documentElement.style.setProperty('--theme-primary-rgb', `${rgb.r}, ${rgb.g}, ${rgb.b}`);

    settings.primaryColor = color;
    saveSettings();
    localStorage.setItem('customPrimaryColor', color);
}

// Helper functions for color conversion
function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

function rgbToHex(r, g, b) {
    return "#" + [r, g, b].map(x => {
        const hex = Math.round(x).toString(16);
        return hex.length === 1 ? "0" + hex : hex;
    }).join("");
}

// Settings handlers
if (primaryColorInput) {
    primaryColorInput.addEventListener('input', (e) => {
        const color = e.target.value;
        document.getElementById('colorValue').textContent = color;
        applyCustomColor(color);
    });
}

lineWidthInput.addEventListener('input', (e) => {
    settings.lineWidth = parseInt(e.target.value);
    document.getElementById('lineWidthValue').textContent = e.target.value;
    saveSettings();
});

smoothingInput.addEventListener('input', (e) => {
    const value = parseInt(e.target.value) / 100;
    settings.smoothing = value;
    analyser.smoothingTimeConstant = value;
    document.getElementById('smoothingValue').textContent = value.toFixed(2);
    saveSettings();
});

sensitivityInput.addEventListener('input', (e) => {
    settings.sensitivity = parseInt(e.target.value) / 100;
    document.getElementById('sensitivityValue').textContent = settings.sensitivity.toFixed(2);
    saveSettings();
});

bgColorInput.addEventListener('input', (e) => {
    settings.bgColor = e.target.value;
    document.getElementById('bgColorValue').textContent = e.target.value;
    saveSettings();
});

mirrorEffectInput.addEventListener('change', (e) => {
    settings.mirrorEffect = e.target.checked;
    saveSettings();
});

// GPU Acceleration setting
const gpuAccelerationInput = document.getElementById('gpuAcceleration');
if (gpuAccelerationInput) {
    gpuAccelerationInput.addEventListener('change', (e) => {
        settings.gpuAcceleration = e.target.checked;
        applyGPUAcceleration(e.target.checked);
        saveSettings();
    });
}

// FPS Cap setting
const fpsCapSelect = document.getElementById('fpsCap');
if (fpsCapSelect) {
    // Load saved FPS cap
    const savedFpsCap = localStorage.getItem('fpsCap') || 'unlimited';
    fpsCapSelect.value = savedFpsCap;
    updateFpsCap(savedFpsCap);

    fpsCapSelect.addEventListener('change', (e) => {
        const value = e.target.value;
        updateFpsCap(value);
        localStorage.setItem('fpsCap', value);

        // Update custom select trigger text
        const customSelect = fpsCapSelect.nextElementSibling;
        if (customSelect && customSelect.classList.contains('custom-select')) {
            const trigger = customSelect.querySelector('.custom-select-trigger');
            if (trigger) {
                trigger.textContent = fpsCapSelect.options[fpsCapSelect.selectedIndex]?.text || fpsCapSelect.value;
            }
        }
    });

    // Initialize custom select
    createCustomSelect(fpsCapSelect);
}

function updateFpsCap(value) {
    if (value === 'unlimited') {
        fpsCap = null;
        fpsCapLastFrameTime = 0; // Reset timing
    } else {
        fpsCap = parseInt(value);
        fpsCapLastFrameTime = performance.now(); // Reset timing when changing cap
    }
    console.log('FPS Cap set to:', fpsCap === null ? 'Unlimited' : `${fpsCap} FPS`);
}

// Open DevTools on Startup setting
const openDevToolsOnStartupInput = document.getElementById('openDevToolsOnStartup');
if (openDevToolsOnStartupInput) {
    openDevToolsOnStartupInput.addEventListener('change', (e) => {
        settings.openDevToolsOnStartup = e.target.checked;
        saveSettings();
        // Show notification that restart is required
        showNotification('Restart app to apply DevTools setting', 'info');
    });
}

// Album Art settings
const albumArtBackgroundInput = document.getElementById('albumArtBackground');

if (albumArtBackgroundInput) {
    albumArtBackgroundInput.addEventListener('change', (e) => {
        settings.albumArtBackground = e.target.checked;
        // Re-render file list to show/hide album art
        renderFileList();
        saveSettings();
    });
}

// Beat detection settings
const beatDetectionInput = document.getElementById('beatDetection');
const beatFlashInput = document.getElementById('beatFlash');
const beatDurationInput = document.getElementById('beatDuration');

beatDetectionInput.addEventListener('change', (e) => {
    settings.beatDetection = e.target.checked;
    saveSettings();
});

beatFlashInput.addEventListener('input', (e) => {
    settings.beatFlashIntensity = parseFloat(e.target.value);
    document.getElementById('beatFlashValue').textContent = e.target.value;
    saveSettings();
});

beatDurationInput.addEventListener('input', (e) => {
    settings.beatFlashDuration = parseFloat(e.target.value);
    document.getElementById('beatDurationValue').textContent = e.target.value;
    saveSettings();
});

// Camelot notation toggle
const useCamelotNotationInput = document.getElementById('useCamelotNotation');
if (useCamelotNotationInput) {
    useCamelotNotationInput.addEventListener('change', (e) => {
        settings.useCamelotNotation = e.target.checked;
        saveSettings();
        updateKeyDisplay(); // Refresh display immediately
    });
}

// Apply or remove GPU acceleration
function applyGPUAcceleration(enabled) {
    if (enabled) {
        canvas.style.transform = 'translateZ(0) scale(1)';
        canvas.style.willChange = 'transform, contents';
        canvas.style.backfaceVisibility = 'hidden';
        canvas.style.webkitBackfaceVisibility = 'hidden';
        canvas.style.imageRendering = 'auto';
        canvas.style.webkitTransform = 'translateZ(0)';
        // Force hardware acceleration
        canvas.style.perspective = '1000px';
    } else {
        canvas.style.transform = '';
        canvas.style.willChange = '';
        canvas.style.backfaceVisibility = '';
        canvas.style.webkitBackfaceVisibility = '';
        canvas.style.imageRendering = '';
        canvas.style.webkitTransform = '';
        canvas.style.perspective = '';
    }
    console.log('GPU Acceleration:', enabled ? 'enabled' : 'disabled');
}

// Save settings to localStorage
function saveSettings() {
    localStorage.setItem('audioVisualizerSettings', JSON.stringify(settings));
    console.log('Settings saved:', settings);
}

// Load settings from localStorage
function loadSettings() {
    const saved = localStorage.getItem('audioVisualizerSettings');
    if (saved) {
        const loaded = JSON.parse(saved);
        Object.assign(settings, loaded);
    }

    // Update UI - only if custom color is selected
    const savedTheme = localStorage.getItem('colorTheme') || 'green';
    if (savedTheme === 'custom' && primaryColorInput) {
        primaryColorInput.value = settings.primaryColor;
        document.getElementById('colorValue').textContent = settings.primaryColor;
    }

    lineWidthInput.value = settings.lineWidth;
    document.getElementById('lineWidthValue').textContent = settings.lineWidth;

    smoothingInput.value = settings.smoothing * 100;
    document.getElementById('smoothingValue').textContent = settings.smoothing.toFixed(2);
    analyser.smoothingTimeConstant = settings.smoothing;

    sensitivityInput.value = settings.sensitivity * 100;
    document.getElementById('sensitivityValue').textContent = settings.sensitivity.toFixed(2);

    bgColorInput.value = settings.bgColor;
    document.getElementById('bgColorValue').textContent = settings.bgColor;

    mirrorEffectInput.checked = settings.mirrorEffect;

    // GPU Acceleration setting
    if (gpuAccelerationInput) {
        const gpuEnabled = settings.gpuAcceleration !== false;
        gpuAccelerationInput.checked = gpuEnabled;
        applyGPUAcceleration(gpuEnabled);
    }

    // Album Art settings
    if (albumArtBackgroundInput) {
        albumArtBackgroundInput.checked = settings.albumArtBackground !== false;
    }

    // Beat detection settings
    if (beatDetectionInput) {
        beatDetectionInput.checked = settings.beatDetection !== false;
        beatFlashInput.value = settings.beatFlashIntensity || 0.3;
        document.getElementById('beatFlashValue').textContent = (settings.beatFlashIntensity || 0.3).toFixed(2);
        beatDurationInput.value = settings.beatFlashDuration || 0.92;
        document.getElementById('beatDurationValue').textContent = (settings.beatFlashDuration || 0.92).toFixed(2);
    }

    // Camelot notation setting
    if (useCamelotNotationInput) {
        useCamelotNotationInput.checked = settings.useCamelotNotation !== false; // Default to true
    }

    // Dev tools setting
    if (openDevToolsOnStartupInput) {
        openDevToolsOnStartupInput.checked = settings.openDevToolsOnStartup === true;
    }

    console.log('Settings loaded:', settings);
}

loadSettings();

// Apply GPU acceleration on startup (even if setting doesn't exist yet)
applyGPUAcceleration(settings.gpuAcceleration !== false);

// Start performance monitoring
startPerformanceMonitoring();

// Load last opened folder on startup (deferred to improve startup time)
setTimeout(() => {
    const lastFolder = localStorage.getItem('lastOpenedFolder');
    if (lastFolder && fs.existsSync(lastFolder)) {
        console.log('Loading last opened folder:', lastFolder);
        const result = fileManager.loadFolder(lastFolder);
        if (result.success) {
            audioFiles = result.files;
            syncAudioFilesToLoader();
            currentFolder = lastFolder;
            updateFolderPath(lastFolder);
            renderFileList();
            fileCount.textContent = `${result.count} song${result.count !== 1 ? 's' : ''}`;
            prevBtn.disabled = result.count === 0;
            nextBtn.disabled = result.count === 0;
        }
    }
}, 100);

// Initialize Discord presence
setTimeout(() => {
    updateDiscordPresence();
}, 1000);

// ===== KEYBOARD SHORTCUTS =====
document.addEventListener('keydown', (e) => {
    // Ignore if typing in input/select
    if (e.target.matches('input, select')) return;

    // Space = Play/Pause
    if (e.code === 'Space') {
        e.preventDefault();
        if (audioBuffer && !isPlaying) {
            playBtn.click();
        } else if (isPlaying) {
            pauseBtn.click();
        }
    }

    // Arrow Left = Previous track
    if (e.code === 'ArrowLeft') {
        e.preventDefault();
        prevBtn.click();
    }

    // Arrow Right = Next track
    if (e.code === 'ArrowRight') {
        e.preventDefault();
        nextBtn.click();
    }

    // Arrow Up = Volume up
    if (e.code === 'ArrowUp') {
        e.preventDefault();
        const newVolume = Math.min(100, parseInt(volumeSlider.value) + 5);
        volumeSlider.value = newVolume;
        volumeSlider.dispatchEvent(new Event('input'));
    }

    // Arrow Down = Volume down
    if (e.code === 'ArrowDown') {
        e.preventDefault();
        const newVolume = Math.max(0, parseInt(volumeSlider.value) - 5);
        volumeSlider.value = newVolume;
        volumeSlider.dispatchEvent(new Event('input'));
    }

    // R = Toggle repeat
    if (e.code === 'KeyR') {
        repeatBtn.click();
    }

    // H = Toggle shuffle
    if (e.code === 'KeyH') {
        shuffleBtn.click();
    }

    // Q = Toggle queue
    if (e.code === 'KeyQ') {
        queueBtn.click();
    }

    // 1-8 = Switch visualizers
    const digitKeys = ['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Digit6', 'Digit7', 'Digit8'];
    const digitIndex = digitKeys.indexOf(e.code);
    if (digitIndex !== -1 && visualizerSelect.options.length > digitIndex) {
        visualizerSelect.selectedIndex = digitIndex;
        visualizerSelect.dispatchEvent(new Event('change'));
    }

    // S = Toggle settings
    if (e.code === 'KeyS') {
        settingsToggle.click();
    }
});

console.log('File browser and keyboard shortcuts loaded');
console.log('8 visualizers available with custom settings');
console.log('Playback controls: Prev/Next, Shuffle, Repeat, Volume, Speed, Queue');
console.log('Keyboard: Space=Play/Pause, ←→=Prev/Next, ↑↓=Volume, R=Repeat, H=Shuffle, Q=Queue, S=Settings');

// Initial canvas state
ctx.fillStyle = '#000';
ctx.fillRect(0, 0, canvas.width, canvas.height);
// Use CSS variable for theme color (not settings.primaryColor which is for visualizers)
const themeColor = getComputedStyle(document.documentElement).getPropertyValue('--theme-primary').trim() || '#00ff88';
ctx.fillStyle = themeColor;
ctx.font = '20px Arial';
ctx.textAlign = 'center';
ctx.fillText('Browse a folder and select an audio file to begin', canvas.width / 2, canvas.height / 2);

// ===== SPOTIFY INTEGRATION =====

let spotifyAccessToken = null;
let spotifyRefreshToken = null;
let spotifyPlaylists = [];
let currentSpotifyPlaylist = null;
let currentSpotifyTrack = null;
let isSpotifyMode = false;

// Get UI elements
const localFilesTab = document.getElementById('localFilesTab');
const spotifyTab = document.getElementById('spotifyTab');
const spotifyPanel = document.getElementById('spotifyPanel');
const spotifyLoginBtn = document.getElementById('spotifyLoginBtn');
const spotifyLogoutBtn = document.getElementById('spotifyLogoutBtn');
const loadPlaylistsBtn = document.getElementById('loadPlaylistsBtn');
const spotifyLogin = document.getElementById('spotifyLogin');
const spotifyConnected = document.getElementById('spotifyConnected');
const spotifyUsername = document.getElementById('spotifyUsername');
const spotifySearchInput = document.getElementById('spotifySearchInput');
const spotifySearchBtn = document.getElementById('spotifySearchBtn');
const searchInputWrapper = document.querySelector('.search-input-wrapper');
const browseFolderBtnContainer = browseFolderBtn.parentElement;

// Tab switching
localFilesTab.addEventListener('click', () => {
    localFilesTab.classList.add('active');
    spotifyTab.classList.remove('active');
    localFilesTab.style.background = '#00ff88';
    localFilesTab.style.color = '#000';
    spotifyTab.style.background = '#444';
    spotifyTab.style.color = '#888';
    spotifyPanel.classList.add('hidden');

    // Hide YouTube panel if it exists
    const youtubePanel = document.getElementById('youtubePanel');
    if (youtubePanel) youtubePanel.classList.add('hidden');
    const youtubeTab = document.getElementById('youtubeTab');
    if (youtubeTab) {
        youtubeTab.classList.remove('active');
        youtubeTab.style.background = '#444';
        youtubeTab.style.color = '#888';
    }

    searchInputWrapper.classList.remove('hidden');
    browseFolderBtnContainer.classList.remove('hidden');
    isSpotifyMode = false;
    renderFileList();
});

spotifyTab.addEventListener('click', () => {
    spotifyTab.classList.add('active');
    localFilesTab.classList.remove('active');
    spotifyTab.style.background = '#00ff88';
    spotifyTab.style.color = '#000';
    localFilesTab.style.background = '#444';
    localFilesTab.style.color = '#888';
    spotifyPanel.classList.remove('hidden');

    // Hide YouTube panel if it exists
    const youtubePanel = document.getElementById('youtubePanel');
    if (youtubePanel) youtubePanel.classList.add('hidden');
    const youtubeTab = document.getElementById('youtubeTab');
    if (youtubeTab) {
        youtubeTab.classList.remove('active');
        youtubeTab.style.background = '#444';
        youtubeTab.style.color = '#888';
    }

    searchInputWrapper.classList.add('hidden');
    browseFolderBtnContainer.classList.add('hidden');
    isSpotifyMode = true;

    // Clear file browser and show Spotify content
    if (spotifyAccessToken) {
        renderSpotifyPlaylists();
    } else {
        fileBrowser.innerHTML = '<div class="empty-state">Connect to Spotify to view your playlists</div>';
    }
});

// Spotify login
spotifyLoginBtn.addEventListener('click', () => {
    console.log('Initiating Spotify login...');
    ipcRenderer.send('spotify-login');
});

// Spotify logout
spotifyLogoutBtn.addEventListener('click', () => {
    spotifyAccessToken = null;
    spotifyPlaylists = [];
    currentSpotifyPlaylist = null;
    localStorage.removeItem('spotifyAccessToken');
    localStorage.removeItem('spotifyRefreshToken');
    localStorage.removeItem('spotifyUser');

    spotifyLogin.classList.remove('hidden');
    spotifyConnected.classList.add('hidden');
    fileBrowser.innerHTML = '<div class="empty-state">Connect to Spotify to view your playlists</div>';
    console.log('Logged out from Spotify');
});

// Load playlists
loadPlaylistsBtn.addEventListener('click', () => {
    console.log('Loading Spotify playlists...');
    ipcRenderer.send('spotify-get-playlists', spotifyAccessToken, spotifyRefreshToken);
    statusText.textContent = 'Loading playlists...';
});

// Spotify search
function performSpotifySearch() {
    const query = spotifySearchInput.value.trim();
    if (!query) return;

    console.log('Searching Spotify for:', query);
    ipcRenderer.send('spotify-search', query);
    statusText.textContent = `Searching for "${query}"...`;
}

spotifySearchBtn.addEventListener('click', performSpotifySearch);

spotifySearchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        performSpotifySearch();
    }
});

// Listen for Spotify auth success
ipcRenderer.on('spotify-auth-success', (event, data) => {
    console.log('Spotify authentication successful!', data.user);
    spotifyAccessToken = data.accessToken;
    spotifyRefreshToken = data.refreshToken;

    // Save tokens
    localStorage.setItem('spotifyAccessToken', data.accessToken);
    localStorage.setItem('spotifyRefreshToken', data.refreshToken);
    localStorage.setItem('spotifyUser', JSON.stringify(data.user));

    // Update UI
    spotifyLogin.classList.add('hidden');
    spotifyConnected.classList.remove('hidden');
    spotifyUsername.textContent = data.user.display_name || data.user.id;

    statusText.textContent = 'Connected to Spotify!';

    // Initialize the Spotify Web Playback SDK
    initSpotifyPlayer(data.accessToken);
});

// Listen for auth errors
ipcRenderer.on('spotify-auth-error', (event, error) => {
    console.error('Spotify auth error:', error);
    statusText.textContent = 'Spotify auth failed';
});

// Listen for token refresh
ipcRenderer.on('spotify-token-refreshed', (event, data) => {
    console.log('Spotify token refreshed');
    spotifyAccessToken = data.accessToken;
    localStorage.setItem('spotifyAccessToken', data.accessToken);
});

// Listen for playlists
ipcRenderer.on('spotify-playlists-received', (event, data) => {
    console.log('Received Spotify playlists:', data.items.length);
    spotifyPlaylists = data.items;
    renderSpotifyPlaylists();
    statusText.textContent = `Loaded ${data.items.length} playlists`;
});

// Listen for search results
ipcRenderer.on('spotify-search-results', (event, data) => {
    console.log('Received search results:', data.tracks.items.length);
    const tracks = data.tracks.items.map(track => ({ track }));
    renderSpotifyTracks(tracks);
    statusText.textContent = `Found ${data.tracks.items.length} tracks`;
});

// Listen for playlist tracks
ipcRenderer.on('spotify-playlist-tracks-received', (event, data) => {
    console.log('Received playlist tracks:', data.tracks.items.length);
    currentSpotifyPlaylist = data;
    renderSpotifyTracks(data.tracks.items);
    statusText.textContent = `Loaded ${data.tracks.items.length} tracks`;
});

// Listen for track features (BPM and Key)
ipcRenderer.on('spotify-track-features-received', (event, data) => {
    if (data.features && data.features.tempo) {
        bpmDetector.setBPM(data.features.tempo);
        detectedBPM = bpmDetector.getBPM(); // Sync for backward compatibility
        updateBPMDisplay();
        console.log('Spotify track BPM:', detectedBPM);
    }

    // Spotify provides key as integer (0-11) and mode (0=minor, 1=major)
    if (data.features && data.features.key !== undefined && data.features.mode !== undefined) {
        const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        const key = noteNames[data.features.key];
        const scale = data.features.mode === 1 ? 'major' : 'minor';
        keyDetector.setKey(key, scale);
        updateKeyDisplay();
        console.log('Spotify track key:', keyDetector.getKeyString());
    }
});

// Listen for errors
ipcRenderer.on('spotify-error', (event, error) => {
    console.error('Spotify error:', error);
    statusText.textContent = 'Spotify error: ' + error;
});

// Render Spotify playlists
function renderSpotifyPlaylists() {
    if (spotifyPlaylists.length === 0) {
        fileBrowser.innerHTML = '<div class="empty-state">No playlists found<br><small>Click "Load Playlists" to fetch your playlists</small></div>';
        return;
    }

    fileBrowser.innerHTML = '';

    spotifyPlaylists.forEach((playlist) => {
        const playlistItem = document.createElement('div');
        playlistItem.className = 'playlist-item';

        const cover = document.createElement('img');
        cover.className = 'playlist-cover';
        if (playlist.images && playlist.images.length > 0) {
            cover.src = playlist.images[playlist.images.length - 1].url;
        } else {
            cover.style.background = '#444';
        }

        const info = document.createElement('div');
        info.className = 'playlist-info';

        const name = document.createElement('div');
        name.className = 'playlist-name';
        name.textContent = playlist.name;

        const tracks = document.createElement('div');
        tracks.className = 'playlist-tracks';
        tracks.textContent = `${playlist.tracks.total} tracks`;

        info.appendChild(name);
        info.appendChild(tracks);
        playlistItem.appendChild(cover);
        playlistItem.appendChild(info);

        playlistItem.addEventListener('click', () => {
            console.log('Loading playlist:', playlist.name);
            ipcRenderer.send('spotify-get-playlist-tracks', playlist.id);
            statusText.textContent = 'Loading tracks...';
        });

        fileBrowser.appendChild(playlistItem);
    });
}

// Render Spotify tracks
function renderSpotifyTracks(tracks) {
    if (tracks.length === 0) {
        fileBrowser.innerHTML = '<div class="empty-state">No tracks in this playlist</div>';
        return;
    }

    fileBrowser.innerHTML = '';

    tracks.forEach((item, index) => {
        if (!item.track) return;

        const track = item.track;
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        fileItem.dataset.spotifyIndex = index;

        const iconSpan = document.createElement('span');
        iconSpan.className = 'file-icon';
        iconSpan.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>';

        const contentDiv = document.createElement('div');
        contentDiv.className = 'file-content';

        const titleDiv = document.createElement('div');
        titleDiv.className = 'file-title';
        titleDiv.textContent = track.name;

        const artistDiv = document.createElement('div');
        artistDiv.className = 'file-artist';
        artistDiv.textContent = track.artists.map(a => a.name).join(', ');

        contentDiv.appendChild(titleDiv);
        contentDiv.appendChild(artistDiv);
        fileItem.appendChild(iconSpan);
        fileItem.appendChild(contentDiv);

        // Add download button
        const downloadBtn = document.createElement('button');
        downloadBtn.className = 'spotify-download-btn';
        downloadBtn.innerHTML = '⬇';
        downloadBtn.title = 'Download MP3 from YouTube';
        downloadBtn.style.cssText = 'padding: 5px 10px; background: #1DB954; color: white; border: none; border-radius: 3px; cursor: pointer; font-size: 16px; margin-left: auto;';
        downloadBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Don't trigger track play
            downloadSpotifyTrack(track);
        });

        // Add status indicators
        if (spotifyPlayer && spotifyDeviceId) {
            // Add "full track" indicator when player is ready
            const fullTrackBadge = document.createElement('span');
            fullTrackBadge.style.cssText = 'font-size: 10px; color: #00ff88; margin-left: 5px;';
            fullTrackBadge.textContent = '(full track - no viz)';
            artistDiv.appendChild(fullTrackBadge);
        } else if (track.preview_url) {
            // Has preview available
            const previewBadge = document.createElement('span');
            previewBadge.style.cssText = 'font-size: 10px; color: #888; margin-left: 5px;';
            previewBadge.textContent = '(30s preview)';
            artistDiv.appendChild(previewBadge);
        } else {
            // No preview but can download
            const downloadableBadge = document.createElement('span');
            downloadableBadge.style.cssText = 'font-size: 10px; color: #00ff88; margin-left: 5px;';
            downloadableBadge.textContent = '(download only)';
            artistDiv.appendChild(downloadableBadge);
        }

        fileItem.appendChild(downloadBtn);

        fileItem.addEventListener('click', () => {
            loadSpotifyTrack(track, index);
        });

        fileBrowser.appendChild(fileItem);
    });
}

// Load Spotify track preview (fallback when Web Playback SDK not available)
async function loadSpotifyTrackPreview(track, index) {
    console.log('Loading Spotify preview:', track.name);

    if (!track.preview_url) {
        statusText.textContent = 'No preview available for this track';
        console.warn('No preview URL for track:', track.name);
        return;
    }

    // Stop current playback
    if (audioSource && isPlaying) {
        manualStop = true;
        audioSource.stop();
        isPlaying = false;
    syncStateToWindow();
    }

    currentSpotifyTrack = track;
    currentFileIndex = index;
    syncStateToWindow();
    statusText.textContent = 'Loading...';

    try {
        // Fetch audio preview (30 seconds)
        const response = await fetch(track.preview_url);
        const arrayBuffer = await response.arrayBuffer();

        // Decode audio
        audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        console.log('Spotify preview loaded:', audioBuffer.duration, 'seconds');

        statusText.textContent = `${track.name} - ${track.artists[0].name} (Preview)`;
        playBtn.disabled = false;
        pauseBtn.disabled = true;

        // Reset time display
        durationEl.textContent = formatTime(audioBuffer.duration);
        currentTimeEl.textContent = '0:00';
        progressFill.style.width = '0%';
        progressHandle.style.left = '0%';
        pauseTime = 0;

        // Get BPM from Spotify
        detectedBPM = 0;
        updateBPMDisplay();
        ipcRenderer.send('spotify-get-track-features', track.id);

        // Update file selection
        const fileItems = fileBrowser.querySelectorAll('.file-item');
        fileItems.forEach((item, i) => {
            item.classList.remove('selected', 'playing');
            if (i === index) {
                item.classList.add('selected');
            }
        });

        // Update Discord presence
        updateDiscordPresence();

    } catch (error) {
        console.error('Error loading Spotify track:', error);
        statusText.textContent = 'Error loading track';
    }
}

// Check for saved Spotify session on startup
const savedAccessToken = localStorage.getItem('spotifyAccessToken');
const savedRefreshToken = localStorage.getItem('spotifyRefreshToken');
const savedUser = localStorage.getItem('spotifyUser');

if (savedAccessToken && savedUser) {
    try {
        spotifyAccessToken = savedAccessToken;
        spotifyRefreshToken = savedRefreshToken;
        const user = JSON.parse(savedUser);

        spotifyLogin.classList.add('hidden');
        spotifyConnected.classList.remove('hidden');
        spotifyUsername.textContent = user.display_name || user.id;

        console.log('Restored Spotify session for:', user.display_name || user.id);

        // Initialize the Spotify Web Playback SDK (non-blocking)
        setTimeout(() => {
            try {
                initSpotifyPlayer(savedAccessToken);
            } catch (error) {
                console.error('Error initializing Spotify player:', error);
            }
        }, 1000); // Wait for SDK to load
    } catch (error) {
        console.error('Error restoring Spotify session:', error);
        // Clear invalid tokens
        localStorage.removeItem('spotifyAccessToken');
        localStorage.removeItem('spotifyRefreshToken');
        localStorage.removeItem('spotifyUser');
    }
}

console.log('Spotify integration loaded');

// ===== SPOTIFY WEB PLAYBACK SDK =====

let spotifyPlayer = null;
let spotifyDeviceId = null;
let spotifyMediaElement = null;
let spotifyAudioSource = null;
let isUsingSpotifyPlayer = false;

// Initialize Spotify Web Playback SDK when ready
window.onSpotifyWebPlaybackSDKReady = () => {
    console.log('Spotify Web Playback SDK ready');
};

// Initialize Spotify Player
function initSpotifyPlayer(accessToken) {
    if (spotifyPlayer) {
        console.log('Spotify player already initialized');
        return;
    }

    console.log('Initializing Spotify Web Playback SDK...');

    spotifyPlayer = new Spotify.Player({
        name: 'Audio Visualizer',
        getOAuthToken: cb => { cb(accessToken); },
        volume: 0.5
    });

    // Error handling
    spotifyPlayer.addListener('initialization_error', ({ message }) => {
        console.error('Spotify initialization error:', message);
        statusText.textContent = 'Spotify player error: ' + message;
    });

    spotifyPlayer.addListener('authentication_error', ({ message }) => {
        console.error('Spotify authentication error:', message);
        statusText.textContent = 'Spotify auth error';
    });

    spotifyPlayer.addListener('account_error', ({ message }) => {
        console.error('Spotify account error:', message);
        statusText.textContent = 'Spotify Premium required for full playback';
    });

    spotifyPlayer.addListener('playback_error', ({ message }) => {
        console.error('Spotify playback error:', message);
    });

    // Ready
    spotifyPlayer.addListener('ready', ({ device_id }) => {
        console.log('Spotify player ready! Device ID:', device_id);
        spotifyDeviceId = device_id;
        statusText.textContent = 'Spotify player ready - you can now play full tracks!';

        // Connect the Spotify player's audio to Web Audio API
        connectSpotifyPlayerToWebAudio();
    });

    // Not Ready
    spotifyPlayer.addListener('not_ready', ({ device_id }) => {
        console.log('Spotify player not ready. Device ID:', device_id);
    });

    // Player state changed
    spotifyPlayer.addListener('player_state_changed', (state) => {
        if (!state) return;

        console.log('Spotify player state:', state);

        // Update UI based on playback state
        if (state.paused) {
            playBtn.disabled = false;
            pauseBtn.disabled = true;
            isPlaying = false;
    syncStateToWindow();
        } else {
            playBtn.disabled = true;
            pauseBtn.disabled = false;
            isPlaying = true;
    syncStateToWindow();
        }

        // Update progress
        const duration = state.duration / 1000;
        const position = state.position / 1000;

        durationEl.textContent = formatTime(duration);
        currentTimeEl.textContent = formatTime(position);

        const progressPercent = (position / duration) * 100;
        progressFill.style.width = progressPercent + '%';
        progressHandle.style.left = progressPercent + '%';
    });

    // Connect to the player
    spotifyPlayer.connect().then(success => {
        if (success) {
            console.log('Successfully connected to Spotify player');
        } else {
            console.error('Failed to connect to Spotify player');
            statusText.textContent = 'Failed to connect to Spotify player';
        }
    });
}

// Connect Spotify Player to Web Audio API for visualization
function connectSpotifyPlayerToWebAudio() {
    // The Spotify SDK doesn't expose the audio element directly,
    // but we can create a hidden audio element and use getUserMedia to capture it
    // OR we can try to find the SDK's internal audio element

    // Try to find Spotify's internal audio/video element
    const findSpotifyMediaElement = setInterval(() => {
        // The Spotify SDK creates an iframe with an audio element
        // We need to access it through the DOM
        const spotifyIframe = document.querySelector('iframe[src*="spotify"]');

        if (spotifyIframe) {
            try {
                const iframeDoc = spotifyIframe.contentDocument || spotifyIframe.contentWindow.document;
                spotifyMediaElement = iframeDoc.querySelector('audio') || iframeDoc.querySelector('video');

                if (spotifyMediaElement) {
                    console.log('Found Spotify media element!', spotifyMediaElement);
                    clearInterval(findSpotifyMediaElement);

                    // Connect to Web Audio API
                    try {
                        if (spotifyAudioSource) {
                            spotifyAudioSource.disconnect();
                        }

                        spotifyAudioSource = audioContext.createMediaElementSource(spotifyMediaElement);
                        // Connect main visualizer: source → dbGainNode → analyser → gainNode → destination
                        // dbGainNode affects visualizer intensity, gainNode affects output volume
                        spotifyAudioSource.connect(dbGainNode);
                        dbGainNode.connect(analyser);
                        analyser.connect(gainNode);
                        gainNode.connect(audioContext.destination);

                        // Connect volume history: dbGainNode → volumeHistoryAnalyser (also affected by dB gain)
                        // Share the same dbGainNode output for volume history
                        dbGainNode.connect(volumeHistoryAnalyser);

                        console.log('✅ Successfully connected Spotify player to Web Audio API!');
                        statusText.textContent = 'Spotify connected - visualizations enabled!';
                        isUsingSpotifyPlayer = true;
                    } catch (err) {
                        console.error('Error connecting Spotify to Web Audio:', err);
                        // If we can't create MediaElementSource (already exists), that's OK
                        if (!err.message.includes('already created')) {
                            statusText.textContent = 'Could not connect audio for visualization';
                        } else {
                            console.log('Media element source already exists');
                            isUsingSpotifyPlayer = true;
                        }
                    }
                }
            } catch (err) {
                // Cross-origin iframe access might fail
                console.log('Cannot access Spotify iframe (cross-origin):', err.message);
            }
        }
    }, 500);

    // Stop trying after 10 seconds
    setTimeout(() => {
        clearInterval(findSpotifyMediaElement);
        if (!spotifyMediaElement) {
            console.warn('Could not find Spotify media element for visualization');
            // We'll still be able to play music, just no visualizations
        }
    }, 10000);
}

// Play Spotify track using Web Playback SDK
async function playSpotifyTrackFull(track, index) {
    console.log('Playing full Spotify track:', track.name);

    if (!spotifyPlayer || !spotifyDeviceId) {
        console.error('Spotify player not ready');
        statusText.textContent = 'Spotify player not ready - initializing...';

        // Initialize player if not done yet
        if (spotifyAccessToken) {
            initSpotifyPlayer(spotifyAccessToken);
        }
        return;
    }

    currentSpotifyTrack = track;
    currentFileIndex = index;
    syncStateToWindow();
    statusText.textContent = 'Starting playback...';
    isUsingSpotifyPlayer = true;

    try {
        // Transfer playback to our player and start the track
        const response = await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${spotifyDeviceId}`, {
            method: 'PUT',
            body: JSON.stringify({ uris: [track.uri] }),
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${spotifyAccessToken}`
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${await response.text()}`);
        }

        console.log('✅ Started playing:', track.name);
        statusText.textContent = `${track.name} - ${track.artists[0].name} (Full Track)`;

        playBtn.disabled = true;
        pauseBtn.disabled = false;
        isPlaying = true;
    syncStateToWindow();

        // Display message on canvas (no visualization for DRM-protected content)
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Display album artwork if available
        if (track.album && track.album.images && track.album.images.length > 0) {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
                const size = Math.min(canvas.width, canvas.height) * 0.6;
                const x = (canvas.width - size) / 2;
                const y = (canvas.height - size) / 2 - 50;
                ctx.drawImage(img, x, y, size, size);

                // Add text
                ctx.fillStyle = '#00ff88';
                ctx.font = 'bold 24px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('Playing Full Track', canvas.width / 2, y + size + 50);
                ctx.font = '16px Arial';
                ctx.fillStyle = '#888';
                ctx.fillText('Visualization not available for DRM-protected Spotify playback', canvas.width / 2, y + size + 80);
                ctx.fillText('Click download button ⬇ to save as MP3 for full visualization', canvas.width / 2, y + size + 105);
            };
            img.src = track.album.images[0].url;
        } else {
            ctx.fillStyle = '#00ff88';
            ctx.font = 'bold 28px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('🎵 Playing Full Track', canvas.width / 2, canvas.height / 2 - 40);
            ctx.font = '18px Arial';
            ctx.fillStyle = '#fff';
            ctx.fillText(track.name, canvas.width / 2, canvas.height / 2);
            ctx.fillStyle = '#888';
            ctx.font = '14px Arial';
            ctx.fillText(track.artists.map(a => a.name).join(', '), canvas.width / 2, canvas.height / 2 + 30);
            ctx.fillText('Visualization not available for DRM-protected Spotify playback', canvas.width / 2, canvas.height / 2 + 70);
            ctx.fillText('Click download button ⬇ to save as MP3 for full visualization', canvas.width / 2, canvas.height / 2 + 95);
        }

        // Get BPM from Spotify
        detectedBPM = 0;
        updateBPMDisplay();
        ipcRenderer.send('spotify-get-track-features', track.id);

        // Update file selection
        const fileItems = fileBrowser.querySelectorAll('.file-item');
        fileItems.forEach((item, i) => {
            item.classList.remove('selected', 'playing');
            if (i === index) {
                item.classList.add('selected', 'playing');
            }
        });

        // Update Discord presence
        updateDiscordPresence();

    } catch (error) {
        console.error('Error playing Spotify track:', error);
        statusText.textContent = 'Error: ' + error.message;

        // If we get a 404, it might mean Premium is required
        if (error.message.includes('404')) {
            statusText.textContent = 'Spotify Premium required for full playback';
        }
    }
}

// Main function to load Spotify track - chooses between full playback or preview
async function loadSpotifyTrack(track, index) {
    // If player is ready, use full playback
    if (spotifyPlayer && spotifyDeviceId) {
        await playSpotifyTrackFull(track, index);
    } else {
        // Otherwise fall back to preview
        await loadSpotifyTrackPreview(track, index);
    }
}

// Download Spotify track as MP3 using YouTube
function downloadSpotifyTrack(track) {
    console.log('Downloading track:', track.name);

    // Show downloading status
    statusText.textContent = `Searching YouTube for "${track.name}"...`;

    // Send download request to main process
    ipcRenderer.send('download-spotify-track', {
        title: track.name,
        artist: track.artists.map(a => a.name).join(', '),
        album: track.album ? track.album.name : '',
        albumArt: track.album && track.album.images && track.album.images.length > 0
            ? track.album.images[0].url
            : null
    });
}

// Listen for download progress
ipcRenderer.on('download-progress', (event, data) => {
    statusText.textContent = data.message;
});

// Listen for download complete
ipcRenderer.on('download-complete', (event, data) => {
    statusText.textContent = `Downloaded: ${data.filename}`;
    console.log('Download complete:', data.path);
});

// Listen for download error
ipcRenderer.on('download-error', (event, error) => {
    statusText.textContent = `Download failed: ${error}`;
    console.error('Download error:', error);
});

// OLD CODE - keeping for reference
function downloadSpotifyTrackOld(track) {
    console.log('Opening download service for:', track.name);

    // Construct search query: "Artist - Track Name"
    const searchQuery = `${track.artists[0].name} - ${track.name}`;

    // Show dialog to user
    const { shell } = window.require('electron');

    // YouTube search (most reliable option)
    const youtubeSearchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(searchQuery + ' official audio')}`;

    // Copy search query to clipboard
    if (navigator.clipboard) {
        navigator.clipboard.writeText(searchQuery).then(() => {
            console.log('Search query copied to clipboard:', searchQuery);
            statusText.textContent = `"${searchQuery}" copié! Recherche YouTube...`;
        }).catch(err => {
            console.log('Could not copy to clipboard:', err);
        });
    }

    statusText.textContent = `Recherche YouTube: ${track.name}`;

    // Open YouTube search - users can then use youtube-dl, browser extensions, or online converters
    shell.openExternal(youtubeSearchUrl).then(() => {
        console.log('Opened YouTube search for:', track.name);

        // Show instructions
        setTimeout(() => {
            statusText.textContent = `Utilisez un convertisseur YouTube → MP3 (extension navigateur ou site)`;
        }, 2000);
    }).catch(err => {
        console.error('Error opening YouTube:', err);
        statusText.textContent = `Erreur: impossible d'ouvrir le navigateur`;
    });
}
}