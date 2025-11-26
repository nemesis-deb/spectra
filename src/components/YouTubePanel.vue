<template>
  <div v-if="isOpen" class="youtube-panel sidebar" id="youtubePanel">
    <div class="sidebar-content">
      <!-- Search Section -->
      <div class="youtube-search-section">
        <div class="search-input-wrapper">
          <input 
            type="text" 
            v-model="searchQuery"
            @keyup.enter="searchVideos"
            id="youtubeSidebarSearch" 
            placeholder="Search YouTube..." 
            autocomplete="off"
            class="youtube-search-input"
          />
          <button 
            @click="searchVideos"
            :disabled="isSearching || !searchQuery.trim()"
            class="youtube-search-btn"
            id="youtubeSidebarSearchBtn"
          >
            <svg v-if="!isSearching" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <svg v-else class="spinner" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10" />
            </svg>
          </button>
        </div>
      </div>
      
      <!-- Results Section -->
      <div class="youtube-results-section" id="youtubeResultsSidebar">
        <!-- Empty State -->
        <div v-if="searchResults.length === 0 && !isSearching" class="youtube-empty-state">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="currentColor">
            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
          </svg>
          <p class="empty-state-title">Search YouTube</p>
          <p class="empty-state-subtitle">Find and play videos with audio visualization</p>
        </div>
        
        <!-- Loading State -->
        <div v-if="isSearching" class="youtube-loading-state">
          <div class="loading-spinner"></div>
          <p>Searching...</p>
        </div>
        
        <!-- Video Results -->
        <div 
          v-for="(video, index) in searchResults" 
          :key="index"
          @click="playVideo(video)"
          class="youtube-video-item"
        >
          <div class="video-thumbnail-wrapper">
            <img 
              v-if="video.thumbnail" 
              :src="video.thumbnail" 
              alt="Thumbnail"
              class="video-thumbnail"
            />
            <div v-if="video.duration" class="video-duration-badge">
              {{ formatDuration(video.duration) }}
            </div>
            <div class="video-play-overlay">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="10,8 10,16 16,12" />
              </svg>
            </div>
          </div>
          <div class="video-info">
            <div class="video-title">{{ video.title }}</div>
            <div class="video-channel">{{ video.channel || video.channelTitle || 'YouTube' }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useUIStore } from '../stores/ui.js';
import { useElectronIPC } from '../composables/useElectronIPC.js';

const uiStore = useUIStore();
const { send, on, invoke } = useElectronIPC();

const searchQuery = ref('');
const searchResults = ref([]);
const isSearching = ref(false);

const isOpen = computed(() => uiStore.activeSidebarTab === 'youtube');

// No close button - tabs handle switching

// Initialize YouTube integration when panel opens
watch(() => uiStore.youtubePanelOpen, (open) => {
  if (open) {
    // Force initialization if integration exists but isn't ready
    setTimeout(() => {
      if (window.initYouTubeIntegration && !window.youtubeIntegration) {
        console.log('[YouTube Panel] Forcing integration initialization...');
        try {
          window.initYouTubeIntegration();
        } catch (e) {
          console.error('[YouTube Panel] Error initializing:', e);
        }
      } else if (window.youtubeIntegration && !window.youtubeIntegration._ready()) {
        console.log('[YouTube Panel] Integration exists but not ready, initializing...');
        try {
          window.youtubeIntegration.initializeYouTube();
        } catch (e) {
          console.error('[YouTube Panel] Error initializing integration:', e);
        }
      }
    }, 100);
  }
});

// Also initialize on mount if panel is already open
onMounted(() => {
  // Force initialization on mount
  setTimeout(() => {
    if (window.initYouTubeIntegration && !window.youtubeIntegration) {
      console.log('[YouTube Panel] Mount: Forcing integration initialization...');
      try {
        window.initYouTubeIntegration();
      } catch (e) {
        console.error('[YouTube Panel] Mount: Error initializing:', e);
      }
    } else if (window.youtubeIntegration && !window.youtubeIntegration._ready()) {
      console.log('[YouTube Panel] Mount: Integration exists but not ready, initializing...');
      try {
        window.youtubeIntegration.initializeYouTube();
      } catch (e) {
        console.error('[YouTube Panel] Mount: Error initializing integration:', e);
      }
    }
  }, 100);
});

