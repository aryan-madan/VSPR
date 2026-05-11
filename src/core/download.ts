import { app, BrowserWindow } from "electron";
import { exec, spawn } from "child_process";
import fs from "fs";
import path from "path";
import os from "os";
import https from "https";

const ENV = { ...process.env, PATH: `/usr/local/bin:/opt/homebrew/bin:/usr/bin:${process.env.PATH}` };

function getRoot(): string { return path.join(app.getPath("userData"), "whisper"); }
function getModels(): string { return path.join(getRoot(), "models"); }

export type Progress = {
    step: "binary" | "model";
    pct: number;
    message: string;
};

function send(win: BrowserWindow, p: Progress) {
    if (!win.isDestroyed()) win.webContents.send("progress", p);
}

export function binPath(): string {
    if (app.isPackaged) {
        return os.platform() === "win32"
            ? path.join(process.resourcesPath, "whisper", "whisper-cli.exe")
            : path.join(process.resourcesPath, "whisper", "whisper-cli");
    }
    return os.platform() === "win32"
        ? path.join(getRoot(), "whisper-cli.exe")
        : path.join(__dirname, "../../vendor/whisper/build/bin/whisper-cli");
}

export function modelPath(model: string): string {
    if (app.isPackaged) {
        const bundled = path.join(process.resourcesPath, "whisper", "models", `ggml-${model}.bin`);
        if (fs.existsSync(bundled)) return bundled;
    }
    return path.join(getModels(), `ggml-${model}.bin`);
}

export function isReady(model: string): boolean {
    return fs.existsSync(binPath()) && fs.existsSync(modelPath(model));
}

function download(url: string, dest: string, onPct: (pct: number) => void): Promise<void> {
    return new Promise((resolve, reject) => {
        const tmp = dest + ".tmp";
        const file = fs.createWriteStream(tmp);

        function get(u: string) {
            https.get(u, (res) => {
                if (res.statusCode === 301 || res.statusCode === 302) {
                    return get(res.headers.location!);
                }
                if (res.statusCode !== 200) {
                    return reject(`HTTP ${res.statusCode} for ${u}`);
                }
                const total = parseInt(res.headers["content-length"] ?? "0");
                let received = 0;
                res.on("data", (chunk: Buffer) => {
                    received += chunk.length;
                    file.write(chunk);
                    if (total) onPct(Math.round((received / total) * 100));
                });
                res.on("end", () => file.close(() => { fs.renameSync(tmp, dest); resolve(); }));
                res.on("error", reject);
            }).on("error", reject);
        }

        get(url);
    });
}

async function downloadWin(win: BrowserWindow): Promise<void> {
    const ROOT = getRoot();

    if (fs.existsSync(binPath())) {
        send(win, { step: "binary", pct: 100, message: "Already installed" });
        return;
    }

    fs.mkdirSync(ROOT, { recursive: true });

    const url = `https://github.com/ggerganov/whisper.cpp/releases/latest/download/whisper-bin-x64.zip`;
    const zip = path.join(ROOT, "whisper.zip");

    send(win, { step: "binary", pct: 0, message: "Downloading whisper..." });

    await download(url, zip, (pct) => {
        send(win, { step: "binary", pct: Math.round(pct * 0.8), message: `Downloading whisper... ${pct}%` });
    });

    send(win, { step: "binary", pct: 85, message: "Extracting..." });

    await new Promise<void>((resolve, reject) => {
        exec(
            `powershell -command "Expand-Archive -Path '${zip}' -DestinationPath '${ROOT}' -Force"`,
            { env: ENV },
            (err) => err ? reject(err) : resolve()
        );
    });

    fs.unlinkSync(zip);
    send(win, { step: "binary", pct: 100, message: "Whisper ready" });
}

export async function downloadModel(win: BrowserWindow, model: string): Promise<void> {
    const MODELS = getModels();
    fs.mkdirSync(MODELS, { recursive: true });

    const dest = modelPath(model);
    if (fs.existsSync(dest)) {
        send(win, { step: "model", pct: 100, message: "Model already downloaded" });
        return;
    }

    const url = `https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-${model}.bin`;
    send(win, { step: "model", pct: 0, message: `Downloading ${model} model...` });

    await download(url, dest, (pct) => {
        send(win, { step: "model", pct, message: `Downloading ${model}... ${pct}%` });
    });

    send(win, { step: "model", pct: 100, message: "Model ready" });
}

export async function runSetup(win: BrowserWindow, model: string): Promise<void> {
    if (os.platform() === "win32") {
        await downloadWin(win);
    } else {
        send(win, { step: "binary", pct: 100, message: "Whisper engine ready" });
    }
    await downloadModel(win, model);
}