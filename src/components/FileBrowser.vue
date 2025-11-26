<template>
  <div v-if="isOpen" class="sidebar" id="fileBrowserSidebar">
    <div class="sidebar-content">

      <!-- Folder Path Display -->
      <div v-if="currentFolder" class="folder-path-container">
        <div id="folderPath" class="folder-path">
          <span class="path-segment">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" style="vertical-align: middle; margin-right: 4px;">
              <path d="M1.75 1A1.75 1.75 0 000 2.75v10.5C0 14.216.784 15 1.75 15h12.5A1.75 1.75 0 0016 13.25v-8.5A1.75 1.75 0 0014.25 3H7.5a.25.25 0 01-.2-.1l-.9-1.2C6.07 1.26 5.55 1 5 1H1.75z"/>
            </svg>
            {{ folderName }}
          </span>
        </div>
      </div>

      <!-- Search Input -->
      <div class="search-container">
        <input 
          type="text" 
          id="searchInput"
          v-model="searchQuery"
          placeholder="Search files..."
          class="search-input"
        />
      </div>

      <!-- File Count -->
      <div class="file-count" id="fileCount">
        {{ fileCountText }}
      </div>

      <!-- File List -->
      <div class="file-browser" id="fileBrowser" ref="fileBrowserRef">
        <div v-if="loading" class="empty-state">
          Loading files...
        </div>
        <div v-else-if="filteredFiles.length === 0" class="empty-state">
          {{ emptyStateMessage }}
        </div>
        <template v-else>
          <!-- Flat List (no subfolders) -->
          <template v-if="!groupedFolders || groupedFolders.length <= 1">
            <div
              v-for="file in filteredFiles"
              :key="file.path"
              :class="['file-item', { 
                selected: getFileIndex(file) === currentFileIndex, 
                playing: getFileIndex(file) === currentFileIndex && isPlaying 
              }]"
              :data-index="getFileIndex(file)"
              @click="handleFileClick(file, getFileIndex(file))"
            >
              <span class="file-icon">
                <img 
                  v-if="getFileAlbumArt(file)" 
                  :src="getFileAlbumArt(file)" 
                  alt="Album art"
                  style="width: 100%; height: 100%; object-fit: cover; border-radius: 3px;"
                />
                <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M9 18V5l12-2v13"/>
                  <circle cx="6" cy="18" r="3"/>
                  <circle cx="18" cy="16" r="3"/>
                </svg>
              </span>
              <div class="file-content">
                <div class="file-title">{{ getFileTitle(file) }}</div>
                <div v-if="getFileArtist(file) || getFileAlbum(file)" class="file-artist">
                  <template v-if="getFileArtist(file) && getFileAlbum(file)">
                    {{ getFileArtist(file) }} • {{ getFileAlbum(file) }}
                  </template>
                  <template v-else-if="getFileArtist(file)">
                    {{ getFileArtist(file) }}
                  </template>
                  <template v-else-if="getFileAlbum(file)">
                    {{ getFileAlbum(file) }}
                  </template>
                </div>
              </div>
            </div>
          </template>

          <!-- Grouped List (with subfolders) -->
          <template v-else>
            <div
              v-for="folder in groupedFolders"
              :key="folder.path"
              class="folder-group"
            >
              <div
                v-if="folder.path !== mainFolderPath"
                class="folder-header"
                :class="{ collapsed: collapsedFolders.has(folder.path) }"
                @click="toggleFolder(folder.path)"
              >
                <svg class="folder-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                </svg>
                <span class="folder-name">{{ folder.name }}</span>
                <span class="folder-count">{{ getFolderFileCount(folder.path) }} songs</span>
                <svg class="folder-toggle" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </div>
              <div
                v-if="folder.path === mainFolderPath || !collapsedFolders.has(folder.path)"
                :class="['folder-content', { collapsed: collapsedFolders.has(folder.path) }]"
              >
                <div
                  v-for="file in getFilesInFolder(folder.path)"
                  :key="file.path"
                  :class="['file-item', { 
                    'subfolder-item': folder.path !== mainFolderPath,
                    selected: getFileIndex(file) === currentFileIndex, 
                    playing: getFileIndex(file) === currentFileIndex && isPlaying 
                  }]"
                  :data-index="getFileIndex(file)"
                  @click="handleFileClick(file, getFileIndex(file))"
                >
                  <span class="file-icon">
                    <img 
                      v-if="getFileAlbumArt(file)" 
                      :src="getFileAlbumArt(file)" 
                      alt="Album art"
                      style="width: 100%; height: 100%; object-fit: cover; border-radius: 3px;"
                    />
                    <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M9 18V5l12-2v13"/>
                      <circle cx="6" cy="18" r="3"/>
                      <circle cx="18" cy="16" r="3"/>
                    </svg>
                  </span>
                  <div class="file-content">
                    <div class="file-title">{{ getFileTitle(file) }}</div>
                    <div v-if="getFileArtist(file) || getFileAlbum(file)" class="file-artist">
                      <template v-if="getFileArtist(file) && getFileAlbum(file)">
                        {{ getFileArtist(file) }} • {{ getFileAlbum(file) }}
                      </template>
                      <template v-else-if="getFileArtist(file)">
                        {{ getFileArtist(file) }}
                      </template>
                      <template v-else-if="getFileAlbum(file)">
                        {{ getFileAlbum(file) }}
                      </template>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </template>
        </template>
      </div>
      
      <!-- Bottom Controls -->
      <div style="margin-top: auto; padding-top: 15px; border-top: 1px solid rgba(255, 255, 255, 0.1);">
        <!-- Browse Folder Button -->
        <div class="browse-folder-container">
          <button @click="browseFolder" class="browse-folder-btn" id="browseFolderBtn">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M1.75 1A1.75 1.75 0 000 2.75v10.5C0 14.216.784 15 1.75 15h12.5A1.75 1.75 0 0016 13.25v-8.5A1.75 1.75 0 0014.25 3H7.5a.25.25 0 01-.2-.1l-.9-1.2C6.07 1.26 5.55 1 5 1H1.75z"/>
            </svg>
            Browse Folder
          </button>
        </div>

        <!-- Include Subfolders Checkbox -->
        <div class="include-subfolders-container">
          <label class="checkbox-label">
            <input 
              type="checkbox" 
              id="includeSubfoldersCheckbox"
              v-model="includeSubfolders"
              @change="onIncludeSubfoldersChange"
            />
            <span>Include subfolders</span>
          </label>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { useUIStore } from '../stores/ui.js';
