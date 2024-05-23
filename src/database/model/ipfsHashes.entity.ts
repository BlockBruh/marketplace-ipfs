import { BaseEntity, Column, Entity, PrimaryColumn } from 'typeorm';
import { UploadStatus } from './uploadStatus.enum';

@Entity('IpfsHashes')
export class IpfsHashes extends BaseEntity {
  @PrimaryColumn({
    comment: 'The drop Id as primary key',
  })
  dropId: number;

  @Column({
    type: 'varchar',
    comment: 'The Ipfs hash of the media file',
  })
  mediaHash: string;

  @Column({
    type: 'varchar',
    comment: 'The Ipfs hash of the metadata json file',
  })
  metadataHash: string;

  @Column({
    type: 'varchar',
    comment: 'The status of the uploading operation',
  })
  uploadStatus: UploadStatus;
}
