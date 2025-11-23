// Album Art Module - Extract and display album art with blur effect
const { ipcRenderer } = require('electron');

export class AlbumArtManager {
    constructor() {
        this.currentArtUrl = null;
        this.cache = new Map(); // Cache album art by file path
    }

    async extractAlbumArt(filePath) {
        // Check cache first
        if (this.cache.has(filePath)) {
            console.log('Album art found in cache for:', filePath);
            return this.cache.get(filePath);
        }

        try {
            console.log('Extracting album art from:', filePath);
            
            // Use IPC to extract album art in main process
            const pictureData = await ipcRenderer.invoke('extract-album-art', filePath);
            
            if (pictureData) {
                console.log('Album art found! Format:', pictureData.format, 'Data length:', pictureData.data.length);
                
                // Convert array back to Uint8Array
                const uint8Array = new Uint8Array(pictureData.data);
                const blob = new Blob([uint8Array], { type: `image/${pictureData.format}` });
                const url = URL.createObjectURL(blob);
                
                console.log('Blob URL created:', url);
                
                // Cache the URL
                this.cache.set(filePath, url);
                console.log('Album art extracted successfully');
                
                return url;
            } else {
                console.log('No album art embedded in file');
            }
        } catch (error) {
            console.warn('Could not extract album art:', error.message);
            console.error(error);
        }
        
        return null;
    }

    setBackground(imageUrl, blurAmount = 20, opacity = 0.3) {
        const backgroundElement = document.getElementById('albumArtBackground');
        
        if (!backgroundElement) {
            console.error('Background element not found');
            return;
        }

        if (imageUrl) {
            console.log('Setting album art background:', imageUrl);
            backgroundElement.style.backgroundImage = `url(${imageUrl})`;
            backgroundElement.style.filter = `blur(${blurAmount}px)`;
            backgroundElement.style.opacity = opacity;
            backgroundElement.style.display = 'block';
            this.currentArtUrl = imageUrl;
        } else {
            // No album art - hide background completely
            console.log('No album art found, hiding background');
            backgroundElement.style.display = 'none';
            this.currentArtUrl = null;
        }
    }

    clearBackground() {
        const backgroundElement = document.getElementById('albumArtBackground');
        if (backgroundElement) {
            backgroundElement.style.display = 'none';
        }
    }

    // Clean up old cached URLs to prevent memory leaks
    clearCache() {
        this.cache.forEach(url => {
            if (url && url.startsWith('blob:')) {
                URL.revokeObjectURL(url);
            }
        });
        this.cache.clear();
    }

    // Remove specific item from cache
    removeFromCache(filePath) {
        const url = this.cache.get(filePath);
        if (url && url.startsWith('blob:')) {
            URL.revokeObjectURL(url);
        }
        this.cache.delete(filePath);
    }
}
