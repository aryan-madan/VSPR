import { app, BrowserWindow, globalShortcut, ipcMain, clipboard, systemPreferences } from "electron";
import { createTray } from "./tray";
import { createPill } from "./pill";
import { createSetup } from "./setup";
import { createWindow } from "./window";
import { runSetup } from "../core/download";
import { isReady, getHotkey, setModel, setHotkey, addHistory, getHistory, clearHistory, getModel } from "../core/store";
import { transcribe } from "../core/transcribe";
import { paste } from "../core/paste";
import fs from "fs";
import path from "path";
import os from "os";

export const wavPath = path.join(os.tmpdir(), "vspr.wav");

let recording = false;
let trayWin: BrowserWindow;
let pillWin: BrowserWindow;
let setupWin: BrowserWindow | null = null;
let mainWin: BrowserWindow | null = null;

export function setMainWin(w: BrowserWindow | null) { mainWin = w; }
export function suspendHotkey() { globalShortcut.unregisterAll(); }
export function resumeHotkey() { bindHotkey(); }

app.whenReady().then(async () => {
    app.dock?.hide();

    if (process.platform === "darwin") {
        systemPreferences.isTrustedAccessibilityClient(true);
    }

    if (isReady()) boot();
    else {
        setupWin = createSetup();
        setupWin.on("closed", () => { setupWin = null; });
    }
});

app.on("will-quit", () => globalShortcut.unregisterAll());
app.on("window-all-closed", () => { });

ipcMain.on("setup-start", async (_, model: string) => {
    setModel(model);
    try {
        await runSetup(setupWin!, model);
        setupWin?.webContents.send("setup-done");
    } catch (e: any) {
        setupWin?.webContents.send("setup-error", e?.message ?? String(e));
    }
});

ipcMain.on("setup-complete", () => {
    setupWin?.close();
    boot();
});

function openMain() {
    if (!mainWin || mainWin.isDestroyed()) {
        mainWin = createWindow();
        setMainWin(mainWin);
        mainWin.on("show", () => { app.dock?.show(); suspendHotkey(); });
        mainWin.on("hide", () => { app.dock?.hide(); resumeHotkey(); });
        mainWin.on("closed", () => { mainWin = null; setMainWin(null); app.dock?.hide(); resumeHotkey(); });
    }
    mainWin.show();
    mainWin.focus();
    app.dock?.show();
}

function boot() {
    trayWin = createTray();
    pillWin = createPill();
    bindHotkey();
    openMain();
}

function bindHotkey() {
    globalShortcut.unregisterAll();
    const raw = getHotkey().trim();
    if (!raw || raw.endsWith("+")) return;
    const hotkey = raw.replace("Command", "CommandOrControl");
    console.log("Registering hotkey:", hotkey);
    const ok = globalShortcut.register(hotkey, () => {
        if (!recording) startRecording();
        else stopRecording();
    });
    console.log("Registered:", ok);
}

function startRecording() {
    recording = true;
    if (trayWin && !trayWin.isDestroyed()) trayWin.webContents.send("cmd", "start");
    if (pillWin && !pillWin.isDestroyed()) {
        pillWin.show();
        pillWin.webContents.send("cmd", "start");
        pillWin.webContents.send("state", "recording");
    }
}

function stopRecording() {
    recording = false;
    if (trayWin && !trayWin.isDestroyed()) trayWin.webContents.send("cmd", "stop");
    if (pillWin && !pillWin.isDestroyed()) pillWin.webContents.send("cmd", "stop");
}

ipcMain.on("recorded", async () => {
    setState("transcribing");
    try {
        if (!fs.existsSync(wavPath) || fs.statSync(wavPath).size < 8000) {
            setState("idle"); return;
        }
        const text = await transcribe(wavPath);
        if (text.trim()) {
            addHistory(text);
            broadcastHistory();
            paste(text);
        }
        setState("idle");
    } catch (e: any) {
        console.error("Transcription error:", e);
        setState("idle");
    }
});

function broadcastHistory() {
    if (mainWin && !mainWin.isDestroyed()) {
        mainWin.webContents.send("history", getHistory());
    }
}

function setState(s: string) {
    if (s === "idle") pillWin?.hide();
    trayWin?.webContents.send("state", s);
    pillWin?.webContents.send("state", s);
}

ipcMain.on("get-history", (e) => e.sender.send("history", getHistory()));
ipcMain.on("clear-history", () => clearHistory());
ipcMain.on("copy", (_, text) => clipboard.writeText(text));
ipcMain.on("get-settings", (e) => e.sender.send("settings", { model: getModel(), hotkey: getHotkey() }));
ipcMain.on("set-model", (_, m) => setModel(m));

ipcMain.on("set-hotkey", (_, h: string) => {
    if (!h || h.endsWith("+")) return;
    setHotkey(h);
    bindHotkey();
});

ipcMain.on("stop", () => stopRecording());
ipcMain.on("quit", () => { app.exit(0); });
ipcMain.on("close-main", () => { mainWin?.hide(); resumeHotkey(); });