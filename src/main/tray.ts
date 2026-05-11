import { BrowserWindow, Tray, nativeImage, screen, app, Menu } from "electron";
import path from "path";
import { createWindow } from "./window";
import { suspendHotkey, resumeHotkey, setMainWin } from "./index";

let mainWin: BrowserWindow | null = null;

function icon(): Electron.NativeImage {
  const img = nativeImage.createFromPath(
    path.join(__dirname, "../../build/tray.png")
  );
  img.setTemplateImage(true);
  return img;
}

export function createTray(): BrowserWindow {
  const tray = new Tray(icon());
  tray.setToolTip("VSPR");

  const win = new BrowserWindow({
    width: 200,
    height: 80,
    show: false,
    frame: false,
    resizable: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    backgroundColor: "#111111",
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  win.loadFile(path.join(__dirname, "../../src/renderer/tray/index.html"));
  win.on("blur", () => win.hide());

  tray.on("click", () => {
    if (!mainWin || mainWin.isDestroyed()) {
      mainWin = createWindow();
      setMainWin(mainWin);
      mainWin.on("closed", () => { mainWin = null; setMainWin(null); resumeHotkey(); });
    }
    mainWin.show();
    mainWin.focus();
    suspendHotkey();
  });

  tray.on("right-click", () => {
    const menu = Menu.buildFromTemplate([
      {
        label: "Open VSPR", click: () => {
          if (!mainWin || mainWin.isDestroyed()) {
            mainWin = createWindow();
            setMainWin(mainWin);
            mainWin.on("closed", () => { mainWin = null; setMainWin(null); resumeHotkey(); });
          }
          mainWin.show();
          mainWin.focus();
        }
      },
      { type: "separator" },
      { label: "Quit VSPR", click: () => app.quit() },
    ]);
    tray.popUpContextMenu(menu);
  });

  return win;
}