import { app, BrowserWindow, globalShortcut, ipcMain } from "electron";
import { createTray } from "./tray";
import { createPill } from "./pill";
import path from "path";
import os from "os";

export const wavPath = path.join(os.tmpdir(), "vspr.wav");

let recording = false;
let trayWin: BrowserWindow;
let pillWin: BrowserWindow;

app.whenReady().then(() => {
    app.dock?.hide();
    trayWin = createTray();
    pillWin = createPill();

    globalShortcut.register("Alt+Space", () => {
        if (!recording) startRecording();
        else stopRecording();
    });

    ipcMain.on("recorded", (_, state: string) => {
        setState("transcribing");
        setTimeout(() => setState("idle"), 1500);
    });

    ipcMain.on("stop", () => stopRecording());
    ipcMain.on("quit", () => app.quit());
});

function startRecording() {
    recording = true;
    trayWin.webContents.send("cmd", "start");
    pillWin.show();
    pillWin.webContents.send("cmd", "start");
}

function stopRecording() {
    recording = false;
    trayWin.webContents.send("cmd", "stop");
    pillWin.webContents.send("cmd", "stop");
}

function setState(s: string) {
    if (s === "idle") pillWin.hide();
    trayWin.webContents.send("state", s);
    pillWin.webContents.send("state", s);
}

app.on("will-quit", () => globalShortcut.unregisterAll());
app.on("window-all-closed", () => { });