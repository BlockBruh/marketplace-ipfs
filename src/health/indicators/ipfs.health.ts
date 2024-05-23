import { Injectable } from '@nestjs/common';
import {
  HealthCheckError,
  HealthIndicator,
  HealthIndicatorResult,
} from '@nestjs/terminus';
import { IpfsService } from '../../ipfs/service/ipfs.service';

@Injectable()
export class IpfsHealthIndicator extends HealthIndicator {
  constructor(private readonly ipfsService: IpfsService) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    const authStatus = await this.ipfsService.testAuth();
    const usage = await this.ipfsService.calculateUsage();
    const isHealthy = authStatus && usage !== undefined;
    const result = this.getStatus(key, isHealthy, {});

    if (isHealthy) {
      return result;
    }
    throw new HealthCheckError('Ipfs check failed', result);
  }
}
