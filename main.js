const { app, BrowserWindow, screen, ipcMain, dialog } = require('electron')
const path = require('path')
const fs   = require('fs')

const boundsFile = path.join(app.getPath('userData'), 'window-bounds.json')

function loadBounds() {
  try { return JSON.parse(fs.readFileSync(boundsFile, 'utf8')) }
  catch { return null }
}

function saveBounds(win) {
  if (win.isMaximized() || win.isMinimized()) return
  fs.writeFileSync(boundsFile, JSON.stringify(win.getBounds()))
}

function createWindow() {
  const { width: screenW, height: screenH } = screen.getPrimaryDisplay().workAreaSize

  const defaultWidth  = Math.min(1280, screenW)
  const defaultHeight = Math.min(820,  screenH)

  const saved = loadBounds() || {
    width:  defaultWidth,
    height: defaultHeight,
    x: Math.round((screenW - defaultWidth)  / 2),
    y: Math.round((screenH - defaultHeight) / 2),
  }

  const win = new BrowserWindow({
    width:     saved.width,
    height:    saved.height,
    x:         saved.x,
    y:         saved.y,
    minWidth:  900,
    minHeight: 600,
    frame:     false,
    backgroundColor: '#1A1030',
    webPreferences: {
      nodeIntegration:  false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  })

  win.loadFile('index.html')

  win.on('resize', () => saveBounds(win))
  win.on('move',   () => saveBounds(win))
  win.on('maximize',   () => win.webContents.send('maximized', true))
  win.on('unmaximize', () => win.webContents.send('maximized', false))
}

ipcMain.on('win-minimize', () => BrowserWindow.getFocusedWindow()?.minimize())
ipcMain.on('win-maximize', () => {
  const win = BrowserWindow.getFocusedWindow()
  win?.isMaximized() ? win.unmaximize() : win.maximize()
})
ipcMain.on('win-close', () => BrowserWindow.getFocusedWindow()?.close())

ipcMain.handle('export-pdf', async (event, { html, filename }) => {
  const { canceled, filePath } = await dialog.showSaveDialog({
    defaultPath: filename,
    filters: [{ name: 'PDF', extensions: ['pdf'] }],
  })
  if (canceled || !filePath) return { success: false }

  // spin up a hidden window to render the HTML and print it
  const pdfWin = new BrowserWindow({
    show: false,
    webPreferences: { nodeIntegration: false, contextIsolation: true },
  })

  await pdfWin.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(html))

  const pdfBuffer = await pdfWin.webContents.printToPDF({
    printBackground: true,
    pageSize: 'A4',
    margins: { top: 0, bottom: 0, left: 0, right: 0 },
  })

  pdfWin.destroy()
  fs.writeFileSync(filePath, pdfBuffer)
  return { success: true, filePath }
})

app.whenReady().then(() => {
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})