import { useAudioStore } from '../stores/audio.js';
import { useSettingsStore } from '../stores/settings.js';
import { useElectronIPC } from '../composables/useElectronIPC.js';

const uiStore = useUIStore();
const audioStore = useAudioStore();
const settingsStore = useSettingsStore();
const { send, on, invoke } = useElectronIPC();

const isOpen = computed(() => {
  return uiStore.activeSidebarTab === 'files';
});
const isPlaying = computed(() => audioStore.isPlaying);
const currentFileIndex = computed(() => audioStore.currentIndex);

const searchQuery = ref('');
const includeSubfolders = ref(false);
const currentFolder = ref('');
const audioFiles = ref([]);
const fileMetadata = ref(new Map()); // Store metadata for files
const fileAlbumArts = ref(new Map()); // Store album art for files
const loading = ref(false);
const collapsedFolders = ref(new Set());

const fileBrowserRef = ref(null);

// Computed properties
const folderName = computed(() => {
  if (!currentFolder.value) return '';
  // Use path separator based on OS (Windows uses \, Unix uses /)
  const sep = currentFolder.value.includes('\\') ? '\\' : '/';
  const parts = currentFolder.value.split(sep).filter(part => part);
  return parts[parts.length - 1] || '';
});

const filteredFiles = computed(() => {
  if (!searchQuery.value) return audioFiles.value;
  
  const searchLower = searchQuery.value.toLowerCase();
  return audioFiles.value.filter(file => {
    const title = fileMetadata.value.get(file.path)?.title || file.title || file.name;
    const artist = fileMetadata.value.get(file.path)?.artist || file.artist || '';
    const album = fileMetadata.value.get(file.path)?.album || file.album || '';
    
    return title.toLowerCase().includes(searchLower) ||
           artist.toLowerCase().includes(searchLower) ||
           album.toLowerCase().includes(searchLower) ||
           file.name.toLowerCase().includes(searchLower);
  });
});

