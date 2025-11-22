console.log('Renderer process loaded!');

// Import BPM detection library
const { guess } = require('web-audio-beat-detector');

// Audio variables (declare first)
let audioBuffer = null;
let audioSource = null;
let isPlaying = false;
let currentFolder = '';
let audioFiles = [];
let currentFileIndex = -1;
let searchQuery = '';
let startTime = 0;
let pauseTime = 0;
let animationFrameId = null;
let shuffleMode = false;
let repeatMode = 'off'; // 'off', 'one', 'all'
let playbackRate = 1.0;
let volume = 1.0;
let gainNode = null;
let playbackQueue = [];
let manualStop = false; // Flag to distinguish manual stop from natural end

const canvas = document.getElementById('visualizer');
const ctx = canvas.getContext('2d');

// Create audio context
const audioContext = new AudioContext();
console.log('AudioContext created:', audioContext.state);

// Create gain node for volume control
gainNode = audioContext.createGain();
gainNode.gain.value = 1.0;

// Create analyser node
const analyser = audioContext.createAnalyser();
analyser.fftSize = 2048; // Must be power of 2 (256, 512, 1024, 2048, etc.)
analyser.smoothingTimeConstant = 0.8; // 0-1, higher = smoother
console.log('AnalyserNode created - fftSize:', analyser.fftSize, 'smoothing:', analyser.smoothingTimeConstant);

// Create data arrays for analysis
const bufferLength = analyser.frequencyBinCount; // Half of fftSize
const timeDomainData = new Uint8Array(bufferLength); // For waveform (0-255)
const frequencyData = new Uint8Array(bufferLength); // For frequency bars (0-255)
console.log('Data arrays created - bufferLength:', bufferLength);

// Get UI elements
const playBtn = document.getElementById('playBtn');
const pauseBtn = document.getElementById('pauseBtn');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const shuffleBtn = document.getElementById('shuffleBtn');
const repeatBtn = document.getElementById('repeatBtn');
const volumeSlider = document.getElementById('volumeSlider');
const volumeValue = document.getElementById('volumeValue');
const speedSelect = document.getElementById('speedSelect');
const queueBtn = document.getElementById('queueBtn');
const queuePanel = document.getElementById('queuePanel');
const closeQueueBtn = document.getElementById('closeQueueBtn');
const queueList = document.getElementById('queueList');
const visualizerSelect = document.getElementById('visualizerSelect');
const statusText = document.getElementById('status');
const settingsToggle = document.getElementById('settingsToggle');
const settingsPanel = document.getElementById('settingsPanel');
const browseFolderBtn = document.getElementById('browseFolderBtn');
const fileBrowser = document.getElementById('fileBrowser');
const folderPath = document.getElementById('folderPath');
const searchInput = document.getElementById('searchInput');
const fileCount = document.getElementById('fileCount');
const currentTimeEl = document.getElementById('currentTime');
const durationEl = document.getElementById('duration');
const progressBar = document.getElementById('progressBar');
const progressFill = document.getElementById('progressFill');
const progressHandle = document.getElementById('progressHandle');

// Settings UI elements (already declared above, just get the inputs)
const settingsContent = document.getElementById('settingsContent');
const primaryColorInput = document.getElementById('primaryColor');
const lineWidthInput = document.getElementById('lineWidth');
const smoothingInput = document.getElementById('smoothing');
const sensitivityInput = document.getElementById('sensitivity');
const bgColorInput = document.getElementById('bgColor');
const mirrorEffectInput = document.getElementById('mirrorEffect');

// Settings object
const settings = {
    primaryColor: '#00ff88',
    lineWidth: 2,
    smoothing: 0.8,
    sensitivity: 1.0,
    bgColor: '#000000',
    mirrorEffect: false,
    beatDetection: true,
    beatFlashIntensity: 0.3,
    beatFlashDuration: 0.92
};

// Beat detection variables
let beatValue = 0;

// BPM detection variables
let detectedBPM = 0;
let bpmOffset = 0; // Offset from start of track to first beat
let lastBeatFlash = 0;

