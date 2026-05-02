import { BrowserWindow } from "electron";
import { exec, spawn } from "child_process";
import fs from "fs";
import path from "path";
import os from "os";
import https from "https";

const ROOT = path.join(__dirname, "../../vendor/whisper");
const MODELS = path.join(ROOT, "models");

export type Progress = {
    step: "check" | "binary" | "model";
    pct: number;
    message: string;
};

function send(win: BrowserWindow, p: Progress) {
    if (!win.isDestroyed()) win.webContents.send("progress", p);
}

export function binPath(): string {
    return os.platform() === "win32"
        ? path.join(ROOT, "whisper-cli.exe")
        : path.join(ROOT, "build", "bin", "whisper-cli");
}

export function modelPath(model: string): string {
    return path.join(MODELS, `ggml-${model}.bin`);
}

export function isReady(model: string): boolean {
    return fs.existsSync(binPath()) && fs.existsSync(modelPath(model));
}

function download(
    url: string,
    dest: string,
    onPct: (pct: number) => void
): Promise<void> {
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

function checkXcode(): Promise<boolean> {
    return new Promise((resolve) => {
        exec("xcode-select -p", (err) => resolve(!err));
    });
}

async function buildMac(win: BrowserWindow): Promise<void> {
    if (fs.existsSync(binPath())) {
        send(win, { step: "binary", pct: 100, message: "Already built" });
        return;
    }

    const hasXcode = await checkXcode();
    if (!hasXcode) {
        throw new Error(
            "Xcode Command Line Tools not found.\n\nRun this in Terminal:\n  xcode-select --install\n\nThen reopen VSPR."
        );
    }

    if (!fs.existsSync(path.join(ROOT, "CMakeLists.txt"))) {
        send(win, { step: "binary", pct: 0, message: "Cloning whisper.cpp..." });
        fs.mkdirSync(path.dirname(ROOT), { recursive: true });
        await new Promise<void>((resolve, reject) => {
            const proc = spawn("git", [
                "clone", "--depth=1",
                "https://github.com/ggerganov/whisper.cpp", ROOT
            ]);
            let err = "";
            proc.stderr.on("data", (d: Buffer) => {
                const line = d.toString();
                err += line;
                const m = line.match(/(\d+)%/);
                if (m) send(win, { step: "binary", pct: Math.round(parseInt(m[1]) * 0.3), message: "Cloning..." });
            });
            proc.on("close", (code) => code === 0 ? resolve() : reject(`git clone failed:\n${err}`));
        });
    }

    send(win, { step: "binary", pct: 30, message: "Building (this takes ~1 min)..." });
    await new Promise<void>((resolve, reject) => {
        const proc = exec(`cd "${ROOT}" && cmake -B build && cmake --build build -j --config Release`);
        let err = "";
        let pct = 30;
        const pulse = setInterval(() => {
            pct = Math.min(pct + 1, 95);
            send(win, { step: "binary", pct, message: "Building..." });
        }, 600);
        proc.stderr?.on("data", (d: Buffer) => { err += d.toString(); });
        proc.on("close", (code) => {
            clearInterval(pulse);
            if (code !== 0) return reject(`Build failed:\n${err}`);
            send(win, { step: "binary", pct: 100, message: "Built successfully" });
            resolve();
        });
    });
}

async function downloadWin(win: BrowserWindow): Promise<void> {
    if (fs.existsSync(binPath())) {
        send(win, { step: "binary", pct: 100, message: "Already installed" });
        return;
    }

    fs.mkdirSync(ROOT, { recursive: true });

    const arch = os.arch() === "arm64" ? "Win32" : "x64";
    const url = `https://github.com/ggerganov/whisper.cpp/releases/latest/download/whisper-bin-${arch}.zip`;
    const zip = path.join(ROOT, "whisper.zip");

    send(win, { step: "binary", pct: 0, message: "Downloading whisper..." });

    await download(url, zip, (pct) => {
        send(win, { step: "binary", pct: Math.round(pct * 0.8), message: `Downloading whisper... ${pct}%` });
    });

    send(win, { step: "binary", pct: 85, message: "Extracting..." });

    await new Promise<void>((resolve, reject) => {
        exec(
            `powershell -command "Expand-Archive -Path '${zip}' -DestinationPath '${ROOT}' -Force"`,
            (err) => err ? reject(err) : resolve()
        );
    });

    fs.unlinkSync(zip);
    send(win, { step: "binary", pct: 100, message: "Whisper ready" });
}

export async function downloadModel(win: BrowserWindow, model: string): Promise<void> {
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
    if (os.platform() === "darwin") await buildMac(win);
    else await downloadWin(win);
    await downloadModel(win, model);
}