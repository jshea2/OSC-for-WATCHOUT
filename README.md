![128x128](https://user-images.githubusercontent.com/70780576/153570079-4d8bb354-9993-4eea-ab89-b1d3f2bc3f8c.png)
# OSC for WATCHOUT
Control Actions in WATCHOUT via OSC
### [Download Here](https://github.com/jshea2/OSC-for-WATCHOUT/releases)

<img src="https://user-images.githubusercontent.com/70780576/153570422-1d8da18f-948e-4256-97fa-0d840572951e.png" alt="demo" width="400"/>

# OSC Commands

- `/watchout/go/${cue}` Executes: "gotoControlCue ${cue}" followed by "run"

- `/watchout/goto/${cue}` Executes: "gotoControlCue ${cue}" followed by "run"

- `/watchout/run` Executes: "run"

- `/watchout/halt` Executes: "halt"

# Credits:
All credit goes to [danielbchapman](https://github.com/danielbchapman/osc-watchout) for writing the amazing server side code. I just packaged it in a React-Electron App