// Format time in MM:SS
function formatTime(seconds) {
    if (!isFinite(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Beat detection using BPM timing
function detectBeat() {
    if (!settings.beatDetection || detectedBPM === 0 || !isPlaying) {
        beatValue *= beatDecay;
        return false;
    }
    
    // Calculate current position in track
    const currentTime = audioContext.currentTime - startTime;
    
    // Calculate beat interval in seconds
    const beatInterval = 60 / detectedBPM;
    
    // Calculate time since track start, adjusted for offset
    const adjustedTime = currentTime - bpmOffset;
    
    // Find the nearest beat time
    const beatNumber = Math.floor(adjustedTime / beatInterval);
    const nextBeatTime = (beatNumber * beatInterval) + bpmOffset;
    const timeSinceLastBeat = currentTime - nextBeatTime;
    
    // Trigger flash if we just passed a beat (within 50ms window)
    if (timeSinceLastBeat >= 0 && timeSinceLastBeat < 0.05 && lastBeatFlash !== beatNumber) {
        lastBeatFlash = beatNumber;
        beatValue = 1.0;
        return true;
    }
    
    // Decay beat value using duration setting
    beatValue *= settings.beatFlashDuration;
    return false;
}

// Analyze BPM using web-audio-beat-detector library
async function analyzeBPM(audioBuffer) {
    try {
        console.log('Analyzing BPM...');
        const result = await guess(audioBuffer);
        detectedBPM = Math.round(result.bpm);
        bpmOffset = result.offset || 0; // Time offset to first beat
        lastBeatFlash = -1; // Reset beat counter
        console.log('✓ BPM detected:', detectedBPM, 'Offset:', bpmOffset.toFixed(3) + 's', 'Tempo:', result.tempo);
        updateBPMDisplay();
    } catch (error) {
        console.error('BPM detection failed:', error);
        detectedBPM = 0;
        bpmOffset = 0;
        updateBPMDisplay();
    }
}

// Update BPM display
function updateBPMDisplay() {
    const bpmDisplay = document.getElementById('bpmDisplay');
    if (bpmDisplay) {
        if (detectedBPM > 0) {
            bpmDisplay.textContent = `${detectedBPM} BPM`;
            console.log('BPM updated:', detectedBPM);
        } else {
            bpmDisplay.textContent = '-- BPM';
        }
    }
}

// Update Discord Rich Presence
function updateDiscordPresence() {
    // Get current visualizer name
    const currentVisualizer = visualizerManager?.currentVisualizer?.name || 'Waveform';
    
    if (currentFileIndex === -1 || audioFiles.length === 0) {
        ipcRenderer.send('update-discord-presence', {
            state: `Using ${currentVisualizer}`,
            details: 'No song playing'
        });
        return;
    }

    const file = audioFiles[currentFileIndex];
    const parsed = parseFileName(file.name);
    
    let songName = parsed.hasArtist ? `${parsed.artist} - ${parsed.title}` : parsed.title;
    let details = isPlaying ? `Listening to ${songName}` : `Paused`;
    let state = `Using ${currentVisualizer}`;
    
    const data = {
        details: details,
        state: state
    };
    
    // Add timestamps if playing
    if (isPlaying && audioBuffer) {
        const currentTime = audioContext.currentTime - startTime;
        const remaining = audioBuffer.duration - currentTime;
        data.endTimestamp = Date.now() + (remaining * 1000);
    }
    
    ipcRenderer.send('update-discord-presence', data);
}

// Update progress bar
function updateProgress() {
    if (!audioBuffer || !isPlaying) return;
    
    const currentTime = audioContext.currentTime - startTime;
    const duration = audioBuffer.duration;
    const progress = Math.min((currentTime / duration) * 100, 100);
    
    progressFill.style.width = `${progress}%`;
    progressHandle.style.left = `${progress}%`;
    currentTimeEl.textContent = formatTime(currentTime);
    
    if (currentTime >= duration) {
        // Song ended
        isPlaying = false;
        playBtn.disabled = false;
        pauseBtn.disabled = true;
        updateFileSelection();
        progressFill.style.width = '0%';
        progressHandle.style.left = '0%';
        currentTimeEl.textContent = '0:00';
    }
}

// ===== PLAYBACK CONTROLS =====

// Previous track
prevBtn.addEventListener('click', () => {
    if (audioFiles.length === 0) return;
    
    const wasPlaying = isPlaying;
    const currentTime = isPlaying ? (audioContext.currentTime - startTime) : 0;
    
    // If more than 3 seconds into song, restart it
    if (currentTime > 3 && audioBuffer) {
        loadAudioFile(currentFileIndex);
    } else {
        // Go to previous track
        let prevIndex = currentFileIndex - 1;
        if (prevIndex < 0) {
            prevIndex = audioFiles.length - 1; // Wrap to last song
        }
        loadAudioFile(prevIndex);
    }
    
    // Auto-play if was playing
    if (wasPlaying) {
        setTimeout(() => playBtn.click(), 100);
    }
});

// Next track
nextBtn.addEventListener('click', () => {
    playNextTrack();
});

function playNextTrack() {
    if (audioFiles.length === 0) return;
    
    let nextIndex;
    if (shuffleMode) {
        // Random track
        nextIndex = Math.floor(Math.random() * audioFiles.length);
        // Avoid playing same song twice in a row
        if (nextIndex === currentFileIndex && audioFiles.length > 1) {
            nextIndex = (nextIndex + 1) % audioFiles.length;
        }
    } else {
        nextIndex = currentFileIndex + 1;
        if (nextIndex >= audioFiles.length) {
            if (repeatMode === 'all') {
                nextIndex = 0; // Loop to first song
            } else {
                return; // End of playlist
            }
        }
    }
    
    loadAudioFile(nextIndex).then(() => {
        setTimeout(() => playBtn.click(), 100);
    });
}

// Shuffle toggle
shuffleBtn.addEventListener('click', () => {
    shuffleMode = !shuffleMode;
    shuffleBtn.classList.toggle('active', shuffleMode);
    shuffleBtn.title = shuffleMode ? 'Shuffle On' : 'Shuffle Off';
    console.log('Shuffle:', shuffleMode);
});

// Repeat toggle
repeatBtn.addEventListener('click', () => {
    const modes = ['off', 'all', 'one'];
    const currentIndex = modes.indexOf(repeatMode);
    repeatMode = modes[(currentIndex + 1) % modes.length];
    
    repeatBtn.classList.toggle('active', repeatMode !== 'off');
    
    if (repeatMode === 'off') {
        repeatBtn.title = 'Repeat Off';
        repeatBtn.querySelector('svg').innerHTML = '<path d="M17 1l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="M7 23l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>';
    } else if (repeatMode === 'all') {
        repeatBtn.title = 'Repeat All';
        repeatBtn.querySelector('svg').innerHTML = '<path d="M17 1l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="M7 23l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>';
    } else {
        repeatBtn.title = 'Repeat One';
        repeatBtn.querySelector('svg').innerHTML = '<path d="M17 1l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="M7 23l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/><text x="12" y="16" text-anchor="middle" font-size="10" fill="currentColor">1</text>';
    }
    
    console.log('Repeat mode:', repeatMode);
});

// Volume control
volumeSlider.addEventListener('input', (e) => {
    volume = e.target.value / 100;
    gainNode.gain.value = volume;
    volumeValue.textContent = `${e.target.value}%`;
});

// Speed control
speedSelect.addEventListener('change', (e) => {
    playbackRate = parseFloat(e.target.value);
    if (audioSource) {
        audioSource.playbackRate.value = playbackRate;
    }
    console.log('Playback speed:', playbackRate);
});

// Queue panel toggle
if (queueBtn) {
    queueBtn.addEventListener('click', () => {
        console.log('Queue button clicked');
        queuePanel.classList.toggle('hidden');
        if (!queuePanel.classList.contains('hidden')) {
            updateQueueDisplay();
        }
    });
    console.log('Queue button handler attached');
} else {
    console.error('Queue button not found!');
}

if (closeQueueBtn) {
    closeQueueBtn.addEventListener('click', () => {
        queuePanel.classList.add('hidden');
    });
} else {
    console.error('Close queue button not found!');
}

// Update queue display
function updateQueueDisplay() {
    if (audioFiles.length === 0) {
        queueList.innerHTML = '<div class="empty-state">No songs in queue</div>';
        return;
    }
    
    queueList.innerHTML = '';
    audioFiles.forEach((file, index) => {
        const queueItem = document.createElement('div');
        queueItem.className = 'queue-item';
        if (index === currentFileIndex) {
            queueItem.classList.add('current');
        }
        
        const parsed = parseFileName(file.name);
        queueItem.innerHTML = `
            <span class="queue-item-number">${index + 1}</span>
            <div class="file-content">
                <div class="file-title">${parsed.title}</div>
                ${parsed.hasArtist ? `<div class="file-artist">${parsed.artist}</div>` : ''}
            </div>
        `;
        
        queueItem.addEventListener('click', () => {
            loadAudioFile(index);
            if (!isPlaying) {
                setTimeout(() => playBtn.click(), 100);
            }
            queuePanel.classList.add('hidden');
        });
        
        queueList.appendChild(queueItem);
    });
}

// Seek to position
progressBar.addEventListener('click', (e) => {
    if (!audioBuffer) return;
    
    const rect = progressBar.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const seekTime = percent * audioBuffer.duration;
    
    if (isPlaying && audioSource) {
        // Stop current playback
        manualStop = true; // Set flag before stopping
        audioSource.stop();
        
        // Create new source at seek position
        audioSource = audioContext.createBufferSource();
        audioSource.buffer = audioBuffer;
        audioSource.playbackRate.value = playbackRate;
        
        // Connect: source → analyser → gain → destination
        audioSource.connect(analyser);
        analyser.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        // Handle when audio ends (same as play button)
        audioSource.onended = () => {
            // Check if this was a manual stop
            if (manualStop) {
                manualStop = false;
                return;
            }
            
            // Natural end of song
            if (repeatMode === 'one') {
                loadAudioFile(currentFileIndex).then(() => {
                    setTimeout(() => playBtn.click(), 100);
                });
            } else if (repeatMode === 'all' || (currentFileIndex < audioFiles.length - 1) || shuffleMode) {
                playNextTrack();
            } else {
                isPlaying = false;
                statusText.textContent = 'Playback ended';
                playBtn.disabled = false;
                pauseBtn.disabled = true;
                updateFileSelection();
                progressFill.style.width = '0%';
                progressHandle.style.left = '0%';
                currentTimeEl.textContent = '0:00';
            }
        };
        
        audioSource.start(0, seekTime);
        startTime = audioContext.currentTime - seekTime;
    } else {
        // Just update the visual position
        const progress = percent * 100;
        progressFill.style.width = `${progress}%`;
        progressHandle.style.left = `${progress}%`;
        currentTimeEl.textContent = formatTime(seekTime);
        pauseTime = seekTime;
    }
});

// ===== FILE BROWSER =====
const fs = require('fs');
const path = require('path');
const { ipcRenderer } = require('electron');

// Browse folder button
browseFolderBtn.addEventListener('click', async () => {
    console.log('Browse folder button clicked');
    ipcRenderer.send('open-folder-dialog');
});

// Receive folder path from main process
ipcRenderer.on('folder-selected', (event, folderPath) => {
    console.log('Received folder path:', folderPath);
    if (folderPath) {
        currentFolder = folderPath;
        loadFolder(currentFolder);
    } else {
        console.log('No folder path received');
    }
});

// Load folder contents
function loadFolder(folderPath) {
    console.log('Loading folder:', folderPath);
    
    try {
        // Check if folder exists
        if (!fs.existsSync(folderPath)) {
            throw new Error('Folder does not exist');
        }

        const files = fs.readdirSync(folderPath);
        console.log('Found files:', files.length);
        
        audioFiles = [];

        // Filter audio files
        const audioExtensions = ['.mp3', '.wav', '.ogg', '.m4a', '.flac', '.aac', '.wma'];
        files.forEach(file => {
            const ext = path.extname(file).toLowerCase();
            if (audioExtensions.includes(ext)) {
                audioFiles.push({
                    name: file,
                    path: path.join(folderPath, file)
                });
            }
        });

        // Sort alphabetically
        audioFiles.sort((a, b) => a.name.localeCompare(b.name));

        // Update UI
        updateFolderPath(folderPath);
        renderFileList();

        console.log(`Loaded ${audioFiles.length} audio files from ${folderPath}`);
        
        // Update file count
        fileCount.textContent = `${audioFiles.length} song${audioFiles.length !== 1 ? 's' : ''}`;
        
        // Enable prev/next buttons if we have songs
        prevBtn.disabled = audioFiles.length === 0;
        nextBtn.disabled = audioFiles.length === 0;
        
        // Save last opened folder to localStorage
        localStorage.setItem('lastOpenedFolder', folderPath);
        console.log('Saved last opened folder:', folderPath);
        
        if (audioFiles.length === 0) {
            fileBrowser.innerHTML = '<div class="empty-state">No audio files found in this folder<br><small>Supported: MP3, WAV, OGG, FLAC, M4A, AAC, WMA</small></div>';
        }
    } catch (error) {
        console.error('Error loading folder:', error);
        fileBrowser.innerHTML = `<div class="empty-state">Error loading folder<br><small>${error.message}</small></div>`;
    }
}

// Update folder path display
function updateFolderPath(folderPathStr) {
    const pathParts = folderPathStr.split(path.sep);
    folderPath.innerHTML = '';

    const homeSpan = document.createElement('span');
    homeSpan.className = 'path-segment';
    homeSpan.textContent = '🏠 ' + pathParts[pathParts.length - 1];
    folderPath.appendChild(homeSpan);
}

// Parse filename to extract artist and title
function parseFileName(filename) {
    // Remove extension
    const nameWithoutExt = filename.replace(/\.[^/.]+$/, '');
    
    // Common patterns:
    // "Artist - Song Title"
    // "Artist-Song Title"
    // "01 Artist - Song Title"
    // "01. Artist - Song Title"
    // "Song Title"
    
    // Remove leading track numbers (01, 01., 1., etc.)
    let cleaned = nameWithoutExt.replace(/^\d+[\s.-]*/, '');
    
    // Try to split by " - " or " – " (em dash)
    const separators = [' - ', ' – ', ' — '];
    for (const sep of separators) {
        if (cleaned.includes(sep)) {
            const parts = cleaned.split(sep);
            return {
                artist: parts[0].trim(),
                title: parts.slice(1).join(sep).trim(),
                hasArtist: true
            };
        }
    }
    
    // No separator found, treat entire name as title
    return {
        artist: '',
        title: cleaned.trim(),
        hasArtist: false
    };
}

// Render file list
function renderFileList() {
    if (audioFiles.length === 0) {
        fileBrowser.innerHTML = '<div class="empty-state">No audio files found in this folder</div>';
        return;
    }

    // Filter files based on search query
    const filteredFiles = audioFiles.filter((file, index) => {
        if (!searchQuery) return true;
        
        const parsed = parseFileName(file.name);
        const searchLower = searchQuery.toLowerCase();
        
        return parsed.title.toLowerCase().includes(searchLower) ||
               parsed.artist.toLowerCase().includes(searchLower) ||
               file.name.toLowerCase().includes(searchLower);
    });

    fileBrowser.innerHTML = '';
    
    if (filteredFiles.length === 0) {
        fileBrowser.innerHTML = '<div class="empty-state">No songs match your search</div>';
        return;
    }

    filteredFiles.forEach((file) => {
        const index = audioFiles.indexOf(file);
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        fileItem.dataset.index = index;

        const parsed = parseFileName(file.name);
        
        // Create file item HTML with artist and title
        const iconSpan = document.createElement('span');
        iconSpan.className = 'file-icon';
        iconSpan.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>';
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'file-content';
        
        if (parsed.hasArtist) {
            const titleDiv = document.createElement('div');
            titleDiv.className = 'file-title';
            titleDiv.textContent = parsed.title;
            
            const artistDiv = document.createElement('div');
            artistDiv.className = 'file-artist';
            artistDiv.textContent = parsed.artist;
            
            contentDiv.appendChild(titleDiv);
            contentDiv.appendChild(artistDiv);
        } else {
            const titleDiv = document.createElement('div');
            titleDiv.className = 'file-title';
            titleDiv.textContent = parsed.title;
            contentDiv.appendChild(titleDiv);
        }
        
        fileItem.appendChild(iconSpan);
        fileItem.appendChild(contentDiv);

        fileItem.addEventListener('click', () => {
            const wasPlaying = isPlaying;
            loadAudioFile(index).then(() => {
                // Auto-play if something was already playing
                if (wasPlaying) {
                    setTimeout(() => playBtn.click(), 100);
                }
            });
        });

        fileBrowser.appendChild(fileItem);
    });
}

// Search input handler
searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value;
    renderFileList();
    updateFileSelection();
});

// Load audio file
async function loadAudioFile(index) {
    if (index < 0 || index >= audioFiles.length) return;

    // Stop current playback if any
    if (audioSource && isPlaying) {
        manualStop = true; // Set flag before stopping
        audioSource.stop();
        isPlaying = false;
    }

    currentFileIndex = index;
    const file = audioFiles[index];

    statusText.textContent = 'Loading...';
    console.log('Loading file:', file.name);

    try {
        // Read file
        const buffer = fs.readFileSync(file.path);
        const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);

        // Decode audio data
        audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        console.log('Audio loaded successfully:', audioBuffer.duration, 'seconds');

        statusText.textContent = `${file.name} (${audioBuffer.duration.toFixed(1)}s)`;
        playBtn.disabled = false;
        pauseBtn.disabled = true;
        
        // Reset time display
        durationEl.textContent = formatTime(audioBuffer.duration);
        currentTimeEl.textContent = '0:00';
        progressFill.style.width = '0%';
        progressHandle.style.left = '0%';
        pauseTime = 0;
        
        // Reset and analyze BPM
        detectedBPM = 0;
        updateBPMDisplay();
        analyzeBPM(audioBuffer); // Async analysis in background

        // Update UI
        updateFileSelection();
        updateDiscordPresence();

    } catch (error) {
        console.error('Error loading audio:', error);
        statusText.textContent = 'Error loading file';
    }
}

