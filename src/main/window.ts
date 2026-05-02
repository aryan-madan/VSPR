import { BrowserWindow } from "electron";
import path from "path";

export function createWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 680,
    height: 480,
    show: false,
    frame: false,
    resizable: false,
    center: true,
    title: "VSPR",
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  win.loadFile(path.join(__dirname, "../../src/renderer/main/index.html"));
  win.webContents.openDevTools({ mode: "detach" });
  return win;
}