import { exec } from "child_process";
import fs from "fs";
import { binPath, modelPath } from "./store";

export function transcribe(wav: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const cmd = `"${binPath()}" -m "${modelPath()}" -f "${wav}" -np -nt`;
        exec(cmd, (err, stdout, stderr) => {
            if (err) { reject(stderr); return; }
            resolve(stdout.trim());
        });
    });
}