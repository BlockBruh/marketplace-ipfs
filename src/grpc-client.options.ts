import { ClientOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';

export const grpcClientOptions: ClientOptions = {
  transport: Transport.GRPC,
  options: {
    url: '0.0.0.0:5001',
    package: 'GrpcIpfs',
    protoPath: join(__dirname, 'ipfs/proto/ipfs-service.proto'),
    loader: {
      keepCase: true,
      longs: Number,
      defaults: false,
      arrays: true,
      objects: true,
    },
  },
};
