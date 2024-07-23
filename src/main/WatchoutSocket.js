import net from 'net';
import { verbose, debug, info, critical } from './SimpleLog';

class WatchoutSocket {
  constructor(address, port, level = 'verbose') {
    this.address = address || 'localhost';
    this.port = port || 3040;
    this.debug = debug || false;
  }

  conditional(label, first, second) {
    const socket = new net.Socket();
    socket.setTimeout(1000); // short life socket

    socket.on('data', (data) => {
      info(data);
      if (data.indexOf('Error') > -1) {
        critical(`[ERROR]Watchout:"${data}"`);
        socket.destroy();
      } else {
        debug('[Ping Success]');
        socket.write(`${second}\r\n`);
        socket.destroy();
      }
    });

    socket.on('error', (err) => {
      critical(err);
      socket.destroy();
    });

    socket.connect(
      {
        host: this.address,
        port: this.port,
        readable: true,
        writeable: true,
      },
      () => {
        info('[Socket] Watchout socket connected');
        debug(first);
        socket.write(`${first}\r\n`);
        debug('ping');
        socket.write('ping\r\n');
      }
    );
  }

  synchronous(label, commands) {
    const socket = new net.Socket();
    socket.setTimeout(1000); // short life socket

    socket.on('data', (data) => {
      info(data);
    });

    socket.on('error', (err) => {
      critical(err);
    });

    socket.connect(
      {
        host: this.address,
        port: this.port,
        readable: true,
        writeable: true,
      },
      () => {
        info('[Socket] Watchout socket connected');
        debug(commands);
        for (const x of commands) {
          verbose(`write: ${x}`);
          socket.write(`${x}\r\n`);
        }
        verbose('destroying socket');
        socket.destroy();
      }
    );
  }

  online() {
    throw 'NOT IMPLEMENTED';
  }

  offline() {
    throw 'NOT IMPLEMENTED';
  }

  run() {
    this.synchronous('run', 'run');
  }

  halt() {
    this.synchronous('halt', 'halt');
  }

  moveToControlCue(cue) {
    this.synchronous(`gotoControlCue ${cue}`, [`gotoControlCue ${cue}`]);
  }

  auxMoveToControlCue(cue, auxTimeline) {
    this.synchronous(`gotoControlCue ${cue} false ${auxTimeline}`);
  }

  gotoControlCue(cue) {
    this.conditional(
      `Show Control Goto Control Cue "${cue}" and Run if Exists`,
      `gotoControlCue ${cue}`,
      `run`
    );
  }

  auxGotoControlCue(timeline, cue) {
    this.conditional(
      `Show Control Goto Control Cue "${timeline}/${cue}" and Run if Exists`,
      `gotoControlCue ${cue} false ${timeline}`,
      `run ${timeline}`
    );
  }

  safeControlCue(cue) {
    info(`Trying Safe Control Cue: ${cue}`);
    const socket = new net.Socket();
    socket.setTimeout(1000); // short life socket
    const wait = 'waiting';

    socket.on('data', (data) => {
      if (data.indexOf('Error') > -1) {
        critical(`[ERROR]Watchout:"${data}"`);
        socket.destroy();
      } else {
        info('[Ping Success: EXECUTING RUN]');
        socket.write('run\r\n');
        socket.destroy();
      }
    });

    const opts = {
      host: this.address,
      port: this.port,
      readable: true,
      writeable: true,
    };

    socket.connect(opts, () => {
      if (this.debug) {
        info('[Socket] Watchout socket connected');
      }
      info(`gotoControlCue ${cue}`);
      socket.write(`gotoControlCue ${cue}\r\n`);
      info(`ping`);
      socket.write('ping\r\n');
    });
  }

  /**
   * Sends a command/set of commands to watchout, then disconnects. Because
   * of the nature of the online/offline workflow with Watchout
   * I'm opting to a socket per show control command rather than
   * keeping a socket open. If this becomes an issue we can revisit it.
   * @param {Array<string>} command
   */
  send(commands) {
    verbose('send ${0}', commands);
    const { address } = this;
    const { port } = this;

    const socket = new net.Socket();
    socket.setTimeout(1000); // short life socket
    socket.on('connect', () => {
      verbose('connect');
    });

    socket.on('data', (data) => {
      info(data);
    });

    socket.on('close', () => {
      verbose(closed);
    });

    socket.on('error', (err) => {
      critical(err);
    });

    socket.connect(
      {
        host: this.host,
        port: this.port,
        readable: true,
        writeable: true,
      },
      () => {
        info('[Socket] Watchout socket connected');
        debug(commands);
        for (const x of commands) {
          verbose(`write: ${x}`);
          socket.write(`${x}\r\n`);
        }
        verbose('destroying socket');
        socket.destroy();
      }
    );
  }
}

export default WatchoutSocket;
