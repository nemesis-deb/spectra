/**
 * Renderer - Main renderer process initialization
 * Refactored to use modular structure like Amethyst
 * 
 * This file initializes the Spectra app and sets up all systems
 */
import { spectra } from './spectra.js';
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
import { AmethystSpectrumVisualizer as AmethystSpectrumVisualizerNew } from './visualizers/amethyst-spectrum-new.js';
import { VisualizerManager } from './modules/visualizer-manager.js';
import { DiscordRPC } from './modules/discord-rpc.js';
import { BPMDetector } from './modules/bpm-detector.js';
import { KeyDetector } from './modules/key-detector.js';
import { SpotifyIntegration } from './modules/spotify-integration.js';
import { AlbumArtManager } from './modules/album-art.js';
import { PresetManager } from './modules/preset-manager.js';
import { createCustomSelect } from './utils/customSelect.js';

console.log('[RENDERER] Starting renderer initialization...');

// Global error handlers
window.addEventListener('error', (event) => {
  console.error('[RENDERER] Global error:', event.error);
  event.preventDefault();
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('[RENDERER] Unhandled promise rejection:', event.reason);
  event.preventDefault();
});

// Initialize Spectra app
async function initialize() {
  try {
    console.log('[RENDERER] Initializing Spectra app...');
    
    // Initialize visualizer manager FIRST (before spectra.initialize)
    // This prevents spectra from creating an empty one
    const visualizerManager = new VisualizerManager();
    
    // Set it in spectra instance so initializeVisualizers() uses it
    spectra.visualizerManager = visualizerManager;
    
    // Initialize settings for visualizers
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
    
    // Load saved settings from localStorage if available
    try {
      const savedSettings = localStorage.getItem('visualizerSettings');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        Object.assign(settings, parsed);
      }
    } catch (e) {
      console.warn('[RENDERER] Could not load saved settings:', e);
    }
    
    // Share settings with visualizers
    setSettings(settings);
    console.log('[RENDERER] Settings initialized');
    
    // Initialize Spectra (creates audio context, player, etc.)
    await spectra.initialize();
    
    // Initialize additional modules
    const discordRPC = new DiscordRPC();
    const bpmDetector = new BPMDetector();
    const keyDetector = new KeyDetector();
    const spotify = new SpotifyIntegration();
    const albumArtManager = new AlbumArtManager();
    const presetManager = new PresetManager();
    
    // Create metadata cache (Map to store file metadata)
    const metadataCache = new Map();
    
    // Register all visualizers
    visualizerManager.register(new AmethystSpectrumVisualizerNew());
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
    
    // Set default visualizer (first one)
    const visualizerNames = visualizerManager.getVisualizerNames();
    if (visualizerNames.length > 0) {
      visualizerManager.setActive(visualizerNames[0]);
      console.log('[RENDERER] Set default visualizer:', visualizerNames[0]);
    }
    
    // Initialize visualizers with canvas context
    const canvas = document.getElementById('visualizerCanvas');
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Initialize all visualizers
        visualizerManager.getAll().forEach(viz => {
          if (viz.init) {
            viz.init(canvas, ctx);
          }
        });
        console.log('[RENDERER] Initialized', visualizerManager.getAll().length, 'visualizers');
      }
    } else {
      console.warn('[RENDERER] Canvas not found for visualizer initialization');
    }
    
    // Export to window for Vue components and legacy code
    window.spectra = spectra;
    
    // IMPORTANT: Set visualizerManager in spectra instance to use the one we created
    // This prevents spectra.initializeVisualizers() from creating a new empty one
    spectra.visualizerManager = visualizerManager;
    
    window.visualizerManager = visualizerManager;
    window.discordRPC = discordRPC;
    window.bpmDetector = bpmDetector;
    window.keyDetector = keyDetector;
    window.spotify = spotify;
    window.albumArtManager = albumArtManager;
    window.presetManager = presetManager;
    window.metadataCache = metadataCache; // Export metadata cache for Vue components
    window.parseFileName = window.parseFileName || spectra.parseFileName || ((filename) => {
      // Fallback parseFileName if not already set
      const nameWithoutExt = filename.replace(/\.[^/.]+$/, '');
      let cleaned = nameWithoutExt.replace(/^\d+[\s.-]*/, '');
      const separators = [' - ', ' – ', ' — '];
      for (const sep of separators) {
        if (cleaned.includes(sep)) {
          const parts = cleaned.split(sep);
          return {
            artist: parts[0].trim(),
            title: parts.slice(1).join(sep).trim(),
            hasArtist: true
          };
        }
      }
      return {
        artist: '',
        title: cleaned.trim(),
        hasArtist: false
      };
    });
    window.fileManager = spectra.fileManager;
    window.audioPlayer = spectra.audioPlayer;
    window.audioContext = spectra.audioContext;
    window.analyser = spectra.analyser;
    window.gainNode = spectra.gainNode;
    
    // Log visualizer count for debugging
    console.log('[RENDERER] Visualizer count:', visualizerManager.getVisualizerNames().length);
    console.log('[RENDERER] Visualizer names:', visualizerManager.getVisualizerNames());
    
    // Legacy compatibility - create audioManager object
    window.audioManager = {
      play: () => spectra.play(),
      pause: () => spectra.pause(),
      stop: () => spectra.stop(),
      setVolume: (vol) => spectra.setVolume(vol),
      setPlaybackRate: (rate) => spectra.setPlaybackRate(rate),
      loadFile: (index) => spectra.loadFile(index),
      seekTo: (time) => {
        // Seek to specific time in the current track
        if (spectra.audioPlayer && spectra.audioPlayer.seekTo) {
          spectra.audioPlayer.seekTo(time);
        }
      },
      gainNode: spectra.gainNode, // Volume gain node (output control)
      setGain: (gainDB) => {
        // DB gain affects visualizer intensity
        if (spectra.audioPlayer && spectra.audioPlayer.setGainDB) {
          spectra.audioPlayer.setGainDB(gainDB);
        }
      },
      // External audio source support (for YouTube, etc.)
      externalAudio: null,
      externalAudioSource: null,
      seekTo(time) {
        // Seek support for external audio
        if (this.externalAudio && this.externalAudio.duration > 0) {
          this.externalAudio.currentTime = Math.max(0, Math.min(time, this.externalAudio.duration));
          // Update store immediately
          if (window.audioStore) {
            window.audioStore.setTime(this.externalAudio.currentTime, this.externalAudio.duration);
          }
          return true;
        }
        return false;
      },
      clear() {
        // Clear external audio and disconnect source
        if (this.externalAudioSource) {
          try {
            this.externalAudioSource.disconnect();
          } catch (e) {
            // ignore
          }
          this.externalAudioSource = null;
        }
        if (this.externalAudio) {
          try {
            this.externalAudio.pause();
            this.externalAudio.currentTime = 0;
          } catch (e) {
            // ignore
          }
          this.externalAudio = null;
        }
      },
      setAudioSource(mediaElement, providedCtx = null) {
        try {
          // Use provided context or existing audioContext
          const ctx = providedCtx || spectra.audioContext || new (window.AudioContext || window.webkitAudioContext)();
          
          // Ensure analyser exists
          if (!spectra.analyser) {
            console.warn('[audioManager] Analyser not available');
            return false;
          }
          
          // Clean previous source
          if (this.externalAudioSource) {
            try { 
              this.externalAudioSource.disconnect(); 
            } catch (e) { 
              // ignore 
            }
          }
          
          this.externalAudio = mediaElement;
          
          // Create media source from audio element
          const source = ctx.createMediaElementSource(mediaElement);
          this.externalAudioSource = source;
          
          // Connect: source -> dbGainNode -> analyser -> gainNode -> destination
          // dbGainNode affects visualizer intensity, gainNode affects output volume
          if (spectra.dbGainNode) {
            source.connect(spectra.dbGainNode);
            spectra.dbGainNode.connect(spectra.analyser);
            if (spectra.gainNode) {
              spectra.analyser.connect(spectra.gainNode);
              spectra.gainNode.connect(ctx.destination);
            } else {
              spectra.analyser.connect(ctx.destination);
            }
          } else {
            // Fallback: no dbGainNode, use old connection
            source.connect(spectra.analyser);
            if (spectra.gainNode) {
              spectra.analyser.connect(spectra.gainNode);
              spectra.gainNode.connect(ctx.destination);
            } else {
              spectra.analyser.connect(ctx.destination);
            }
          }
          
          // Set up event listeners
          const onPlay = () => {
            if (window.audioStore) {
              window.audioStore.setPlaying(true);
            }
            // Update Discord RPC if this is YouTube audio
            if (mediaElement && window.discordRPC && window.discordRPC.updateYouTubePresence) {
              // Check if this is a YouTube video by checking the source or metadata
              const videoId = mediaElement.dataset?.videoId || window.currentYouTubeVideoId;
              if (videoId) {
                // Get metadata from audio store or window
                const title = window.audioStore?.title || 'Unknown';
                const artist = window.audioStore?.artist || 'YouTube';
                const thumbnail = window.audioStore?.albumArt;
                
                window.discordRPC.updateYouTubePresence({
                  title: title,
                  artist: artist,
                  thumbnail: thumbnail,
                  isPlaying: true,
                  currentTime: mediaElement.currentTime || 0,
                  duration: mediaElement.duration || 0,
                  videoId: videoId
                });
              }
            }
          };
          const onPause = () => {
            if (window.audioStore) {
              window.audioStore.setPlaying(false);
            }
            // Update Discord RPC if this is YouTube audio
            if (mediaElement && window.discordRPC && window.discordRPC.updateYouTubePresence) {
              const videoId = mediaElement.dataset?.videoId || window.currentYouTubeVideoId;
              if (videoId) {
                const title = window.audioStore?.title || 'Unknown';
                const artist = window.audioStore?.artist || 'YouTube';
                const thumbnail = window.audioStore?.albumArt;
                
                window.discordRPC.updateYouTubePresence({
                  title: title,
                  artist: artist,
                  thumbnail: thumbnail,
                  isPlaying: false,
                  currentTime: mediaElement.currentTime || 0,
                  duration: mediaElement.duration || 0,
                  videoId: videoId
                });
              }
            }
          };
          const onTimeUpdate = () => {
            if (mediaElement) {
              const currentTime = mediaElement.currentTime || 0;
              const duration = mediaElement.duration || 0;
              
              // Only update if we have valid duration (prevents resetting to 0:00)
              // Check readyState to ensure metadata is loaded
              if (duration > 0 && !isNaN(duration) && !isNaN(currentTime) && mediaElement.readyState >= 2) {
                // Update audio store if available
                if (window.audioStore) {
                  window.audioStore.setTime(currentTime, duration);
                }
                
                // Update Discord RPC periodically (every ~5 seconds) for YouTube
                if (window.discordRPC && window.discordRPC.updateYouTubePresence) {
                  const videoId = mediaElement.dataset?.videoId || window.currentYouTubeVideoId;
                  if (videoId && (!mediaElement._lastDiscordUpdate || Date.now() - mediaElement._lastDiscordUpdate > 5000)) {
                    const title = window.audioStore?.title || 'Unknown';
                    const artist = window.audioStore?.artist || 'YouTube';
                    const thumbnail = window.audioStore?.albumArt;
                    
                    window.discordRPC.updateYouTubePresence({
                      title: title,
                      artist: artist,
                      thumbnail: thumbnail,
                      isPlaying: !mediaElement.paused,
                      currentTime: currentTime,
                      duration: duration,
                      videoId: videoId
                    });
                    mediaElement._lastDiscordUpdate = Date.now();
                  }
                }
              }
            }
          };
          const onEnded = () => {
            if (window.audioStore) {
              window.audioStore.setPlaying(false);
            }
          };
          
          // Remove previous listeners if any
          try {
            mediaElement.removeEventListener('play', mediaElement.__onPlay);
            mediaElement.removeEventListener('pause', mediaElement.__onPause);
            mediaElement.removeEventListener('timeupdate', mediaElement.__onTimeUpdate);
            mediaElement.removeEventListener('ended', mediaElement.__onEnded);
          } catch (e) { }
          
          mediaElement.__onPlay = onPlay;
          mediaElement.__onPause = onPause;
          mediaElement.__onTimeUpdate = onTimeUpdate;
          mediaElement.__onEnded = onEnded;
          
          mediaElement.addEventListener('play', onPlay);
          mediaElement.addEventListener('pause', onPause);
          mediaElement.addEventListener('timeupdate', onTimeUpdate);
          mediaElement.addEventListener('ended', onEnded);
          
          console.log('[audioManager] External audio source connected successfully');
          return true;
        } catch (err) {
          console.error('[audioManager] setAudioSource error:', err);
          return false;
        }
      },
      clear() {
        if (this.externalAudioSource) {
          try {
            this.externalAudioSource.disconnect();
          } catch (e) {
            // ignore
          }
          this.externalAudioSource = null;
        }
        this.externalAudio = null;
      }
    };
    
    // Legacy compatibility - loadAudioFile function
    window.loadAudioFile = async (index) => {
      return await spectra.loadFile(index);
    };
    
    // Set up file manager listeners
    spectra.fileManager.on('folderLoaded', (data) => {
      console.log('[RENDERER] Folder loaded:', data.folderPath, data.count, 'files');
      if (spectra.audioPlayer) {
        spectra.audioPlayer.setAudioFiles(data.files);
      }
      window.audioFiles = data.files;
    });
    
    // Set up Electron IPC listeners
    if (spectra.electron && spectra.electron.ipc) {
      // Folder selection - listen for IPC event from main process
      spectra.electron.on('folder-selected', (event, folderPath) => {
        console.log('[RENDERER] Folder selected via IPC:', folderPath);
        if (folderPath) {
          const result = spectra.fileManager.loadFolder(folderPath);
          if (result.success) {
            console.log('[RENDERER] Loaded', result.count, 'files');
          }
        }
      });
    }
    
    // Also listen directly to ipcRenderer if available (for legacy compatibility)
    if (window.electron && window.electron.ipcRenderer) {
      window.electron.ipcRenderer.on('folder-selected', (event, folderPath) => {
        console.log('[RENDERER] Folder selected (legacy IPC):', folderPath);
        if (folderPath && spectra.fileManager) {
          const result = spectra.fileManager.loadFolder(folderPath);
          if (result.success) {
            console.log('[RENDERER] Loaded', result.count, 'files');
          }
        }
      });
    }
    
    console.log('[RENDERER] Initialization complete!');
    console.log('[RENDERER] Exported globals:');
    console.log('  - window.spectra:', !!window.spectra);
    console.log('  - window.visualizerManager:', !!window.visualizerManager);
    console.log('  - window.audioPlayer:', !!window.audioPlayer);
    console.log('  - window.audioContext:', !!window.audioContext);
    console.log('  - window.analyser:', !!window.analyser);
    console.log('  - window.loadAudioFile:', typeof window.loadAudioFile === 'function');
    
    // Export createCustomSelect to window for Vue components
    window.createCustomSelect = createCustomSelect;
    
    // Set up animation loop for visualizers
    setupAnimationLoop();
    
    // Set up keyboard shortcuts
    setupKeyboardShortcuts();
    
  } catch (error) {
    console.error('[RENDERER] Error during initialization:', error);
    throw error;
  }
}

