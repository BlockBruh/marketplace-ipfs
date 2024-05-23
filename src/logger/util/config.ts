import winston, { format, transports } from 'winston';
import cli_colors_util_1 from '@nestjs/common/utils/cli-colors.util';

export class LoggerConfig {
  private readonly options: winston.LoggerOptions;

  constructor() {
    this.options = {
      exitOnError: false,
      format: format.combine(
        format.colorize(),
        format.timestamp(),
        format.printf((msg) => {
          if (msg.correlation_id) {
            return `${msg.timestamp} [${msg.level}][${msg.context}]{${msg.correlation_id}} - ${msg.message}`;
          } else {
            return `${msg.timestamp} [${msg.level}][${msg.context}] - ${msg.message}`;
          }
        }),
      ),
      transports: [new transports.Console({ level: 'debug' })], // alert > error > warning > notice > info > debug
    };
  }

  public console(): object {
    return this.options;
  }

  getColorByLogLevel(level) {
    switch (level) {
      case 'debug':
        return cli_colors_util_1.clc.magentaBright;
      case 'warn':
        return cli_colors_util_1.clc.yellow;
      case 'error':
        return cli_colors_util_1.clc.red;
      case 'verbose':
        return cli_colors_util_1.clc.cyanBright;
      default:
        return cli_colors_util_1.clc.green;
    }
  }
}
