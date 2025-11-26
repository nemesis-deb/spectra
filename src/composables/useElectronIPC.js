/**
 * Composable for Electron IPC communication
 * Provides a Vue-friendly wrapper around Electron's IPC
 */
export function useElectronIPC() {
  // Get ipcRenderer - handle both ES modules and CommonJS
  let ipcRenderer;
  try {
    if (typeof window !== 'undefined' && window.require) {
      // Electron with nodeIntegration
      ipcRenderer = window.require('electron').ipcRenderer;
    } else if (typeof require !== 'undefined') {
      // CommonJS require
      ipcRenderer = require('electron').ipcRenderer;
    }
  } catch (e) {
    console.warn('Could not load electron IPC:', e);
  }

  // Send message to main process
  const send = (channel, ...args) => {
    if (ipcRenderer) {
      ipcRenderer.send(channel, ...args);
    } else {
      console.warn('IPC not available (not in Electron environment)');
    }
  };

  // Listen for message from main process
  const on = (channel, callback) => {
    if (ipcRenderer) {
      ipcRenderer.on(channel, (event, ...args) => {
        callback(...args);
      });
    } else {
      console.warn('IPC not available for listening');
    }
  };

  // Remove listener
  const removeListener = (channel, callback) => {
    if (ipcRenderer) {
      ipcRenderer.removeListener(channel, callback);
    }
  };

  // Remove all listeners for a channel
  const removeAllListeners = (channel) => {
    if (ipcRenderer) {
      ipcRenderer.removeAllListeners(channel);
    }
  };

  // Invoke (send and wait for response)
  const invoke = async (channel, data) => {
    if (ipcRenderer && ipcRenderer.invoke) {
      return await ipcRenderer.invoke(channel, data);
    } else {
      console.warn('IPC invoke not available');
      return null;
    }
  };

  return {
    send,
    on,
    removeListener,
    removeAllListeners,
    invoke
  };
}

