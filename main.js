// Polyfill for undici compatibility with Electron
if (typeof global.File === 'undefined') {
  global.File = class File extends Blob {
    constructor(bits, name, options) {
      super(bits, options);
      this.name = name;
      this.lastModified = options?.lastModified || Date.now();
    }
  };
}

const { app, BrowserWindow, ipcMain, dialog, Menu } = require('electron');
const DiscordRPC = require('discord-rpc');
const SpotifyWebApi = require('spotify-web-api-node');
const jsmediatags = require('jsmediatags');
const youtubedl = require('youtube-dl-exec');
const yts = require('yt-search');
const fs = require('fs');
const path = require('path');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffmpeg = require('fluent-ffmpeg');
ffmpeg.setFfmpegPath(ffmpegPath);

// Global error handlers
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception in main process:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled rejection in main process:', reason);
});

// Note: Spotify integration is for metadata/playlists only (no DRM playback)
// Widevine/DRM support removed - using local file playback only

// Suppress GPU-related warnings
app.commandLine.appendSwitch('no-sandbox');
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('ignore-gpu-blocklist');
app.commandLine.appendSwitch('disable-software-rasterizer');

// Reduce console spam
if (process.env.NODE_ENV !== 'development') {
  app.commandLine.appendSwitch('disable-logging');
}

let mainWindow;
let rpcClient = null;
const clientId = '1441891580561850379'; // You'll need to create a Discord app and replace this

// Spotify API Configuration
// TODO: Replace with your own Spotify App credentials from https://developer.spotify.com/dashboard
const spotifyApi = new SpotifyWebApi({
  clientId: '96593e8fda6f413db8b19d6bf77a2842',
  clientSecret: '4653a8cb45cd4ab58bc18b64579660ad',
  redirectUri: 'http://127.0.0.1:8888/callback'
});

let spotifyAuthServer = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1600,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    backgroundColor: '#1a1a1a',
    icon: 'icon.png',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true
    }
  });

  mainWindow.loadFile('index.html');

  // Check if dev tools should open on startup
  mainWindow.webContents.on('did-finish-load', () => {
    try {
      const fs = require('fs');
      const path = require('path');
      const userDataPath = app.getPath('userData');
      const settingsPath = path.join(userDataPath, 'audioVisualizerSettings.json');

      // Try to read settings from localStorage equivalent
      mainWindow.webContents.executeJavaScript('localStorage.getItem("audioVisualizerSettings")')
        .then(settingsStr => {
          if (settingsStr) {
            const settings = JSON.parse(settingsStr);
            if (settings.openDevToolsOnStartup === true) {
              mainWindow.webContents.openDevTools();
              console.log('DevTools opened automatically (setting enabled)');
            }
          }
        })
        .catch(err => {
          console.log('Could not check DevTools setting:', err.message);
        });
    } catch (error) {
      console.log('Error checking DevTools setting:', error.message);
    }
  });
}

