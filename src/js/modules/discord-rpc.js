// Discord RPC Module - Handles Discord Rich Presence updates
const { ipcRenderer } = require('electron');

export class DiscordRPC {
    constructor() {
        this.enabled = true;
        this.lastSongPath = null;
        this.lastPlayState = false;
        this.cachedEndTimestamp = null;
    }

    // Update Discord Rich Presence
    updatePresence(data) {
        if (!this.enabled) return;

        const {
            visualizerName = 'Waveform',
            currentFile = null,
            isPlaying = false,
            audioBuffer = null,
            audioContext = null,
            startTime = 0,
            parseFileName = null,
            metadata = null
        } = data;

        // No song playing
        if (!currentFile) {
            this.lastSongPath = null;
            this.lastPlayState = false;
            this.cachedEndTimestamp = null;
            ipcRenderer.send('update-discord-presence', {
                state: `Using ${visualizerName}`,
                details: 'No song playing'
            });
            return;
        }

        // Use metadata if available, otherwise parse filename
        let songName;
        let albumInfo = '';
        
        if (metadata && (metadata.title || metadata.artist)) {
            const title = metadata.title || parseFileName(currentFile.name).title;
            const artist = metadata.artist;
            const album = metadata.album;
            
            if (artist) {
                songName = `${artist} - ${title}`;
            } else {
                songName = title;
            }
            
            if (album) {
                albumInfo = ` (${album})`;
            }
        } else {
            // Fallback to filename parsing
            const parsed = parseFileName ? parseFileName(currentFile.name) : { title: currentFile.name, hasArtist: false };
            songName = parsed.hasArtist ? `${parsed.artist} - ${parsed.title}` : parsed.title;
        }

        const details = isPlaying ? `${songName}${albumInfo}` : `Paused: ${songName}`;
        const state = `Using ${visualizerName}`;

        const presenceData = {
            details: details,
            state: state
        };

        // Check if song or play state changed
        const songChanged = this.lastSongPath !== currentFile.path;
        const playStateChanged = this.lastPlayState !== isPlaying;

        // Only recalculate timestamp if song changed or play state changed
        if (isPlaying && audioBuffer && audioContext) {
            if (songChanged || playStateChanged || !this.cachedEndTimestamp) {
                const currentTime = audioContext.currentTime - startTime;
                const remaining = audioBuffer.duration - currentTime;
                this.cachedEndTimestamp = Date.now() + (remaining * 1000);
            }
            presenceData.endTimestamp = this.cachedEndTimestamp;
        } else {
            // Not playing, clear cached timestamp
            this.cachedEndTimestamp = null;
        }

        // Update tracking variables
        this.lastSongPath = currentFile.path;
        this.lastPlayState = isPlaying;

        ipcRenderer.send('update-discord-presence', presenceData);
    }

    // Clear presence
    clearPresence() {
        ipcRenderer.send('update-discord-presence', {
            details: 'Idle',
            state: 'No song playing'
        });
    }

    // Enable/disable Discord RPC
    setEnabled(enabled) {
        this.enabled = enabled;
        if (!enabled) {
            this.clearPresence();
        }
    }
}
