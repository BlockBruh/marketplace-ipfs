import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IpfsHashes } from '../model/ipfsHashes.entity';
import { Repository } from 'typeorm';
import { IpfsHashesDTO } from '../model/ipfsHashes.dto';
import { AILoggerService } from '../../logger/service/appInsights.logging.service';

@Injectable()
export class DatabaseService {
  constructor(
    @InjectRepository(IpfsHashes)
    private readonly ipfsHashesRepository: Repository<IpfsHashes>,
    private readonly logger: AILoggerService,
  ) {}

  async createOrUpdateIpfsHashes(
    ipfsHashesDto: IpfsHashesDTO,
    correlationId: string,
  ) {
    const ipfsHashes: IpfsHashes = await this.ipfsHashesRepository.create(
      ipfsHashesDto,
    );
    this.logger.log(
      `Create of update drop id: ${ipfsHashes.dropId} with status ${ipfsHashes.uploadStatus}`,
      correlationId,
    );
    return await this.ipfsHashesRepository.save(ipfsHashes);
  }

  async getIpfsHashesByDropId(dropId: number) {
    return (await this.ipfsHashesRepository.findBy({ dropId: dropId })).pop();
  }

  async getAllIpfsHashes() {
    return await this.ipfsHashesRepository.find();
  }
}
