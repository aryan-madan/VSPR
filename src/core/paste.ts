import { exec } from "child_process";
import { clipboard } from "electron";

export function paste(text: string) {
    clipboard.writeText(text);

    const cmd = process.platform === "darwin"
        ? `osascript -e 'tell application "System Events" to keystroke "v" using command down'`
        : `powershell -command "$wshell = New-Object -ComObject wscript.shell; $wshell.SendKeys('^v')"`;

    exec(cmd);
}