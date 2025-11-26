<template>
  <div v-if="isOpen" class="spotify-panel sidebar" id="spotifyPanel">
    <div class="sidebar-content">
      <!-- Login State -->
      <div v-if="!isConnected" class="spotify-login-state" id="spotifyLogin">
        <div class="login-icon">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.42 1.56-.299.421-1.02.599-1.559.3z"/>
          </svg>
        </div>
        <h3 class="login-title">Connect Spotify</h3>
        <p class="login-subtitle">Access your playlists and search tracks</p>
        <button 
          @click="connectSpotify"
          id="spotifyLoginBtn"
          class="spotify-connect-btn"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.42 1.56-.299.421-1.02.599-1.559.3z"/>
          </svg>
          Connect Spotify
        </button>
      </div>
      
      <!-- Connected State -->
      <div v-else class="spotify-connected-state" id="spotifyConnected">
        <!-- User Info Bar -->
        <div class="spotify-user-bar">
          <div class="user-info">
            <svg class="user-status-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M8 12l2 2 4-4" stroke-linecap="round" />
            </svg>
            <div class="user-details">
              <div id="spotifyUsername" class="username">{{ username }}</div>
              <div class="user-status">Connected</div>
            </div>
          </div>
          <button 
            @click="disconnectSpotify"
            id="spotifyLogoutBtn"
            class="disconnect-btn"
          >
            Disconnect
          </button>
        </div>
        
        <!-- Actions -->
        <div class="spotify-actions">
          <button 
            @click="loadPlaylists"
            id="loadPlaylistsBtn"
            class="spotify-action-btn"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Load Playlists
          </button>
        </div>
        
        <!-- Search -->
        <div class="spotify-search-wrapper">
          <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input 
            type="text" 
            v-model="searchQuery"
            @keyup.enter="searchTracks"
            id="spotifySearchInput" 
            placeholder="Search tracks..."
            class="spotify-search-input"
          />
          <button 
            @click="searchTracks"
            :disabled="isLoadingSearch || !searchQuery.trim()"
            class="spotify-search-btn"
          >
            <svg v-if="!isLoadingSearch" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <div v-else class="loading-spinner-small"></div>
          </button>
        </div>
        
        <!-- View Tabs -->
        <div class="spotify-view-tabs">
          <button 
            @click="currentView = 'search'"
            :class="{ active: currentView === 'search' }"
            class="view-tab"
          >
            Search Results
            <span v-if="searchResults.length > 0" class="tab-count">{{ searchResults.length }}</span>
          </button>
          <button 
            @click="currentView = 'playlists'"
            :class="{ active: currentView === 'playlists' }"
            class="view-tab"
          >
            Playlists
            <span v-if="playlists.length > 0" class="tab-count">{{ playlists.length }}</span>
          </button>
        </div>
        
        <!-- Content Section -->
        <div class="spotify-results-section">
          <!-- Search Results View -->
          <div v-if="currentView === 'search'">
            <div v-if="isLoadingSearch" class="spotify-loading-state">
              <div class="loading-spinner"></div>
              <p class="loading-text">Searching...</p>
            </div>
            <div v-else-if="searchResults.length === 0" class="spotify-empty-state">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.42 1.56-.299.421-1.02.599-1.559.3z"/>
              </svg>
              <p class="empty-text">Search for tracks to get started</p>
            </div>
            
            <div 
              v-for="(track, index) in searchResults" 
              :key="`track-${track.id || index}`"
              @click="playTrack(track)"
              class="spotify-track-item"
            >
              <div class="track-artwork">
                <img 
                  v-if="track.album?.images?.[0]?.url" 
                  :src="track.album.images[0].url" 
                  alt="Album art"
                  class="track-image"
                />
                <div v-else class="track-image-placeholder">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
                  </svg>
                </div>
                <div class="track-play-overlay">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="10,8 10,16 16,12" />
                  </svg>
                </div>
              </div>
              <div class="track-info">
                <div class="track-name">{{ track.name }}</div>
                <div class="track-artist">{{ track.artists?.map(a => a.name).join(', ') || 'Unknown Artist' }}</div>
              </div>
            </div>
          </div>
          
          <!-- Playlists View -->
          <div v-else-if="currentView === 'playlists'">
            <div v-if="isLoadingPlaylists" class="spotify-loading-state">
              <div class="loading-spinner"></div>
              <p class="loading-text">Loading playlists...</p>
            </div>
            <div v-else-if="playlists.length === 0" class="spotify-empty-state">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.42 1.56-.299.421-1.02.599-1.559.3z"/>
              </svg>
              <p class="empty-text">Click "Load Playlists" to view your playlists</p>
            </div>
            
            <div 
              v-for="(playlist, index) in playlists" 
              :key="`playlist-${playlist.id || index}`"
              class="spotify-playlist-item"
            >
              <div class="playlist-artwork">
                <img 
                  v-if="playlist.images?.[0]?.url" 
                  :src="playlist.images[0].url" 
                  alt="Playlist art"
                  class="playlist-image"
                />
                <div v-else class="playlist-image-placeholder">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.42 1.56-.299.421-1.02.599-1.559.3z"/>
                  </svg>
                </div>
              </div>
              <div class="playlist-info">
                <div class="playlist-name">{{ playlist.name }}</div>
                <div class="playlist-meta">{{ playlist.tracks?.total || 0 }} tracks</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useUIStore } from '../stores/ui.js';