// Update file selection UI
function updateFileSelection() {
    const fileItems = fileBrowser.querySelectorAll('.file-item');
    fileItems.forEach((item, index) => {
        item.classList.remove('selected', 'playing');
        if (index === currentFileIndex) {
            item.classList.add(isPlaying ? 'playing' : 'selected');
        }
    });
}

// Play button handler
playBtn.addEventListener('click', () => {
    if (!audioBuffer) return;

    // Resume audio context if suspended
    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }

    // Stop current source if playing
    if (audioSource) {
        audioSource.stop();
    }

    // Create new source node
    audioSource = audioContext.createBufferSource();
    audioSource.buffer = audioBuffer;
    audioSource.playbackRate.value = playbackRate;

    // Connect: source → analyser → gain → destination (speakers)
    audioSource.connect(analyser);
    analyser.connect(gainNode);
    gainNode.connect(audioContext.destination);
    console.log('Audio graph connected: source → analyser → gain → destination');

    // Handle when audio ends
    audioSource.onended = () => {
        // Check if this was a manual stop (pause/load new file)
        if (manualStop) {
            manualStop = false; // Reset flag
            return; // Don't auto-play next track
        }
        
        // Natural end of song
        if (repeatMode === 'one') {
            // Repeat current song
            loadAudioFile(currentFileIndex).then(() => {
                setTimeout(() => playBtn.click(), 100);
            });
        } else if (repeatMode === 'all' || (currentFileIndex < audioFiles.length - 1) || shuffleMode) {
            // Play next track
            playNextTrack();
        } else {
            // End of playlist
            isPlaying = false;
            statusText.textContent = 'Playback ended';
            playBtn.disabled = false;
            pauseBtn.disabled = true;
            updateFileSelection();
            progressFill.style.width = '0%';
            progressHandle.style.left = '0%';
            currentTimeEl.textContent = '0:00';
            console.log('Playback ended');
        }
    };

    // Start playback from pause position or beginning
    const offset = pauseTime || 0;
    audioSource.start(0, offset);
    startTime = audioContext.currentTime - offset;
    pauseTime = 0;
    
    isPlaying = true;
    statusText.textContent = 'Playing...';
    playBtn.disabled = true;
    pauseBtn.disabled = false;
    console.log('Playback started');

    // Update file selection UI
    updateFileSelection();
    
    // Update Discord presence
    updateDiscordPresence();

    // Start visualization (animation loop runs continuously)
    animate();
});

