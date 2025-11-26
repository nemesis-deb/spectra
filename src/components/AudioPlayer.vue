<template>
  <div class="audio-player">
    <!-- Now Playing Section -->
    <div class="header">
      <div 
        class="now-playing-art" 
        ref="nowPlayingArtRef"
        @click="openAlbumArtModal"
        :class="{ 'clickable': albumArt }"
      >
        <img v-if="albumArt" :src="albumArt" alt="Album Art" />
        <svg v-else width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="var(--theme-primary)" stroke-width="2">
          <path d="M9 18V5l12-2v13" />
          <circle cx="6" cy="18" r="3" />
          <circle cx="18" cy="16" r="3" />
        </svg>
      </div>
      <div class="now-playing-info">
        <div class="now-playing-title">{{ title }}</div>
        <div class="now-playing-artist">
          <template v-if="artist && album">
            {{ artist }} • {{ album }}
          </template>
          <template v-else-if="artist">
            {{ artist }}
          </template>
          <template v-else-if="album">
            {{ album }}
          </template>
          <template v-else>
            Unknown Artist
          </template>
        </div>
      </div>
      <div class="gain-controls-container" style="margin-left: auto; margin-right: 8px;">
        <div class="gain-controls">
          <button @click="increaseGain" class="gain-btn" title="Increase gain (+3dB)">▲</button>
          <button @click="decreaseGain" class="gain-btn" title="Decrease gain (-3dB)">▼</button>
        </div>
        <span class="gain-display">{{ formatGain(gain) }}</span>
      </div>
      <div class="volume-history-container" style="margin-right: 15px;">
        <canvas id="volumeHistoryCanvas" ref="volumeHistoryCanvas" width="150" height="30"></canvas>
      </div>
      <button @click="toggleQueue" class="queue-btn" title="Queue">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="8" y1="6" x2="21" y2="6" />
          <line x1="8" y1="12" x2="21" y2="12" />
          <line x1="8" y1="18" x2="21" y2="18" />
          <line x1="3" y1="6" x2="3.01" y2="6" />
          <line x1="3" y1="12" x2="3.01" y2="12" />
          <line x1="3" y1="18" x2="3.01" y2="18" />
        </svg>
        <span>Queue</span>
      </button>
    </div>

    <!-- Controls Bar -->
    <div class="controls-bar">
      <div class="control-group">
        <button 
          @click="previousTrack" 
          :disabled="!hasPrevious" 
          class="icon-btn" 
          title="Previous Track"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
          </svg>
        </button>
        <button 
          @click="play" 
          :disabled="!canPlay || isPlaying" 
          class="icon-btn" 
          title="Play"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
        </button>
        <button 
          @click="pause" 
          :disabled="!isPlaying" 
          class="icon-btn" 
          title="Pause"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <rect x="6" y="4" width="4" height="16" />
            <rect x="14" y="4" width="4" height="16" />
          </svg>
        </button>
        <button 
          @click="nextTrack" 
          :disabled="!hasNext" 
          class="icon-btn" 
          title="Next Track"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
          </svg>
        </button>
      </div>

      <div class="control-group">
        <button 
          @click="toggleShuffle" 
          :class="['icon-btn', 'toggle-btn', { active: shuffle }]" 
          :title="shuffle ? 'Shuffle On' : 'Shuffle Off'"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5" />
          </svg>
        </button>
        <button 
          @click="toggleRepeat" 
          :class="['icon-btn', 'toggle-btn', { active: repeatMode !== 'off' }]" 
          :title="repeatTitle"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M17 1l4 4-4 4" />
            <path d="M3 11V9a4 4 0 0 1 4-4h14" />
            <path d="M7 23l-4-4 4-4" />
            <path d="M21 13v2a4 4 0 0 1-4 4H3" />
            <text v-if="repeatMode === 'one'" x="12" y="16" text-anchor="middle" font-size="10" fill="currentColor">1</text>
          </svg>
        </button>
      </div>

      <div class="time-display">
        <span>{{ formattedCurrentTime }}</span>
        <span class="time-separator">/</span>
        <span>{{ formattedDuration }}</span>
      </div>

      <div class="progress-bar-container">
        <div 
          class="progress-bar" 
          @click="seekTo"
          @mousemove="updateProgressHover"
          @mouseleave="hideProgressHover"
          ref="progressBarRef"
        >
          <div class="progress-fill" :style="{ width: progressPercent + '%' }"></div>
          <div class="progress-handle" :style="{ left: progressPercent + '%' }"></div>
        </div>
      </div>

      <div class="divider"></div>

      <div class="control-group volume-control">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
        </svg>
        <input 
          type="range" 
          v-model.number="volumePercent" 
          @input="onVolumeChange"
          min="0" 
          max="100" 
          title="Volume"
          class="volume-slider"
        />
        <span>{{ volumePercent }}%</span>
      </div>

      <div class="control-group speed-control">
        <label>Speed:</label>
        <select 
          v-model.number="playbackRate" 
          @change="onSpeedChange" 
          title="Playback Speed" 
          ref="speedSelectRef"
          class="speed-select"
        >
          <option :value="0.5">0.5x</option>
          <option :value="0.75">0.75x</option>
          <option :value="1">1x</option>
          <option :value="1.25">1.25x</option>
          <option :value="1.5">1.5x</option>
          <option :value="2">2x</option>
        </select>
      </div>

      <span 
        class="bpm-display"
        style="display: inline; color: var(--theme-primary); font-weight: 600; margin-left: 15px; padding: 4px 8px; background: rgba(var(--theme-primary-rgb), 0.1); border-radius: 3px;"
      >
        {{ bpm || '--' }} BPM
      </span>
      <span 
        class="key-display"
        style="display: inline; color: var(--theme-primary); font-weight: 600; margin-left: 10px; padding: 4px 8px; background: rgba(var(--theme-primary-rgb), 0.1); border-radius: 3px;"
      >
        {{ key || '--' }} Key
      </span>
    </div>

    <!-- Album Art Modal -->
    <div 
      v-if="showAlbumArtModal && albumArt" 
      class="album-art-modal"
      @click="closeAlbumArtModal"
    >
      <img 
        :src="albumArt" 
        alt="Album Art" 
        class="album-art-zoomed"
        @click.stop
      />
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted, watch, nextTick } from 'vue';
import { useAudioStore } from '../stores/audio.js';
import { useUIStore } from '../stores/ui.js';
import { useSettingsStore } from '../stores/settings.js';
import { formatTime } from '../utils/formatTime.js';
import { useVolumeHistory } from '../composables/useVolumeHistory.js';