import { useElectronIPC } from '../composables/useElectronIPC.js';

const uiStore = useUIStore();
const { send, on } = useElectronIPC();

const isConnected = ref(false);
const username = ref('');
const accessToken = ref(null);
const refreshToken = ref(null);
const searchQuery = ref('');
const searchResults = ref([]);
const playlists = ref([]);
const isLoadingPlaylists = ref(false);
const isLoadingSearch = ref(false);
const currentView = ref('search'); // 'search' or 'playlists'

const isOpen = computed(() => uiStore.activeSidebarTab === 'spotify');

const connectSpotify = () => {
  if (window.spotifyIntegration && window.spotifyIntegration.connect) {
    window.spotifyIntegration.connect();
  } else {
    send('spotify-login');
  }
};

const disconnectSpotify = () => {
  if (window.spotifyIntegration && window.spotifyIntegration.disconnect) {
    window.spotifyIntegration.disconnect();
  } else {
    send('spotify-disconnect');
  }
  isConnected.value = false;
  username.value = '';
  accessToken.value = null;
  refreshToken.value = null;
  searchResults.value = [];
  playlists.value = [];
};

const loadPlaylists = () => {
  if (!accessToken.value) {
    console.warn('No access token available');
    return;
  }
  
  isLoadingPlaylists.value = true;
  // Send tokens to main process
  send('spotify-get-playlists', accessToken.value, refreshToken.value);
};

const searchTracks = async () => {
  if (!searchQuery.value.trim()) return;
  if (!accessToken.value) {
    console.warn('No access token available');
    return;
  }
  
  isLoadingSearch.value = true;
  // Main process expects just the query string, not an object
  send('spotify-search', searchQuery.value);
};

const playTrack = (track) => {
  // For now, just log - actual playback integration can be added later
  console.log('Play track:', track);
  // You can emit an event or call a store action to handle playback
  // For example: audioStore.playSpotifyTrack(track);
};

