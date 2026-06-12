import pino, { Logger } from 'pino';

const logger: Logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport:
    process.env.NODE_ENV !== 'production'
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname',
          },
        }
      : undefined,
});

export default class Logging {
  public static logger = logger;

  public static log = (args: unknown) => this.info(args);
  public static info = (args: unknown) => logger.info(args);
  public static warning = (args: unknown) => logger.warn(args);
  public static error = (args: unknown) => logger.error(args);
}