const searchVideos = async () => {
  if (!searchQuery.value.trim()) return;
  
  isSearching.value = true;
  searchResults.value = [];
  
  try {
    // Use YouTubeSearch directly (integration's searchYouTube expects DOM elements)
    if (window.YouTubeSearch) {
      const youtubeSearch = new window.YouTubeSearch();
      const apiKey = 'AIzaSyBsMmyjyWaFGeziczXZrnWWJWCJC-rIyoI'; // TODO: Load from settings
      youtubeSearch.init(apiKey);
      const results = await youtubeSearch.searchVideos(searchQuery.value, 20);
      searchResults.value = results || [];
    } else {
      // Fallback: send IPC message
      send('youtube-search', { query: searchQuery.value });
    }
  } catch (error) {
    console.error('YouTube search error:', error);
    alert('Failed to search YouTube. Please check your API key or try again.');
  } finally {
    isSearching.value = false;
  }
};

const playVideo = async (video) => {
  // Extract videoId from video object
  const videoId = video.id || video.videoId || video.video?.id;
  
  if (!videoId) {
    console.error('No video ID found in video object:', video);
    return;
  }
  
  console.log('[YouTube Panel] Playing video:', videoId);
  
  // Wait for YouTube integration to be available
  const waitForIntegration = async (maxWait = 5000) => {
    const startTime = Date.now();
    while (Date.now() - startTime < maxWait) {
      // Check if integration object exists and has the playYouTubeVideo function
      if (window.youtubeIntegration && typeof window.youtubeIntegration.playYouTubeVideo === 'function') {
        // Check if it's actually initialized (has the classes ready)
        if (window.youtubeIntegration._ready && window.youtubeIntegration._ready()) {
          console.log('[YouTube Panel] Integration is ready');
          return window.youtubeIntegration;
        } else {
          // Integration object exists but not initialized yet, try to initialize
          console.log('[YouTube Panel] Integration object exists but not initialized, attempting to initialize...');
          try {
            await window.youtubeIntegration.initializeYouTube();
            if (window.youtubeIntegration._ready && window.youtubeIntegration._ready()) {
              return window.youtubeIntegration;
            }
          } catch (e) {
            console.warn('[YouTube Panel] Initialization error:', e);
          }
        }
      }
      
      // Try to initialize if function exists but integration object doesn't
      if (window.initYouTubeIntegration && !window.youtubeIntegration) {
        console.log('[YouTube Panel] Attempting to initialize integration...');
        try {
          window.initYouTubeIntegration();
        } catch (e) {
          console.warn('[YouTube Panel] Init function error:', e);
        }
      }
      
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    console.error('[YouTube Panel] Integration not available after waiting. YouTubeSearch:', !!window.YouTubeSearch, 'YouTubeAudio:', !!window.YouTubeAudio, 'youtubeIntegration:', !!window.youtubeIntegration);
    return null;
  };
  
  // Wait for integration to be ready
  const integration = await waitForIntegration();
  
  if (integration && integration.playYouTubeVideo) {
    try {
      console.log('[YouTube Panel] Using integration playYouTubeVideo');
      // Pass video metadata if available
      const videoMetadata = {
        title: video.title || video.snippet?.title,
        channel: video.channel || video.snippet?.channelTitle,
        thumbnail: video.thumbnail || video.snippet?.thumbnails?.medium?.url || video.snippet?.thumbnails?.default?.url
      };
      await integration.playYouTubeVideo(videoId, videoMetadata);
      return;
    } catch (error) {
      console.error('Error playing YouTube video via integration:', error);
      alert('Failed to play YouTube video: ' + (error.message || 'Unknown error'));
      return;
    }
  }
  
  // If we still don't have the integration, show an error
  alert('YouTube integration is not available. Please wait a moment and try again, or refresh the page.');
  console.error('[YouTube Panel] Cannot play video - integration not available after waiting');
};

const formatDuration = (duration) => {
  if (!duration) return '';
  
  // Handle ISO 8601 duration format (PT1H2M10S)
  if (typeof duration === 'string' && duration.startsWith('PT')) {
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (match) {
      const hours = parseInt(match[1] || 0);
      const minutes = parseInt(match[2] || 0);
      const seconds = parseInt(match[3] || 0);
      
      if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      }
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
  }
  
  // Handle seconds as number
  if (typeof duration === 'number') {
    const mins = Math.floor(duration / 60);
    const secs = Math.floor(duration % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
  
  return duration;
};

// Listen for YouTube search results
on('youtube-search-results', (event, results) => {
  searchResults.value = results || [];
  isSearching.value = false;
});
</script>

<style scoped>
.sidebar-content {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.youtube-search-section {
  padding: 15px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  flex-shrink: 0;
}

.search-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 0 12px;
  transition: all 0.2s;
}

.search-input-wrapper:focus-within {
  border-color: var(--theme-primary, #00ff88);
  background: rgba(255, 255, 255, 0.08);
  box-shadow: 0 0 0 3px rgba(0, 255, 136, 0.1);
}

.search-icon {
  color: #888;
  flex-shrink: 0;
}

.youtube-search-input {
  flex: 1;
  background: transparent;
  border: none;
  color: #fff;
  font-size: 13px;
  padding: 10px 0;
  outline: none;
}

.youtube-search-input::placeholder {
  color: #666;
}

.youtube-search-btn {
  background: var(--theme-primary, #00ff88);
  border: none;
  border-radius: 6px;
  color: #000;
  padding: 6px 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  flex-shrink: 0;
  font-weight: 600;
}

.youtube-search-btn:hover:not(:disabled) {
  background: var(--theme-primary-hover, #00dd77);
  transform: scale(1.05);
}

.youtube-search-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.youtube-results-section {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
}

.youtube-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
  color: #666;
}

.youtube-empty-state svg {
  color: var(--theme-primary, #00ff88);
  margin-bottom: 16px;
  opacity: 0.6;
  filter: drop-shadow(0 2px 8px rgba(0, 255, 136, 0.3));
}

.empty-state-title {
  font-size: 15px;
  font-weight: 600;
  color: #aaa;
  margin: 0 0 6px 0;
}

.empty-state-subtitle {
  font-size: 12px;
  color: #666;
  margin: 0;
}

.youtube-loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: #888;
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid rgba(0, 255, 136, 0.2);
  border-top-color: var(--theme-primary, #00ff88);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 12px;
}

.youtube-video-item {
  display: flex;
  gap: 12px;
  padding: 10px;
  margin-bottom: 8px;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid transparent;
}

.youtube-video-item:hover {
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(0, 255, 136, 0.2);
  transform: translateX(2px);
}

.video-thumbnail-wrapper {
  position: relative;
  width: 120px;
  height: 68px;
  flex-shrink: 0;
  border-radius: 6px;
  overflow: hidden;
  background: #1a1a1a;
}

.video-thumbnail {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.video-duration-badge {
  position: absolute;
  bottom: 4px;
  right: 4px;
  background: rgba(0, 0, 0, 0.8);
  color: #fff;
  font-size: 10px;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 3px;
}

.video-play-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s;
  color: #fff;
}

.youtube-video-item:hover .video-play-overlay {
  opacity: 1;
}

.video-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 4px;
}

.video-title {
  color: #fff;
  font-size: 13px;
  font-weight: 500;
  line-height: 1.4;
  display: -webkit-box;
  line-clamp: 2;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

.video-channel {
  color: #888;
  font-size: 11px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>

