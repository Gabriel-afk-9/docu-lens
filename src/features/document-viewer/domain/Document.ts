export interface Document {
  readonly uri: string;
  readonly data: Uint8Array;
  readonly size: number;
}
