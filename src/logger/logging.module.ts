import { Global, Module } from '@nestjs/common';
import { AILoggerService } from './service/appInsights.logging.service';
import { NRLoggerService } from './service/newRelic.logging.service';
import { WinstonModule } from 'nest-winston';
import { LoggerConfig } from './util/config';

@Global()
@Module({
  imports: [WinstonModule],
  exports: [AILoggerService, NRLoggerService],
  providers: [
    AILoggerService,
    NRLoggerService,
    {
      provide: 'ApplicationInsights',
      useValue: require('applicationinsights'),
    },
    LoggerConfig,
  ],
})
export class LoggerModule {}
