import { InjectQueue, Process, Processor } from '@nestjs/bull';
import { Job, Queue } from 'bull';
import { PinataConstants, QueueConstants } from '../util/constants';
import { DatabaseService } from '../../database/service/database.service';
import { AILoggerService } from '../../logger/service/appInsights.logging.service';
import axios from 'axios';
import PinataClient from '@pinata/sdk';
import { configService } from '../../config/config.service';
import { IpfsHashes } from 'src/database/model/ipfsHashes.entity';
import { UploadStatus } from '../../database/model/uploadStatus.enum';
import { IpfsHashesDTO } from '../../database/model/ipfsHashes.dto';
import { GrpcIpfs } from '../interfaces/ipfs/proto/ipfs-service';
import { NRLoggerService } from '../../logger/service/newRelic.logging.service';
import FormData from 'form-data';
import UploadIpfsResponse = GrpcIpfs.UploadIpfsResponse;
import UploadNFTRequest = GrpcIpfs.UploadNFTRequest;

@Processor(QueueConstants.UPLOAD_QUEUE_NAME)
export class IpfsService {
  private pinataService;

  constructor(
    @InjectQueue(QueueConstants.UPLOAD_QUEUE_NAME) private queue: Queue,
    private readonly databaseService: DatabaseService,
    private readonly nrLogger: NRLoggerService,
    private readonly logger: AILoggerService,
  ) {
    this.pinataService = new PinataClient(
      configService.getPinataConfig().pinataApiKey,
      configService.getPinataConfig().pinataSecretApiKey,
    );
  }

  @Process(QueueConstants.UPLOAD_JOB_NAME)
  async processJob(job: Job) {
    const correlationId = job.data.correlationId;
    try {
      this.logger.log(
        `Start processing job with id: ${job.id} and drop id: ${job.data.uploadNFTRequest.dropId}`,
        correlationId,
      );
      this.uploadToIpfs(job.data.uploadNFTRequest, correlationId).then(
        (ipfsHashes) => {
          this.logger.log(
            `Job with id: ${job.id} has been processed for drop id: ${ipfsHashes.dropId}`,
            correlationId,
          );
        },
      );
    } catch (e) {
      this.logger.log(
        `Error processing job with id: ${job.id} and drop id: ${job.data.uploadNFTRequest.dropId}`,
        correlationId,
      );
      await this.databaseService.createOrUpdateIpfsHashes(
        new IpfsHashesDTO(
          job.data.uploadNFTRequest.dropId,
          '',
          '',
          UploadStatus.Failed,
        ),
        correlationId,
      );
    }
  }

  async upload(
    uploadNFTRequests: UploadNFTRequest[],
    correlationId: string,
  ): Promise<UploadIpfsResponse> {
    const response: UploadIpfsResponse = {
      uploadNFTResponses: [],
    };
    for (const uploadNFTRequest of uploadNFTRequests) {
      const ipfsHashes: IpfsHashes =
        await this.databaseService.getIpfsHashesByDropId(
          uploadNFTRequest.dropId,
        );
      // if drop not found or Failed
      if (!ipfsHashes || ipfsHashes.uploadStatus === UploadStatus.Failed) {
        const ipfsHashes: IpfsHashes =
          await this.databaseService.createOrUpdateIpfsHashes(
            new IpfsHashesDTO(
              uploadNFTRequest.dropId,
              '',
              '',
              UploadStatus.InProgress,
            ),
            correlationId,
          );
        await this.queue.add(QueueConstants.UPLOAD_JOB_NAME, {
          uploadNFTRequest,
          correlationId,
        });
        response.uploadNFTResponses.push({
          dropId: uploadNFTRequest.dropId,
          mediaHashUri: ipfsHashes.mediaHash,
          metadataHashUri: ipfsHashes.metadataHash,
          uploadStatus: UploadStatus.InProgress,
        });
      } else {
        response.uploadNFTResponses.push({
          dropId: uploadNFTRequest.dropId,
          mediaHashUri: ipfsHashes.mediaHash,
          metadataHashUri: ipfsHashes.metadataHash,
          uploadStatus: ipfsHashes.uploadStatus,
        });
      }
    }
    return response;
  }

