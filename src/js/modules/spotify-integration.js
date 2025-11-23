// Spotify Integration Module
const { ipcRenderer } = require('electron');

export class SpotifyIntegration {
    constructor() {
        this.accessToken = null;
        this.playlists = [];
        this.currentPlaylist = null;
        this.currentTrack = null;
        // Note: Spotify integration is for metadata/playlists only
        // Actual playback uses local files
        
        this.setupEventListeners();
        this.restoreSession();
    }

    // Restore session from localStorage
    restoreSession() {
        const savedToken = localStorage.getItem('spotifyAccessToken');
        const savedUser = localStorage.getItem('spotifyUser');
        
        if (savedToken && savedUser) {
            this.accessToken = savedToken;
            const user = JSON.parse(savedUser);
            this.updateUILoggedIn(user);
        }
    }

    // Setup IPC event listeners
    setupEventListeners() {
        // Auth success
        ipcRenderer.on('spotify-auth-success', (event, data) => {
            console.log('Spotify authentication successful!', data.user);
            this.accessToken = data.accessToken;
            
            localStorage.setItem('spotifyAccessToken', data.accessToken);
            localStorage.setItem('spotifyRefreshToken', data.refreshToken);
            localStorage.setItem('spotifyUser', JSON.stringify(data.user));
            
            this.updateUILoggedIn(data.user);
            console.log('Spotify connected - metadata and playlists available');
        });

        // Auth error
        ipcRenderer.on('spotify-auth-error', (event, error) => {
            console.error('Spotify auth error:', error);
        });

        // Token refresh
        ipcRenderer.on('spotify-token-refreshed', (event, data) => {
            console.log('Spotify token refreshed');
            this.accessToken = data.accessToken;
            localStorage.setItem('spotifyAccessToken', data.accessToken);
        });

        // Playlists received
        ipcRenderer.on('spotify-playlists-received', (event, data) => {
            console.log('Received Spotify playlists:', data.items.length);
            this.playlists = data.items;
        });

        // Playlist tracks received
        ipcRenderer.on('spotify-playlist-tracks-received', (event, data) => {
            console.log('Received playlist tracks:', data.tracks.items.length);
            this.currentPlaylist = data;
        });

        // Track features (BPM)
        ipcRenderer.on('spotify-track-features-received', (event, data) => {
            if (data.features && data.features.tempo) {
                // Callback will be set by renderer
                if (this.onBPMReceived) {
                    this.onBPMReceived(data.features.tempo);
                }
            }
        });

        // Errors
        ipcRenderer.on('spotify-error', (event, error) => {
            console.error('Spotify error:', error);
        });
    }

    // Login
    login() {
        console.log('Initiating Spotify login...');
        ipcRenderer.send('spotify-login');
    }

    // Logout
    logout() {
        this.accessToken = null;
        this.playlists = [];
        this.currentPlaylist = null;
        localStorage.removeItem('spotifyAccessToken');
        localStorage.removeItem('spotifyRefreshToken');
        localStorage.removeItem('spotifyUser');
        console.log('Logged out from Spotify');
    }

    // Load playlists
    loadPlaylists() {
        if (!this.accessToken) return;
        console.log('Loading Spotify playlists...');
        ipcRenderer.send('spotify-get-playlists', this.accessToken);
    }

    // Load playlist tracks
    loadPlaylistTracks(playlistId) {
        if (!this.accessToken) return;
        console.log('Loading playlist tracks...');
        ipcRenderer.send('spotify-get-playlist-tracks', playlistId);
    }

    // Get track features (BPM, key, etc.)
    getTrackFeatures(trackId) {
        if (!this.accessToken) return;
        console.log('Getting track features for:', trackId);
        ipcRenderer.send('spotify-get-track-features', trackId);
    }

    // Note: Direct Spotify playback is not supported
    // Use this integration to browse playlists and get metadata (BPM, key)
    // Then play matching local files for visualization

    // Update UI when logged in
    updateUILoggedIn(user) {
        const spotifyLogin = document.getElementById('spotifyLogin');
        const spotifyConnected = document.getElementById('spotifyConnected');
        const spotifyUsername = document.getElementById('spotifyUsername');
        
        if (spotifyLogin) spotifyLogin.classList.add('hidden');
        if (spotifyConnected) spotifyConnected.classList.remove('hidden');
        if (spotifyUsername) spotifyUsername.textContent = user.display_name || user.id;
    }

    // Getters
    isLoggedIn() {
        return this.accessToken !== null;
    }

    getPlaylists() {
        return this.playlists;
    }

    getCurrentPlaylist() {
        return this.currentPlaylist;
    }

    // Get track info by ID
    getTrackInfo(trackId) {
        return this.currentPlaylist?.tracks?.items?.find(
            item => item.track.id === trackId
        )?.track;
    }
}