const audioStore = useAudioStore();
const uiStore = useUIStore();
const settingsStore = useSettingsStore();

// Refs
const volumeHistoryCanvas = ref(null);
const progressBarRef = ref(null);
const nowPlayingArtRef = ref(null);
const speedSelectRef = ref(null);
const showAlbumArtModal = ref(false);

// Volume history composable
let volumeHistory = null;
let analyserCheckInterval = null;

// Computed properties
const isPlaying = computed(() => audioStore.isPlaying);
const title = computed(() => audioStore.title);
const artist = computed(() => audioStore.artist);
const album = computed(() => audioStore.album);
const albumArt = computed(() => audioStore.albumArt);
const currentTime = computed(() => audioStore.currentTime);
const duration = computed(() => audioStore.duration);
const volume = computed(() => audioStore.volume);
const playbackRate = computed({
  get: () => audioStore.playbackRate,
  set: (value) => audioStore.setPlaybackRate(value)
});
const shuffle = computed(() => audioStore.shuffle);
const repeatMode = computed(() => audioStore.repeat);
const bpm = computed(() => audioStore.bpm);
const key = computed(() => {
  const storedKey = audioStore.key;
  if (!storedKey || !window.keyDetector) return '--';
  
  // Get notation format from settings
  const notation = settingsStore.keyNotation || 'camelot';
  
  // If key is already in the format we want, return it
  // Otherwise, try to parse and reformat using keyDetector
  if (window.keyDetector.getKeyDisplay) {
    // Check if keyDetector has the detected key set
    const detectorKey = window.keyDetector.getKey();
    const detectorScale = window.keyDetector.getScale();
    
    if (detectorKey && detectorScale) {
      return window.keyDetector.getKeyDisplay(notation);
    }
    
    // Fallback: try to parse the stored key string
    // If it's in format "C major" or "A minor", we can use it
    if (storedKey.includes('major') || storedKey.includes('minor')) {
      const parts = storedKey.split(' ');
      if (parts.length >= 2) {
        window.keyDetector.setKey(parts[0], parts[1]);
        return window.keyDetector.getKeyDisplay(notation);
      }
    }
  }
  
  return storedKey;
});
const gain = computed(() => audioStore.gain);
const hasNext = computed(() => audioStore.hasNext);
const hasPrevious = computed(() => audioStore.hasPrevious);
const canPlay = computed(() => audioStore.currentTrack !== null);

