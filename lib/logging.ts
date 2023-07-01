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
export type ValidLogger = NoOpLogger | StreamLogger

// The type of <ValidLoggers> or (possibly) undefined
export type MaybeLogger = ValidLogger | undefined

/**
 * We implement a simple Pino like logger
 */
/**
 * We implement a very simplistic stream (file) based logger base on the Pino
 * logger interface to provide a simple testing interface...
 *
 * See: <pino api: https://getpino.io/#/docs/api?id=logger>
 */
class StreamLogger {

   // the log file path
   logFilePath : string = ""

   // the file descriptor for the sonicBoom
   logFile : number = -1
 
   constructor() {
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
    // TODO put time and other NDLog fields into the record, JSON.stringify the
    // record and write it out.

    // fs.writeSync(Logging._theFileDescriptor,"OPENED")
   }

   // TODO fail fast: put level check in each of the following methods
   trace(...args: any[])  {this.log('trace', arguments)}
   debug(...args: any[])  {this.log('debug', arguments)}
   info(...args: any[])   {this.log('info', arguments)}
   warn(...args: any[])   {this.log('warn', arguments)}
   error(...args: any[])  {this.log('error', arguments)}
   fatal(...args: any[])  {this.log('fatal', arguments)}
   silent(...args: any[]) {this.log('silent', arguments)}
 
   level = 0
   setLevel(aLevel : number) { this.level = aLevel }
   isLevelEnabled(aLevel : number )  { return (this.level < aLevel) }
   // TODO CHANGE TO static CONSTANTS on the Logging class
   levels = {
     labels: {
       '1': 'trace',
       '2': 'debug',
       '3': 'info',
       '4': 'warn',
       '5': 'error',
       '6': 'fatal'
     },
     values: {
       fatal: 6, error: 5, warn: 4, info: 3, debug: 2, trace: 1
     }
   } 
 
}

/**
 * We implement a simple no-op version of the Pino logger interface...
 * See: <pino api: https://getpino.io/#/docs/api?id=logger>
 */
export class NoOpLogger extends StreamLogger {
  trace()  {}
  debug()  {}
  info()   {}
  warn()   {}
  error()  {}
  fatal()  {}
  silent() {}
  isLevelEnabled()  { return false }
}

// A global (static) class used to provide a simple logging interface to all of
// the code in a LPiC project.
export class Logging {
  
  // A Mapping from a "logger name" to a logger instance.
  static theLogger : MaybeLogger
  
  /**
   * Get the existing StreamLogger instance or create it if it has not already
   * been created.
   */
  static getLogger() : ValidLogger {
    // TODO check the LPIC_NOLOGGER evnironment variable if defined use a
    // NoOpLogger
    if (Logging.theLogger) return Logging.theLogger
    Logging.theLogger = new StreamLogger()
    return Logging.theLogger
  }

  // Ge a NoOpLogger instance
  static getNoOpLogger() : NoOpLogger {
    return new NoOpLogger()
  }
}
