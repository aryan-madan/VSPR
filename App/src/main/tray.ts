import { BrowserWindow, Tray, nativeImage, app, Menu } from "electron";
import path from "path";
import { createWindow } from "./window";
import { suspendHotkey, resumeHotkey, setMainWin } from "./index";

let mainWin: BrowserWindow | null = null;

function icon(): Electron.NativeImage {
  const p = app.isPackaged
    ? path.join(process.resourcesPath, "tray.png")
    : path.join(__dirname, "../../build/tray.png");
  const img = nativeImage.createFromPath(p);
  img.setTemplateImage(true);
  return img;
}

export function createTray(): BrowserWindow {
  const tray = new Tray(icon());
  tray.setToolTip("VSPR");

  const win = new BrowserWindow({
    width: 200, height: 80,
    show: false, frame: false, resizable: false,
    alwaysOnTop: true, skipTaskbar: true,
    backgroundColor: "#111111",
    webPreferences: { nodeIntegration: true, contextIsolation: false },
  });

  win.loadFile(path.join(__dirname, "../../src/renderer/tray/index.html"));
  win.on("blur", () => win.hide());

  tray.on("click", () => {
    if (!mainWin || mainWin.isDestroyed()) {
      mainWin = createWindow();
      setMainWin(mainWin);
      mainWin.on("show", () => { app.dock?.show(); suspendHotkey(); });
      mainWin.on("hide", () => { app.dock?.hide(); resumeHotkey(); });
      mainWin.on("closed", () => { mainWin = null; setMainWin(null); app.dock?.hide(); resumeHotkey(); });
    }
    if (mainWin.isVisible()) {
      mainWin.hide();
    } else {
      mainWin.show();
      mainWin.focus();
    }
  });

  tray.on("right-click", () => {
    const menu = Menu.buildFromTemplate([
      { label: "About VSPR", click: () => { require("electron").shell.openExternal("https://vsprflow.vercel.app"); } },
      {
        label: "Open VSPR", click: () => {
          if (!mainWin || mainWin.isDestroyed()) {
            mainWin = createWindow();
            setMainWin(mainWin);
            mainWin.on("show", () => { app.dock?.show(); suspendHotkey(); });
            mainWin.on("hide", () => { app.dock?.hide(); resumeHotkey(); });
            mainWin.on("closed", () => { mainWin = null; setMainWin(null); app.dock?.hide(); resumeHotkey(); });
          }
          mainWin.show();
          mainWin.focus();
          suspendHotkey();
        }
      },
      { label: "Quit VSPR", accelerator: "CommandOrControl+Q", click: () => app.exit(0) },
    ]);
    tray.popUpContextMenu(menu);
  });

  return win;
}