/**
 *  Logging
 * 
 * We use the <pino: https://getpino.io> logging framework...
 * 
 * @module
 */

import      deepcopy  from 'deepcopy'
import { pino       } from 'pino'
import * as process   from 'process'
import * as yaml      from 'yaml'

// The type of all valid Loggers (NoOpLogger, ArrayLogger, pino.Logger)
export type ValidLogger = NoOpLogger | ArrayLogger | pino.Logger

// The type of <ValidLoggers> or (possibly) undefined
export type MaybeLogger = ValidLogger | undefined

/**
 * We implement a simple no-op version of the Pino logger interface...
 * See: <pino api: https://getpino.io/#/docs/api?id=logger>
 */
export class NoOpLogger {
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

/**
 * We implement a simple array logger version of the Pino logger interface to
 * provide a simple testing interface...
 *
 * See: <pino api: https://getpino.io/#/docs/api?id=logger>
 */
export class ArrayLogger {
  theArray : Array<Array<any>>

  /** 
   * Create a new ArrayLogger
   * 
   * @param theArray - The array into which all logging activity will be appended.
   */
  constructor(theArray: Array<Array<any>>) {
    this.theArray = theArray
  }

  /**
   * A private function which collects all of its arguments and appends them to
   * the ArrayLogger's `theArray`
   *
   * @param logLevel - one of Pino's log levels
   * @param theArguments - the collection of Pino log arguments
   */
  appendToArray(logLevel: string, theArguments: object) {
    var theArgumentsArray : Array<any> = Object.values(theArguments)
    theArgumentsArray.unshift(Date.now())
    theArgumentsArray.unshift(logLevel)
    this.theArray.push(theArgumentsArray)
  }

  trace(...args: any[])  {this.appendToArray('trace', arguments)}
  debug(...args: any[])  {this.appendToArray('debug', arguments)}
  info(...args: any[])   {this.appendToArray('info', arguments)}
  warn(...args: any[])   {this.appendToArray('warn', arguments)}
  error(...args: any[])  {this.appendToArray('error', arguments)}
  fatal(...args: any[])  {this.appendToArray('fatal', arguments)}
  silent(...args: any[]) {this.appendToArray('silent', arguments)}
  child(...args: any[])  {return this}
  bindings(...args: any[])  {return null}
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

// A global (static) class used to provide [Pino logging
// framework](https://getpino.io) to all of the code in a LPiC project.
export class Logging {
  
  // A Mapping from a "logger name" to a logger instance.
  static loggers : Map<string, pino.Logger | NoOpLogger | ArrayLogger> = new Map()
  
  // The default Pino options
  static options : object = {}
  
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

  /**
   * The file system path to which all logging will be directed.
   * 
   * **Default**: /tmp/lpicLogger_YYYY-MM-DD_HH-MM-SS-PID 
   */
  static logFilePath = '/tmp/lpicLogger_' +
    Logging.todayDateArray.join('-') + 
    '_'+Logging.nowTimeArray.join('-') +
    '_'+process.pid

  // The default Pino destination structure created using the <logFilePath>
  static destination : pino.DestinationStream = pino.destination(Logging.logFilePath)

  /**
   * Set the default options
   * 
   * Unfortunately, at the moment, the logger gets created at import time before
   * any code can be run to override this default.
   * 
   * @param options - the default Pino options
   */
  static setOptions(options : object ) { Logging.options = options }
  

  /**
   * Set the default destination.
   * 
   * Unfortunately, at the moment, the logger gets created at import time before
   * any code can be run to override this default.
   * 
   * @param destination - the default Pino DestinationString
   */
  static setDestination(destination : pino.DestinationStream ) { Logging.destination = destination }

  /**
   * Get a named Pino (child) logger instance or create it if it has not already
   * been created.
   *
   * @param loggerName - the name of this Pino (child) logger instance
   * @param options - the optional Pino logger options to be used if creating
   *  this (child) logger instance.
   * @param destination - the optional Pino destination stream to be used if
   *  creating this (child) logger instance.
   */
  static getLogger(
    loggerName: string,
    options?: pino.LoggerOptions,
    destination?: pino.DestinationStream
  ) : ValidLogger {
    if (!Logging.loggers.has(loggerName)) {
      if (typeof options === "undefined") {
        options = Logging.options
      }
      if (typeof destination === "undefined") {
        destination = Logging.destination
      }
      const lOptions : pino.LoggerOptions = deepcopy(options)
      lOptions['name'] = loggerName
      Logging.loggers.set(loggerName, pino(lOptions, destination))
    }

    var theLogger : MaybeLogger = Logging.loggers.get(loggerName)

    if (theLogger === undefined) { theLogger = new NoOpLogger() }

    return theLogger
  }

  /**
   * Ge a named NoOpLogger instance
   * 
   * @param loggerName - the name of the NoOpLogger instance
   */
  static getNoOpLogger(loggerName : string) : NoOpLogger {
    Logging.loggers.set(loggerName, new NoOpLogger())
    return <NoOpLogger> Logging.loggers.get(loggerName)
  }

  /**
   * Get an named ArrayLogger instance 
   *
   * @param loggerName - the name of the ArrayLogger instance
   * @param theArray - the array into which all logging will be appended.
   */
  static getArrayLogger(loggerName : string, theArray : Array<Array<any>>) : ArrayLogger {
    Logging.loggers.set(loggerName, new ArrayLogger(theArray))
    return <ArrayLogger> Logging.loggers.get(loggerName)
  }

  /**
   * Remove a logger
   *
   * @param loggerName - removes the given logger name from the collection of
   *              known loggers.
   */
  static removeLogger(loggerName : string) {
    Logging.loggers.delete(loggerName)
  }
}
