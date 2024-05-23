import { Controller, Get } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckService,
  TypeOrmHealthIndicator,
} from '@nestjs/terminus';
import { IpfsHealthIndicator } from '../indicators/ipfs.health';
import { LoggerHealthIndicator } from '../indicators/logger.health';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: TypeOrmHealthIndicator,
    private ipfs: IpfsHealthIndicator,
    private logger: LoggerHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.db.pingCheck('database'),
      () => this.ipfs.isHealthy('ipfs'),
      () => this.logger.isHealthy('logger'),
    ]);
  }
}
