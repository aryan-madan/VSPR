import { BrowserWindow } from "electron";
import path from "path";

export function createSetup(): BrowserWindow {
    const win = new BrowserWindow({
        width: 480,
        height: 360,
        show: true,
        frame: false,
        resizable: false,
        center: true,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        },
    });

    win.loadFile(path.join(__dirname, "../../src/renderer/setup/index.html"));
    return win;
}