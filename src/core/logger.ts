import pino from "pino";
import type { Logger as PinoLogger, LoggerOptions } from "pino";

export enum LogLevel {
  DEBUG = 10,
  INFO = 30,
  WARN = 40,
  ERROR = 50,
  FATAL = 60,
}

const PINO_LEVEL_MAP = {
  [LogLevel.DEBUG]: "debug",
  [LogLevel.INFO]: "info",
  [LogLevel.WARN]: "warn",
  [LogLevel.ERROR]: "error",
  [LogLevel.FATAL]: "fatal",
} as const;

class Logger {
  private pinoLogger: PinoLogger;
  private currentLevel: LogLevel;

  constructor(
    options: {
      level?: LogLevel;
      module?: string;
      pretty?: boolean;
      destination?: string;
      pinoOptions?: LoggerOptions;
    } = {}
  ) {
    this.currentLevel = options.level ?? LogLevel.INFO;

    const pinoOptions: LoggerOptions = {
      level: this.mapLogLevel(this.currentLevel),
      ...(options.module && {
        base: { module: options.module },
      }),
      ...options.pinoOptions,
    };

    if (options.destination) {
      this.pinoLogger = pino(
        pinoOptions,
        pino.destination({
          dest: options.destination,
          sync: false,
        })
      );
    } else if (
      options.pretty !== false &&
      process.env.NODE_ENV !== "production"
    ) {
      this.pinoLogger = pino({
        ...pinoOptions,
        transport: {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "SYS:standard",
            ignore: "pid,hostname",
          },
        },
      });
    } else {
      this.pinoLogger = pino(pinoOptions);
    }
  }

  private mapLogLevel(level: LogLevel): string {
    return PINO_LEVEL_MAP[level];
  }

  setLevel(level: LogLevel): void {
    this.currentLevel = level;
    this.pinoLogger.level = this.mapLogLevel(level);
  }

  debug(message: string, context?: Record<string, any>): void {
    if (context) {
      this.pinoLogger.debug(context, message);
    } else {
      this.pinoLogger.debug(message);
    }
  }

  info(message: string, context?: Record<string, any>): void {
    if (context) {
      this.pinoLogger.info(context, message);
    } else {
      this.pinoLogger.info(message);
    }
  }

  warn(message: string, context?: Record<string, any>): void {
    if (context) {
      this.pinoLogger.warn(context, message);
    } else {
      this.pinoLogger.warn(message);
    }
  }

  error(message: string, error?: Error, context?: Record<string, any>): void {
    const logData = {
      ...context,
      ...(error && {
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
        },
      }),
    };

    if (Object.keys(logData).length > 0) {
      this.pinoLogger.error(logData, message);
    } else {
      this.pinoLogger.error(message);
    }
  }

  fatal(message: string, error?: Error, context?: Record<string, any>): void {
    const logData = {
      ...context,
      ...(error && {
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
        },
      }),
    };

    if (Object.keys(logData).length > 0) {
      this.pinoLogger.fatal(logData, message);
    } else {
      this.pinoLogger.fatal(message);
    }
  }

  child(module: string, bindings?: Record<string, any>): Logger {
    const childLogger = new Logger();
    childLogger.pinoLogger = this.pinoLogger.child({
      module,
      ...bindings,
    });
    childLogger.currentLevel = this.currentLevel;
    return childLogger;
  }

  getPinoLogger(): PinoLogger {
    return this.pinoLogger;
  }
}

export const logger = new Logger({
  level: process.env.LOG_LEVEL
    ? LogLevel[process.env.LOG_LEVEL as keyof typeof LogLevel]
    : LogLevel.INFO,
  pretty: process.env.NODE_ENV !== "production",
});

export function createLogger(
  module: string,
  options?: {
    level?: LogLevel;
    pretty?: boolean;
    destination?: string;
    pinoOptions?: LoggerOptions;
  }
): Logger {
  return new Logger({
    level: options?.level ?? LogLevel.INFO,
    module,
    pretty: options?.pretty,
    destination: options?.destination,
    pinoOptions: options?.pinoOptions,
  });
}

export function createFileLogger(
  filePath: string,
  options?: {
    level?: LogLevel;
    module?: string;
    prettyConsole?: boolean;
  }
): Logger {
  const fileLogger = new Logger({
    level: options?.level ?? LogLevel.INFO,
    module: options?.module,
    destination: filePath,
    pretty: false,
  });

  if (options?.prettyConsole !== false) {
    const streams = [
      {
        level: logger.getPinoLogger().level,
        stream: pino.destination({ dest: filePath, sync: false }),
      },
      {
        level: logger.getPinoLogger().level,
        stream: process.stdout,
      },
    ];

    const multiLogger = new Logger();
    multiLogger["pinoLogger"] = pino(
      {
        level: PINO_LEVEL_MAP[options?.level ?? LogLevel.INFO],
        ...(options?.module && { base: { module: options.module } }),
      },
      pino.multistream(streams)
    );

    return multiLogger;
  }

  return fileLogger;
}

export type { LoggerOptions } from "pino";
