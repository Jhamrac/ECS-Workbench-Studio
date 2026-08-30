const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const { spawn, exec } = require('child_process');
const { autoUpdater } = require('electron-updater');

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: 'ECS Tridium Niagara Workbench Studio',
    icon: path.join(__dirname, '../public/favicon.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false, // Allows local JACE oBIX HTTP calls without CORS blocks
    },
    autoHideMenuBar: true,
    backgroundColor: '#0f172a',
  });

  // Load production dist or local dev server
  const isDev = !app.isPackaged;
  if (isDev && process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    // In production build, load local Express backend or static entry
    const indexPath = path.join(__dirname, '../dist/index.html');
    mainWindow.loadFile(indexPath);
  }

  // Open external links in user's default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http:') || url.startsWith('https:')) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });

  // Auto-updater event listeners
  autoUpdater.on('update-available', (info) => {
    mainWindow?.webContents.send('auto-update-status', { status: 'available', version: info.version });
  });

  autoUpdater.on('download-progress', (progressObj) => {
    mainWindow?.webContents.send('auto-update-status', { status: 'downloading', percent: Math.round(progressObj.percent) });
  });

  autoUpdater.on('update-downloaded', () => {
    mainWindow?.webContents.send('auto-update-status', { status: 'downloaded' });
  });

  autoUpdater.checkForUpdatesAndNotify().catch(() => {
    // Ignore update check errors on offline/dev mode
  });
}

// Native PowerShell Execution IPC
ipcMain.handle('exec-powershell', async (event, command) => {
  return new Promise((resolve) => {
    const ps = spawn('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', command]);
    let stdout = '';
    let stderr = '';

    ps.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    ps.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    ps.on('close', (code) => {
      resolve({
        code,
        stdout: stdout.trim(),
        stderr: stderr.trim(),
        success: code === 0,
      });
    });

    ps.on('error', (err) => {
      resolve({
        code: -1,
        stdout: '',
        stderr: err.message,
        success: false,
      });
    });
  });
});

ipcMain.handle('get-app-info', () => {
  return {
    isDesktop: true,
    version: app.getVersion(),
    platform: process.platform,
    arch: process.arch,
  };
});

ipcMain.handle('restart-and-update', () => {
  autoUpdater.quitAndInstall();
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
