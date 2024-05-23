import { UploadStatus } from './uploadStatus.enum';

export class IpfsHashesDTO {
  dropId: number;
  mediaHash: string;
  metadataHash: string;
  uploadStatus: UploadStatus;
  constructor(
    dropId: number,
    mediaHash: string,
    metadataHash: string,
    uploadStatus: UploadStatus,
  ) {
    this.dropId = dropId;
    this.mediaHash = mediaHash;
    this.metadataHash = metadataHash;
    this.uploadStatus = uploadStatus;
  }
}
