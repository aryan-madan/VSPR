import { exec } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";
import { binPath, modelPath } from "./store";

const converted = path.join(os.tmpdir(), "vspr_converted.wav");

export function transcribe(wav: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const bin = binPath();
        const mdl = modelPath();

        console.log("=== TRANSCRIBE ===");
        console.log("WAV exists:", fs.existsSync(wav));

        const convert = `ffmpeg -y -i "${wav}" -ar 16000 -ac 1 -c:a pcm_s16le "${converted}"`;

        exec(convert, (cerr, _, cstderr) => {
            console.log("ffmpeg err:", cerr);
            console.log("ffmpeg stderr:", cstderr);

            if (cerr) { reject(`ffmpeg failed: ${cstderr}`); return; }

            const cmd = `"${bin}" -m "${mdl}" -f "${converted}" -np -nt`;
            console.log("CMD:", cmd);

            exec(cmd, (err, stdout, stderr) => {
                console.log("stdout:", stdout);
                console.log("stderr:", stderr);
                if (err) { reject(stderr); return; }
                resolve(stdout.trim());
            });
        });
    });
}