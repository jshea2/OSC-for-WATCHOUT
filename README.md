![128x128](https://user-images.githubusercontent.com/70780576/153570079-4d8bb354-9993-4eea-ab89-b1d3f2bc3f8c.png)
# OSC for WATCHOUT
Control Actions in WATCHOUT via OSC
### [Download Here](https://github.com/jshea2/OSC-for-WATCHOUT/releases)

<img src="https://user-images.githubusercontent.com/70780576/153570422-1d8da18f-948e-4256-97fa-0d840572951e.png" alt="demo" width="400"/>

# Setup

### Eos

- System > Show Control > OSC
    - Enable **OSC TX**
    - Set **OSC UDP TX Port** To match *OSC for WATCHOUT*
        - Default is `3032`
    - Set **OSC Cue Send String** to 
        - `/watchout/go/%1`
          - this syntax triggers every go cue from Eos and replaces the `%1` with the fired cue number
    - Set **UDP TX IP Address** to the IP of the WATHCOUT Production computer or OSC for WATCHOUT
        - *Note: In my case for using the same computer for Eos -> WATCHOUT 127.0.0.1 did not work, so i used the IP that it connects to another network.*


![Screenshot 2022-02-11 193513](https://user-images.githubusercontent.com/70780576/153695773-377dbc16-1ba9-440b-a713-7f341e2e1568.png)


### OSC for WATCHOUT

- OSC IN
   - IP should be `127.0.0.1`
   - Port should be what is set in Eos
      - Default is `3032`
 - Watchout (Out)
   - IP should match to the WATCHOUT Production computer's IP
   - Port should be `3040`
      - This is the port WATCHOUT uses to listen for control messages

### WATCHOUT

- Preferences > Control > Production Computer Control
    - Enable "TCP/IP"


![Screenshot 2022-02-11 193633](https://user-images.githubusercontent.com/70780576/153695791-cbbbc9c4-ec8a-4d2c-ac8a-2dde4b505ccf.png)


# OSC Commands

- `/watchout/go/[cueNumber]` Executes: "gotoControlCue [cue]" followed by "run"

- `/watchout/goto/[cueNumber]` Executes: "gotoControlCue [cue]" followed by "run"

- `/watchout/run` Executes: "run"

- `/watchout/halt` Executes: "halt"

# Credits:
All credit goes to [danielbchapman](https://github.com/danielbchapman/osc-watchout) for writing the amazing server side code. I just packaged it in a React-Electron App
