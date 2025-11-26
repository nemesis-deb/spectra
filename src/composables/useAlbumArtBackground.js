import { watch, onMounted, onUnmounted } from 'vue';
import { useAudioStore } from '../stores/audio.js';
import { useSettingsStore } from '../stores/settings.js';

export function useAlbumArtBackground() {
  const audioStore = useAudioStore();
  const settingsStore = useSettingsStore();

  let backgroundElement = null;

  const updateBackground = async (imageUrl) => {
    if (!backgroundElement) {
      backgroundElement = document.getElementById('albumArtBackground');
      if (!backgroundElement) {
        console.warn('[AlbumArtBackground] Background element not found');
        return;
      }
    }

    // Get settings
    const blurAmount = settingsStore.albumArtBlur || 20;
    const opacity = settingsStore.albumArtOpacity || 0.3;
    const rotationSpeed = settingsStore.albumArtRotationSpeed || 50;
    const zoom = settingsStore.albumArtZoom || 1.5;
    const enabled = settingsStore.albumArtWallpaper !== false;

    if (!enabled) {
      backgroundElement.style.display = 'none';
      backgroundElement.style.animation = 'none';
      return;
    }

    if (imageUrl) {
      console.log('[AlbumArtBackground] Setting background:', imageUrl);
      
      // Set background image with smooth transition
      backgroundElement.style.backgroundImage = `url(${imageUrl})`;
      backgroundElement.style.filter = `blur(${blurAmount}px)`;
      backgroundElement.style.opacity = opacity;
      backgroundElement.style.display = 'block';
      
      // Set infinite rotation animation with zoom
      const rotationDuration = rotationSpeed; // seconds
      backgroundElement.style.setProperty('--album-art-zoom', zoom);
      backgroundElement.style.animation = `albumArtRotate ${rotationDuration}s linear infinite`;
      backgroundElement.style.transform = `scale(${zoom})`;
    } else {
      // No album art - hide background
      console.log('[AlbumArtBackground] No album art, hiding background');
      backgroundElement.style.display = 'none';
      backgroundElement.style.animation = 'none';
    }
  };

  const loadAlbumArtForCurrentTrack = async () => {
    if (!window.albumArtManager) {
      console.warn('[AlbumArtBackground] AlbumArtManager not available');
      return null;
    }

    const currentTrack = audioStore.currentTrack;
    if (!currentTrack || !currentTrack.path) {
      return null;
    }

    // Check if it's a YouTube video (path starts with youtube:)
    if (currentTrack.path.startsWith('youtube:')) {
      // Use the albumArt from store (set by YouTube integration)
      return audioStore.albumArt;
    }

    // For local files, extract album art
    try {
      const artUrl = await window.albumArtManager.extractAlbumArt(currentTrack.path);
      return artUrl;
    } catch (error) {
      console.warn('[AlbumArtBackground] Error extracting album art:', error);
      return null;
    }
  };

  // Watch for albumArt changes in the store (primary source)
  watch(
    () => audioStore.albumArt,
    async (newArt) => {
      if (newArt) {
        await updateBackground(newArt);
      }
    },
    { immediate: true }
  );

  // Watch for currentTrack changes (fallback to load art if not in store)
  watch(
    () => audioStore.currentTrack,
    async (newTrack, oldTrack) => {
      // Only update if track actually changed
      if (!newTrack || (oldTrack && newTrack.path === oldTrack.path)) {
        if (!newTrack) {
          await updateBackground(null);
        }
        return;
      }

      // If albumArt is already set in store, use it (set by YouTube or other sources)
      if (audioStore.albumArt) {
        await updateBackground(audioStore.albumArt);
        return;
      }

      // If it's YouTube, check for thumbnail in track or wait for albumArt
      if (newTrack.path && newTrack.path.startsWith('youtube:')) {
        // Wait a bit for albumArt to be set by YouTube integration
        setTimeout(async () => {
          const artUrl = audioStore.albumArt || newTrack.thumbnail;
          await updateBackground(artUrl);
        }, 200);
      } else if (newTrack.path) {
        // For local files, load album art
        const artUrl = await loadAlbumArtForCurrentTrack();
        if (artUrl) {
          // Also update the store so we don't reload it
          audioStore.setAlbumArt(artUrl);
        }
        await updateBackground(artUrl);
      }
    },
    { immediate: true, deep: true }
  );

  // Watch for settings changes
  watch(
    () => [settingsStore.albumArtWallpaper, settingsStore.albumArtBlur, settingsStore.albumArtOpacity, settingsStore.albumArtRotationSpeed, settingsStore.albumArtZoom],
    async () => {
      const artUrl = audioStore.albumArt || await loadAlbumArtForCurrentTrack();
      await updateBackground(artUrl);
    }
  );

  onMounted(() => {
    // Initial update
    const artUrl = audioStore.albumArt || null;
    if (!artUrl && audioStore.currentTrack) {
      loadAlbumArtForCurrentTrack().then(updateBackground);
    } else {
      updateBackground(artUrl);
    }
  });

  return {
    updateBackground,
    loadAlbumArtForCurrentTrack
  };
}

