const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  execPowerShell: (command) => ipcRenderer.invoke('exec-powershell', command),
  getAppInfo: () => ipcRenderer.invoke('get-app-info'),
  restartAndUpdate: () => ipcRenderer.invoke('restart-and-update'),
  onAutoUpdateStatus: (callback) => {
    ipcRenderer.on('auto-update-status', (event, value) => callback(value));
  },
});
