import { Injectable } from '@nestjs/common';
import { configService } from '../../config/config.service';
import axios from 'axios';
import { NewRelicConstants } from '../util/constants';
import { NewRelicEventDTO } from '../model/newRelicEvent.dto';

@Injectable()
export class NRLoggerService {
  private readonly loggingApiUrl;

  constructor() {
    this.loggingApiUrl = configService.getValue('LOGGING_API_URL');
  }

  public healthCheck = async () => {
    const config = {
      method: 'get',
      url: this.loggingApiUrl + NewRelicConstants.LOGGING_HEALTH_URL_SUFFIX,
    };
    return axios(config);
  };

  public logDownloadEvent = async (dropId: number, filePath: string) => {
    await this.logNewRelicEvent(this.buildDownloadEvent(dropId, filePath));
  };

  public logMediaUploadEvent = async (dropId: number, mediaHash: string) => {
    await this.logNewRelicEvent(this.buildMediaUploadEvent(dropId, mediaHash));
  };

  public logMetadataUploadEvent = async (dropId: number, filePath: string) => {
    await this.logNewRelicEvent(
      this.buildMetadataUploadEvent(dropId, filePath),
    );
  };

  private logNewRelicEvent = async (event: NewRelicEventDTO) => {
    const config = {
      method: 'post',
      url: this.loggingApiUrl + NewRelicConstants.LOGGING_URL_SUFFIX,
      headers: {
        'Content-Type': NewRelicConstants.CONTENT_TYPE_JSON,
      },
      data: event.toJSON(),
    };
    await axios(config)
      .then(() => {
        console.log(
          `Success calling logging api for event: ${event.eventType}`,
        );
      })
      .catch((error) => {
        console.log('Failed calling logging api', error);
      });
  };

  private buildDownloadEvent = (
    dropId: number,
    filePath: string,
  ): NewRelicEventDTO => {
    const attributes = new Map<string, string>();
    attributes.set(NewRelicConstants.DROP_ID_ATTRIBUTE_KEY, dropId.toString());
    attributes.set(NewRelicConstants.FILE_PATH_ATTRIBUTE_KEY, filePath);
    return new NewRelicEventDTO(
      NewRelicConstants.DOWNLOAD_EVENT_TYPE,
      attributes,
    );
  };

  private buildMediaUploadEvent = (
    dropId: number,
    mediaHash: string,
  ): NewRelicEventDTO => {
    const attributes = new Map<string, string>();
    attributes.set(NewRelicConstants.DROP_ID_ATTRIBUTE_KEY, dropId.toString());
    attributes.set(NewRelicConstants.MEDIA_HASH_ATTRIBUTE_KEY, mediaHash);
    return new NewRelicEventDTO(
      NewRelicConstants.MEDIA_UPLOAD_EVENT_TYPE,
      attributes,
    );
  };

  private buildMetadataUploadEvent = (
    dropId: number,
    metadataHash: string,
  ): NewRelicEventDTO => {
    const attributes = new Map<string, string>();
    attributes.set(NewRelicConstants.DROP_ID_ATTRIBUTE_KEY, dropId.toString());
    attributes.set(NewRelicConstants.METADATA_HASH_ATTRIBUTE_KEY, metadataHash);
    return new NewRelicEventDTO(
      NewRelicConstants.METADATA_UPLOAD_EVENT_TYPE,
      attributes,
    );
  };
}
