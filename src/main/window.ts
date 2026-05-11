import { resumeHotkey } from "./index";
import { BrowserWindow, app } from "electron";
import path from "path";

export function createWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 680,
    height: 480,
    show: false,
    frame: true,
    titleBarStyle: "hiddenInset",
    resizable: false,
    center: true,
    title: "VSPR",
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  win.loadFile(path.join(__dirname, "../../src/renderer/main/index.html"));

  win.on("close", (e) => {
    e.preventDefault();
    win.hide();
    resumeHotkey();
    const anyVisible = BrowserWindow.getAllWindows().some(w => w.isVisible());
    if (!anyVisible) app.dock?.hide();
  });

  return win;
}