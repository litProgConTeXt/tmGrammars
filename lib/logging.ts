/**
 *  Logging
 * 
 * We use the <pino: https://getpino.io> logging framework...
 * 
 * @module
 */

import fs from "fs"

import      deepcopy  from 'deepcopy'
import * as process   from 'process'
import * as yaml      from 'yaml'

// The type of all valid Loggers (NoOpLogger, ArrayLogger, pino.Logger)
export type ValidLogger = NoOpLogger | ArrayLogger | StreamLogger

// The type of <ValidLoggers> or (possibly) undefined
export type MaybeLogger = ValidLogger | undefined

/**
 * We implement a simple Pino like logger
 */
class BaseLogger {

  log(logLevel: string, theArguments : object) {}

  trace(...args: any[])  {this.log('trace', arguments)}
  debug(...args: any[])  {this.log('debug', arguments)}
  info(...args: any[])   {this.log('info', arguments)}
  warn(...args: any[])   {this.log('warn', arguments)}
  error(...args: any[])  {this.log('error', arguments)}
  fatal(...args: any[])  {this.log('fatal', arguments)}
  silent(...args: any[]) {this.log('silent', arguments)}
  flush()  {}
  close()  {}
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
}

/**
 * We implement a simple no-op version of the Pino logger interface...
 * See: <pino api: https://getpino.io/#/docs/api?id=logger>
 */
export class NoOpLogger extends BaseLogger {
  trace()  {}
  debug()  {}
  info()   {}
  warn()   {}
  error()  {}
  fatal()  {}
  silent() {}
  isLevelEnabled()  { return false }
}

/**
 * We implement a simple array logger version of the Pino logger interface to
 * provide a simple testing interface...
 *
 * See: <pino api: https://getpino.io/#/docs/api?id=logger>
 */
export class ArrayLogger extends BaseLogger {
  theArray : Array<Array<any>> = []

  /** 
   * Create a new ArrayLogger
   * 
   * @param theArray - The array into which all logging activity will be appended.
   */
  constructor(theArray: Array<Array<any>>) {
    super()
    this.theArray = theArray
  }

  /**
   * A private function which collects all of its arguments and appends them to
   * the ArrayLogger's `theArray`
   *
   * @param logLevel - one of Pino's log levels
   * @param theArguments - the collection of Pino log arguments
   *
   */
  log(logLevel: string, theArguments: object) {
    var theArgumentsArray : Array<any> = Object.values(theArguments)
    theArgumentsArray.unshift(Date.now())
    theArgumentsArray.unshift(logLevel)
    this.theArray.push(theArgumentsArray)
  }
}

/**
 * We implement a very simplistic stream (file) based logger base on the Pino
 * logger interface to provide a simple testing interface...
 *
 * See: <pino api: https://getpino.io/#/docs/api?id=logger>
 */
export class StreamLogger extends BaseLogger {

  // the log file path
  logFilePath : string = ""

  // the file descriptor for the sonicBoom
  logFile : number = -1

  constructor() {
    super()
    
    var logFilePath : string | undefined = process.env.LPIC_LOGFILE
    if (!logFilePath) {

      var logFilePrefix : string | undefined = process.env.LPIC_LOGPREFIX
      if (!logFilePrefix) { logFilePrefix = "/tmp/lpicLogger" }

      const today = new Date()
      const todayDateArray = [
        today.getFullYear().toString(),
        (today.getMonth()+1).toString().padStart(2,'0'),
        today.getDate().toString().padStart(2,'0')
      ]
      const nowTimeArray = [
        today.getHours().toString().padStart(2,'0'),
        today.getMinutes().toString().padStart(2,'0'),
        today.getMilliseconds().toString().padStart(2,'0')
      ]

      // The default file system path to which all logging will be directed:
      //   {logPrefix}_YYYY-MM-DD_HH-MM-SS-PID 
      logFilePath = logFilePrefix + '_' +
        todayDateArray.join('-') + 
        '_'+nowTimeArray.join('-') +
        '_'+process.pid
    }  
    this.logFilePath = logFilePath

    this.logFile = fs.openSync(logFilePath,"w")
  }
  
  flush() {
    //if (-1 < this.logFile) fs.flushSync(this.logFile)
  }

  close() {
    if (2 < this.logFile) {
      //fs.flushSync(this.logFile)
      fs.closeSync(this.logFile)
    }
    this.logFile = -1
    this.logFilePath = ""
  }

  /**
   * A private function which collects all of its arguments and appends them to
   * the ArrayLogger's `theArray`
  *
  * @param logLevel - one of Pino's log levels
  * @param theArguments - the collection of Pino log arguments
  */
 log(logLevel: string, theArguments: object) {
   //fs.writeSync(Logging._theFileDescriptor, "OPENED")
  }
}

// A global (static) class used to provide [Pino logging
// framework](https://getpino.io) to all of the code in a LPiC project.
export class Logging {
  
  // A Mapping from a "logger name" to a logger instance.
  static theLogger : MaybeLogger
  
  // Close the logger
  static close() {
    if (Logging.theLogger) Logging.theLogger.close()
  }

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
  static getLogger(loggerName: string) : ValidLogger {
    if (Logging.theLogger) return Logging.theLogger
    Logging.theLogger = new StreamLogger()
    return Logging.theLogger
  }

  /**
   * Ge a named NoOpLogger instance
   * 
   * @param loggerName - the name of the NoOpLogger instance
   */
  static getNoOpLogger(loggerName : string) : NoOpLogger {
    return new NoOpLogger
  }

  /**
   * Get an named ArrayLogger instance 
   *
   * @param loggerName - the name of the ArrayLogger instance
   * @param theArray - the array into which all logging will be appended.
   */
  static getArrayLogger(loggerName : string, theArray : Array<Array<any>>) : ArrayLogger {
    return new ArrayLogger(theArray)
  }

}
