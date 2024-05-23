import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AILoggerService } from './logger/service/appInsights.logging.service';
import { grpcClientOptions } from './grpc-client.options';
import { MicroserviceOptions } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.connectMicroservice<MicroserviceOptions>(grpcClientOptions);
  app.useLogger(app.get(AILoggerService));
  await app.startAllMicroservices();
  await app.listen(4001);
}

bootstrap();
