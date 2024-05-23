export class FileDTO {
  private _filePath: string;
  private _mimeType: string;
  private _size: number;
  private _isSaved: boolean;

  constructor(
    filePath: string,
    mimeType: string,
    size: number,
    isSaved: boolean,
  ) {
    this._filePath = filePath;
    this._mimeType = mimeType;
    this._size = size;
    this._isSaved = isSaved;
  }

  get filePath(): string {
    return this._filePath;
  }

  set filePath(value: string) {
    this._filePath = value;
  }

  get mimeType(): string {
    return this._mimeType;
  }

  set mimeType(value: string) {
    this._mimeType = value;
  }

  get size(): number {
    return this._size;
  }

  set size(value: number) {
    this._size = value;
  }

  get isSaved(): boolean {
    return this._isSaved;
  }

  set isSaved(value: boolean) {
    this._isSaved = value;
  }
}