// Listen for Spotify connection events
onMounted(() => {
  const handleSpotifyConnected = (data) => {
    console.log('[SpotifyPanel] Connected:', data);
    // Handle 'spotify-auth-success' event from main process
    const userData = data?.user || data;
    isConnected.value = true;
    username.value = userData?.display_name || userData?.username || 'User';
    accessToken.value = data?.accessToken || null;
    refreshToken.value = data?.refreshToken || null;
    
    // Save tokens and user data to localStorage
    if (accessToken.value) {
      localStorage.setItem('spotifyAccessToken', accessToken.value);
    }
    if (refreshToken.value) {
      localStorage.setItem('spotifyRefreshToken', refreshToken.value);
    }
    if (userData) {
      localStorage.setItem('spotifyUser', JSON.stringify(userData));
    }
  };
  
  const handleSpotifyDisconnected = () => {
    isConnected.value = false;
    username.value = '';
    accessToken.value = null;
    refreshToken.value = null;
    searchResults.value = [];
    playlists.value = [];
  };
  
  const handleSpotifySearchResults = (results) => {
    console.log('[SpotifyPanel] Search results received:', results);
    isLoadingSearch.value = false;
    // Main process sends results.body directly
    // results contains the search results from Spotify API
    searchResults.value = results?.tracks?.items || [];
    currentView.value = 'search';
    console.log('[SpotifyPanel] Search results count:', searchResults.value.length);
  };
  
  const handleSpotifyPlaylistsReceived = (data) => {
    console.log('[SpotifyPanel] Playlists received:', data);
    isLoadingPlaylists.value = false;
    // Main process sends playlists.body directly
    // data contains the playlists response from Spotify API
    playlists.value = data?.items || [];
    currentView.value = 'playlists';
    console.log('[SpotifyPanel] Playlists count:', playlists.value.length);
  };
  
  const handleSpotifyError = (error) => {
    isLoadingPlaylists.value = false;
    isLoadingSearch.value = false;
    console.error('[SpotifyPanel] Spotify error:', error);
    // You could show a toast notification here
  };
  
  const handleTokenRefreshed = (data) => {
    // Update access token when it's refreshed
    if (data?.accessToken) {
      accessToken.value = data.accessToken;
      localStorage.setItem('spotifyAccessToken', data.accessToken);
    }
  };
  
  // Check initial connection state from localStorage
  const savedToken = localStorage.getItem('spotifyAccessToken');
  const savedRefreshToken = localStorage.getItem('spotifyRefreshToken');
  const savedUser = localStorage.getItem('spotifyUser');
  
  if (savedToken && savedUser) {
    accessToken.value = savedToken;
    refreshToken.value = savedRefreshToken;
    try {
      const user = JSON.parse(savedUser);
      isConnected.value = true;
      username.value = user?.display_name || user?.username || 'User';
    } catch (e) {
      console.error('Error parsing saved user data:', e);
    }
  }
  
  // Listen for events
  on('spotify-auth-success', handleSpotifyConnected);
  on('spotify-disconnected', handleSpotifyDisconnected);
  on('spotify-search-results', handleSpotifySearchResults);
  on('spotify-playlists-received', handleSpotifyPlaylistsReceived);
  on('spotify-error', handleSpotifyError);
  on('spotify-token-refreshed', handleTokenRefreshed);
});
</script>

<style scoped>
.sidebar-content {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

/* Login State */
.spotify-login-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
  height: 100%;
}

.login-icon {
  color: #1DB954;
  margin-bottom: 20px;
}

.login-icon svg {
  filter: drop-shadow(0 2px 8px rgba(29, 185, 84, 0.3));
}

.login-title {
  font-size: 18px;
  font-weight: 600;
  color: #fff;
  margin: 0 0 8px 0;
}

.login-subtitle {
  font-size: 13px;
  color: #888;
  margin: 0 0 24px 0;
}

.spotify-connect-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  max-width: 200px;
  background: #1DB954;
  color: white;
  padding: 12px 20px;
  border: none;
  border-radius: 24px;
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
  transition: all 0.2s;
}

.spotify-connect-btn:hover {
  background: #1ed760;
  transform: scale(1.02);
}

/* Connected State */
.spotify-connected-state {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.spotify-user-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 15px;
  background: rgba(29, 185, 84, 0.1);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  min-width: 0;
}

.user-status-icon {
  color: #1DB954;
  flex-shrink: 0;
}

.user-details {
  flex: 1;
  min-width: 0;
}

