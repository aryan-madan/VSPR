import Store from "electron-store";
import path from "path";
import os from "os";

interface Schema {
    model: string;
    hotkey: string;
    history: { text: string; timestamp: number }[];
}

const store = new Store<Schema>({
    defaults: {
        model: "base.en",
        hotkey: "Alt+Space",
        history: [],
    },
});

export function getModel() {
    return store.get("model");
}

export function setModel(m: string) {
    store.set("model", m);
}

export function getHotkey() {
    return store.get("hotkey");
}

export function setHotkey(h: string) {
    store.set("hotkey", h);
}

export function getHistory(): { text: string; timestamp: number }[] {
    return store.get("history");
}

export function addHistory(text: string) {
    const prev = store.get("history").slice(0, 49);
    store.set("history", [{ text, ts: Date.now() }, ...prev]);
}

export function clearHistory() {
    store.set("history", []);
}

export function modelPath(): string {
    return path.join(
        __dirname, "../../vendor/whisper/models",
        `ggml-${store.get("model")}.bin`
    );
}

export function binPath(): string {
    return path.join(
        __dirname, "../../vendor/whisper",
        os.platform() === "win32" ? "build/bin/Release/main.exe" : "main"
    );
}

export function isReady(): boolean {
    const fs = require("fs");
    return fs.existsSync(binPath()) && fs.existsSync(modelPath());
}