// Create application menu
function createMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Open Folder',
          accelerator: 'CmdOrCtrl+O',
          click: () => {
            mainWindow.webContents.send('menu-open-folder');
          }
        },
        { type: 'separator' },
        {
          label: 'Settings',
          accelerator: 'CmdOrCtrl+,',
          click: () => {
            mainWindow.webContents.send('menu-open-settings');
          }
        },
        { type: 'separator' },
        {
          label: 'Exit',
          accelerator: 'CmdOrCtrl+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'delete' },
        { type: 'separator' },
        { role: 'selectAll' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Playback',
      submenu: [
        {
          label: 'Play/Pause',
          accelerator: 'Space',
          click: () => {
            mainWindow.webContents.send('menu-play-pause');
          }
        },
        {
          label: 'Next Track',
          accelerator: 'CmdOrCtrl+Right',
          click: () => {
            mainWindow.webContents.send('menu-next-track');
          }
        },
        {
          label: 'Previous Track',
          accelerator: 'CmdOrCtrl+Left',
          click: () => {
            mainWindow.webContents.send('menu-prev-track');
          }
        },
        { type: 'separator' },
        {
          label: 'Shuffle',
          accelerator: 'CmdOrCtrl+S',
          click: () => {
            mainWindow.webContents.send('menu-shuffle');
          }
        },
        {
          label: 'Repeat',
          accelerator: 'CmdOrCtrl+R',
          click: () => {
            mainWindow.webContents.send('menu-repeat');
          }
        }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'About Audio Visualizer',
              message: 'Audio Visualizer',
              detail: 'Version 1.0.0\n\nA beautiful audio visualizer with multiple visualization modes.',
              buttons: ['OK']
            });
          }
        },
        {
          label: 'Learn More',
          click: async () => {
            const { shell } = require('electron');
            await shell.openExternal('https://github.com');
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// Setup IPC handlers
function setupIPCHandlers() {
  // Handle folder dialog
  ipcMain.on('open-folder-dialog', async (event) => {
    try {
      const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openDirectory'],
        title: 'Select Music Folder'
      });

      if (!result.canceled && result.filePaths.length > 0) {
        console.log('Folder selected:', result.filePaths[0]);
        event.sender.send('folder-selected', result.filePaths[0]);
      }
    } catch (error) {
      console.error('Error opening folder dialog:', error);
    }
  });

  // Discord presence updates
  ipcMain.on('update-discord-presence', (event, data) => {
    setActivity(data);
  });

  // Spotify handlers
  ipcMain.on('spotify-login', (event) => {
    startSpotifyAuth(event);
  });

  ipcMain.on('spotify-get-playlists', (event, accessToken, refreshToken) => {
    getSpotifyPlaylists(event, accessToken, refreshToken);
  });

  ipcMain.on('spotify-get-playlist-tracks', (event, playlistId) => {
    getSpotifyPlaylistTracks(event, playlistId);
  });

  ipcMain.on('spotify-get-track-features', (event, trackId) => {
    getSpotifyTrackFeatures(event, trackId);
  });

  ipcMain.on('spotify-search', (event, query) => {
    searchSpotifyTracks(event, query);
  });

  ipcMain.on('download-spotify-track', (event, trackInfo) => {
    downloadTrackFromYouTube(event, trackInfo);
  });

  // Album art extraction
  ipcMain.handle('extract-album-art', async (event, filePath) => {
    console.log('[Main] Extracting album art from:', filePath);
    return new Promise((resolve) => {
      jsmediatags.read(filePath, {
        onSuccess: (tag) => {
          console.log('[Main] Tags read successfully');
          const picture = tag.tags.picture;
          if (picture) {
            console.log('[Main] Album art found! Format:', picture.format, 'Size:', picture.data.length);
            // Convert picture data to Buffer
            const data = new Uint8Array(picture.data);
            const format = picture.format;

            resolve({
              data: Array.from(data), // Convert to regular array for IPC
              format: format
            });
          } else {
            console.log('[Main] No picture tag found');
            resolve(null);
          }
        },
        onError: (error) => {
          console.error('[Main] Error extracting album art:', error);
          resolve(null);
        }
      });
    });
  });

  // Extract metadata (title, artist, album)
  ipcMain.handle('extract-metadata', async (event, filePath) => {
    return new Promise((resolve) => {
      jsmediatags.read(filePath, {
        onSuccess: (tag) => {
          const tags = tag.tags;
          resolve({
            title: tags.title || null,
            artist: tags.artist || null,
            album: tags.album || null
          });
        },
        onError: (error) => {
          console.error('[Main] Error extracting metadata:', error);
          resolve({ title: null, artist: null, album: null });
        }
      });
    });
  });

  // Save preset (.spk file)
  ipcMain.handle('save-preset', async (event, data) => {
    try {
      const result = await dialog.showSaveDialog(mainWindow, {
        title: 'Save Spectra Preset',
        defaultPath: data.fileName,
        filters: [
          { name: 'Spectra Preset', extensions: ['spk'] },
          { name: 'All Files', extensions: ['*'] }
        ]
      });

      if (!result.canceled && result.filePath) {
        const fs = require('fs');
        fs.writeFileSync(result.filePath, data.content, 'utf8');
        console.log('[Main] Preset saved:', result.filePath);
        return { success: true, path: result.filePath };
      } else {
        return { success: false, error: 'Save cancelled' };
      }
    } catch (error) {
      console.error('[Main] Error saving preset:', error);
      return { success: false, error: error.message };
    }
  });

  // Load preset (.spk file)
  ipcMain.handle('load-preset', async (event) => {
    try {
      const result = await dialog.showOpenDialog(mainWindow, {
        title: 'Load Spectra Preset',
        filters: [
          { name: 'Spectra Preset', extensions: ['spk'] },
          { name: 'All Files', extensions: ['*'] }
        ],
        properties: ['openFile']
      });

      if (!result.canceled && result.filePaths.length > 0) {
        const fs = require('fs');
        const content = fs.readFileSync(result.filePaths[0], 'utf8');
        console.log('[Main] Preset loaded:', result.filePaths[0]);
        return { success: true, content: content, path: result.filePaths[0] };
      } else {
        return { success: false, error: 'Load cancelled' };
      }
    } catch (error) {
      console.error('[Main] Error loading preset:', error);
      return { success: false, error: error.message };
    }
  });

  // YouTube audio extraction using yt-dlp
  ipcMain.handle('get-youtube-audio-url', async (event, videoId) => {
    try {
      console.log('[Main] Getting YouTube audio URL for:', videoId);

      // Use the bundled yt-dlp from youtube-dl-exec
      const ytdlpPath = require.resolve('youtube-dl-exec').replace('index.js', 'bin/yt-dlp.exe');

      // Get video info using youtube-dl-exec
      const result = await youtubedl(`https://www.youtube.com/watch?v=${videoId}`, {
        dumpSingleJson: true,
        noWarnings: true,
        noCallHome: true,
        noCheckCertificate: true,
        preferFreeFormats: true,
        youtubeSkipDashManifest: true,
        extractorArgs: 'youtube:player_client=default'
      });

      // Find best audio format
      const audioFormats = result.formats.filter(f => 
        f.acodec && f.acodec !== 'none' && (!f.vcodec || f.vcodec === 'none')
      );

      if (audioFormats.length === 0) {
        throw new Error('No audio formats available');
      }

      // Sort by quality (bitrate)
      audioFormats.sort((a, b) => (b.abr || 0) - (a.abr || 0));
      const bestAudio = audioFormats[0];

      console.log('[Main] Successfully extracted audio URL');

      return {
        url: bestAudio.url,
        title: result.title,
        duration: result.duration,
        thumbnail: result.thumbnail
      };

    } catch (error) {
      console.error('[Main] Error getting YouTube audio:', error);
      throw error;
    }
  });
}