const groupedFolders = computed(() => {
  if (!includeSubfolders.value || !window.fileManager) return null;
  return window.fileManager.getGroupedFiles();
});

const mainFolderPath = computed(() => {
  if (!window.fileManager) return '';
  return window.fileManager.getCurrentFolder();
});

const fileCountText = computed(() => {
  const count = filteredFiles.value.length;
  return `${count} song${count !== 1 ? 's' : ''}`;
});

const emptyStateMessage = computed(() => {
  if (audioFiles.value.length === 0) {
    return 'No audio files found in this folder';
  }
  if (searchQuery.value && filteredFiles.value.length === 0) {
    return 'No songs match your search';
  }
  return 'No files';
});

// Methods
// No close button needed - tabs handle switching

const browseFolder = () => {
  send('open-folder-dialog');
};

const onIncludeSubfoldersChange = () => {
  if (window.fileManager) {
    window.fileManager.setIncludeSubfolders(includeSubfolders.value);
    
    // Reload current folder if one is loaded
    if (currentFolder.value) {
      loadFolder(currentFolder.value);
    }
  }
};

const loadFolder = (folderPath) => {
  if (!window.fileManager) {
    console.warn('FileManager not available');
    return;
  }
  
  loading.value = true;
  const result = window.fileManager.loadFolder(folderPath);
  
  if (result.success) {
    // Clear previous metadata tracking and caches
    loadedMetadataPaths.value.clear();
    fileMetadata.value.clear();
    fileAlbumArts.value.clear();
    fileIndexCache.value.clear();
    
    audioFiles.value = result.files;
    currentFolder.value = folderPath;
    
    // Update window globals
    if (window.audioFiles !== undefined) {
      window.audioFiles = result.files;
    }
    if (window.currentFolder !== undefined) {
      window.currentFolder = folderPath;
    }
    
    loading.value = false;
    
    // Pre-populate album arts from cache before loading metadata
    if (window.albumArtManager && result.files.length > 0) {
      const cachedArts = new Map();
      result.files.forEach(file => {
        // Check in-memory cache first
        if (window.albumArtManager.cache && window.albumArtManager.cache.has(file.path)) {
          const cached = window.albumArtManager.cache.get(file.path);
          if (cached) {
            cachedArts.set(file.path, cached);
          }
        } else {
          // Check persistent cache (localStorage)
          try {
            const cacheKey = window.albumArtManager.cacheKey || 'spectra_album_art_cache';
            const cached = localStorage.getItem(cacheKey);
            if (cached) {
              const cacheData = JSON.parse(cached);
              if (cacheData[file.path]) {
                cachedArts.set(file.path, cacheData[file.path]);
                // Also restore to in-memory cache
                if (window.albumArtManager.cache) {
                  window.albumArtManager.cache.set(file.path, cacheData[file.path]);
                }
              }
            }
          } catch (error) {
            // Ignore errors when checking cache
          }
        }
      });
      
      // Apply cached arts immediately
      if (cachedArts.size > 0) {
        const newMap = new Map(fileAlbumArts.value);
        cachedArts.forEach((artUrl, filePath) => {
          newMap.set(filePath, artUrl);
        });
        fileAlbumArts.value = newMap;
        console.log('[FileBrowser] Pre-loaded', cachedArts.size, 'album arts from cache');
      }
    }
    
    // Load metadata and album art for all files (Amethyst-style)
    if (result.files.length > 0) {
      // Start loading metadata immediately
      loadFileMetadata(result.files, false);
      
      // Retry loading metadata only if globals weren't ready and no metadata was loaded
      setTimeout(() => {
        const hasMetadata = fileMetadata.value.size > 0 || fileAlbumArts.value.size > 0;
        const globalsReady = window.albumArtManager && window.metadataCache && window.parseFileName;
        
        if (!hasMetadata && globalsReady) {
          console.log('[FileBrowser] Retrying metadata load...');
          loadFileMetadata(result.files, false);
        }
      }, 1000);
    }
  } else {
    loading.value = false;
    console.error('Error loading folder:', result.error);
  }
};