// Pause button handler
pauseBtn.addEventListener('click', () => {
    if (audioSource && isPlaying) {
        manualStop = true; // Set flag before stopping
        audioSource.stop();
        pauseTime = audioContext.currentTime - startTime;
        isPlaying = false;
        statusText.textContent = 'Paused';
        playBtn.disabled = false;
        pauseBtn.disabled = true;
        updateFileSelection();
        updateDiscordPresence();
        console.log('Playback paused at', pauseTime);
    }
});

// ===== VISUALIZER ARCHITECTURE =====

// Base Visualizer class
class Visualizer {
    constructor(name) {
        this.name = name;
        this.settings = {};
    }

    init(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
    }

    update(timeDomainData, frequencyData) {
        // Override in subclasses
    }

    draw() {
        // Override in subclasses
    }

    // Return custom settings for this visualizer
    getCustomSettings() {
        return []; // Override in subclasses to return array of setting definitions
    }

    // Update visualizer-specific setting
    updateSetting(key, value) {
        this.settings[key] = value;
    }
}

// Waveform Visualizer
class WaveformVisualizer extends Visualizer {
    constructor() {
        super('Waveform');
    }

    update(timeDomainData, frequencyData) {
        this.timeDomainData = timeDomainData;
    }

    draw() {
        // Clear canvas with settings background color
        this.ctx.fillStyle = settings.bgColor;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Set line style from settings
        this.ctx.lineWidth = settings.lineWidth;
        this.ctx.strokeStyle = settings.primaryColor;
        this.ctx.beginPath();

        // Calculate slice width
        const sliceWidth = this.canvas.width / this.timeDomainData.length;
        let x = 0;

        // Draw waveform
        for (let i = 0; i < this.timeDomainData.length; i++) {
            const v = this.timeDomainData[i] / 255.0;
            const y = v * this.canvas.height * settings.sensitivity;

            if (i === 0) {
                this.ctx.moveTo(x, y);
            } else {
                this.ctx.lineTo(x, y);
            }

            x += sliceWidth;
        }

        this.ctx.lineTo(this.canvas.width, this.canvas.height / 2);
        this.ctx.stroke();

        // Mirror effect
        if (settings.mirrorEffect) {
            this.ctx.save();
            this.ctx.scale(1, -1);
            this.ctx.translate(0, -this.canvas.height);
            this.ctx.globalAlpha = 0.5;
            this.ctx.drawImage(this.canvas, 0, 0);
            this.ctx.restore();
        }
    }
}

// Visualizer Manager
class VisualizerManager {
    constructor() {
        this.visualizers = new Map();
        this.currentVisualizer = null;
    }

    register(visualizer) {
        this.visualizers.set(visualizer.name, visualizer);
        console.log(`Registered visualizer: ${visualizer.name}`);
    }

    setActive(name) {
        const visualizer = this.visualizers.get(name);
        if (visualizer) {
            this.currentVisualizer = visualizer;
            this.currentVisualizer.init(canvas, ctx);
            console.log(`Active visualizer: ${name}`);
            return true;
        }
        return false;
    }

    update(timeDomainData, frequencyData) {
        if (this.currentVisualizer) {
            this.currentVisualizer.update(timeDomainData, frequencyData);
        }
    }

    draw() {
        if (this.currentVisualizer) {
            this.currentVisualizer.draw();
        }
    }

    getVisualizerNames() {
        return Array.from(this.visualizers.keys());
    }
}

// Frequency Bars Visualizer
class FrequencyBarsVisualizer extends Visualizer {
    constructor() {
        super('Frequency Bars');
    }

    update(timeDomainData, frequencyData) {
        this.frequencyData = frequencyData;
    }

