import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './controller/health.controller';
import { IpfsModule } from '../ipfs/ipfs.module';
import { IpfsHealthIndicator } from './indicators/ipfs.health';
import { LoggerHealthIndicator } from './indicators/logger.health';
import { LoggerModule } from '../logger/logging.module';

@Module({
  imports: [TerminusModule, IpfsModule, LoggerModule],
  controllers: [HealthController],
  providers: [IpfsHealthIndicator, LoggerHealthIndicator],
  exports: [TerminusModule, IpfsHealthIndicator, LoggerHealthIndicator],
})
export class HealthModule {}
