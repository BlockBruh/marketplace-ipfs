import { Module } from '@nestjs/common';
import { IpfsService } from './service/ipfs.service';
import { BullModule } from '@nestjs/bull';
import { IpfsController } from './controller/ipfs.controller';
import { QueueConstants } from './util/constants';
import { DatabaseModule } from '../database/database.module';
import { ClientsModule } from '@nestjs/microservices';
import { grpcClientOptions } from '../grpc-client.options';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'IPFS',
        ...grpcClientOptions,
      },
    ]),
    BullModule.registerQueue({
      name: QueueConstants.UPLOAD_QUEUE_NAME,
    }),
    DatabaseModule,
  ],
  controllers: [IpfsController],
  providers: [IpfsService],
  exports: [IpfsService],
})
export class IpfsModule {}