app.whenReady().then(() => {
  createWindow();
  createMenu();
  setupIPCHandlers();
  initDiscordRPC();
});

// Quit when all windows are closed (except on macOS)
app.on('window-all-closed', () => {
  if (rpcClient) {
    rpcClient.destroy();
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// On macOS, re-create window when dock icon is clicked
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Initialize Discord Rich Presence
function initDiscordRPC() {
  DiscordRPC.register(clientId);
  rpcClient = new DiscordRPC.Client({ transport: 'ipc' });

  rpcClient.on('ready', () => {
    console.log('Discord RPC connected');
    setActivity({
      state: 'Idle',
      details: 'No song playing'
    });
  });

  rpcClient.login({ clientId }).catch(err => {
    console.error('Failed to connect to Discord:', err);
  });
}

// Update Discord activity
function setActivity(data) {
  if (!rpcClient) return;

  const activity = {
    details: data.details || 'Audio Visualizer',
    state: data.state || 'Idle',
    largeImageKey: 'icon', // You'll need to upload this in Discord Developer Portal
    largeImageText: 'Audio Visualizer',
    instance: false,
  };

  if (data.startTimestamp) {
    activity.startTimestamp = data.startTimestamp;
  }

  if (data.endTimestamp) {
    activity.endTimestamp = data.endTimestamp;
  }

  // Set activity with type 2 for "Listening"
  rpcClient.request('SET_ACTIVITY', {
    pid: process.pid,
    activity: {
      ...activity,
      type: 2 // 0 = Playing, 1 = Streaming, 2 = Listening, 3 = Watching
    }
  }).catch(err => {
    console.error('Failed to set Discord activity:', err);
  });
}

// Spotify OAuth functions
function startSpotifyAuth(event) {
  const scopes = [
    'user-read-private',
    'user-read-email',
    'playlist-read-private',
    'playlist-read-collaborative',
    'user-library-read',
    'streaming',
    'user-read-playback-state',
    'user-modify-playback-state',
    'user-read-currently-playing',
    'app-remote-control'
  ];

  const authorizeURL = spotifyApi.createAuthorizeURL(scopes, 'state');

  // Create a simple HTTP server to handle the callback
  const http = require('http');

  if (spotifyAuthServer) {
    spotifyAuthServer.close();
  }

  spotifyAuthServer = http.createServer(async (req, res) => {
    if (req.url.startsWith('/callback')) {
      const urlParams = new URL(req.url, 'http://localhost:8888').searchParams;
      const code = urlParams.get('code');
      const error = urlParams.get('error');

      if (error) {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end('<html><body><h1>Authentication failed</h1><p>You can close this window.</p></body></html>');
        event.sender.send('spotify-auth-error', error);
        spotifyAuthServer.close();
        return;
      }

      if (code) {
        try {
          // Exchange code for access token
          const data = await spotifyApi.authorizationCodeGrant(code);

          spotifyApi.setAccessToken(data.body['access_token']);
          spotifyApi.setRefreshToken(data.body['refresh_token']);

          // Get user info
          const userInfo = await spotifyApi.getMe();

          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end('<html><body><h1>Successfully connected to Spotify!</h1><p>You can close this window.</p></body></html>');

          event.sender.send('spotify-auth-success', {
            accessToken: data.body['access_token'],
            refreshToken: data.body['refresh_token'],
            expiresIn: data.body['expires_in'],
            user: userInfo.body
          });

          spotifyAuthServer.close();

          // Set up token refresh
          setTimeout(() => refreshSpotifyToken(event), (data.body['expires_in'] - 60) * 1000);
        } catch (err) {
          console.error('Error getting tokens:', err);
          res.writeHead(500, { 'Content-Type': 'text/html' });
          res.end('<html><body><h1>Error</h1><p>Failed to authenticate with Spotify.</p></body></html>');
          event.sender.send('spotify-auth-error', err.message);
          spotifyAuthServer.close();
        }
      }
    }
  });

  spotifyAuthServer.listen(8888, () => {
    console.log('Spotify auth server listening on port 8888');
    // Open browser for authentication
    require('electron').shell.openExternal(authorizeURL);
  });
}

// Refresh Spotify token
async function refreshSpotifyToken(event) {
  try {
    const data = await spotifyApi.refreshAccessToken();
    spotifyApi.setAccessToken(data.body['access_token']);

    if (event && event.sender) {
      event.sender.send('spotify-token-refreshed', {
        accessToken: data.body['access_token'],
        expiresIn: data.body['expires_in']
      });
    }

    // Schedule next refresh
    setTimeout(() => refreshSpotifyToken(event), (data.body['expires_in'] - 60) * 1000);
  } catch (err) {
    console.error('Error refreshing token:', err);
  }
}

// Helper functions for Spotify IPC handlers
async function getSpotifyPlaylists(event, accessToken, refreshToken) {
  // Set tokens
  if (accessToken) {
    spotifyApi.setAccessToken(accessToken);
  }
  if (refreshToken) {
    spotifyApi.setRefreshToken(refreshToken);
  }

  try {
    const playlists = await spotifyApi.getUserPlaylists({ limit: 50 });
    event.sender.send('spotify-playlists-received', playlists.body);
  } catch (err) {
    console.error('Error getting playlists:', err);

    // If token expired, try to refresh
    if (err.statusCode === 401 && refreshToken) {
      try {
        console.log('Token expired, attempting refresh...');
        const data = await spotifyApi.refreshAccessToken();
        spotifyApi.setAccessToken(data.body['access_token']);

        // Notify renderer of new token
        event.sender.send('spotify-token-refreshed', {
          accessToken: data.body['access_token'],
          expiresIn: data.body['expires_in']
        });

        // Retry the request
        const playlists = await spotifyApi.getUserPlaylists({ limit: 50 });
        event.sender.send('spotify-playlists-received', playlists.body);
      } catch (refreshErr) {
        console.error('Error refreshing token:', refreshErr);
        event.sender.send('spotify-error', 'Session expired. Please log in again.');
      }
    } else {
      event.sender.send('spotify-error', err.message);
    }
  }
}

async function getSpotifyPlaylistTracks(event, playlistId) {
  try {
    const tracks = await spotifyApi.getPlaylistTracks(playlistId, { limit: 100 });
    event.sender.send('spotify-playlist-tracks-received', { playlistId, tracks: tracks.body });
  } catch (err) {
    console.error('Error getting playlist tracks:', err);

    // If token expired, try to refresh
    if (err.statusCode === 401) {
      try {
        console.log('Token expired, attempting refresh...');
        const data = await spotifyApi.refreshAccessToken();
        spotifyApi.setAccessToken(data.body['access_token']);

        // Notify renderer of new token
        event.sender.send('spotify-token-refreshed', {
          accessToken: data.body['access_token'],
          expiresIn: data.body['expires_in']
        });

        // Retry the request
        const tracks = await spotifyApi.getPlaylistTracks(playlistId, { limit: 100 });
        event.sender.send('spotify-playlist-tracks-received', { playlistId, tracks: tracks.body });
      } catch (refreshErr) {
        console.error('Error refreshing token:', refreshErr);
        event.sender.send('spotify-error', 'Session expired. Please log in again.');
      }
    } else {
      event.sender.send('spotify-error', err.message);
    }
  }
}

async function getSpotifyTrackFeatures(event, trackId) {
  try {
    const features = await spotifyApi.getAudioFeaturesForTrack(trackId);
    event.sender.send('spotify-track-features-received', { trackId, features: features.body });
  } catch (err) {
    console.error('Error getting track features:', err);

    // If token expired, try to refresh
    if (err.statusCode === 401) {
      try {
        console.log('Token expired, attempting refresh...');
        const data = await spotifyApi.refreshAccessToken();
        spotifyApi.setAccessToken(data.body['access_token']);

        // Notify renderer of new token
        event.sender.send('spotify-token-refreshed', {
          accessToken: data.body['access_token'],
          expiresIn: data.body['expires_in']
        });

        // Retry the request
        const features = await spotifyApi.getAudioFeaturesForTrack(trackId);
        event.sender.send('spotify-track-features-received', { trackId, features: features.body });
      } catch (refreshErr) {
        console.error('Error refreshing token:', refreshErr);
        event.sender.send('spotify-error', 'Session expired. Please log in again.');
      }
    } else {
      event.sender.send('spotify-error', err.message);
    }
  }
}

async function searchSpotifyTracks(event, query) {
  try {
    const results = await spotifyApi.searchTracks(query, { limit: 50 });
    event.sender.send('spotify-search-results', results.body);
  } catch (err) {
    console.error('Error searching Spotify:', err);

    // If token expired, try to refresh
    if (err.statusCode === 401) {
      try {
        console.log('Token expired, attempting refresh...');
        const data = await spotifyApi.refreshAccessToken();
        spotifyApi.setAccessToken(data.body['access_token']);

        // Notify renderer of new token
        event.sender.send('spotify-token-refreshed', {
          accessToken: data.body['access_token'],
          expiresIn: data.body['expires_in']
        });

        // Retry the request
        const results = await spotifyApi.searchTracks(query, { limit: 50 });
        event.sender.send('spotify-search-results', results.body);
      } catch (refreshErr) {
        console.error('Error refreshing token:', refreshErr);
        event.sender.send('spotify-error', 'Session expired. Please log in again.');
      }
    } else {
      event.sender.send('spotify-error', err.message);
    }
  }
}


// Download track from YouTube using yt-dlp
async function downloadTrackFromYouTube(event, trackInfo) {
  try {
    const { title, artist, album, albumArt } = trackInfo;
    const searchQuery = `${artist} - ${title} official audio`;

    console.log('Searching YouTube for:', searchQuery);
    event.sender.send('download-progress', { message: `Searching YouTube for "${title}"...` });

    // Search YouTube using yt-search
    const searchResults = await yts(searchQuery);
    const videos = searchResults.videos;

    if (!videos || videos.length === 0) {
      throw new Error('No YouTube results found');
    }

    const video = videos[0];
    console.log('Found video:', video.title, '|', video.url);
    event.sender.send('download-progress', { message: `Found: ${video.title}` });

    // Create Music/Spectra directory
    const musicPath = app.getPath('music');
    const spectraPath = path.join(musicPath, 'Spectra');

    if (!fs.existsSync(spectraPath)) {
      fs.mkdirSync(spectraPath, { recursive: true });
      console.log('Created directory:', spectraPath);
    }

    const sanitizedFilename = `${artist} - ${title}`.replace(/[<>:"/\\|?*]/g, '_');
    const outputPath = path.join(spectraPath, sanitizedFilename);

    // Download album art from Spotify if available
    let thumbnailPath = null;
    if (albumArt) {
      try {
        event.sender.send('download-progress', { message: 'Downloading album art...' });
        const https = require('https');
        thumbnailPath = path.join(spectraPath, `${sanitizedFilename}_cover.jpg`);

        await new Promise((resolve, reject) => {
          const file = fs.createWriteStream(thumbnailPath);
          https.get(albumArt, (response) => {
            response.pipe(file);
            file.on('finish', () => {
              file.close();
              console.log('Album art downloaded:', thumbnailPath);
              resolve();
            });
          }).on('error', (err) => {
            fs.unlink(thumbnailPath, () => { });
            thumbnailPath = null;
            console.log('Failed to download album art:', err.message);
            resolve(); // Continue even if album art fails
          });
        });
      } catch (err) {
        console.log('Error downloading album art:', err.message);
        thumbnailPath = null;
      }
    }

    event.sender.send('download-progress', { message: 'Downloading audio...' });

    // Download using yt-dlp with metadata
    await youtubedl(video.url, {
      format: 'bestaudio',
      output: outputPath + '.%(ext)s',
      noPlaylist: true,
      extractorArgs: 'youtube:player_client=default',
      noWarnings: true,
      addMetadata: true,
      metadataFromTitle: '%(artist)s - %(title)s'
    });

    // Find the downloaded file
    const files = fs.readdirSync(spectraPath);
    const downloadedFile = files.find(f =>
      f.startsWith(sanitizedFilename) &&
      !f.endsWith('_cover.jpg') &&
      !f.endsWith('.jpg') &&
      !f.endsWith('.webp')
    );

    if (!downloadedFile) {
      throw new Error('Downloaded file not found');
    }

    const downloadedPath = path.join(spectraPath, downloadedFile);
    console.log('Downloaded file:', downloadedPath);

    // Convert to MP3 if not already MP3
    const mp3Path = path.join(spectraPath, `${sanitizedFilename}.mp3`);

    if (!downloadedFile.endsWith('.mp3')) {
      event.sender.send('download-progress', { message: 'Converting to MP3...' });

      await new Promise((resolve, reject) => {
        const command = ffmpeg(downloadedPath)
          .audioBitrate(320)
          .audioCodec('libmp3lame')
          .toFormat('mp3');

        // Add album art if available
        if (thumbnailPath && fs.existsSync(thumbnailPath)) {
          command.addInput(thumbnailPath)
            .outputOptions([
              '-map 0:a',
              '-map 1:0',
              '-c:v copy',
              '-id3v2_version 3',
              '-metadata:s:v title="Album cover"',
              '-metadata:s:v comment="Cover (front)"'
            ]);
        }

        command
          .on('end', () => {
            console.log('Conversion complete:', mp3Path);
            // Delete original file
            try {
              fs.unlinkSync(downloadedPath);
              console.log('Deleted original file:', downloadedPath);
            } catch (e) {
              console.log('Could not delete original file:', e.message);
            }
            resolve();
          })
          .on('error', (err) => {
            console.error('Conversion error:', err);
            reject(err);
          })
          .save(mp3Path);
      });
    } else {
      // Already MP3, just rename if needed
      if (downloadedPath !== mp3Path) {
        fs.renameSync(downloadedPath, mp3Path);
      }
    }

    // Clean up temporary thumbnail files
    try {
      const tempThumb = outputPath + '.jpg';
      if (fs.existsSync(tempThumb)) fs.unlinkSync(tempThumb);
      const webpThumb = outputPath + '.webp';
      if (fs.existsSync(webpThumb)) fs.unlinkSync(webpThumb);
    } catch (e) {
      // Ignore cleanup errors
    }

    console.log('Final MP3 file:', mp3Path);
    event.sender.send('download-complete', {
      path: mp3Path,
      filename: `${sanitizedFilename}.mp3`
    });

  } catch (error) {
    console.error('Error downloading track:', error);
    event.sender.send('download-error', error.message || 'Download failed');
  }
}
