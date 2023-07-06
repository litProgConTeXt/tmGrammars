/**
 *  Logging
 * 
 * We use the <pino: https://getpino.io> logging framework...
 * 
 * @module
 */

import fs from "fs"

import      deepcopy  from 'deepcopy'
import * as os        from 'os'
import * as process   from 'process'
import * as yaml      from 'yaml'

// The type of all valid Loggers (ConsoleLobber, NoOpLogger, FileLogger)
export type ValidLogger = ConsoleLogger | NoOpLogger | FileLogger

// The type of a ValidLogger or (possibly) undefined
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
export class ConsoleLogger {

   // The log file path
   logFilePath : string = ""

   // The file descriptor
   logFile : number = -1
 
   // The host name (used by FileLogger)
   readonly hostName : string = ""

   // The PID (used by FileLogger)
   readonly pid : number = 0

   // The logName
   readonly logName : string = "lpic"

   /**
    * Construct a ConsoleLogger by setting defaults.
    * 
    * @param logName - The name of this logger instance.
    */
   constructor(logName: string) {
    this.logFile = 1
    this.logFilePath = "console"
    this.logName = logName
    this.hostName = os.hostname()
    this.pid = process.pid
   }
   
   // Flush the current log
   flush() {
     //if (-1 < this.logFile) fs.flushSync(this.logFile)
   }
 
   // Close this log.
   //
   // This logger should not be used after closing it.
   close() {
     if (2 < this.logFile) {
       fs.closeSync(this.logFile)
     }
     this.logFile = -1
     this.logFilePath = ""
   }
 
   /**
    * A private function which collects all of its arguments and writes them to
    * the console.log.
   *
   * @param logLevel - one of Pino's log levels
   * @param theArguments - the collection of Pino log arguments
   */
  log(logLevel: number, theArguments: object) {
    console.log(logLevel, theArguments)
  }

  // Log the arguments at the TRACE level.
   trace(...args: any[])  {if (this.level <= 10) this.log(10, arguments)}
  // Log the arguments at the DEBUG level.
  debug(...args: any[])  {if (this.level <= 20) this.log(20, arguments)}
  // Log the arguments at the INFO level.
  info(...args: any[])   {if (this.level <= 30) this.log(30, arguments)}
  // Log the arguments at the WARN level.
  warn(...args: any[])   {if (this.level <= 40) this.log(40, arguments)}
  // Log the arguments at the ERROR level.
  error(...args: any[])  {if (this.level <= 50) this.log(50, arguments)}
  // Log the arguments at the FATAL level.
  fatal(...args: any[])  {if (this.level <= 60) this.log(60, arguments)}
 
  // The currenly logging level
  level = 30

  // Set the current logging level.
  //
  // @param aLevel - The *value* of the new logging level.
  setLevel(aLevel : number) { this.level = aLevel }

  /**
   * Check to see if logging is enabled.
   *
   * @param aLevel - The logging level to check
   *
   * @returns True if aLevel is greater than or equal to currently set logging
   * level.
   */
  isLevelEnabled(aLevel : number )  { return (this.level < aLevel) }
}

/**
 * We implement a simple ndJson based file version of the Pino logger
 * interface... See: <pino api: https://getpino.io/#/docs/api?id=logger>
 */
export class FileLogger extends ConsoleLogger {

