import { app, BrowserWindow, nativeImage, Tray } from "electron";
import path from "path";
import { uIOhook, UiohookKey } from "uiohook-napi";
import { createTray } from "./tray";
import { Recorder } from "../core/recorder";

let tray: Tray;
let popup: BrowserWindow;
let recorder: Recorder;

app.whenReady().then(() => {
    app.dock?.hide();

    recorder = new Recorder();
    ({ tray, popup } = createTray(recorder));

    bindHotkey(recorder, popup);

    const { ipcMain } = require("electron");
    ipcMain.on("quit", () => app.quit());
});

app.on("window-all-closed", (e: Event) => e.preventDefault());

function bindHotkey(rec: Recorder, win: BrowserWindow) {
    let held = false;

    uIOhook.on("keydown", (e) => {
        if (e.keycode !== UiohookKey.Space) return;
        if (!e.altKey || held) return;
        held = true;
        rec.start();
        win.webContents.send("state", "recording");
    });

    uIOhook.on("keyup", (e) => {
        if (e.keycode !== UiohookKey.Space) return;
        if (!held) return;
        held = false;
        rec.stop((state) => win.webContents.send("state", state));
    });

    uIOhook.start();
}