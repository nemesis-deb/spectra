/**
 * YouTube Audio Handler
 * Uses yt-dlp via Electron IPC to extract audio URLs
 */

class YouTubeAudio {
    constructor() {
        this.currentAudio = null;
        this.currentVideoId = null;
    }

    /**
     * Get audio URL using yt-dlp via IPC
     */
    async getAudioUrl(videoId) {
        try {
            console.log('[YouTubeAudio] Getting audio URL for:', videoId);

            const { ipcRenderer } = require('electron');
            const result = await ipcRenderer.invoke('get-youtube-audio-url', videoId);

            if (!result || !result.url) {
                throw new Error('Failed to get audio URL');
            }

            console.log('[YouTubeAudio] Got audio URL successfully');

            return result;

        } catch (error) {
            console.error('[YouTubeAudio] Error getting audio URL:', error);
            throw error;
        }
    }

    /**
     * Create and play audio element
     */
    async createAudioElement(videoId) {
        try {
            const audioData = await this.getAudioUrl(videoId);

            // Cleanup previous audio
            if (this.currentAudio) {
                this.currentAudio.pause();
                this.currentAudio.remove();
            }

            // Create new audio element
            this.currentAudio = new Audio(audioData.url);
            this.currentAudio.crossOrigin = 'anonymous';
            this.currentVideoId = videoId;

            console.log('[YouTubeAudio] Audio element created');

            return {
                audio: this.currentAudio,
                metadata: audioData
            };

        } catch (error) {
            console.error('[YouTubeAudio] Error creating audio element:', error);
            throw error;
        }
    }

    /**
     * Playback controls
     */
    play() {
        if (this.currentAudio) this.currentAudio.play();
    }

    pause() {
        if (this.currentAudio) this.currentAudio.pause();
    }

    stop() {
        if (this.currentAudio) {
            this.currentAudio.pause();
            this.currentAudio.currentTime = 0;
        }
    }

    setVolume(volume) {
        if (this.currentAudio) this.currentAudio.volume = volume;
    }

    getCurrentTime() {
        return this.currentAudio ? this.currentAudio.currentTime : 0;
    }

    getDuration() {
        return this.currentAudio ? this.currentAudio.duration : 0;
    }

    seekTo(seconds) {
        if (this.currentAudio) this.currentAudio.currentTime = seconds;
    }

    isPlaying() {
        return this.currentAudio && !this.currentAudio.paused;
    }

    /**
     * Clean up
     */
    cleanup() {
        if (this.currentAudio) {
            this.currentAudio.pause();
            this.currentAudio.remove();
            this.currentAudio = null;
        }
        this.currentVideoId = null;
    }
}

// Export as global for browser use
window.YouTubeAudio = YouTubeAudio;