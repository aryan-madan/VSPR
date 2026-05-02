import { exec } from "child_process";
import os from "os";
import path from "path";

const HOME = os.homedir();

const BIN = os.platform() === "win32"
    ? path.join(HOME, "whisper.cpp", "build", "bin", "Release", "main.exe")
    : path.join(HOME, "whisper.cpp", "main");

const MDL = path.join(HOME, "whisper.cpp", "models", "ggml-base.en.bin");

export function transcribe(wav: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const cmd = `"${BIN}" -m "${MDL}" -f "${wav}" -np -nt --output-txt`;
        exec(cmd, (err, stdout, stderr) => {
            if (err) { reject(stderr); return; }
            resolve(stdout.trim());
        });
    });
}