   /**
    * Construct a FileLogger by setting defaults.
    *
    * @param logName - The name of this logger instance.
    *
    * **Environment Variables**:
    *  - LPIC_LOG_FILE is a full path to the desired log file.
    *
    *  - LPIC_LOG_PREFIX is a prefix to pre-pend to an automatically generated
    *    log file path (Default: /tmp/lpicLogger)
    *
    *  - If LPIC_LOG_FILE is not set, then the log file path will be the
    *    LPIC_LOG_PREFIX pre-pended to '_YYYY-MM-DD_HH-MM-SS_PID.log' 
    */
   constructor(logName: string) {
    super(logName)
    var logFilePath : string | undefined = process.env.LPIC_LOG_FILE
    if (!logFilePath) {

      var logFilePrefix : string | undefined = process.env.LPIC_LOG_PREFIX
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

  /**
   * A private function which collects all of its arguments and writes them in
   * ndJson format to the opened logFile.
   *
   * We use the Pino ndJson format and logging levels so that we can use the
   * existing pino-pretty log display tool.
   *
   * See: 
   *  - [ndJson](http://ndjson.org/)
   *  - [pino-pretty](https://github.com/pinojs/pino-pretty)
   *  - [pino-logger-levels](https://getpino.io/#/docs/api?id=loggerlevels-object)
   *
   *
   * @param logLevel - one of Pino's log levels
   * @param theArguments - the collection of Pino log arguments
   */
  log(logLevel: number, theArguments: object) {
    var logJson : any = { }
    for (const [key, value] of Object.entries(theArguments)) {
      if (key === "0") logJson["msg"] = value
      else             logJson[key]   = value
    }
    logJson["level"]    = logLevel
    logJson["name"]     = this.logName
    logJson["time"]     = Date.now()
    logJson["pid"]      = this.pid
    logJson["hostname"] = this.hostName

    fs.writeSync(this.logFile,JSON.stringify(logJson)+"\n")
  }
}

/**
 * We implement a simple no-op logger.
 */
export class NoOpLogger extends ConsoleLogger {

   /**
    * Construct a NoOpLogger by setting defaults.
    *
    * @param logName - The name of this logger instance.
    */
  constructor(logName : string) {
    super(logName)
    this.logFilePath="no logging"
  }

  // Log the arguments at the TRACE level.
  trace()  {}
  // Log the arguments at the DEBUG level.
  debug()  {}
  // Log the arguments at the INFO level.
  info()   {}
  // Log the arguments at the WARN level.
  warn()   {}
  // Log the arguments at the ERROR level.
  error()  {}
  // Log the arguments at the FATAL level.
  fatal()  {}

  // Log the arguments at the TRACE level.
  isLevelEnabled(aLevel: number)  { return false }
}

// A global (static) class used to provide a simple logging interface to all of
// the code in a LPiC project.
export class Logging {

  // Does nothing...
  constructor() {}

  // We use the Pino logging levels to allow the use of pino-pretty
  // see: [pino-logger-levels](https://getpino.io/#/docs/api?id=loggerlevels-object)

  // The numical value associated with the TRACE logging level
  static TRACE = 10
  // The numical value associated with the DEBUG logging level
  static DEBUG = 20
  // The numical value associated with the INFO logging level
  static INFO  = 30
  // The numical value associated with the WARN logging level
  static WARN  = 40
  // The numical value associated with the ERROR logging level
  static ERROR = 50
  // The numical value associated with the FATAL logging level
  static FATAL = 60

  /**
   * Check to see if logging is enabled.
   *
   * @param aLevel - The logging level to check
   *
   * @returns False
   */
  static theLogger : MaybeLogger
  
  /**
   * Get a ValidLogger instance or create one if it has not already been
   * created.
   *
   * **Envionrment Variables**: If **LPIC_LOG_LEVEL** is set to a *number* then
   * that number (as a string) will be converted to a number and be used to set
   * the initial logLevel.
   * 
   * @param logName - The name of the logger created (typically 'lpic')
   *
   * @returns If the **LPIC_NO_LOG** environment variable is set, then a
   *  NoOpLogger will be returned, otherwise if **LPIC_CONSOLE_LOG** is set then
   *  a ConsoleLogger will be returned, otherwise a FileLogger will be returned.
   */
  static getLogger(logName: string) : ValidLogger {
    if (Logging.theLogger) return Logging.theLogger
    if (process.env.LPIC_NO_LOG)           Logging.theLogger = new NoOpLogger(logName)
    else if (process.env.LPIC_CONSOLE_LOG) Logging.theLogger = new ConsoleLogger(logName)
    else                                   Logging.theLogger = new FileLogger(logName)
    if (process.env.LPIC_LOG_LEVEL) 
      Logging.theLogger.setLevel(Number(process.env.LPIC_LOG_LEVEL))
    return Logging.theLogger
  }

  /**
   * Get a FileLogger instance
   * 
   * @param logName - The name of the logger created (typically 'lpic')
   */
  static getFileLogger(logName: string) : FileLogger {
    if (Logging.theLogger) Logging.theLogger.close()
    Logging.theLogger = new FileLogger(logName)
    return Logging.theLogger
  }

  /**
   * Get a ConsoleLogger instance
   * 
   * @param logName - The name of the logger created (typically 'lpic')
   */
  static getConsoleLogger(logName: string) : ConsoleLogger {
    if (Logging.theLogger) Logging.theLogger.close()
    Logging.theLogger = new ConsoleLogger(logName)
    return Logging.theLogger
  }

  /**
   *  Get a NoOpLogger instance
   * 
   * @param logName - The name of the logger created (typically 'lpic')
   */
  static getNoOpLogger(logName: string) : NoOpLogger {
    if (Logging.theLogger) Logging.theLogger.close()
    Logging.theLogger = new NoOpLogger(logName)
    return Logging.theLogger
  }

  // Close the currently created ValidLogger
  static close() {
    if (Logging.theLogger) Logging.theLogger.close()
  }
}
