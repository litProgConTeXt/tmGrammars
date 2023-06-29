# Common TypeScript modules for the LPiC projects

A collection of javascript modules to manipulate and run TextMate Grammars
using vscode components.

## Logging

Since these modules are used to implement language servers, which communicate
with the client-editors via stdout, we need to ensure no console.log output will
confuse the client-editor.

To do this we implement (comprehensive) logging using the
[pino](https://getpino.io) logging framework.

This means that the log files are in a new-line-delimited JSON format. This
makes the log files easy to parse and manipulate in various scripting languages.
Alas this also means they are harder for a human to read.

To make these logs easy to read, we have included a bash script called `spl`
("show-pino-log") in the `scripts` directory.

This `spl` tool passes the specified colorized log file through `pino-pretty`
and then `less`.

To use this `spl` command you must install the
[`pino-pretty`](https://github.com/pinojs/pino-pretty#readme) npm package
*globally* by typing:

```
  npm install --global pino-pretty
```

The `spl` command:

```
  spl [options] <logFilePath>
```

  - takes any [`pino-pretty`
    options](https://github.com/pinojs/pino-pretty#cli-arguments) (*except* -c /
    --colorize)

    - the most useful pino-pretty option is probably:
```
      -L (--minimumLevel) Hide messages below the given log level
        may be a number [0-60] or one of:
          trace(10), debug(20), info(30), warn(40), error(50) or fatal(60)
```

  - expects the *last* argument to be the path to the log file to view

  - colorizes the logs in `less`

## Development tools

1. We use `typescript` to type check our TypeScript code. To do this we
   use the most modern settings (i.e. we do NOT target `commonjs`)

2. We use swc to *transpile* our Typescript to `commonjs` to keep `node`js
   happy.

3. We use `typedoc` with the current carefully crafted `tsconfig.json`
   settings to build the documentation (note that `typedoc` uses `tsc`).

4. We use mocha to run the tests *after* the TypeScript code has been
   converted to `commonjs` by `swc`.

5. We use `node`js to run the code (from the "out" directory).

6. We use `pino-pretty` to view all logged output (see Logging above)
