const { app, BrowserWindow, ipcMain, dialog, Menu } = require('electron');
const DiscordRPC = require('discord-rpc');
const SpotifyWebApi = require('spotify-web-api-node');
const jsmediatags = require('jsmediatags');

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

  ipcMain.on('spotify-get-playlists', (event, accessToken) => {
    getSpotifyPlaylists(event, accessToken);
  });

  ipcMain.on('spotify-get-playlist-tracks', (event, playlistId) => {
    getSpotifyPlaylistTracks(event, playlistId);
  });

  ipcMain.on('spotify-get-track-features', (event, trackId) => {
    getSpotifyTrackFeatures(event, trackId);
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
function getSpotifyPlaylists(event, accessToken) {
  // If token provided, use it directly
  if (accessToken) {
    spotifyApi.setAccessToken(accessToken);
  }

  spotifyApi.getUserPlaylists({ limit: 50 })
    .then(playlists => {
      event.sender.send('spotify-playlists-received', playlists.body);
    })
    .catch(err => {
      console.error('Error getting playlists:', err);
      event.sender.send('spotify-error', err.message);
    });
}

function getSpotifyPlaylistTracks(event, playlistId) {
  spotifyApi.getPlaylistTracks(playlistId, { limit: 100 })
    .then(tracks => {
      event.sender.send('spotify-playlist-tracks-received', { playlistId, tracks: tracks.body });
    })
    .catch(err => {
      console.error('Error getting playlist tracks:', err);
      event.sender.send('spotify-error', err.message);
    });
}

function getSpotifyTrackFeatures(event, trackId) {
  spotifyApi.getAudioFeaturesForTrack(trackId)
    .then(features => {
      event.sender.send('spotify-track-features-received', { trackId, features: features.body });
    })
    .catch(err => {
      console.error('Error getting track features:', err);
      event.sender.send('spotify-error', err.message);
    });
}