// Animation loop for visualizers
function setupAnimationLoop() {
  const canvas = document.getElementById('visualizerCanvas');
  if (!canvas) {
    console.warn('[RENDERER] Canvas not found, animation loop not started');
    return;
  }

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    console.warn('[RENDERER] Could not get canvas context');
    return;
  }

  // Get analyser for frequency data
  const analyser = window.analyser;
  if (!analyser) {
    console.warn('[RENDERER] Analyser not available');
    return;
  }

  const bufferLength = analyser.frequencyBinCount;
  const timeDomainData = new Uint8Array(bufferLength);
  const frequencyData = new Uint8Array(bufferLength);

  function animate() {
    requestAnimationFrame(animate);

    if (!window.visualizerManager || !analyser) return;

    // Get audio data
    analyser.getByteTimeDomainData(timeDomainData);
    analyser.getByteFrequencyData(frequencyData);

    // Update and draw current visualizer
    const currentVisualizer = window.visualizerManager.getCurrent();
    if (currentVisualizer) {
      try {
        // Update visualizer with new data
        if (currentVisualizer.update) {
          currentVisualizer.update(timeDomainData, frequencyData);
        }
        
        // Draw visualizer
        if (currentVisualizer.draw) {
          currentVisualizer.draw();
        } else if (currentVisualizer.render) {
          // Legacy render method
          currentVisualizer.render(ctx, timeDomainData, frequencyData, canvas.width, canvas.height);
        }
      } catch (error) {
        console.error('[RENDERER] Error rendering visualizer:', error);
      }
    } else {
      // No visualizer selected, clear canvas
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  }

  // Start animation loop
  animate();
  console.log('[RENDERER] Animation loop started');
}