const loadFileMetadata = async (files, force = false) => {
  // Wait for required globals to be available
  let attempts = 0;
  const maxAttempts = 50;
  while ((!window.metadataCache || !window.albumArtManager || !window.parseFileName) && attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, 100));
    attempts++;
  }
  
  if (!window.metadataCache || !window.albumArtManager || !window.parseFileName) {
    console.warn('[FileBrowser] Required globals not available for metadata loading:', {
      metadataCache: !!window.metadataCache,
      albumArtManager: !!window.albumArtManager,
      parseFileName: !!window.parseFileName
    });
    return;
  }
  
  // Process files in batches to avoid overwhelming the system (Amethyst-style)
  const batchSize = 5;
  for (let i = 0; i < files.length; i += batchSize) {
    const batch = files.slice(i, i + batchSize);
    
    // Collect updates for this batch
    const albumArtUpdates = new Map();
    const metadataUpdates = new Map();
    
    // Fetch metadata and cover concurrently (Amethyst approach)
    await Promise.all(batch.map(async (file) => {
      // Skip if already loaded and not forcing
      if (!force && loadedMetadataPaths.value.has(file.path)) {
        return;
      }
      
      try {
        // Check in-memory cache first (Amethyst-style)
        let metadata = !force ? window.metadataCache.get(file.path) : null;
        
        // If not in cache, fetch from main process
        if (!metadata) {
          if (window.require) {
            const { ipcRenderer } = window.require('electron');
            metadata = await ipcRenderer.invoke('extract-metadata', file.path);
            
            // Cache the result
            if (metadata) {
              window.metadataCache.set(file.path, metadata);
            }
          }
        }
        
        // Extract metadata fields (support both old and new format)
        // Always ensure we have at least filename-based metadata
        let parsed = { title: file.name, artist: '', hasArtist: false };
        if (window.parseFileName) {
          try {
            parsed = window.parseFileName(file.name);
          } catch (e) {
            console.warn('[FileBrowser] parseFileName error:', e);
          }
        }
        
        // Always set metadata - use extracted if available, otherwise use filename parsing
        let title = parsed.title || file.name;
        let artist = parsed.artist || '';
        let album = '';
        
        if (metadata) {
          // Use metadata if available
          if (metadata.title) title = metadata.title;
          else if (metadata.common?.title) title = metadata.common.title;
          
          if (metadata.artist) {
            artist = metadata.artist;
          } else if (metadata.common?.artists && Array.isArray(metadata.common.artists) && metadata.common.artists.length > 0) {
            artist = metadata.common.artists.join(' & ');
          } else if (metadata.common?.artist) {
            artist = metadata.common.artist;
          }
          
          if (metadata.album) album = metadata.album;
          else if (metadata.common?.album) album = metadata.common.album;
        }
        
        // Always set metadata - never leave it empty
        metadataUpdates.set(file.path, {
          title: title || file.name,
          artist: artist || '',
          album: album || ''
        });
        
        // Load album art concurrently (Amethyst approach)
        if (window.albumArtManager && (!fileAlbumArts.value.has(file.path) || force)) {
            try {
            // extractAlbumArt will check cache first (both memory and persistent)
            // and return cached value if available, or extract if not
              const artUrl = await window.albumArtManager.extractAlbumArt(file.path);
              if (artUrl) {
                albumArtUpdates.set(file.path, artUrl);
                console.log('[FileBrowser] Album art loaded for:', file.name);
                }
            // Note: null values are already cached in AlbumArtManager, so we don't need to cache them here
            } catch (error) {
              console.warn('[FileBrowser] Failed to extract album art for:', file.name, error.message);
          }
        } else if (window.albumArtManager && fileAlbumArts.value.has(file.path)) {
          // Already have it in FileBrowser's local cache, but check if it's also in AlbumArtManager cache
          // This ensures consistency
          const existingArt = fileAlbumArts.value.get(file.path);
          if (existingArt && window.albumArtManager.cache && !window.albumArtManager.cache.has(file.path)) {
            // Restore to AlbumArtManager cache if not already there
            window.albumArtManager.cache.set(file.path, existingArt);
          }
        }
        
        // Mark as loaded
        loadedMetadataPaths.value.add(file.path);
      } catch (error) {
        // Silently fail for individual files
        console.warn('[FileBrowser] Error loading metadata for:', file.name, error.message);
      }
    }));
    
    // Apply all updates from this batch at once to trigger Vue reactivity
    if (metadataUpdates.size > 0) {
      metadataUpdates.forEach((meta, filePath) => {
        fileMetadata.value.set(filePath, meta);
      });
      console.log('[FileBrowser] Applied', metadataUpdates.size, 'metadata updates');
    }
    
    if (albumArtUpdates.size > 0) {
      // Create new map to trigger Vue reactivity
      const newMap = new Map(fileAlbumArts.value);
      albumArtUpdates.forEach((artUrl, filePath) => {
        if (artUrl) {
          newMap.set(filePath, artUrl);
          console.log('[FileBrowser] Setting album art for:', filePath.substring(filePath.lastIndexOf('\\') + 1));
        }
      });
      fileAlbumArts.value = newMap;
      console.log('[FileBrowser] Applied', albumArtUpdates.size, 'album art updates');
    }
    
    // Small delay between batches to prevent overwhelming
    if (i + batchSize < files.length) {
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  }
};