const formattedCurrentTime = computed(() => formatTime(currentTime.value));
const formattedDuration = computed(() => formatTime(duration.value));
const progressPercent = computed(() => {
  if (duration.value <= 0) return 0;
  return Math.min((currentTime.value / duration.value) * 100, 100);
});

const volumePercent = computed({
  get: () => Math.round(volume.value * 100),
  set: (value) => {
    const vol = value / 100;
    audioStore.setVolume(vol);
    // Update volume gain node (affects output only, not visualizer intensity)
    if (window.spectra && window.spectra.audioPlayer && window.spectra.audioPlayer.setVolume) {
      window.spectra.audioPlayer.setVolume(vol);
    } else if (window.gainNode) {
      // Fallback: apply directly to gainNode
      window.gainNode.gain.value = vol;
    }
    // Save to localStorage
    localStorage.setItem('audioVolume', vol.toString());
  }
});

// Watch for volume changes in store and update UI if needed (after volumePercent is defined)
// Note: We don't need this watch since volumePercent.get() already reads from audioStore.volume
// The computed property will automatically update when the store changes
// This watch was causing initialization issues, so it's removed

const repeatTitle = computed(() => {
  switch (repeatMode.value) {
    case 'off': return 'Repeat Off';
    case 'all': return 'Repeat All';
    case 'one': return 'Repeat One';
    default: return 'Repeat Off';
  }
});

// Methods
const play = () => {
  // Check for external audio (YouTube) FIRST - this takes priority
  if (window.audioManager && window.audioManager.externalAudio) {
    const audioEl = window.audioManager.externalAudio;
    if (audioEl && audioEl.paused) {
      audioEl.play().then(() => {
        audioStore.setPlaying(true);
      }).catch(err => {
        console.warn('[AudioPlayer] Failed to play external audio:', err);
      });
      return;
    }
  }
  
  // Try new Spectra API for local files
  if (window.spectra && window.spectra.isInitialized) {
    const played = window.spectra.play();
    if (played) {
      audioStore.setPlaying(true);
      return;
    }
  }
  
  // Fallback to AudioFileLoader
  if (window.audioFileLoader && window.audioFileLoader.play) {
    const played = window.audioFileLoader.play();
    if (played) {
      audioStore.setPlaying(true);
      return;
    }
  }
  
  // Fallback to legacy audioManager
  if (window.audioManager && window.audioManager.play) {
    window.audioManager.play();
    audioStore.setPlaying(true);
  }
};

const pause = () => {
  // Check for external audio (YouTube) FIRST - this takes priority
  if (window.audioManager && window.audioManager.externalAudio) {
    const audioEl = window.audioManager.externalAudio;
    if (audioEl && !audioEl.paused) {
      audioEl.pause();
      audioStore.setPlaying(false);
      return;
    }
  }
  
  // Try new Spectra API for local files
  if (window.spectra && window.spectra.isInitialized) {
    const paused = window.spectra.pause();
    if (paused) {
      audioStore.setPlaying(false);
      return;
    }
  }
  
  // Fallback to AudioFileLoader
  if (window.audioFileLoader && window.audioFileLoader.pause) {
    const paused = window.audioFileLoader.pause();
    if (paused) {
      audioStore.setPlaying(false);
      return;
    }
  }
  
  // Fallback to legacy audioManager
  if (window.audioManager && window.audioManager.pause) {
    window.audioManager.pause();
    audioStore.setPlaying(false);
  }
};

