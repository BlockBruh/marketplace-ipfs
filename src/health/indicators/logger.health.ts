import { Injectable } from '@nestjs/common';
import {
  HealthCheckError,
  HealthIndicator,
  HealthIndicatorResult,
} from '@nestjs/terminus';
import { NRLoggerService } from '../../logger/service/newRelic.logging.service';

@Injectable()
export class LoggerHealthIndicator extends HealthIndicator {
  constructor(private readonly nrLogger: NRLoggerService) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    const loggerStatus = await this.nrLogger.healthCheck();
    const isHealthy = loggerStatus.data.status === 'UP';
    const result = this.getStatus(key, isHealthy, {});

    if (isHealthy) {
      return result;
    }
    throw new HealthCheckError('New Relic logger check failed', result);
  }
}