.username {
  color: #1DB954;
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-status {
  color: #888;
  font-size: 11px;
}

.disconnect-btn {
  padding: 6px 12px;
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #888;
  border-radius: 6px;
  cursor: pointer;
  font-size: 11px;
  transition: all 0.2s;
  flex-shrink: 0;
}

.disconnect-btn:hover {
  border-color: rgba(255, 255, 255, 0.2);
  color: #aaa;
}

.spotify-actions {
  padding: 12px 15px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.spotify-action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  background: rgba(0, 255, 136, 0.1);
  border: 1px solid rgba(0, 255, 136, 0.2);
  color: var(--theme-primary, #00ff88);
  padding: 10px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  font-size: 13px;
  transition: all 0.2s;
}

.spotify-action-btn:hover {
  background: rgba(0, 255, 136, 0.15);
  border-color: rgba(0, 255, 136, 0.3);
}

.spotify-search-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 15px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.search-icon {
  position: absolute;
  left: 27px;
  color: #888;
  pointer-events: none;
  z-index: 1;
}

.spotify-search-input {
  flex: 1;
  padding: 10px 12px 10px 36px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: #fff;
  font-size: 13px;
  outline: none;
  transition: all 0.2s;
}

.spotify-search-input:focus {
  border-color: #1DB954;
  background: rgba(255, 255, 255, 0.08);
  box-shadow: 0 0 0 3px rgba(29, 185, 84, 0.1);
}

.spotify-search-input::placeholder {
  color: #666;
}

.spotify-search-btn {
  padding: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: #1DB954;
  border: none;
  border-radius: 8px;
  color: white;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
}

.spotify-search-btn:hover:not(:disabled) {
  background: #1ed760;
  transform: scale(1.05);
}

.spotify-search-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.loading-spinner-small {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.spotify-view-tabs {
  display: flex;
  gap: 4px;
  padding: 8px 15px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  background: rgba(0, 0, 0, 0.2);
}

.view-tab {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 12px;
  background: transparent;
  border: none;
  border-radius: 6px;
  color: #888;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.view-tab:hover {
  background: rgba(255, 255, 255, 0.05);
  color: #aaa;
}

.view-tab.active {
  background: rgba(29, 185, 84, 0.15);
  color: #1DB954;
}

.tab-count {
  background: rgba(29, 185, 84, 0.2);
  color: #1DB954;
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 10px;
  font-weight: 600;
}

.spotify-results-section {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
}

.spotify-loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid rgba(29, 185, 84, 0.2);
  border-top-color: #1DB954;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 12px;
}

.loading-text {
  font-size: 13px;
  color: #888;
  margin: 0;
}

.spotify-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
  color: #666;
}

.spotify-empty-state svg {
  color: #444;
  margin-bottom: 12px;
}

.empty-text {
  font-size: 13px;
  color: #888;
  margin: 0;
}

.spotify-track-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px;
  margin-bottom: 8px;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid transparent;
}

.spotify-track-item:hover {
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(29, 185, 84, 0.2);
  transform: translateX(2px);
}

.track-artwork {
  position: relative;
  width: 56px;
  height: 56px;
  flex-shrink: 0;
  border-radius: 6px;
  overflow: hidden;
  background: #1a1a1a;
}

.track-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.track-image-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #444;
  background: #1a1a1a;
}

.track-play-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s;
  color: #1DB954;
}

.spotify-track-item:hover .track-play-overlay {
  opacity: 1;
}

.track-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.track-name {
  color: #fff;
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.track-artist {
  color: #888;
  font-size: 11px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.spotify-playlist-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px;
  margin-bottom: 8px;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid transparent;
}

.spotify-playlist-item:hover {
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(29, 185, 84, 0.2);
  transform: translateX(2px);
}

.playlist-artwork {
  width: 56px;
  height: 56px;
  flex-shrink: 0;
  border-radius: 6px;
  overflow: hidden;
  background: #1a1a1a;
}

.playlist-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.playlist-image-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #444;
  background: #1a1a1a;
}

.playlist-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.playlist-name {
  color: #fff;
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.playlist-meta {
  color: #888;
  font-size: 11px;
}
</style>

