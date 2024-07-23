import unicorn from 'format-unicorn/safe';
import moment from 'moment';

export const LEVELS = {
  VERBOSE: 'verbose',
  DEBUG: 'debug',
  INFO: 'info',
  CRITICAL: 'critical',
};

const LOOKUP = {
  verbose: 4,
  debug: 3,
  info: 2,
  critical: 1,
};
const REV_LOOKUP = {
  4: 'verbose',
  3: 'debug',
  2: 'info',
  1: 'critical',
};

let SimpleLog__level = LOOKUP[LEVELS.VERBOSE];
let SimpleLog__userFunction = null;

export const setCustomLogFn = (fn) => {
  if (fn) {
    SimpleLog__userFunction = fn;
  }
};

export const setLevel = (level = LEVELS.VERBOSE) => {
  SimpleLog__level = LOOKUP[level];
  if (SimpleLog__level < 1 || SimpleLog__level > 4) {
    SimpleLog__level = 4;
  }
};

export const getLevel = () => {
  switch (SimpleLog__level) {
    case 1:
      return LEVELS.CRITICAL;
    case 2:
      return LEVELS.INFO;
    case 3:
      return LEVELS.DEBUG;
  }

  return LEVELS.VERBOSE;
};

export const formatString = (lvlString, str, params) => {
  let parameters = '';
  if (params) {
    parameters = `[Parameters: ${JSON.stringify(params)}] `;
  }

  return `[${lvlString}][${moment().format(
    'YYYY-MM-DD HH:mm:ss'
  )}]${parameters} ${unicorn(str, params)}`;
};

export const universalLog = (levelString, str, params) => {
  const level = LOOKUP[levelString] || 4;
  // console.log(`\tDEBUG\t[${level}] ${levelString} ${args} x ${SimpleLog__level}`)
  if (SimpleLog__level >= level) {
    if (SimpleLog__userFunction) {
      SimpleLog__userFunction(unicorn(str, params));
    } else {
      console.log(formatString(levelString, str, params));
    }
  }
};

export const verbose = (str, ...args) => {
  universalLog(LEVELS.VERBOSE, str, args);
};
export const debug = (str, ...args) => {
  universalLog(LEVELS.DEBUG, str, args);
};
export const info = (str, ...args) => {
  universalLog(LEVELS.INFO, str, args);
};
export const critical = (str, ...args) => {
  console.error(formatString('CRITICAL', str, ...args));
  universalLog(LEVELS.CRITICAL, str, args);
};