  async uploadToIpfs(
    uploadNFTRequest: UploadNFTRequest,
    correlationId: string,
  ): Promise<IpfsHashes> {
    const mediaUploadResult = await this.uploadMediaFile(
      uploadNFTRequest,
      correlationId,
    );
    if (mediaUploadResult) {
      const mediaHash: string =
        mediaUploadResult[PinataConstants.IPFS_HASH_KEY];
      this.nrLogger.logMediaUploadEvent(uploadNFTRequest.dropId, mediaHash);
      const metadataJson = this.constructMetadata(uploadNFTRequest, mediaHash);
      const metadataResult = await this.uploadMetadataJson(
        metadataJson,
        uploadNFTRequest,
        correlationId,
      );
      if (metadataResult) {
        this.nrLogger.logMetadataUploadEvent(
          uploadNFTRequest.dropId,
          metadataResult[PinataConstants.IPFS_HASH_KEY],
        );
        return await this.databaseService.createOrUpdateIpfsHashes(
          new IpfsHashesDTO(
            uploadNFTRequest.dropId,
            PinataConstants.IPFS_URL_PREFIX + mediaHash,
            PinataConstants.IPFS_URL_PREFIX +
              metadataResult[PinataConstants.IPFS_HASH_KEY],
            UploadStatus.Done,
          ),
          correlationId,
        );
      } else {
        this.logger.error(
          `Uploading metadata json file error: ${metadataResult}`,
          correlationId,
        );
        return await this.databaseService.createOrUpdateIpfsHashes(
          new IpfsHashesDTO(
            uploadNFTRequest.dropId,
            '',
            '',
            UploadStatus.Failed,
          ),
          correlationId,
        );
      }
    } else {
      this.logger.error(
        `Uploading media file error: ${mediaUploadResult}`,
        correlationId,
      );
      return await this.databaseService.createOrUpdateIpfsHashes(
        new IpfsHashesDTO(uploadNFTRequest.dropId, '', '', UploadStatus.Failed),
        correlationId,
      );
    }
  }

  /**
   * Will add a file to IPFS - read more about the api here - https://docs.pinata.cloud/pinata-node-sdk
   * @param metadata  - metadata key:value to be saved
   * @param correlationId
   */
  async uploadMediaFile(metadata: UploadNFTRequest, correlationId: string) {
    this.logger.log(
      `Saving FILE to IPFS [dropId: ${metadata.dropId}] from filepath: ${metadata.objectUri}`,
      correlationId,
    );
    return axios({
      method: 'get',
      url: metadata.objectUri,
      responseType: 'stream',
    }).then((response) => {
      const readableStreamForFile = response.data;
      const options = this.createIpfsRequestOptions(
        metadata.dropId.toString(),
        metadata.dropId,
        metadata.creatorName,
        PinataConstants.CONTENT_TYPE_MEDIA,
      );
      return this.addFileToIpfs(readableStreamForFile, options, correlationId);
    });
  }

  async uploadMetadataJson(json, metadata: UploadNFTRequest, correlationId) {
    // this.info("Saving JSON to IPFS:", json, correlationId);
    const options = this.createIpfsRequestOptions(
      metadata.dropId.toString(),
      metadata.dropId,
      metadata.creatorName,
      PinataConstants.CONTENT_TYPE_METADATA,
    );
    return await this.addJsonToIpfs(json, options, correlationId);
  }

  private async addJsonToIpfs(json: any, options: any, correlationId: string) {
    try {
      const result = await this.pinataService.pinJSONToIPFS(json, options);
      if (result && result[PinataConstants.IPFS_HASH_KEY] !== null) {
        this.logger.log(
          `Adding JSON to Pinata success with hash: ${result.IpfsHash}`,
          correlationId,
        );
        return result;
      } else {
        this.logger.error(
          `Adding JSON to Pinata error: ${result}`,
          correlationId,
        );
      }
    } catch (e) {
      this.logger.error(`Adding JSON to Pinata error: ${e}`, correlationId);
    }

    return null;
  }

