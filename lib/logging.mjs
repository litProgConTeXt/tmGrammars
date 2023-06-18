
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
  child()  {}
  bindings()  {}
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

class Logging {
  static shouldLog = true

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
    if (! Logging.shouldLog ) { return new NoOpLogger() }

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
}

export { NoOpLogger, Logging }