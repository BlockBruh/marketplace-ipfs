import { Controller, UseInterceptors } from '@nestjs/common';
import { IpfsService } from '../service/ipfs.service';
import { GrpcMethod } from '@nestjs/microservices';
import { Metadata } from '@grpc/grpc-js';
import { GrpcIpfs } from '../interfaces/ipfs/proto/ipfs-service';
import { PinataConstants } from '../util/constants';
import { LoggerInterceptor } from '../../logger/interceptor/logger.interceptor';
import UploadIpfsRequest = GrpcIpfs.UploadIpfsRequest;
import UploadIpfsResponse = GrpcIpfs.UploadIpfsResponse;

@Controller('ipfs')
@UseInterceptors(new LoggerInterceptor())
export class IpfsController {
  constructor(private readonly ipfsService: IpfsService) {}

  @GrpcMethod('IpfsService', 'UploadIpfs')
  async uploadToIpfs(
    data: UploadIpfsRequest,
    metadata: Metadata,
  ): Promise<UploadIpfsResponse> {
    //process upload request
    const correlationId = metadata.get(PinataConstants.CORRELATION_ID).pop();

    return await this.ipfsService.upload(
      data.uploadNFTRequests,
      correlationId.toString(),
    );
  }
}
