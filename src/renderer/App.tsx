import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import icon from '../../assets/icon.svg';
import './App.css';
import React, { useState } from 'react';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import RecipeReviewCard from './ConsoleCollapse';

const packageJson = require('../../package.json');

let isRunOnce1 = true;

let iposc;
let portosc;
let ipwatchout;
let portwatchout;
let buttonConnected;
let textConnected = 'Connect';

const Hello = () => {
  // console.log("New Render!")

  const [oscIpIn, setOscIpIn] = useState('');
  const [oscPortIn, setOscPortIn] = useState('');
  const [watchoutIpOut, setWatchoutIpOut] = useState('');
  const [watchoutPortOut, setWatchoutPortOut] = useState('');
  const [connected, setConnected] = useState('');
  const [_, setTextConnect] = useState('Connect');

  // const openDev = () => {
  //   window.electron.console("Hi")
  // }

  // window.electron.console("hiiiii")

  // iposc = oscIpIn
  // portosc = oscPortIn
  // ipwatchout = watchoutIpOut
  // portwatchout = watchoutPortOut

  window.electron.ipcRenderer.on('woconnected', (event, arg) => {
    // console.log("App on happend")
    // console.log(arg)
    if (arg == true) {
      setConnected((buttonConnected = 'success'));
      setTextConnect((textConnected = 'Connected'));
    } else {
      setConnected((buttonConnected = 'error'));
      setTextConnect((textConnected = 'Disconnected'));
    }

    console.log('poop');
    console.log(
      `OSC (In)\nIP: ${iposc} \nPort: ${portosc}\n\nWatchout (Out)\nIP: ${ipwatchout}\nPort: ${portwatchout}`
    );
  });

  const getConfigDefaults = async () => {
    const result = await electron.getConfig();
    iposc = result.iposc;
    portosc = result.portosc;
    ipwatchout = result.ipwatchout;
    portwatchout = result.portwatchout;

    console.log(`
    OSC Commands:
      /watchout/go/[cueName]
      /watchout/goAux/[auxTimelineName]/[cueName]
      /watchout/goto/[cueName]
      /watchout/gotoAux/[auxTimelineName]/[cueName]
      /watchout/run
      /watchout/runAux/[auxTimelineName]
      /watchout/halt
      /watchout/haltAux/[auxTimelineName]
      /watchout/killAux/[auxTimelineName]
      /watchout/online
      /watchout/offline
      /watchout/reset
      /watchout/gotoTime [ms]
      /watchout/load [project_name]
      /watchout/standBy
      /watchout/ping
    `);

    console.log(`[Version: ${packageJson.version}]`);
    console.log(
      `[Last Used Config Settings]\n\nOSC (In)\nIP: ${iposc} \nPort: ${portosc}\n\nWatchout (Out)\nIP: ${ipwatchout}\nPort: ${portwatchout}`
    );

    const input = document.getElementById('input1');
    input.value = iposc;

    const input2 = document.getElementById('input2');
    input2.value = portosc;

    const input3 = document.getElementById('input3');
    input3.value = ipwatchout;

    const input4 = document.getElementById('input4');
    input4.value = portwatchout;
  };

  const isRunOnce = async () => {
    // const result = await window.electron.getIsRunOnce()
    // console.log(isRunOnce1)
    if (isRunOnce1) {
      isRunOnce1 = false;
      getConfigDefaults();
    }
  };
  isRunOnce();

  const handleSubmit = async (e) => {
    e.preventDefault();

    // window.electron.ipcRenderer.send('ping', 'ping')

    setTextConnect((textConnected = 'Connecting...'));
    const configData = { iposc, portosc, ipwatchout, portwatchout };
    console.log('[OSC CONNECTED]\n[OSC SERVER RUNNING...]');
    // console.log(configData)
    const result = await window.electron.sendConfig(configData);
    // console.log(result)
  };

  return (
    <div className="body1">
      <form onSubmit={handleSubmit}>
        <Box
          // component="form"
          sx={{
            '& .MuiTextField-root': { m: 4, width: '21ch' },
            tabSize: 2,
          }}
          noValidate
          autoComplete="off"
        />
        <div>
          <h2 className="App-header">OSC (In)</h2>
          <TextField
            sx={{
              input: { color: 'white' },
              fieldSet: { borderColor: 'white' },
              label: { color: 'white' },
            }}
            size="small"
            margin="dense"
            id="input1"
            label="IP"
            w
            defaultValue={oscIpIn}
            onChange={(e) =>
              setOscIpIn(
                e.target.value,
                (iposc = e.target.value)
                // console.log(e)
              )
            }
          />
          <TextField
            sx={{
              input: { color: 'white' },
              fieldSet: { borderColor: 'white' },
              label: { color: 'white' },
            }}
            id="input2"
            size="small"
            margin="dense"
            label="Port"
            defaultValue={oscPortIn}
            onChange={(e) =>
              setOscPortIn((portosc = e.target.value), e.target.value)
            }
          />

          <div>
            {/* {SimpleAccordion() } */}
            {RecipeReviewCard()}
          </div>

          <br />
          <h2 className="App-header">Watchout (Out)</h2>
          <TextField
            sx={{
              input: { color: 'white' },
              fieldSet: { borderColor: 'white' },
              label: { color: 'white' },
            }}
            margin="dense"
            id="input3"
            label="IP"
            size="small"
            defaultValue={watchoutIpOut}
            onChange={(e) =>
              setWatchoutIpOut(e.target.value, (ipwatchout = e.target.value))
            }
          />
          <TextField
            sx={{
              input: { color: 'white' },
              fieldSet: { borderColor: 'white' },
              label: { color: 'white' },
            }}
            margin="dense"
            id="input4"
            label="Port"
            size="small"
            defaultValue={watchoutPortOut}
            onChange={(e) =>
              setWatchoutPortOut(
                e.target.value,
                (portwatchout = e.target.value)
              )
            }
          />

          <Button
            sx={{
              position: 'absolute',
              bottom: '0',
              right: '0',
              height: 60,
            }}
            fullWidth
            variant="contained"
            color={buttonConnected}
            type="submit"
          >
            {textConnected}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Hello />} />
      </Routes>
    </Router>
  );
}