  /**
   * @dev This operation is made with an axios call because the API has a size limit
   * @param readableStreamForFile
   * @param options
   * @param correlationId
   * @private
   */
  private async addFileToIpfs(
    readableStreamForFile: any,
    options: any,
    correlationId: string,
  ) {
    this.logger.log(
      `Saving to IPFS with options drop id: ${options.pinataMetadata.name}`,
      correlationId,
    );
    const data = new FormData();
    data.append(PinataConstants.FILE, readableStreamForFile);
    data.append(PinataConstants.OPTIONS, JSON.stringify(options.pinataOptions));
    data.append(
      PinataConstants.METADATA,
      JSON.stringify(options.pinataMetadata),
    );

    const config = {
      method: 'post',
      url: PinataConstants.PIN_FILE_URL,
      timeout: 6000000, // 100 minutes
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      headers: {
        pinata_api_key: process.env.PINATA_API_KEY,
        pinata_secret_api_key: process.env.PINATA_API_SECRET,
      },
      data: data,
    };
    try {
      this.logger.log(
        `Starting upload to Pinata url: ${config.url}`,
        correlationId,
      );
      const result = await axios(config);
      if (
        result &&
        result.data &&
        result.status === 200 &&
        result.data[PinataConstants.IPFS_HASH_KEY] !== null
      ) {
        this.logger.log(
          `Adding file to Pinata success with hash: ${
            result.data[PinataConstants.IPFS_HASH_KEY]
          }`,
          correlationId,
        );
        return result.data;
      } else {
        this.logger.error(
          `Adding file to Pinata error: ${result.data}`,
          correlationId,
        );
      }
    } catch (e) {
      this.logger.error(`Adding file to Pinata error: ${e}`, correlationId);
    }

    return null;
  }

  private createIpfsRequestOptions(
    name: string,
    dropId: number,
    creator: string,
    type: string,
  ) {
    return {
      pinataMetadata: {
        name: name,
        keyvalues: {
          project: PinataConstants.PROJECT,
          drop_id: dropId,
          creator_name: creator,
          content_type: type,
        },
      },
      pinataOptions: {
        cidVersion: 1,
        customPinPolicy: {
          regions: [
            {
              id: 'FRA1',
              desiredReplicationCount: PinataConstants.REPLICATION_COUNT,
            },
            {
              id: 'NYC1',
              desiredReplicationCount: PinataConstants.REPLICATION_COUNT,
            },
          ],
        },
      },
    };
  }

  public async calculateUsage(): Promise<number> {
    return await this.pinataService.userPinnedDataTotal();
  }

  public async testAuth(): Promise<boolean> {
    return await this.pinataService
      .testAuthentication()
      .then((result) => {
        this.logger.log(`Pinata authentication success: ${result}`);
        return true;
      })
      .catch((e) => {
        this.logger.error(`Pinata authentication error: ${e}`);
        return false;
      });
  }

  /**
   * Use EIP-721 standard: https://github.com/ethereum/EIPs/blob/master/EIPS/eip-721.md
   * or Opensea standard: https://docs.opensea.io/docs/metadata-standards
   * @param metadata
   * @param mediaHash
   * @private
   */
  private constructMetadata(metadata: UploadNFTRequest, mediaHash: string) {
    const ipfsUrl = PinataConstants.IPFS_URL_PREFIX + mediaHash;

    /**
     * These are the ERC-721 metadata standard - https://github.com/ethereum/EIPs/blob/master/EIPS/eip-1155.md#erc-1155-metadata-uri-json-schema
     */
    const properties = {
      dropId: metadata.dropId,
      royalties_percent: metadata.royaltiesPercent,
      creator_name: metadata.creatorName,
    };

    /**
     * Attributes should normally be traits on Opensea, but we don't have such traits currently
     * See https://docs.opensea.io/docs/metadata-standards
     */

    const metadataJson = {
      name: metadata.title, // opensea standard
      description: metadata.description, // opensea standard
      external_url: metadata.externalUrl, // opensea standard
      image: ipfsUrl, // opensea standard
      properties,
    };

    const attributes = metadata.attributes;
    if (attributes && attributes.length > 0) {
      metadataJson['attributes'] = attributes;
    }

    const utilityData = metadata.utilityData;
    if (utilityData) {
      metadataJson['utilities'] = utilityData;
      metadataJson['utilities']['t&c'] = utilityData.tAndCUrl;
      delete metadataJson['utilities']['tAndCUrl'];
    }

    // Read more here - https://docs.opensea.io/docs/metadata-standards
    return metadataJson;
  }
}
