import { DocumentReadError } from "./DocumentReadError";

export class DocumentTooLargeError extends DocumentReadError {
  public readonly size: number;
  public readonly limit: number;

  public constructor(size: number, limit: number) {
    const sizeMb = (size / 1024 / 1024).toFixed(1);
    const limitMb = (limit / 1024 / 1024).toFixed(1);
    super(`Documento muito grande (${sizeMb} MB). O limite atual é ${limitMb} MB.`);
    this.name = "DocumentTooLargeError";
    this.size = size;
    this.limit = limit;
  }
}
