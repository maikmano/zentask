const { app, BrowserWindow, ipcMain } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const isDev = !app.isPackaged;

let mainWindow;

// Configure auto-updater
autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = true;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    backgroundColor: '#09090b',
    titleBarStyle: 'hiddenInset', // Better looking on Mac, but standard on Windows
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false, // Permite requisições para a API do Google sem erro de CORS
      scrollBounce: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // In development, load from Vite dev server
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    // mainWindow.webContents.openDevTools();
  } else {
    // In production, load the built index.html
    mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));
  }

  // Common desktop app behavior: hide menu bar
  mainWindow.setMenuBarVisibility(false);

  return mainWindow;
}

// Auto-updater event handlers
autoUpdater.on('checking-for-update', () => {
  sendStatusToWindow('Verificando atualizações...');
});

autoUpdater.on('update-available', (info) => {
  sendStatusToWindow('update-available', info);
});

autoUpdater.on('update-not-available', (info) => {
  sendStatusToWindow('update-not-available', info);
});

autoUpdater.on('error', (err) => {
  sendStatusToWindow('update-error', err);
});

autoUpdater.on('download-progress', (progressObj) => {
  sendStatusToWindow('download-progress', progressObj);
});

autoUpdater.on('update-downloaded', (info) => {
  sendStatusToWindow('update-downloaded', info);
});

function sendStatusToWindow(event, data) {
  if (mainWindow) {
    mainWindow.webContents.send('update-status', { event, data });
  }
}

// IPC handlers for update actions
ipcMain.handle('check-for-updates', async () => {
  if (!isDev) {
    return await autoUpdater.checkForUpdates();
  }
  return null;
});

ipcMain.handle('download-update', async () => {
  if (!isDev) {
    return await autoUpdater.downloadUpdate();
  }
  return null;
});

ipcMain.handle('install-update', () => {
  if (!isDev) {
    autoUpdater.quitAndInstall();
  }
});

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });

  // Auto-update check (only in production)
  if (!isDev) {
    // Check for updates 5 seconds after app starts
    setTimeout(() => {
      autoUpdater.checkForUpdatesAndNotify();
    }, 5000);
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