// Keyboard shortcuts
function setupKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    // Ignore if typing in input/select/textarea
    if (e.target.matches('input, select, textarea')) return;

    // Space = Play/Pause
    if (e.code === 'Space') {
      e.preventDefault();
      if (window.spectra && window.spectra.isInitialized) {
        const isPlaying = window.spectra.audioPlayer?.isPlaying || false;
        if (isPlaying) {
          window.spectra.pause();
        } else {
          window.spectra.play();
        }
      }
    }

    // Arrow Left = Previous track (if implemented)
    if (e.code === 'ArrowLeft') {
      e.preventDefault();
      // TODO: Implement previous track
    }

    // Arrow Right = Next track (if implemented)
    if (e.code === 'ArrowRight') {
      e.preventDefault();
      // TODO: Implement next track
    }

    // Arrow Up = Volume up
    if (e.code === 'ArrowUp') {
      e.preventDefault();
      if (window.spectra && window.spectra.audioPlayer) {
        const currentVol = window.spectra.audioPlayer.volume || 1.0;
        window.spectra.setVolume(Math.min(1.0, currentVol + 0.05));
      }
    }

    // Arrow Down = Volume down
    if (e.code === 'ArrowDown') {
      e.preventDefault();
      if (window.spectra && window.spectra.audioPlayer) {
        const currentVol = window.spectra.audioPlayer.volume || 1.0;
        window.spectra.setVolume(Math.max(0.0, currentVol - 0.05));
      }
    }

    // S = Toggle settings (handled by Vue component)
    // Q = Toggle queue (handled by Vue component)
    // R = Toggle repeat (handled by Vue component)
    // H = Toggle shuffle (handled by Vue component)
  });

  console.log('[RENDERER] Keyboard shortcuts set up');
}

// Start initialization
initialize().catch(error => {
  console.error('[RENDERER] Failed to initialize:', error);
});

