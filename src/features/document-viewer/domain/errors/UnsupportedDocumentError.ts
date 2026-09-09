export class UnsupportedDocumentError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = "UnsupportedDocumentError";
  }
}
