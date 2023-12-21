import Server from "./dist/server/index.mjs";
import { app, BrowserWindow } from "electron";

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    icon: "icon/512.png",
    title: "FullStacked"
  })

  // fullscreen
  mainWindow.maximize();
  mainWindow.show();

  // and load the url
  mainWindow.loadURL(`http://localhost:${Server.port}`);

  // Open the DevTools
  // mainWindow.webContents.openDevTools();
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed
app.on('window-all-closed', app.quit)

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.