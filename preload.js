const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('windowControls', {
  minimize:   () => ipcRenderer.send('win-minimize'),
  maximize:   () => ipcRenderer.send('win-maximize'),
  close:      () => ipcRenderer.send('win-close'),
  onMaximized: (cb) => ipcRenderer.on('maximized', (_, val) => cb(val)),
})
