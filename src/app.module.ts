import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthController } from './health/controller/health.controller';
import { IpfsController } from './ipfs/controller/ipfs.controller';
import { HealthModule } from './health/health.module';
import { IpfsModule } from './ipfs/ipfs.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { configService } from './config/config.service';
import { DatabaseModule } from './database/database.module';
import { LoggerModule } from './logger/logging.module';
import { BullModule } from '@nestjs/bull';

@Module({
  imports: [
    BullModule.forRoot({
      redis: configService.getRedisConfig(),
    }),
    DatabaseModule,
    HealthModule,
    IpfsModule,
    LoggerModule,
    TypeOrmModule.forRoot(configService.getTypeOrmConfig()),
  ],
  controllers: [AppController, HealthController, IpfsController],
  providers: [AppService],
})
export class AppModule {}