const previousTrack = () => {
  if (window.audioManager && window.audioManager.previousTrack) {
    window.audioManager.previousTrack();
  }
};

const nextTrack = () => {
  if (window.audioManager && window.audioManager.nextTrack) {
    window.audioManager.nextTrack();
  }
};

const toggleShuffle = () => {
  audioStore.setShuffle(!shuffle.value);
};

const toggleRepeat = () => {
  const modes = ['off', 'all', 'one'];
  const currentIndex = modes.indexOf(repeatMode.value);
  const nextMode = modes[(currentIndex + 1) % modes.length];
  audioStore.setRepeat(nextMode);
};

const increaseGain = () => {
  const newGain = Math.min(gain.value + 3, 12);
  audioStore.setGain(newGain);
  // Apply DB gain to dbGainNode (affects visualizer intensity, not output volume)
  if (window.spectra && window.spectra.audioPlayer && window.spectra.audioPlayer.setGainDB) {
    window.spectra.audioPlayer.setGainDB(newGain);
  } else if (window.dbGainNode) {
    // Fallback: apply directly to dbGainNode
    const linearGain = Math.pow(10, newGain / 20);
    window.dbGainNode.gain.value = linearGain;
    localStorage.setItem('audioGainDB', newGain.toString());
  }
};

const decreaseGain = () => {
  const newGain = Math.max(gain.value - 3, -24);
  audioStore.setGain(newGain);
  // Apply DB gain to dbGainNode (affects visualizer intensity, not output volume)
  if (window.spectra && window.spectra.audioPlayer && window.spectra.audioPlayer.setGainDB) {
    window.spectra.audioPlayer.setGainDB(newGain);
  } else if (window.dbGainNode) {
    // Fallback: apply directly to dbGainNode
    const linearGain = Math.pow(10, newGain / 20);
    window.dbGainNode.gain.value = linearGain;
    localStorage.setItem('audioGainDB', newGain.toString());
  }
};

const formatGain = (gainValue) => {
  const sign = gainValue >= 0 ? '+' : '';
  return `${sign}${gainValue}dB`;
};

const toggleQueue = () => {
  uiStore.toggleQueuePanel();
};

const openAlbumArtModal = () => {
  if (albumArt.value) {
    showAlbumArtModal.value = true;
  }
};

const closeAlbumArtModal = () => {
  showAlbumArtModal.value = false;
};

const seekTo = (event) => {
  if (!progressBarRef.value || duration.value <= 0) return;
  const rect = progressBarRef.value.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const percent = Math.max(0, Math.min(1, x / rect.width));
  const seekTime = percent * duration.value;
  
  console.log('[AudioPlayer] Seeking to:', seekTime, 'seconds (', percent * 100, '%)');
  
  // Try new Spectra API first
  if (window.spectra && window.spectra.audioPlayer && window.spectra.audioPlayer.seekTo) {
    window.spectra.audioPlayer.seekTo(seekTime);
    // Update store immediately for responsive UI
    audioStore.setTime(seekTime, duration.value);
    return;
  }
  
  // Fallback to audioManager
  if (window.audioManager && window.audioManager.seekTo) {
    window.audioManager.seekTo(seekTime);
    audioStore.setTime(seekTime, duration.value);
    return;
  }
  
  // Handle external audio (YouTube) - seek directly on audio element
  if (window.audioManager && window.audioManager.externalAudio) {
    const audioEl = window.audioManager.externalAudio;
    if (audioEl && audioEl.duration > 0) {
      audioEl.currentTime = seekTime;
      audioStore.setTime(seekTime, audioEl.duration);
      return;
    }
  }
  
  // Fallback to audioFileLoader
  if (window.audioFileLoader && window.audioFileLoader.seekTo) {
    window.audioFileLoader.seekTo(seekTime);
    audioStore.setTime(seekTime, duration.value);
    return;
  }
  
  console.warn('[AudioPlayer] No seek method available');
};

