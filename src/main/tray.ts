import { BrowserWindow, Tray, nativeImage, screen } from "electron";
import path from "path";
import { createWindow }                              from "./window";
import { suspendHotkey, resumeHotkey, setMainWin }  from "./index";

let mainWin: BrowserWindow | null = null;

export function createTray(): BrowserWindow {
  const tray = new Tray(nativeImage.createEmpty());
  tray.setTitle("VSPR");
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
      mainWin.on("show",   () => suspendHotkey());
      mainWin.on("hide",   () => resumeHotkey());
      mainWin.on("closed", () => { mainWin = null; setMainWin(null); resumeHotkey(); });
    }
    if (mainWin.isVisible()) {
      mainWin.hide();
    } else {
      mainWin.show();
      mainWin.focus();
    }
  });

  tray.on("right-click", (_, bounds) => {
    if (win.isVisible()) { win.hide(); return; }
    const { workArea } = screen.getDisplayNearestPoint({ x: bounds.x, y: bounds.y });
    const [w, h] = win.getSize();
    const x = Math.round(bounds.x - w / 2 + bounds.width / 2);
    const y = bounds.y < workArea.height / 2
      ? bounds.y + bounds.height + 4
      : bounds.y - h - 4;
    win.setPosition(
      Math.max(workArea.x, Math.min(x, workArea.x + workArea.width  - w)),
      Math.max(workArea.y, Math.min(y, workArea.y + workArea.height - h)),
    );
    win.show();
    win.focus();
  });

  return win;
}