// Cache for file indices to avoid repeated lookups
const fileIndexCache = ref(new Map());

const getFileIndex = (file) => {
  // Check cache first
  if (fileIndexCache.value.has(file.path)) {
    return fileIndexCache.value.get(file.path);
  }
  
  // Always use window.audioFiles (renderer's array) as the source of truth
  // since loadAudioFile uses that array
  let index = -1;
  
  if (window.audioFiles && Array.isArray(window.audioFiles)) {
    index = window.audioFiles.findIndex(f => f && f.path === file.path);
  }
  
  // Fallback to Vue component's array if window.audioFiles not available
  if (index === -1) {
    index = audioFiles.value.findIndex(f => f.path === file.path);
  }
  
  // Only log warnings, not every successful lookup
  if (index === -1) {
    console.warn('[FileBrowser] File not found in audioFiles arrays:', file.name, file.path);
  }
  
  // Cache the result
  fileIndexCache.value.set(file.path, index);
  return index;
};

const getFileTitle = (file) => {
  return fileMetadata.value.get(file.path)?.title || file.name;
};

const getFileArtist = (file) => {
  return fileMetadata.value.get(file.path)?.artist || '';
};

const getFileAlbum = (file) => {
  return fileMetadata.value.get(file.path)?.album || '';
};

const getFileAlbumArt = (file) => {
  return fileAlbumArts.value.get(file.path) || null;
};

// Wait for loadAudioFile to be available
const waitForLoadAudioFile = async (maxAttempts = 20, delay = 100) => {
  for (let i = 0; i < maxAttempts; i++) {
    if (typeof window.loadAudioFile !== 'undefined') {
      return true;
    }
    await new Promise(resolve => setTimeout(resolve, delay));
  }
  return false;
};