const updateProgressHover = (event) => {
  // Could add hover preview here
};

const hideProgressHover = () => {
  // Could hide hover preview here
};

const onVolumeChange = (event) => {
  const value = parseInt(event.target.value);
  volumePercent.value = value;
  // Update CSS variable for gradient
  if (event.target) {
    event.target.style.setProperty('--volume-percent', `${value}%`);
  }
};

const onSpeedChange = (event) => {
  const rate = parseFloat(event.target.value);
  playbackRate.value = rate;
  // Apply to audio source
  if (window.audioManager && window.audioManager.setPlaybackRate) {
    window.audioManager.setPlaybackRate(rate);
  }
};

// Initialize volume history
onMounted(async () => {
  await nextTick();
  
  // Listen for BPM detection events
  window.addEventListener('bpm-detected', (event) => {
    const { bpm } = event.detail;
    if (bpm) {
      audioStore.setBPM(bpm);
      console.log('[AudioPlayer] BPM updated in store:', bpm);
    }
  });
  
  // Listen for Key detection events
  window.addEventListener('key-detected', (event) => {
    const { key, rawKey } = event.detail;
    if (key) {
      // Store the formatted key
      audioStore.setKey(key);
      
      // Also update keyDetector's internal state so getKeyDisplay works correctly
      if (window.keyDetector && rawKey) {
        // Parse rawKey (e.g., "C major" or "A minor")
        const parts = rawKey.split(' ');
        if (parts.length >= 2) {
          window.keyDetector.setKey(parts[0], parts[1]);
        }
      }
      
      console.log('[AudioPlayer] Key updated in store:', key);
    }
  });
  
  // Watch for notation format changes and update key display
  watch(() => settingsStore.keyNotation, () => {
    if (window.keyDetector && audioStore.key) {
      const notation = settingsStore.keyNotation || 'camelot';
      const formattedKey = window.keyDetector.getKeyDisplay(notation);
      if (formattedKey && formattedKey !== '--') {
        audioStore.setKey(formattedKey);
      }
    }
  });
  
  // Listen for audio file loaded events from renderer.js
  window.addEventListener('audio-file-loaded', (event) => {
    const { file, index, duration } = event.detail;
    console.log('[AudioPlayer] Audio file loaded event received:', file.name);
    
    // Try to get metadata
    let title = file.name;
    let artist = '';
    let album = '';
    if (window.metadataCache) {
      const metadata = window.metadataCache.get(file.path);
      if (metadata) {
        title = metadata.title || file.name;
        artist = metadata.artist || '';
        album = metadata.album || '';
      } else {
        // Parse filename
        if (window.parseFileName) {
          const parsed = window.parseFileName(file.name);
          title = parsed.title;
          artist = parsed.artist || '';
          album = parsed.album || '';
        }
      }
    } else if (window.parseFileName) {
      const parsed = window.parseFileName(file.name);
      title = parsed.title;
      artist = parsed.artist || '';
      album = parsed.album || '';
    }
    
    // Clean up artist name - remove downloader service names like "SpotiDown.App"
    if (artist && artist.includes(' - ')) {
      const parts = artist.split(' - ');
      // If the first part looks like a service name, use the second part
      if (parts.length > 1 && (parts[0].includes('App') || parts[0].includes('Download'))) {
        artist = parts.slice(1).join(' - ');
      }
    }
    
    // Update audio store - set currentTrack so play button is enabled
    audioStore.setCurrentTrack({
      name: file.name,
      path: file.path,
      title: title,
      artist: artist,
      album: album
    });
    audioStore.setCurrentIndex(index);
    audioStore.setTime(0, duration);
    audioStore.title = title;
    audioStore.artist = artist;
    audioStore.album = album;
    
    // Try to get album art
    if (window.albumArtManager) {
      window.albumArtManager.extractAlbumArt(file.path).then(artUrl => {
        if (artUrl) {
          audioStore.setAlbumArt(artUrl);
        }
      }).catch(() => {
        // Ignore errors
      });
    }
  });
  
  // Initialize volume history canvas
  volumeHistory = useVolumeHistory('volumeHistoryCanvas', window.analyser || null);
  
  // Wait a bit for canvas to be in DOM, then initialize
  setTimeout(async () => {
    await nextTick();
    if (volumeHistory && volumeHistory.init) {
      await volumeHistory.init();
      // Update analyser reference
      if (window.analyser) {
        volumeHistory.updateAnalyser(window.analyser);
      }
    }
  }, 100);
  
  // Initialize custom select for speed dropdown
  await nextTick();
  const initSpeedSelect = () => {
    const speedSelect = speedSelectRef.value;
    if (!speedSelect) {
      console.warn('Speed select element not found');
      return;
    }
    if (!window.createCustomSelect) {
      console.warn('window.createCustomSelect not available yet');
      return;
    }
    
    // Check if already initialized
    if (speedSelect.nextElementSibling?.classList.contains('custom-select')) {
      console.log('Speed select already has custom select');
      return;
    }
    
    console.log('Initializing speed select:', speedSelect);
    try {
      window.createCustomSelect(speedSelect);
      console.log('Speed select initialized successfully');
    } catch (error) {
      console.error('Error initializing speed select:', error);
    }
  };
  
  // Wait for createCustomSelect to be available
  const waitForCreateCustomSelect = () => {
    if (window.createCustomSelect) {
      initSpeedSelect();
    } else {
      setTimeout(waitForCreateCustomSelect, 100);
    }
  };
  
  // Start checking after a short delay
  setTimeout(waitForCreateCustomSelect, 100);
  
  // Load saved volume and ensure UI and gainNode are synced
  // Wait a bit to ensure store is fully initialized
  await nextTick();
  await new Promise(resolve => setTimeout(resolve, 50));
  
  const savedVolume = parseFloat(localStorage.getItem('audioVolume'));
  const volumeToUse = (savedVolume !== null && !isNaN(savedVolume)) ? savedVolume : 1.0;
  
  console.log('[AudioPlayer] Loading volume - localStorage:', savedVolume, 'Using:', volumeToUse, 'Store volume:', audioStore.volume);
  
  // Always set the volume through the store to ensure reactivity
  audioStore.setVolume(volumeToUse);
  
  // Wait for reactivity to propagate
  await nextTick();
  
  // Check what the computed property currently shows
  const currentPercent = volumePercent.value;
  const expectedPercent = Math.round(volumeToUse * 100);
  console.log('[AudioPlayer] Current slider value:', currentPercent + '%', 'Expected:', expectedPercent + '%');
  
  // Force update if there's a mismatch
  if (currentPercent !== expectedPercent) {
    console.log('[AudioPlayer] Mismatch detected! Forcing update...');
    // Directly set the value - this will trigger the setter
    volumePercent.value = expectedPercent;
    await nextTick();
    console.log('[AudioPlayer] After update, slider value:', volumePercent.value + '%');
  }
  
  // Also directly apply to gainNode as a fallback (in case setter didn't work)
  if (window.spectra && window.spectra.audioPlayer && window.spectra.audioPlayer.setVolume) {
    window.spectra.audioPlayer.setVolume(volumeToUse);
    console.log('[AudioPlayer] Applied volume to Spectra audioPlayer');
  } else if (window.gainNode) {
    window.gainNode.gain.value = volumeToUse;
    console.log('[AudioPlayer] Applied volume to gainNode:', window.gainNode.gain.value);
  } else {
    console.warn('[AudioPlayer] No gainNode available to apply volume');
  }
  
  // Load saved DB gain and apply it (affects visualizer intensity)
  const savedGainDB = parseFloat(localStorage.getItem('audioGainDB'));
  if (savedGainDB !== null && !isNaN(savedGainDB)) {
    audioStore.setGain(savedGainDB);
    // Apply to dbGainNode when available
    const applyGain = () => {
      if (window.spectra && window.spectra.audioPlayer && window.spectra.audioPlayer.setGainDB) {
        window.spectra.audioPlayer.setGainDB(savedGainDB);
      } else if (window.dbGainNode) {
        const linearGain = Math.pow(10, savedGainDB / 20);
        window.dbGainNode.gain.value = linearGain;
      }
    };
    // Try immediately, and also after a delay in case audio isn't ready yet
    applyGain();
    setTimeout(applyGain, 500);
  }
  
  // Watch for analyser changes to update volume history
  const checkAnalyser = () => {
    if (window.analyser && volumeHistory) {
      volumeHistory.updateAnalyser(window.analyser);
      if (isPlaying.value) {
        volumeHistory.start();
      }
    }
  };
  
  // Check immediately and periodically
  checkAnalyser();
  analyserCheckInterval = setInterval(checkAnalyser, 1000);
  
  // Set up time update interval
  const updateTime = () => {
    // Check for external audio first (YouTube, etc.)
    if (window.audioManager && window.audioManager.externalAudio) {
      const audioEl = window.audioManager.externalAudio;
      if (audioEl && audioEl.readyState >= 2) { // HAVE_CURRENT_DATA or higher
        const current = audioEl.currentTime || 0;
        const duration = audioEl.duration || 0;
        // Only update if we have valid duration (prevents resetting to 0:00)
        if (duration > 0 && !isNaN(duration) && !isNaN(current)) {
          audioStore.setTime(current, duration);
        }
      }
      return; // Don't check other sources if external audio is playing
    }
    
    // Check for Spectra audio player
    if (window.spectra && window.spectra.audioPlayer) {
      const current = window.spectra.audioPlayer.getCurrentTime();
      const duration = window.spectra.audioPlayer.getDuration();
      if (duration > 0 && !isNaN(duration) && !isNaN(current)) {
        audioStore.setTime(current, duration);
      }
    } else if (window.audioFileLoader) {
      const current = window.audioFileLoader.getCurrentTime();
      const duration = window.audioFileLoader.getDuration();
      if (duration > 0 && !isNaN(duration) && !isNaN(current)) {
        audioStore.setTime(current, duration);
      }
    }
  };
  
  // Start time update interval (update every 100ms)
  const timeUpdateInterval = setInterval(updateTime, 100);
  
  // Store interval for cleanup
  window._audioPlayerTimeInterval = timeUpdateInterval;
});

