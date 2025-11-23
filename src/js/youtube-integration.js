/**
 * YouTube Integration for Spectra
 * Handles YouTube tab, search, and playback
 */

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', initYouTubeIntegration);

function initYouTubeIntegration() {
    console.log('[YouTube] Initializing integration...');

    // YouTube instance
    let youtubeSearch = null;
    let youTubeAudio = null; // New YouTubeAudio instance
    let isYouTubeMode = false;
    let currentYouTubeVideoId = null;

    // API Key - load from .env or settings
    const YOUTUBE_API_KEY = 'AIzaSyBsMmyjyWaFGeziczXZrnWWJWCJC-rIyoI';

    // DOM Elements - get them safely
    const youtubeTab = document.getElementById('youtubeTab');
    const youtubePanel = document.getElementById('youtubePanel');
    const youtubeSidebarSearch = document.getElementById('youtubeSidebarSearch');
    const youtubeSidebarSearchBtn = document.getElementById('youtubeSidebarSearchBtn');
    const youtubeResultsSidebar = document.getElementById('youtubeResultsSidebar');

    // Get elements from renderer
    const localFilesTab = document.getElementById('localFilesTab');
    const spotifyTab = document.getElementById('spotifyTab');
    const spotifyPanel = document.getElementById('spotifyPanel');
    const searchInputWrapper = document.querySelector('.search-input-wrapper');
    const browseFolderBtn = document.getElementById('browseFolderBtn');
    const browseFolderBtnContainer = browseFolderBtn ? browseFolderBtn.parentElement : null;
    const fileBrowser = document.getElementById('fileBrowser');
    const playPauseBtn = document.getElementById('playPauseBtn');

    // Check if required elements exist
    if (!youtubeTab || !youtubePanel) {
        console.error('[YouTube] Required DOM elements not found');
        return;
    }

    // Wait for YouTubeSearch to be available, then initialize
    waitForYouTubeSearch();

    function waitForYouTubeSearch() {
        if (window.YouTubeSearch && window.YouTubeAudio) {
            console.log('[YouTube] YouTube classes found, initializing...');
            initializeYouTube();
        } else {
            console.log('[YouTube] Waiting for YouTube classes...');
            setTimeout(waitForYouTubeSearch, 100);
        }
    }

    // Initialize YouTube
    async function initializeYouTube() {
        console.log('[YouTube] Initializing...');

        if (!window.YouTubeSearch || !window.YouTubeAudio) {
            console.error('[YouTube] Required classes not found');
            return;
        }

        // Initialize Search
        if (!youtubeSearch) {
            youtubeSearch = new window.YouTubeSearch();
            youtubeSearch.init(YOUTUBE_API_KEY);
        }

        // Initialize Audio Handler
        if (!youTubeAudio) {
            youTubeAudio = new window.YouTubeAudio();
        }

        console.log('[YouTube] Initialized successfully');
    }

    // YouTube Tab Click Handler
    youtubeTab.addEventListener('click', () => {
        console.log('[YouTube] Tab clicked');

        // Update tab styles
        youtubeTab.classList.add('active');
        localFilesTab.classList.remove('active');
        spotifyTab.classList.remove('active');

        youtubeTab.style.background = '#00ff88';
        youtubeTab.style.color = '#000';
        localFilesTab.style.background = '#444';
        localFilesTab.style.color = '#888';
        spotifyTab.style.background = '#444';
        localFilesTab.style.color = '#888';

        // Show/hide panels
        youtubePanel.classList.remove('hidden');
        spotifyPanel.classList.add('hidden');
        searchInputWrapper.classList.add('hidden');
        if (browseFolderBtnContainer) browseFolderBtnContainer.classList.add('hidden');

        isYouTubeMode = true;
        // isSpotifyMode = false; // Undefined variable in original code, assuming global or ignored

        // Clear file browser
        fileBrowser.innerHTML = '<div class="empty-state">Search YouTube to find videos</div>';

        // Initialize YouTube if not done yet
        if (!youtubeSearch) {
            initializeYouTube();
        }
    });

    // Search YouTube
    async function searchYouTube() {
        const query = youtubeSidebarSearch.value.trim();

        if (!query) {
            alert('Please enter a search term');
            return;
        }

        console.log('[YouTube] Searching for:', query);

        // Initialize if not done yet
        if (!youtubeSearch) {
            console.log('[YouTube] Initializing before search...');
            await initializeYouTube();
        }

        if (!youtubeSearch) {
            youtubeResultsSidebar.innerHTML = `
                <div style="text-align: center; padding: 20px; color: #ff4444;">
                    YouTube not initialized. Please refresh the page.
                </div>
            `;
            return;
        }

        // Show loading
        youtubeResultsSidebar.innerHTML = `
            <div style="text-align: center; padding: 20px; color: #888;">
                <div style="width: 30px; height: 30px; border: 3px solid rgba(255, 0, 0, 0.3); border-top-color: #FF0000; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 10px;"></div>
                Searching...
            </div>
        `;

        try {
            const results = await youtubeSearch.searchVideos(query, 20);

            if (results.length === 0) {
                youtubeResultsSidebar.innerHTML = `
                    <div style="text-align: center; padding: 20px; color: #888;">
                        No results found
                    </div>
                `;
                return;
            }

            // Display results
            displayYouTubeResults(results);

        } catch (error) {
            console.error('[YouTube] Search error:', error);
            youtubeResultsSidebar.innerHTML = `
                <div style="text-align: center; padding: 20px; color: #ff4444;">
                    Search failed. Check API key.
                </div>
            `;
        }
    }

    // Display YouTube results
    function displayYouTubeResults(results) {
        youtubeResultsSidebar.innerHTML = results.map(video => `
            <div class="youtube-result-item" data-video-id="${video.id}" style="
                display: flex;
                gap: 10px;
                padding: 10px;
                background: rgba(255, 255, 255, 0.03);
                border: 1px solid rgba(255, 0, 0, 0.2);
                border-radius: 5px;
                margin-bottom: 10px;
                cursor: pointer;
                transition: all 0.3s;
            ">
                <img src="${video.thumbnail}" style="width: 120px; height: 68px; object-fit: cover; border-radius: 3px;">
                <div style="flex: 1; min-width: 0;">
                    <div style="font-size: 13px; color: #fff; margin-bottom: 5px; overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; line-height: 1.4;">
                        ${video.title}
                    </div>
                    <div style="font-size: 11px; color: #999;">
                        ${video.channel}
                    </div>
                </div>
            </div>
        `).join('');

        // Add click handlers
        document.querySelectorAll('.youtube-result-item').forEach(item => {
            item.addEventListener('click', () => {
                const videoId = item.dataset.videoId;
                playYouTubeVideo(videoId);
            });

            item.addEventListener('mouseenter', (e) => {
                e.currentTarget.style.background = 'rgba(255, 0, 0, 0.1)';
                e.currentTarget.style.borderColor = '#FF0000';
            });

            item.addEventListener('mouseleave', (e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                e.currentTarget.style.borderColor = 'rgba(255, 0, 0, 0.2)';
            });
        });
    }

    // Play YouTube video
    async function playYouTubeVideo(videoId) {
        console.log('[YouTube] Playing video:', videoId);

        if (!youTubeAudio) {
            await initializeYouTube();
        }

        if (!youTubeAudio) {
            alert('YouTube Audio not initialized');
            return;
        }

        try {
            // Stop current audio if playing
            const audioElement = document.getElementById('audioElement') || document.querySelector('audio');
            if (audioElement && !audioElement.paused) {
                audioElement.pause();
            }

            // Update UI to show loading
            const nowPlayingTitle = document.getElementById('nowPlayingTitle');
            const nowPlayingArtist = document.getElementById('nowPlayingArtist');
            if (nowPlayingTitle) nowPlayingTitle.textContent = 'Loading YouTube Audio...';
            if (nowPlayingArtist) nowPlayingArtist.textContent = 'Please wait';

            // Create audio element using yt-dlp
            console.log('[YouTube] Fetching audio stream...');
            const { audio, metadata } = await youTubeAudio.createAudioElement(videoId);
            
            currentYouTubeVideoId = videoId;
            console.log('[YouTube] Audio stream ready');

            // Connect to Audio Manager (Visualizer)
            if (window.audioManager) {
                console.log('[YouTube] Connecting to Audio Manager...');
                const success = window.audioManager.setAudioSource(audio);
                if (success) {
                    console.log('[YouTube] Connected to visualizer successfully');
                } else {
                    console.error('[YouTube] Failed to connect to visualizer');
                }
            }

            // Play audio
            try {
                await audio.play();
                console.log('[YouTube] Playback started');
                if (playPauseBtn) playPauseBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>';
            } catch (playError) {
                console.error('[YouTube] Playback failed:', playError);
                // Handle autoplay policy
            }

            // Update UI with metadata
            if (metadata) {
                if (nowPlayingTitle) nowPlayingTitle.textContent = metadata.title;
                if (nowPlayingArtist) nowPlayingArtist.textContent = 'YouTube';
                
                const nowPlayingArt = document.getElementById('nowPlayingArt');
                if (nowPlayingArt && metadata.thumbnail) {
                    nowPlayingArt.innerHTML = `<img src="${metadata.thumbnail}" style="width: 100%; height: 100%; object-fit: cover;">`;
                }
            }

        } catch (error) {
            console.error('[YouTube] Playback error:', error);
            const nowPlayingTitle = document.getElementById('nowPlayingTitle');
            if (nowPlayingTitle) nowPlayingTitle.textContent = 'Error loading audio';
            alert('Failed to load YouTube audio. Please try another video.');
        }
    }

    // Event Listeners
    youtubeSidebarSearchBtn.addEventListener('click', searchYouTube);

    youtubeSidebarSearch.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            searchYouTube();
        }
    });

    // Update playback controls for YouTube
    const originalPlayPause = window.playPause || function() {};
    
    // Override global play/pause
    window.playPause = function() {
        if (isYouTubeMode && youTubeAudio) {
            if (youTubeAudio.isPlaying()) {
                youTubeAudio.pause();
                if (playPauseBtn) playPauseBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>';
            } else {
                youTubeAudio.play();
                if (playPauseBtn) playPauseBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>';
            }
        } else {
            originalPlayPause();
        }
    };

    // Export for use in other modules
    window.youtubeIntegration = {
        initializeYouTube,
        searchYouTube,
        playYouTubeVideo,
        isYouTubeMode: () => isYouTubeMode
    };

    console.log('[YouTube] Integration loaded');

} // End of initYouTubeIntegration function
