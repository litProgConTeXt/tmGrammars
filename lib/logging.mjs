
import deepcopy from 'deepcopy'
import { pino } from 'pino'
import process  from 'process'
import   yaml   from 'yaml'
// We implement a simple no-op version of the Pino logger interface...
// See: https://getpino.io/#/docs/api?id=logger
//
class NoOpLogger {
  constructor() {}
  trace()  {}
  debug()  {}
  info()   {}
  warn()   {}
  error()  {}
  fatal()  {}
  silent() {}
  child()  {return this}
  bindings()  {return null}
  flush()  {}
  isLevelEnabled()  { return false }
  level = 0
  levels = {
    labels: {
      '10': 'trace',
      '20': 'debug',
      '30': 'info',
      '40': 'warn',
      '50': 'error',
      '60': 'fatal'
    },
    values: {
      fatal: 60, error: 50, warn: 40, info: 30, debug: 20, trace: 10
    }
  }
  version = '0.0.0'
  // may need to implement logger[Symbol.for(....)]
  // see: https://getpino.io/#/docs/api?id=loggersymbolfor39pinoserializers39
}

// We implement a simple array logger version of the Pino logger interface...
// See: https://getpino.io/#/docs/api?id=logger
//
class ArrayLogger {
  constructor(theArray) {
    this.theArray = theArray
  }
  appendToArray(logLevel, theArguments) {
    theArguments = Array.from(theArguments)
    theArguments.unshift(Date.now())
    theArguments.unshift(logLevel)
    this.theArray.push(theArguments)
  }
  trace()  {this.appendToArray('trace', arguments)}
  debug()  {this.appendToArray('debug', arguments)}
  info()   {this.appendToArray('info', arguments)}
  warn()   {this.appendToArray('warn', arguments)}
  error()  {this.appendToArray('error', arguments)}
  fatal()  {this.appendToArray('fatal', arguments)}
  silent() {this.appendToArray('silent', arguments)}
  child()  {return this}
  bindings()  {return null}
  flush()  {}
  isLevelEnabled()  { return true }
  level = 0
  levels = {
    labels: {
      '10': 'trace',
      '20': 'debug',
      '30': 'info',
      '40': 'warn',
      '50': 'error',
      '60': 'fatal'
    },
    values: {
      fatal: 60, error: 50, warn: 40, info: 30, debug: 20, trace: 10
    }
  }
  version = '0.0.0'
  // may need to implement logger[Symbol.for(....)]
  // see: https://getpino.io/#/docs/api?id=loggersymbolfor39pinoserializers39
}


class Logging {
  static loggers = {}

  static options = {}
  static setOptions(options) { Logging.options = options }

  static today = new Date()
  static todayDateArray = [
    Logging.today.getFullYear().toString(),
    (Logging.today.getMonth()+1).toString().padStart(2,'0'),
    Logging.today.getDate().toString().padStart(2,'0')
  ]
  static nowTimeArray = [
    Logging.today.getHours().toString().padStart(2,'0'),
    Logging.today.getMinutes().toString().padStart(2,'0'),
    Logging.today.getMilliseconds().toString().padStart(2,'0')
  ]
  static logFilePath = '/tmp/lpicLogger_' +
    Logging.todayDateArray.join('-') + 
    '_'+Logging.nowTimeArray.join('-') +
    '_'+process.pid
  static destination = pino.destination(Logging.logFilePath)
  static setDestination(destination) { Logging.destination = destination }

  static getLogger(loggerName, options, destination) {
    if (!Logging.loggers[loggerName]) {
      if (typeof options === "undefined") {
        options = Logging.options
      }
      if (typeof destination === "undefined") {
        destination = Logging.destination
      }
      const lOptions = deepcopy(options)
      lOptions['name'] = loggerName
      Logging.loggers[loggerName] = new pino(lOptions, destination)
    }
    return Logging.loggers[loggerName]
  }

  static getNoOpLogger(loggerName) {
    Logging.loggers[loggerName] = new NoOpLogger()
    return Logging.loggers[loggerName]
  }

  static getArrayLogger(loggerName, theArray) {
    Logging.loggers[loggerName] = new ArrayLogger(theArray)
    return Logging.loggers[loggerName]
  }

  static removeLogger(loggerName) {
    delete Logging.loggers[loggerName]
  }
}

export { NoOpLogger, ArrayLogger, Logging }