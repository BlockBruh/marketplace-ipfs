import { Inject, Injectable, LoggerService } from '@nestjs/common';
import winston, { createLogger } from 'winston';
import { LoggerConfig } from '../util/config';

@Injectable()
export class AILoggerService implements LoggerService {
  private logger: winston.Logger;

  constructor(
    @Inject('ApplicationInsights') private readonly applicationInsights,
    private readonly loggerConfig: LoggerConfig,
  ) {
    this.logger = createLogger(this.loggerConfig.console());
    applicationInsights
      .setup()
      .setAutoCollectRequests(true)
      .setAutoCollectConsole(true, true)
      .setAutoCollectDependencies(false)
      .start();
    this.logger.debug(`Initialized`);
  }

  logDetails(level, log, correlation) {
    const { defaultClient } = this.applicationInsights;
    if (level === 'error') {
      defaultClient.trackException(
        this.getExceptionTelemetry(log, correlation),
      );
    } else {
      defaultClient.trackTrace(this.getTraceTelemetry(log, correlation));
    }
    defaultClient.flush();
  }

  getTraceTelemetry(log: string, id: string) {
    if (id) {
      return {
        message: log,
        tagOverrides: { 'ai.operation.id': id },
      };
    } else {
      return {
        message: log,
      };
    }
  }

  getExceptionTelemetry(log: string, id: string) {
    if (id) {
      return {
        exception: new Error(log),
        tagOverrides: { 'ai.operation.id': id },
      };
    } else {
      return {
        exception: new Error(log),
      };
    }
  }

  error(message: string, ...context: any[]) {
    this.logger.error(this.generateLogMessage(message, context));
    this.logDetails('error', message, context);
  }

  warn(message: string, ...context: any[]) {
    this.logger.warn(this.generateLogMessage(message, context));
    this.logDetails('warn', message, context);
  }

  debug(message: string, ...context: any[]) {
    this.logger.debug(this.generateLogMessage(message, context));
    this.logDetails('debug', message, context);
  }

  log(message: string, ...context: any[]) {
    this.logger.info(this.generateLogMessage(message, context));
    this.logDetails('info', message, context);
  }

  private generateLogMessage(message: string, context: any[]) {
    return {
      message: message,
      context: context[context.length - 1],
      correlation_id: context.length > 1 ? context[0] : null,
    };
  }
}
