<template>
  <div id="app">
    <!-- SVG sprite from original index.html (keep in HTML for now) -->
    <TitleBar />
    
    <!-- Album Art Background -->
    <div id="albumArtBackground" class="album-art-background"></div>
    
    <!-- Main App Container -->
    <div class="app-container">
      <!-- Sidebar with Tabs -->
      <div v-if="songLibraryVisible" class="sidebar-container">
        <SidebarTabs />
        
        <!-- File Browser (left sidebar) -->
        <FileBrowser />
        
        <!-- Spotify Panel -->
        <SpotifyPanel />
        
        <!-- YouTube Panel -->
        <YouTubePanel />
      </div>
      
      <div class="content-wrapper">
        <!-- Audio Player -->
        <AudioPlayer v-if="musicPlayerVisible" />
        
        <!-- Bottom Section: Canvas + Right Panel -->
        <div class="bottom-section">
          <!-- Canvas Container (center) -->
          <VisualizerCanvas />
          
          <!-- Visualizer Panel (right side) -->
          <VisualizerPanel v-if="visualizerManagerVisible" />
        </div>
      </div>
    </div>
    
    <!-- Settings Panel -->
    <SettingsPanel />
    
    <!-- Queue Panel -->
    <QueuePanel />
  </div>
</template>

<script setup>
import TitleBar from './components/TitleBar.vue';
import AudioPlayer from './components/AudioPlayer.vue';
import SettingsPanel from './components/SettingsPanel.vue';
import VisualizerCanvas from './components/VisualizerCanvas.vue';
import VisualizerPanel from './components/VisualizerPanel.vue';
import QueuePanel from './components/QueuePanel.vue';
import SpotifyPanel from './components/SpotifyPanel.vue';
import YouTubePanel from './components/YouTubePanel.vue';
import FileBrowser from './components/FileBrowser.vue';
import SidebarTabs from './components/SidebarTabs.vue';
import { useSettingsStore } from './stores/settings.js';
import { useUIStore } from './stores/ui.js';
import { useAudioIntegration } from './composables/useAudioIntegration.js';
import { useAlbumArtBackground } from './composables/useAlbumArtBackground.js';
import { computed, onMounted } from 'vue';

const settingsStore = useSettingsStore();
const uiStore = useUIStore();

const songLibraryVisible = computed(() => uiStore.songLibraryVisible);
const musicPlayerVisible = computed(() => uiStore.musicPlayerVisible);
const visualizerManagerVisible = computed(() => uiStore.visualizerManagerVisible);
const { initializeIntegration, enhanceAudioManager } = useAudioIntegration();
const { updateBackground } = useAlbumArtBackground();

onMounted(() => {
  // Load settings from localStorage
  settingsStore.loadSettings();
  
  // Initialize audio integration after a short delay to ensure renderer.js has loaded
  setTimeout(() => {
    enhanceAudioManager();
    initializeIntegration();
  }, 500);
});
</script>

<style scoped>
/* Main styles are in styles.css */
#app {
  width: 100%;
  height: 100vh;
  overflow: hidden;
}
</style>

