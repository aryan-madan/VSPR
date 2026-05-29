Hello, if the app doesn't open, and shows
![Error](https://cdn.hackclub.com/019e74da-c339-7de6-bff2-cdedf82deb67/image.png)
It's just macos being macos and not allowing the app to run because it's not codesigned.

I tried it on another laptop (macos tahoe aswell), it's the gatekeeper that's causing the issue.
Use the following command to un-quarantine the app and get it to run (which worked for me)
I can't afford a 99$ per year license :broken_heart:

xattr -dr com.apple.quarantine /Applications/VSPR.app

Thanks, Aryan
P.S. do let me know if it doesn't work :P