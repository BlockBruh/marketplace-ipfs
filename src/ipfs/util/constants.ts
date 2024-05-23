export class QueueConstants {
  static UPLOAD_QUEUE_NAME = 'upload-queue';
  static UPLOAD_JOB_NAME = 'upload-job';
}

export class PinataConstants {
  static REPLICATION_COUNT = 1;
  static PIN_FILE_URL = 'https://api.pinata.cloud/pinning/pinFileToIPFS';
  static OPTIONS = 'pinataOptions';
  static METADATA = 'pinataMetadata';
  static FILE = 'file';
  static CONTENT_TYPE_MEDIA = 'media';
  static CONTENT_TYPE_METADATA = 'metadata';
  static IPFS_HASH_KEY = 'IpfsHash';
  static IPFS_URL_PREFIX = 'ipfs://';
  static PROJECT = 'prj';
  static CORRELATION_ID = 'x-correlation-id';
  static DOWNLOAD_FOLDER = '/tmp';
}
