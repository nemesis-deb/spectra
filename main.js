const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const DiscordRPC = require('discord-rpc');

let mainWindow;
let rpcClient = null;
const clientId = '1441891580561850379'; // You'll need to create a Discord app and replace this

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    backgroundColor: '#1a1a1a',
    icon: 'icon_nobg.png',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true
    }
  });

  mainWindow.loadFile('index.html');
  mainWindow.webContents.openDevTools(); // Opens DevTools automatically - helpful for learning!
}

// Handle folder dialog (outside createWindow to avoid multiple registrations)
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

app.whenReady().then(() => {
  createWindow();
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

  rpcClient.setActivity(activity).catch(err => {
    console.error('Failed to set Discord activity:', err);
  });
}

// Listen for presence updates from renderer
ipcMain.on('update-discord-presence', (event, data) => {
  setActivity(data);
});