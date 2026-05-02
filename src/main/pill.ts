import { BrowserWindow, screen } from "electron";
import path from "path";

export function createPill(): BrowserWindow {
    const { workArea } = screen.getPrimaryDisplay();

    const win = new BrowserWindow({
        width: 280,
        height: 56,
        x: Math.round(workArea.x + workArea.width / 2 - 140),
        y: Math.round(workArea.y + workArea.height - 80),
        show: false,
        frame: false,
        resizable: false,
        alwaysOnTop: true,
        skipTaskbar: true,
        transparent: true,
        hasShadow: false,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        },
    });

    win.loadFile(path.join(__dirname, "../../src/renderer/pill/index.html"));
    return win;
}