    draw() {
        // Clear canvas with settings background color
        this.ctx.fillStyle = settings.bgColor;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Calculate bar width
        const barCount = 128;
        const barWidth = this.canvas.width / barCount;

        // Draw bars
        for (let i = 0; i < barCount; i++) {
            const barHeight = (this.frequencyData[i] / 255) * this.canvas.height * settings.sensitivity;

            // Color gradient based on frequency
            const hue = (i / barCount) * 360;
            this.ctx.fillStyle = `hsl(${hue}, 100%, 50%)`;

            const x = i * barWidth;
            const y = this.canvas.height - barHeight;

            this.ctx.fillRect(x, y, barWidth - 1, barHeight);
        }
    }
}

// Circular Visualizer
class CircularVisualizer extends Visualizer {
    constructor() {
        super('Circular');
    }

    update(timeDomainData, frequencyData) {
        this.timeDomainData = timeDomainData;
    }

    draw() {
        // Clear canvas with settings background color
        this.ctx.fillStyle = settings.bgColor;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const radius = Math.min(centerX, centerY) - 50;

        // Draw main circular waveform
        this.drawCircularWave(centerX, centerY, radius, 1);

        // Mirror effect - draw additional mirrored copies
        if (settings.mirrorEffect) {
            this.ctx.globalAlpha = 0.6;
            
            // Draw 4 mirrored copies for kaleidoscope effect
            this.ctx.save();
            this.ctx.translate(centerX, centerY);
            
            for (let i = 1; i <= 3; i++) {
                this.ctx.rotate(Math.PI / 2);
                this.ctx.scale(1, -1);
                this.drawCircularWave(0, 0, radius, 0.8 - i * 0.15);
                this.ctx.scale(1, -1);
            }
            
            this.ctx.restore();
            this.ctx.globalAlpha = 1;
        }
    }

    drawCircularWave(centerX, centerY, radius, alpha) {
        this.ctx.strokeStyle = settings.primaryColor;
        this.ctx.lineWidth = settings.lineWidth;
        this.ctx.globalAlpha = alpha;
        this.ctx.beginPath();

        const sliceAngle = (Math.PI * 2) / this.timeDomainData.length;

        for (let i = 0; i < this.timeDomainData.length; i++) {
            const v = this.timeDomainData[i] / 255.0;
            const amplitude = (v - 0.5) * 100 * settings.sensitivity;
            const r = radius + amplitude;

            const angle = sliceAngle * i;
            const x = centerX + r * Math.cos(angle);
            const y = centerY + r * Math.sin(angle);

            if (i === 0) {
                this.ctx.moveTo(x, y);
            } else {
                this.ctx.lineTo(x, y);
            }
        }

        this.ctx.closePath();
        this.ctx.stroke();
        this.ctx.globalAlpha = 1;
    }
}

// Particle Visualizer
class ParticleVisualizer extends Visualizer {
    constructor() {
        super('Particles');
        this.particles = [];
        this.settings = { particleCount: 150, speed: 1.5, trailLength: 0.15 };
    }

    getCustomSettings() {
        return [
            { key: 'particleCount', label: 'Particle Count', type: 'range', min: 50, max: 300, value: 150 },
            { key: 'speed', label: 'Speed', type: 'range', min: 0.5, max: 3, value: 1.5, step: 0.1 },
            { key: 'trailLength', label: 'Trail Length', type: 'range', min: 0.05, max: 0.5, value: 0.15, step: 0.05 }
        ];
    }

    init(canvas, ctx) {
        super.init(canvas, ctx);
        this.initParticles();
    }