// Cleanup on unmount
onUnmounted(() => {
  if (analyserCheckInterval) {
    clearInterval(analyserCheckInterval);
    analyserCheckInterval = null;
  }
  if (window._audioPlayerTimeInterval) {
    clearInterval(window._audioPlayerTimeInterval);
    window._audioPlayerTimeInterval = null;
  }
  if (volumeHistory) {
    volumeHistory.stop();
  }
});

// Watch for playing state to start/stop volume history
watch(isPlaying, (playing) => {
  if (volumeHistory) {
    if (playing && window.analyser) {
      volumeHistory.start();
    } else {
      volumeHistory.stop();
    }
  }
});
</script>

<style scoped>
/* Styles are in global styles.css, but we can add component-specific overrides here if needed */
.audio-player {
  width: 100%;
}

.now-playing-art.clickable {
  cursor: pointer;
  transition: transform 0.2s ease, opacity 0.2s ease;
}

.now-playing-art.clickable:hover {
  transform: scale(1.05);
  opacity: 0.9;
}

.album-art-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  cursor: pointer;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.album-art-zoomed {
  max-width: 90vw;
  max-height: 90vh;
  width: auto;
  height: auto;
  object-fit: contain;
  border-radius: 8px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
  animation: zoomIn 0.3s ease;
  cursor: default;
}

@keyframes zoomIn {
  from {
    transform: scale(0.8);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}
</style>

