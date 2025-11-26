import { defineStore } from 'pinia';

export const useUIStore = defineStore('ui', {
  state: () => ({
    // Panel visibility
    settingsPanelOpen: false,
    queuePanelOpen: false,
    
    // Panel visibility toggles
    songLibraryVisible: true,  // File Browser / Sidebar
    musicPlayerVisible: true,  // Audio Player
    visualizerManagerVisible: true,  // Visualizer Panel
    
    // Sidebar tab system (3 tabs: files, spotify, youtube)
    activeSidebarTab: 'files', // 'files', 'spotify', or 'youtube'
    
    // Modal visibility
    aboutModalOpen: false,
    
    // UI state
    fullscreen: false,
    statusMessage: '',
    
    // Active menu
    activeMenu: null
  }),

  getters: {
    fileBrowserOpen: (state) => state.activeSidebarTab === 'files',
    spotifyPanelOpen: (state) => state.activeSidebarTab === 'spotify',
    youtubePanelOpen: (state) => state.activeSidebarTab === 'youtube',
  },

  actions: {
    toggleSettingsPanel() {
      this.settingsPanelOpen = !this.settingsPanelOpen;
    },
    
    toggleQueuePanel() {
      this.queuePanelOpen = !this.queuePanelOpen;
    },
    
    setActiveSidebarTab(tab) {
      if (['files', 'spotify', 'youtube'].includes(tab)) {
        this.activeSidebarTab = tab;
      }
    },
    
    // Legacy methods for compatibility
    toggleFileBrowser() {
      if (this.activeSidebarTab === 'files') {
        this.activeSidebarTab = 'spotify'; // Switch to another tab if closing
      } else {
        this.activeSidebarTab = 'files';
      }
    },
    
    setFileBrowserOpen(open) {
      if (open) {
        this.activeSidebarTab = 'files';
      } else if (this.activeSidebarTab === 'files') {
        this.activeSidebarTab = 'spotify'; // Switch to another tab
      }
    },
    
    toggleSpotifyPanel() {
      if (this.activeSidebarTab === 'spotify') {
        this.activeSidebarTab = 'files';
      } else {
        this.activeSidebarTab = 'spotify';
      }
    },
    
    toggleYouTubePanel() {
      if (this.activeSidebarTab === 'youtube') {
        this.activeSidebarTab = 'files';
      } else {
        this.activeSidebarTab = 'youtube';
      }
    },
    
    setStatusMessage(message) {
      this.statusMessage = message;
    },
    
    setFullscreen(fullscreen) {
      this.fullscreen = fullscreen;
    },
    
    setActiveMenu(menu) {
      this.activeMenu = menu;
    },
    
    closeAllMenus() {
      this.activeMenu = null;
    },
    
    toggleSongLibrary() {
      this.songLibraryVisible = !this.songLibraryVisible;
    },
    
    toggleMusicPlayer() {
      this.musicPlayerVisible = !this.musicPlayerVisible;
    },
    
    toggleVisualizerManager() {
      this.visualizerManagerVisible = !this.visualizerManagerVisible;
    }
  }
});