    initParticles() {
        this.particles = [];
        const count = this.settings.particleCount || 150;
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                vx: (Math.random() - 0.5) * 3,
                vy: (Math.random() - 0.5) * 3,
                size: Math.random() * 2 + 1,
                baseSpeed: Math.random() * 0.5 + 0.5
            });
        }
    }

    updateSetting(key, value) {
        super.updateSetting(key, value);
        if (key === 'particleCount' && this.canvas) {
            this.initParticles();
        }
    }

    update(timeDomainData, frequencyData) {
        this.frequencyData = frequencyData;
        this.timeDomainData = timeDomainData;

        // Calculate average amplitude from frequency data (bass heavy)
        let bassSum = 0;
        let midSum = 0;
        let trebleSum = 0;
        
        const bassEnd = Math.floor(frequencyData.length * 0.1);
        const midEnd = Math.floor(frequencyData.length * 0.4);
        
        for (let i = 0; i < bassEnd; i++) {
            bassSum += frequencyData[i];
        }
        for (let i = bassEnd; i < midEnd; i++) {
            midSum += frequencyData[i];
        }
        for (let i = midEnd; i < frequencyData.length; i++) {
            trebleSum += frequencyData[i];
        }
        
        this.bassEnergy = (bassSum / bassEnd) / 255;
        this.midEnergy = (midSum / (midEnd - bassEnd)) / 255;
        this.trebleEnergy = (trebleSum / (frequencyData.length - midEnd)) / 255;
        this.avgAmplitude = (bassSum + midSum + trebleSum) / frequencyData.length;
    }

    draw() {
        if (!this.canvas) return;

        // Fade effect with adjustable trail length
        const bgColor = settings.bgColor;
        const rgb = parseInt(bgColor.slice(1), 16);
        const r = (rgb >> 16) & 255;
        const g = (rgb >> 8) & 255;
        const b = rgb & 255;
        const trailAlpha = this.settings.trailLength || 0.15;
        this.ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${trailAlpha})`;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Calculate energy with better scaling
        const energy = Math.min((this.avgAmplitude / 128) * settings.sensitivity, 3);
        const bassBoost = this.bassEnergy * 2;

        this.particles.forEach((particle, index) => {
            // Different particles react to different frequencies
            const freqIndex = Math.floor((index / this.particles.length) * 3);
            let particleEnergy = energy;
            
            if (freqIndex === 0) particleEnergy *= (1 + this.bassEnergy * 2);
            else if (freqIndex === 1) particleEnergy *= (1 + this.midEnergy);
            else particleEnergy *= (1 + this.trebleEnergy);

            // Move particle with energy influence
            const speedMultiplier = this.settings.speed || 1.5;
            particle.x += particle.vx * particle.baseSpeed * speedMultiplier * (1 + particleEnergy);
            particle.y += particle.vy * particle.baseSpeed * speedMultiplier * (1 + particleEnergy);

            // Wrap around edges
            if (particle.x < 0) particle.x = this.canvas.width;
            if (particle.x > this.canvas.width) particle.x = 0;
            if (particle.y < 0) particle.y = this.canvas.height;
            if (particle.y > this.canvas.height) particle.y = 0;

            // Draw particle with energy-based size and color
            const particleSize = particle.size * (1 + particleEnergy * 0.5);
            
            // Color varies based on energy
            const primaryRgb = parseInt(settings.primaryColor.slice(1), 16);
            const pr = (primaryRgb >> 16) & 255;
            const pg = (primaryRgb >> 8) & 255;
            const pb = primaryRgb & 255;
            
            // Add energy-based color variation
            const colorR = Math.min(255, pr + particleEnergy * 50);
            const colorG = Math.min(255, pg + particleEnergy * 30);
            const colorB = Math.min(255, pb + particleEnergy * 20);
            
            this.ctx.fillStyle = `rgba(${colorR}, ${colorG}, ${colorB}, ${0.6 + particleEnergy * 0.4})`;
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particleSize, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Add glow effect on high energy
            if (particleEnergy > 1) {
                this.ctx.shadowBlur = 10 * particleEnergy;
                this.ctx.shadowColor = settings.primaryColor;
                this.ctx.beginPath();
                this.ctx.arc(particle.x, particle.y, particleSize, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.shadowBlur = 0;
            }
        });
    }
}

// Spectrum Analyzer Visualizer
class SpectrumVisualizer extends Visualizer {
    constructor() {
        super('Spectrum');
        this.settings = { barGap: 2, barStyle: 'gradient' };
    }

    getCustomSettings() {
        return [
            { key: 'barGap', label: 'Bar Gap', type: 'range', min: 0, max: 10, value: 2 },
            { key: 'barStyle', label: 'Bar Style', type: 'select', options: ['solid', 'gradient', 'glow'], value: 'gradient' }
        ];
    }

    update(timeDomainData, frequencyData) {
        this.frequencyData = frequencyData;
    }

    draw() {
        this.ctx.fillStyle = settings.bgColor;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        const barCount = 64;
        const barWidth = (this.canvas.width / barCount) - this.settings.barGap;

        for (let i = 0; i < barCount; i++) {
            const barHeight = (this.frequencyData[i] / 255) * this.canvas.height * settings.sensitivity;
            const x = i * (barWidth + this.settings.barGap);
            const y = this.canvas.height - barHeight;

            if (this.settings.barStyle === 'gradient') {
                const gradient = this.ctx.createLinearGradient(x, y, x, this.canvas.height);
                gradient.addColorStop(0, settings.primaryColor);
                gradient.addColorStop(1, settings.bgColor);
                this.ctx.fillStyle = gradient;
            } else if (this.settings.barStyle === 'glow') {
                this.ctx.shadowBlur = 20;
                this.ctx.shadowColor = settings.primaryColor;
                this.ctx.fillStyle = settings.primaryColor;
            } else {
                this.ctx.fillStyle = settings.primaryColor;
            }

            this.ctx.fillRect(x, y, barWidth, barHeight);
            this.ctx.shadowBlur = 0;
        }
    }
}

// Radial Bars Visualizer
class RadialBarsVisualizer extends Visualizer {
    constructor() {
        super('Radial Bars');
        this.settings = { barCount: 64, rotation: 0 };
    }

    getCustomSettings() {
        return [
            { key: 'barCount', label: 'Bar Count', type: 'range', min: 32, max: 128, value: 64 },
            { key: 'rotation', label: 'Rotation', type: 'range', min: 0, max: 360, value: 0 }
        ];
    }

    update(timeDomainData, frequencyData) {
        this.frequencyData = frequencyData;
    }

    draw() {
        this.ctx.fillStyle = settings.bgColor;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const radius = Math.min(centerX, centerY) * 0.3;

        // Draw main radial bars
        this.drawRadialBars(centerX, centerY, radius, 1);

        // Mirror effect - draw inverted bars
        if (settings.mirrorEffect) {
            this.ctx.globalAlpha = 0.5;
            // Draw bars going inward instead of outward
            this.drawRadialBarsInverted(centerX, centerY, radius);
            this.ctx.globalAlpha = 1;
        }
    }

    drawRadialBars(centerX, centerY, radius, alpha) {
        const barCount = this.settings.barCount;
        this.ctx.globalAlpha = alpha;

        for (let i = 0; i < barCount; i++) {
            const angle = (i / barCount) * Math.PI * 2 + (this.settings.rotation * Math.PI / 180);
            const barHeight = (this.frequencyData[Math.floor(i * this.frequencyData.length / barCount)] / 255) * radius * settings.sensitivity;

            const x1 = centerX + Math.cos(angle) * radius;
            const y1 = centerY + Math.sin(angle) * radius;
            const x2 = centerX + Math.cos(angle) * (radius + barHeight);
            const y2 = centerY + Math.sin(angle) * (radius + barHeight);

            this.ctx.strokeStyle = settings.primaryColor;
            this.ctx.lineWidth = settings.lineWidth;
            this.ctx.beginPath();
            this.ctx.moveTo(x1, y1);
            this.ctx.lineTo(x2, y2);
            this.ctx.stroke();
        }
        this.ctx.globalAlpha = 1;
    }

    drawRadialBarsInverted(centerX, centerY, radius) {
        const barCount = this.settings.barCount;

        for (let i = 0; i < barCount; i++) {
            const angle = (i / barCount) * Math.PI * 2 + (this.settings.rotation * Math.PI / 180);
            const barHeight = (this.frequencyData[Math.floor(i * this.frequencyData.length / barCount)] / 255) * radius * settings.sensitivity;

            const x1 = centerX + Math.cos(angle) * radius;
            const y1 = centerY + Math.sin(angle) * radius;
            const x2 = centerX + Math.cos(angle) * (radius - barHeight * 0.7);
            const y2 = centerY + Math.sin(angle) * (radius - barHeight * 0.7);

            this.ctx.strokeStyle = settings.primaryColor;
            this.ctx.lineWidth = settings.lineWidth;
            this.ctx.beginPath();
            this.ctx.moveTo(x1, y1);
            this.ctx.lineTo(x2, y2);
            this.ctx.stroke();
        }
    }
}

// Wave Rings Visualizer
class WaveRingsVisualizer extends Visualizer {
    constructor() {
        super('Wave Rings');
        this.settings = { ringCount: 5, ringSpacing: 30 };
    }

    getCustomSettings() {
        return [
            { key: 'ringCount', label: 'Ring Count', type: 'range', min: 3, max: 10, value: 5 },
            { key: 'ringSpacing', label: 'Ring Spacing', type: 'range', min: 20, max: 60, value: 30 }
        ];
    }

    update(timeDomainData, frequencyData) {
        this.timeDomainData = timeDomainData;
    }

    draw() {
        this.ctx.fillStyle = settings.bgColor;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;

        // Draw main rings
        this.drawRings(centerX, centerY, 1, false);

        // Mirror effect - draw inverted amplitude rings
        if (settings.mirrorEffect) {
            this.ctx.globalAlpha = 0.5;
            this.drawRings(centerX, centerY, 0.6, true);
            this.ctx.globalAlpha = 1;
        }
    }

    drawRings(centerX, centerY, amplitudeScale, inverted) {
        for (let ring = 0; ring < this.settings.ringCount; ring++) {
            const baseRadius = (ring + 1) * this.settings.ringSpacing;
            
            this.ctx.strokeStyle = settings.primaryColor;
            this.ctx.lineWidth = settings.lineWidth;
            this.ctx.globalAlpha = (1 - (ring / this.settings.ringCount) * 0.5) * (inverted ? 0.5 : 1);
            this.ctx.beginPath();

            const points = 100;
            for (let i = 0; i <= points; i++) {
                const angle = (i / points) * Math.PI * 2;
                const dataIndex = Math.floor((i / points) * this.timeDomainData.length);
                let amplitude = ((this.timeDomainData[dataIndex] / 255) - 0.5) * 50 * settings.sensitivity * amplitudeScale;
                
                // Invert amplitude for mirror effect
                if (inverted) {
                    amplitude = -amplitude;
                }
                
                const radius = baseRadius + amplitude;

                const x = centerX + Math.cos(angle) * radius;
                const y = centerY + Math.sin(angle) * radius;

                if (i === 0) {
                    this.ctx.moveTo(x, y);
                } else {
                    this.ctx.lineTo(x, y);
                }
            }

            this.ctx.closePath();
            this.ctx.stroke();
        }
        this.ctx.globalAlpha = 1;
    }
}

// Oscilloscope Visualizer
class OscilloscopeVisualizer extends Visualizer {
    constructor() {
        super('Oscilloscope');
        this.settings = { gridLines: true, thickness: 2 };
    }

    getCustomSettings() {
        return [
            { key: 'gridLines', label: 'Grid Lines', type: 'checkbox', value: true },
            { key: 'thickness', label: 'Line Thickness', type: 'range', min: 1, max: 5, value: 2 }
        ];
    }

    update(timeDomainData, frequencyData) {
        this.timeDomainData = timeDomainData;
    }

    draw() {
        this.ctx.fillStyle = settings.bgColor;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw grid
        if (this.settings.gridLines) {
            this.ctx.strokeStyle = '#333';
            this.ctx.lineWidth = 1;
            
            // Horizontal lines
            for (let i = 0; i <= 4; i++) {
                const y = (this.canvas.height / 4) * i;
                this.ctx.beginPath();
                this.ctx.moveTo(0, y);
                this.ctx.lineTo(this.canvas.width, y);
                this.ctx.stroke();
            }
            
            // Vertical lines
            for (let i = 0; i <= 8; i++) {
                const x = (this.canvas.width / 8) * i;
                this.ctx.beginPath();
                this.ctx.moveTo(x, 0);
                this.ctx.lineTo(x, this.canvas.height);
                this.ctx.stroke();
            }
        }

        // Draw waveform
        this.ctx.strokeStyle = settings.primaryColor;
        this.ctx.lineWidth = this.settings.thickness;
        this.ctx.beginPath();

        const sliceWidth = this.canvas.width / this.timeDomainData.length;
        let x = 0;

        for (let i = 0; i < this.timeDomainData.length; i++) {
            const v = this.timeDomainData[i] / 255.0;
            const y = v * this.canvas.height;

            if (i === 0) {
                this.ctx.moveTo(x, y);
            } else {
                this.ctx.lineTo(x, y);
            }

            x += sliceWidth;
        }

        this.ctx.stroke();
    }
}

// Create visualizer manager and register visualizers
const visualizerManager = new VisualizerManager();
visualizerManager.register(new WaveformVisualizer());
visualizerManager.register(new FrequencyBarsVisualizer());
visualizerManager.register(new CircularVisualizer());
visualizerManager.register(new ParticleVisualizer());
visualizerManager.register(new SpectrumVisualizer());
visualizerManager.register(new RadialBarsVisualizer());
visualizerManager.register(new WaveRingsVisualizer());
visualizerManager.register(new OscilloscopeVisualizer());
visualizerManager.setActive('Waveform');

// Populate visualizer dropdown now that they're registered
populateVisualizerSelect();

// Main animation loop
function animate() {
    requestAnimationFrame(animate);

    // Get audio data
    analyser.getByteTimeDomainData(timeDomainData);
    analyser.getByteFrequencyData(frequencyData);

    // Detect beats
    const isBeat = detectBeat(frequencyData);
    
    // Apply beat flash effect to canvas
    if (settings.beatDetection && beatValue > 0.1) {
        const flashIntensity = beatValue * settings.beatFlashIntensity;
        canvas.style.filter = `brightness(${1 + flashIntensity})`;
    } else {
        canvas.style.filter = 'brightness(1)';
    }

    // Update and draw current visualizer
    visualizerManager.update(timeDomainData, frequencyData);
    visualizerManager.draw();
    
    // Update progress bar
    updateProgress();
}

// Removed microphone and desktop audio features - focus on file playback

// Visualizer selector handler
visualizerSelect.addEventListener('change', (event) => {
    const selectedName = event.target.value;
    if (visualizerManager.setActive(selectedName)) {
        console.log(`Switched to ${selectedName} visualizer`);
        updateCustomSettings();
        updateDiscordPresence();
    }
});

// Update custom settings panel for current visualizer
function updateCustomSettings() {
    const customSettingsContainer = document.getElementById('customSettings');
    if (!customSettingsContainer) return;

    const visualizer = visualizerManager.currentVisualizer;
    if (!visualizer) return;

    const customSettings = visualizer.getCustomSettings();
    
    if (customSettings.length === 0) {
        customSettingsContainer.innerHTML = '';
        customSettingsContainer.style.display = 'none';
        return;
    }

    customSettingsContainer.style.display = 'grid';
    customSettingsContainer.innerHTML = '';

    customSettings.forEach(setting => {
        const settingItem = document.createElement('div');
        settingItem.className = 'setting-item';

        if (setting.type === 'range') {
            const label = document.createElement('label');
            label.innerHTML = `${setting.label}: <span id="${setting.key}Value">${setting.value}</span>`;
            
            const input = document.createElement('input');
            input.type = 'range';
            input.min = setting.min;
            input.max = setting.max;
            input.value = setting.value;
            input.addEventListener('input', (e) => {
                visualizer.updateSetting(setting.key, parseFloat(e.target.value));
                document.getElementById(`${setting.key}Value`).textContent = e.target.value;
            });

            settingItem.appendChild(label);
            settingItem.appendChild(input);
        } else if (setting.type === 'select') {
            const label = document.createElement('label');
            label.textContent = setting.label + ':';
            
            const select = document.createElement('select');
            select.style.cssText = 'background: #1a1a1a; color: #fff; border: 1px solid #444; padding: 5px; border-radius: 3px; width: 100%;';
            setting.options.forEach(opt => {
                const option = document.createElement('option');
                option.value = opt;
                option.textContent = opt.charAt(0).toUpperCase() + opt.slice(1);
                if (opt === setting.value) option.selected = true;
                select.appendChild(option);
            });
            select.addEventListener('change', (e) => {
                visualizer.updateSetting(setting.key, e.target.value);
            });

            settingItem.appendChild(label);
            settingItem.appendChild(select);
        } else if (setting.type === 'checkbox') {
            const label = document.createElement('label');
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.checked = setting.value;
            checkbox.addEventListener('change', (e) => {
                visualizer.updateSetting(setting.key, e.target.checked);
            });
            label.appendChild(checkbox);
            label.appendChild(document.createTextNode(' ' + setting.label));
            settingItem.appendChild(label);
        }

        customSettingsContainer.appendChild(settingItem);
    });
}

// Populate visualizer dropdown
function populateVisualizerSelect() {
    const names = visualizerManager.getVisualizerNames();
    visualizerSelect.innerHTML = '';
    names.forEach(name => {
        const option = document.createElement('option');
        option.value = name;
        option.textContent = name;
        visualizerSelect.appendChild(option);
    });
}

// Settings panel toggle
if (settingsToggle) {
    settingsToggle.addEventListener('click', () => {
        console.log('Settings button clicked');
        settingsPanel.classList.toggle('hidden');
        if (!settingsPanel.classList.contains('hidden')) {
            updateCustomSettings();
        }
    });
    console.log('Settings button handler attached');
} else {
    console.error('Settings button not found!');
}

// Settings handlers
primaryColorInput.addEventListener('input', (e) => {
    settings.primaryColor = e.target.value;
    document.getElementById('colorValue').textContent = e.target.value;
    saveSettings();
});

lineWidthInput.addEventListener('input', (e) => {
    settings.lineWidth = parseInt(e.target.value);
    document.getElementById('lineWidthValue').textContent = e.target.value;
    saveSettings();
});

smoothingInput.addEventListener('input', (e) => {
    const value = parseInt(e.target.value) / 100;
    settings.smoothing = value;
    analyser.smoothingTimeConstant = value;
    document.getElementById('smoothingValue').textContent = value.toFixed(2);
    saveSettings();
});

sensitivityInput.addEventListener('input', (e) => {
    settings.sensitivity = parseInt(e.target.value) / 100;
    document.getElementById('sensitivityValue').textContent = settings.sensitivity.toFixed(2);
    saveSettings();
});

bgColorInput.addEventListener('input', (e) => {
    settings.bgColor = e.target.value;
    document.getElementById('bgColorValue').textContent = e.target.value;
    saveSettings();
});

mirrorEffectInput.addEventListener('change', (e) => {
    settings.mirrorEffect = e.target.checked;
    saveSettings();
});

// Beat detection settings
const beatDetectionInput = document.getElementById('beatDetection');
const beatFlashInput = document.getElementById('beatFlash');
const beatDurationInput = document.getElementById('beatDuration');

beatDetectionInput.addEventListener('change', (e) => {
    settings.beatDetection = e.target.checked;
    saveSettings();
});

beatFlashInput.addEventListener('input', (e) => {
    settings.beatFlashIntensity = parseFloat(e.target.value);
    document.getElementById('beatFlashValue').textContent = e.target.value;
    saveSettings();
});

beatDurationInput.addEventListener('input', (e) => {
    settings.beatFlashDuration = parseFloat(e.target.value);
    document.getElementById('beatDurationValue').textContent = e.target.value;
    saveSettings();
});

// Save settings to localStorage
function saveSettings() {
    localStorage.setItem('audioVisualizerSettings', JSON.stringify(settings));
    console.log('Settings saved:', settings);
}

// Load settings from localStorage
function loadSettings() {
    const saved = localStorage.getItem('audioVisualizerSettings');
    if (saved) {
        const loaded = JSON.parse(saved);
        Object.assign(settings, loaded);

        // Update UI
        primaryColorInput.value = settings.primaryColor;
        document.getElementById('colorValue').textContent = settings.primaryColor;

        lineWidthInput.value = settings.lineWidth;
        document.getElementById('lineWidthValue').textContent = settings.lineWidth;

        smoothingInput.value = settings.smoothing * 100;
        document.getElementById('smoothingValue').textContent = settings.smoothing.toFixed(2);
        analyser.smoothingTimeConstant = settings.smoothing;

        sensitivityInput.value = settings.sensitivity * 100;
        document.getElementById('sensitivityValue').textContent = settings.sensitivity.toFixed(2);

        bgColorInput.value = settings.bgColor;
        document.getElementById('bgColorValue').textContent = settings.bgColor;

        mirrorEffectInput.checked = settings.mirrorEffect;
        
        // Beat detection settings
        if (beatDetectionInput) {
            beatDetectionInput.checked = settings.beatDetection !== false;
            beatFlashInput.value = settings.beatFlashIntensity || 0.3;
            document.getElementById('beatFlashValue').textContent = (settings.beatFlashIntensity || 0.3).toFixed(2);
            beatDurationInput.value = settings.beatFlashDuration || 0.92;
            document.getElementById('beatDurationValue').textContent = (settings.beatFlashDuration || 0.92).toFixed(2);
        }

        console.log('Settings loaded:', settings);
    }
}

loadSettings();

// Load last opened folder on startup
const lastFolder = localStorage.getItem('lastOpenedFolder');
if (lastFolder && fs.existsSync(lastFolder)) {
    console.log('Loading last opened folder:', lastFolder);
    currentFolder = lastFolder;
    loadFolder(lastFolder);
}

// Initialize Discord presence
setTimeout(() => {
    updateDiscordPresence();
}, 1000);

// ===== KEYBOARD SHORTCUTS =====
document.addEventListener('keydown', (e) => {
    // Ignore if typing in input/select
    if (e.target.matches('input, select')) return;
    
    // Space = Play/Pause
    if (e.code === 'Space') {
        e.preventDefault();
        if (audioBuffer && !isPlaying) {
            playBtn.click();
        } else if (isPlaying) {
            pauseBtn.click();
        }
    }

    // Arrow Left = Previous track
    if (e.code === 'ArrowLeft') {
        e.preventDefault();
        prevBtn.click();
    }

    // Arrow Right = Next track
    if (e.code === 'ArrowRight') {
        e.preventDefault();
        nextBtn.click();
    }

    // Arrow Up = Volume up
    if (e.code === 'ArrowUp') {
        e.preventDefault();
        const newVolume = Math.min(100, parseInt(volumeSlider.value) + 5);
        volumeSlider.value = newVolume;
        volumeSlider.dispatchEvent(new Event('input'));
    }

    // Arrow Down = Volume down
    if (e.code === 'ArrowDown') {
        e.preventDefault();
        const newVolume = Math.max(0, parseInt(volumeSlider.value) - 5);
        volumeSlider.value = newVolume;
        volumeSlider.dispatchEvent(new Event('input'));
    }

    // R = Toggle repeat
    if (e.code === 'KeyR') {
        repeatBtn.click();
    }

    // H = Toggle shuffle
    if (e.code === 'KeyH') {
        shuffleBtn.click();
    }

    // Q = Toggle queue
    if (e.code === 'KeyQ') {
        queueBtn.click();
    }

    // 1-8 = Switch visualizers
    const digitKeys = ['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Digit6', 'Digit7', 'Digit8'];
    const digitIndex = digitKeys.indexOf(e.code);
    if (digitIndex !== -1 && visualizerSelect.options.length > digitIndex) {
        visualizerSelect.selectedIndex = digitIndex;
        visualizerSelect.dispatchEvent(new Event('change'));
    }

    // S = Toggle settings
    if (e.code === 'KeyS') {
        settingsToggle.click();
    }
});

console.log('File browser and keyboard shortcuts loaded');
console.log('8 visualizers available with custom settings');
console.log('Playback controls: Prev/Next, Shuffle, Repeat, Volume, Speed, Queue');
console.log('Keyboard: Space=Play/Pause, ←→=Prev/Next, ↑↓=Volume, R=Repeat, H=Shuffle, Q=Queue, S=Settings');

// Initial canvas state
ctx.fillStyle = '#000';
ctx.fillRect(0, 0, canvas.width, canvas.height);
ctx.fillStyle = '#00ff88';
ctx.font = '20px Arial';
ctx.textAlign = 'center';
ctx.fillText('Browse a folder and select an audio file to begin', canvas.width / 2, canvas.height / 2);