const handleFileClick = async (file, index) => {
  console.log('File clicked:', file.name, 'index:', index);
  
  // Try to use Spectra API first, fallback to legacy
  const wasPlaying = isPlaying.value;
  
  // Validate index
  if (index < 0) {
    console.error('Invalid index:', index, 'for file:', file.name);
    alert(`Cannot load file: ${file.name}\n\nFile index is invalid. Please try refreshing the file list.`);
    return;
  }
  
  // Check if index is within bounds
  const maxIndex = window.audioFiles?.length || audioFiles.value.length;
  if (index >= maxIndex) {
    console.error('Index out of bounds:', index, 'max:', maxIndex, 'for file:', file.name);
    alert(`Cannot load file: ${file.name}\n\nFile index (${index}) is out of bounds (max: ${maxIndex - 1}). Please try refreshing the file list.`);
    return;
  }
  
  try {
    // Try new Spectra API first
    if (window.spectra && window.spectra.isInitialized) {
      console.log('Using Spectra API to load file');
      await window.spectra.loadFile(index);
      
      // Auto-play if something was already playing
      if (wasPlaying) {
        setTimeout(() => {
          window.spectra.play();
        }, 100);
      }
    } else if (window.loadAudioFile) {
      // Fallback to legacy API
      console.log('Using legacy loadAudioFile API');
      await window.loadAudioFile(index);
      
      // Auto-play if something was already playing
      if (wasPlaying) {
        setTimeout(() => {
          if (window.audioManager && window.audioManager.play) {
            window.audioManager.play();
          } else if (window.spectra) {
            window.spectra.play();
          }
        }, 100);
      }
    } else {
      throw new Error('Audio player not available');
    }
    
    console.log('File loaded successfully');
  } catch (error) {
    console.error('Error loading file:', error);
    
    let errorMsg = 'Error loading file';
    if (error.message && error.message.includes('decode')) {
      errorMsg = 'Unable to decode audio - file may be corrupted';
      alert(`Cannot play this file:\n\n${file.name}\n\nThe file appears to be corrupted or in an unsupported format.`);
    } else if (error.message && error.message.includes('not exist')) {
      errorMsg = 'File not found';
    } else if (error.message && error.message.includes('not available')) {
      alert('Audio player not ready. Please wait a moment and try again.');
      return;
    }
    
    // Show error in status (if available)
    if (window.statusText) {
      window.statusText.textContent = errorMsg;
    }
  }
};

const toggleFolder = (folderPath) => {
  if (collapsedFolders.value.has(folderPath)) {
    collapsedFolders.value.delete(folderPath);
  } else {
    collapsedFolders.value.add(folderPath);
  }
};

const getFilesInFolder = (folderPath) => {
  return filteredFiles.value.filter(file => {
    // Get directory from file path
    const lastSep = Math.max(file.path.lastIndexOf('\\'), file.path.lastIndexOf('/'));
    const fileDir = lastSep >= 0 ? file.path.substring(0, lastSep) : '';
    return fileDir === folderPath;
  });
};

const getFolderFileCount = (folderPath) => {
  return getFilesInFolder(folderPath).length;
};

// Track which files have had metadata loaded to prevent infinite loops
const loadedMetadataPaths = ref(new Set());

// Watch for audioFiles changes from window
const syncAudioFiles = () => {
  if (window.audioFiles && Array.isArray(window.audioFiles)) {
    // Check if files actually changed by comparing paths
    const currentPaths = new Set(audioFiles.value.map(f => f.path));
    const newPaths = new Set(window.audioFiles.map(f => f.path));
    
    // Only update if paths are different
    if (currentPaths.size !== newPaths.size || 
        [...currentPaths].some(path => !newPaths.has(path))) {
      audioFiles.value = [...window.audioFiles]; // Create new array reference
      
      // Clear index cache when files change
      fileIndexCache.value.clear();
      
      // Only load metadata for files we haven't loaded yet
      const filesToLoad = window.audioFiles.filter(file => !loadedMetadataPaths.value.has(file.path));
      if (filesToLoad.length > 0) {
        loadFileMetadata(filesToLoad);
        // Mark these files as loaded
        filesToLoad.forEach(file => loadedMetadataPaths.value.add(file.path));
      }
    }
  }
};

// Watch for currentFolder changes from window
const syncCurrentFolder = () => {
  if (window.currentFolder && window.currentFolder !== currentFolder.value) {
    currentFolder.value = window.currentFolder;
  }
};

// Watch for includeSubfolders changes from window
const syncIncludeSubfolders = () => {
  if (window.fileManager) {
    includeSubfolders.value = window.fileManager.includeSubfolders;
  }
};

// Lifecycle
let syncInterval = null;
let unsubscribeFolder = null;
let unsubscribeMenu = null;

