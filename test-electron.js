const { app, BrowserWindow } = require('electron');

console.log('app:', app);
console.log('BrowserWindow:', BrowserWindow);

app.whenReady().then(() => {
  console.log('Electron is working!');
  app.quit();
});
