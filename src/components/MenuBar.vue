<template>
  <div class="menu-items">
    <div 
      v-for="menu in menus" 
      :key="menu.name"
      class="menu-item"
      :class="{ active: activeMenu === menu.name }"
      @click.stop="toggleMenu(menu.name)"
    >
      <span>{{ menu.label }}</span>
      <div 
        v-if="activeMenu === menu.name"
        class="menu-dropdown"
        :ref="el => setDropdownRef(menu.name, el)"
      >
        <template v-for="(item, index) in menu.items" :key="index">
          <div 
            v-if="item.type === 'separator'"
            class="menu-dropdown-separator"
          ></div>
          <div 
            v-else
            class="menu-dropdown-item"
            :class="{ 'menu-item-checked': isPanelEnabled(item.action) }"
            @click.stop="handleMenuAction(item.action)"
          >
            <span>{{ item.label }}</span>
            <span v-if="isPanelEnabled(item.action)" class="menu-checkmark">✓</span>
            <span v-else-if="item.accelerator" class="menu-accelerator">
              {{ item.accelerator }}
            </span>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useElectronIPC } from '../composables/useElectronIPC.js';
import { useUIStore } from '../stores/ui.js';

const { send, on, removeListener } = useElectronIPC();
const uiStore = useUIStore();

const activeMenu = ref(null);
const dropdownRefs = ref({});

// Menu definitions
const menus = [
  {
    name: 'file',
    label: 'File',
    items: [
      { label: 'Open Folder', action: 'open-folder', accelerator: 'Ctrl+O' },
      { type: 'separator' },
      { label: 'Settings', action: 'open-settings', accelerator: 'Ctrl+,' },
      { type: 'separator' },
      { label: 'Exit', action: 'quit', accelerator: 'Ctrl+Q' }
    ]
  },
  {
    name: 'edit',
    label: 'Edit',
    items: [
      { label: 'Undo', action: 'undo', accelerator: 'Ctrl+Z' },
      { label: 'Redo', action: 'redo', accelerator: 'Ctrl+Y' },
      { type: 'separator' },
      { label: 'Cut', action: 'cut', accelerator: 'Ctrl+X' },
      { label: 'Copy', action: 'copy', accelerator: 'Ctrl+C' },
      { label: 'Paste', action: 'paste', accelerator: 'Ctrl+V' },
      { label: 'Delete', action: 'delete' },
      { type: 'separator' },
      { label: 'Select All', action: 'selectAll', accelerator: 'Ctrl+A' }
    ]
  },
  {
    name: 'view',
    label: 'View',
    items: [
      { label: 'Song Library', action: 'toggle-song-library' },
      { label: 'Music Player', action: 'toggle-music-player' },
      { label: 'Visualizer Manager', action: 'toggle-visualizer-manager' },
      { type: 'separator' },
      { label: 'Reload', action: 'reload', accelerator: 'Ctrl+R' },
      { label: 'Force Reload', action: 'forceReload', accelerator: 'Ctrl+Shift+R' },
      { label: 'Toggle Developer Tools', action: 'toggleDevTools', accelerator: 'F12' },
      { type: 'separator' },
      { label: 'Actual Size', action: 'resetZoom', accelerator: 'Ctrl+0' },
      { label: 'Zoom In', action: 'zoomIn', accelerator: 'Ctrl+Plus' },
      { label: 'Zoom Out', action: 'zoomOut', accelerator: 'Ctrl+-' },
      { type: 'separator' },
      { label: 'Toggle Fullscreen', action: 'toggleFullscreen', accelerator: 'F11' }
    ]
  },
  {
    name: 'playback',
    label: 'Playback',
    items: [
      { label: 'Play/Pause', action: 'play-pause', accelerator: 'Space' },
      { label: 'Next Track', action: 'next-track', accelerator: 'Ctrl+Right' },
      { label: 'Previous Track', action: 'prev-track', accelerator: 'Ctrl+Left' },
      { type: 'separator' },
      { label: 'Shuffle', action: 'shuffle', accelerator: 'Ctrl+S' },
      { label: 'Repeat', action: 'repeat', accelerator: 'Ctrl+R' }
    ]
  },
  {
    name: 'about',
    label: 'About',
    items: [
      { label: 'About Spectra', action: 'about' },
      { label: 'Learn More', action: 'learn-more' }
    ]
  }
];

const toggleMenu = (menuName) => {
  if (activeMenu.value === menuName) {
    activeMenu.value = null;
  } else {
    activeMenu.value = menuName;
  }
  uiStore.setActiveMenu(activeMenu.value);
};

const handleMenuAction = (action) => {
  if (!action) return;
  
  // Handle special actions
  if (action === 'open-settings') {
    uiStore.toggleSettingsPanel();
  } else if (action === 'open-folder') {
    send('open-folder-dialog');
  } else if (action === 'toggleFullscreen') {
    uiStore.setFullscreen(!uiStore.fullscreen);
  } else if (action === 'toggle-song-library') {
    uiStore.toggleSongLibrary();
  } else if (action === 'toggle-music-player') {
    uiStore.toggleMusicPlayer();
  } else if (action === 'toggle-visualizer-manager') {
    uiStore.toggleVisualizerManager();
  }
  
  // Send action to main process (if not a local action)
  if (!['toggle-song-library', 'toggle-music-player', 'toggle-visualizer-manager'].includes(action)) {
    send('menu-action', action);
  }
  
  // Close menu after action
  activeMenu.value = null;
  uiStore.setActiveMenu(null);
};

// Handle edit actions (cut, copy, paste, etc.)
const handleEditAction = (event, action) => {
  document.execCommand(action);
};

// Dropdown positioning is now handled by CSS (position: absolute relative to menu-item)
const setDropdownRef = (menuName, el) => {
  if (el) {
    dropdownRefs.value[menuName] = el;
  }
};

const isPanelEnabled = (action) => {
  switch (action) {
    case 'toggle-song-library':
      return uiStore.songLibraryVisible;
    case 'toggle-music-player':
      return uiStore.musicPlayerVisible;
    case 'toggle-visualizer-manager':
      return uiStore.visualizerManagerVisible;
    default:
      return false;
  }
};

// Close menu when clicking outside
const handleClickOutside = (e) => {
  if (!e.target.closest('.menu-item') && !e.target.closest('.menu-dropdown')) {
    activeMenu.value = null;
    uiStore.setActiveMenu(null);
  }
};

onMounted(() => {
  // Listen for edit actions from main process
  on('menu-edit-action', handleEditAction);
  
  // Listen for clicks outside menu
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  removeListener('menu-edit-action', handleEditAction);
  document.removeEventListener('click', handleClickOutside);
});
</script>

<style scoped>
/* Styles are in main styles.css - no need to duplicate */
</style>

