/**
 * YouTube Search Module
 * Handles YouTube API searches and video playback integration
 */

class YouTubeSearch {
    constructor() {
        this.apiKey = null;
        this.searchResults = [];
        this.currentVideoId = null;
        this.player = null;
        this.audioContext = null;
        this.audioSource = null;
        this.onTrackLoadedCallback = null;
    }

    /**
     * Initialize YouTube API
     */
    init(apiKey) {
        this.apiKey = apiKey;
        console.log('[YouTube] API initialized');
    }

    /**
     * Search YouTube videos
     */
    async searchVideos(query, maxResults = 20) {
        if (!this.apiKey) {
            console.error('[YouTube] API key not configured');
            return [];
        }

        try {
            const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=${maxResults}&q=${encodeURIComponent(query)}&key=${this.apiKey}`;

            const response = await fetch(url);
            const data = await response.json();

            if (data.error) {
                console.error('[YouTube] API error:', data.error.message);
                return [];
            }

            this.searchResults = data.items.map(item => ({
                id: item.id.videoId,
                title: item.snippet.title,
                channel: item.snippet.channelTitle,
                thumbnail: item.snippet.thumbnails.medium.url,
                description: item.snippet.description
            }));

            console.log(`[YouTube] Found ${this.searchResults.length} results for "${query}"`);
            return this.searchResults;

        } catch (error) {
            console.error('[YouTube] Search error:', error);
            return [];
        }
    }

    /**
     * Load YouTube IFrame API
     */
    loadYouTubeAPI() {
        return new Promise((resolve) => {
            if (window.YT && window.YT.Player) {
                resolve();
                return;
            }

            // Create script tag
            const tag = document.createElement('script');
            tag.src = 'https://www.youtube.com/iframe_api';

            // API ready callback
            window.onYouTubeIframeAPIReady = () => {
                console.log('[YouTube] IFrame API loaded');
                resolve();
            };

            document.head.appendChild(tag);
        });
    }

    /**
     * Create YouTube player
     */
    async createPlayer(containerId) {
        await this.loadYouTubeAPI();

        return new Promise((resolve) => {
            this.player = new YT.Player(containerId, {
                height: '180',
                width: '320',
                playerVars: {
                    autoplay: 1,
                    controls: 1,
                    disablekb: 0,
                    fs: 0,
                    modestbranding: 1,
                    playsinline: 1,
                    enablejsapi: 1,
                    origin: window.location.origin
                },
                events: {
                    onReady: () => {
                        console.log('[YouTube] Player ready');
                        resolve(this.player);
                    },
                    onStateChange: (event) => this.onPlayerStateChange(event),
                    onError: (event) => {
                        console.error('[YouTube] Player error:', event.data);
                        const errors = {
                            2: 'Invalid video ID',
                            5: 'HTML5 player error',
                            100: 'Video not found',
                            101: 'Video owner does not allow embedding',
                            150: 'Video owner does not allow embedding',
                            153: 'Video owner does not allow embedding'
                        };
                        alert(`Erreur YouTube: ${errors[event.data] || 'Unknown error'}\n\nEssaie une autre vidéo.`);
                    }
                }
            });
        });
    }

    /**
     * Handle player state changes
     */
    onPlayerStateChange(event) {
        const states = {
            '-1': 'unstarted',
            '0': 'ended',
            '1': 'playing',
            '2': 'paused',
            '3': 'buffering',
            '5': 'cued'
        };

        const state = states[event.data] || 'unknown';
        console.log('[YouTube] Player state:', state);

        if (state === 'playing' && this.onTrackLoadedCallback) {
            this.onTrackLoadedCallback({
                title: this.player.getVideoData().title,
                duration: this.player.getDuration(),
                isYouTube: true
            });
        }
    }

    /**
     * Play a video by ID
     */
    async playVideo(videoId) {
        console.log('[YouTube] playVideo called with:', videoId);
        console.log('[YouTube] Player exists:', !!this.player);

        if (!this.player) {
            console.error('[YouTube] Player not initialized');
            return false;
        }

        try {
            this.currentVideoId = videoId;
            console.log('[YouTube] Calling loadVideoById...');
            this.player.loadVideoById(videoId);
            console.log('[YouTube] loadVideoById called successfully');

            // Auto-play after loading
            setTimeout(() => {
                console.log('[YouTube] Auto-playing...');
                this.player.playVideo();
            }, 500);

            return true;
        } catch (error) {
            console.error('[YouTube] Error in playVideo:', error);
            return false;
        }
    }

    /**
     * Playback controls
     */
    play() {
        if (this.player) this.player.playVideo();
    }

    pause() {
        if (this.player) this.player.pauseVideo();
    }

    stop() {
        if (this.player) this.player.stopVideo();
    }

    setVolume(volume) {
        if (this.player) this.player.setVolume(volume * 100);
    }

    getCurrentTime() {
        return this.player ? this.player.getCurrentTime() : 0;
    }

    getDuration() {
        return this.player ? this.player.getDuration() : 0;
    }

    seekTo(seconds) {
        if (this.player) this.player.seekTo(seconds, true);
    }

    isPlaying() {
        if (!this.player) return false;
        const state = this.player.getPlayerState();
        return state === 1; // YT.PlayerState.PLAYING
    }

    /**
     * Set callback for when track is loaded
     */
    onTrackLoaded(callback) {
        this.onTrackLoadedCallback = callback;
    }

    /**
     * Get video info
     */
    getVideoInfo(videoId) {
        const result = this.searchResults.find(r => r.id === videoId);
        if (result) return result;

        // If not in search results, return basic info
        if (this.player && this.currentVideoId === videoId) {
            return {
                id: videoId,
                title: this.player.getVideoData().title,
                channel: this.player.getVideoData().author,
                thumbnail: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`
            };
        }

        return null;
    }
}

// Export as global for browser use (Electron renderer process)
window.YouTubeSearch = YouTubeSearch;
