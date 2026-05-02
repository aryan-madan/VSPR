import { BrowserWindow, Tray, nativeImage, screen, app } from "electron";
import path from 'path';
import { Recorder } from '../core/recorder';

export function createTray(rec: Recorder): { tray: Tray, popup: BrowserWindow } {
    const img = nativeImage.createEmpty();
    const tray = new Tray(img);
    tray.setToolTip("VSPR");

    const popup = createPopup();

    tray.on("click", (_, bounds) => togglePopup(popup, bounds));

    return { tray, popup };
}

function createPopup(): BrowserWindow {
    const win = new BrowserWindow({
        width: 220,
        height: 160,
        show: false,
        frame: false,
        resizable: false,
        alwaysOnTop: true,
        skipTaskbar: true,
        transparent: false,
        backgroundColor: "#ffffff",
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        },
    });

    win.loadFile(path.join(__dirname, "../../src/renderer/index.html"));

    win.on("blur", () => win.hide());

    return win;
}

function togglePopup(win: BrowserWindow, bounds: Electron.Rectangle) {
    if (win.isVisible()) {
        win.hide();
        return;
    }

    const { x, y } = popupPos(win, bounds);
    win.setPosition(x, y, false);
    win.show();
    win.focus();
}

function popupPos(win: BrowserWindow, bounds: Electron.Rectangle) {
    const [w, h] = win.getSize();
    const display = screen.getDisplayNearestPoint({ x: bounds.x, y: bounds.y });
    const { workArea } = display;

    const x = Math.round(bounds.x - w / 2 + bounds.width / 2);
    const y = bounds.y > workArea.height / 2
        ? bounds.y - h - 4
        : bounds.y + bounds.height + 4;

    return {
        x: Math.max(workArea.x, Math.min(x, workArea.x + workArea.width - w)),
        y: Math.max(workArea.y, Math.min(y, workArea.y + workArea.height - h)),
    };
}