onMounted(() => {
  // Initial sync
  syncAudioFiles();
  syncCurrentFolder();
  syncIncludeSubfolders();
  
  // Set up polling for window.audioFiles (not reactive)
  syncInterval = setInterval(() => {
    syncAudioFiles();
    syncCurrentFolder();
  }, 500);
  
  // Listen for folder-selected event
  unsubscribeFolder = on('folder-selected', (folderPath) => {
    if (folderPath) {
      loadFolder(folderPath);
    }
  });
  
  // Listen for menu-open-folder event
  unsubscribeMenu = on('menu-open-folder', () => {
    browseFolder();
  });
});

onUnmounted(() => {
  if (syncInterval) {
    clearInterval(syncInterval);
  }
  if (unsubscribeFolder) unsubscribeFolder();
  if (unsubscribeMenu) unsubscribeMenu();
});
</script>

<style scoped>
/* Use global sidebar styles from styles.css */
.sidebar.hidden {
  display: none;
}

.sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.icon-btn {
  background: transparent;
  border: none;
  color: #fff;
  font-size: 24px;
  cursor: pointer;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 3px;
  transition: background 0.2s;
}

.icon-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.sidebar-content {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 0px 0;
  display: flex;
  flex-direction: column;
  scrollbar-width: thin;
  scrollbar-color: rgba(200, 200, 200, 0.4) transparent;
}

.sidebar-content::-webkit-scrollbar {
  width: 8px;
}

.sidebar-content::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.3);
}

.sidebar-content::-webkit-scrollbar-thumb {
  background: rgba(200, 200, 200, 0.4);
  border-radius: 10px;
  border: none;
  margin: 2px;
}

.sidebar-content::-webkit-scrollbar-thumb:hover {
  background: rgba(200, 200, 200, 0.6);
}

.browse-folder-container {
  margin: 0 10px 15px 10px;
}

.include-subfolders-container {
  margin: 0 10px 15px 10px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #fff;
  cursor: pointer;
  font-size: 14px;
}

.checkbox-label input[type="checkbox"] {
  cursor: pointer;
}

.folder-path-container {
  margin-bottom: 15px;
  padding: 10px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 5px;
}

.folder-path {
  display: flex;
  align-items: center;
  gap: 5px;
  color: #aaa;
  font-size: 12px;
}

.path-segment {
  display: flex;
  align-items: center;
  gap: 4px;
}

.search-container {
  margin: 0 10px 15px 10px;
}

.search-input {
  width: 100%;
  padding: 8px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 5px;
  color: #fff;
  font-size: 14px;
}

.search-input::placeholder {
  color: #666;
}

.file-count {
  margin: 0 10px 15px 15px;
  color: #aaa;
  font-size: 12px;
}

/* Use global file-browser and file-item styles from styles.css */
.file-browser {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-width: thin;
  scrollbar-color: rgba(200, 200, 200, 0.4) transparent;
}

.file-browser::-webkit-scrollbar {
  width: 8px;
}

.file-browser::-webkit-scrollbar-track {
  background: transparent;
}

.file-browser::-webkit-scrollbar-thumb {
  background: rgba(200, 200, 200, 0.4);
  border-radius: 10px;
  border: none;
  margin: 2px;
}

.file-browser::-webkit-scrollbar-thumb:hover {
  background: rgba(200, 200, 200, 0.6);
}

.empty-state {
  text-align: center;
  color: #666;
  padding: 40px 20px;
  font-size: 14px;
}

.folder-group {
  margin-bottom: 10px;
}

.folder-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 5px;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 5px;
}

.folder-header:hover {
  background: rgba(255, 255, 255, 0.1);
}

.folder-header.collapsed .folder-toggle {
  transform: rotate(-90deg);
}

.folder-icon {
  width: 20px;
  height: 20px;
  color: #00ff88;
}

.folder-name {
  flex: 1;
  color: #fff;
  font-size: 14px;
  font-weight: 500;
}

.folder-count {
  color: #aaa;
  font-size: 12px;
}

.folder-toggle {
  width: 16px;
  height: 16px;
  color: #aaa;
  transition: transform 0.2s;
}

.folder-content {
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding-left: 20px;
}

.folder-content.collapsed {
  display: none;
}

.file-item.subfolder-item {
  padding-left: 20px;
}
</style>

