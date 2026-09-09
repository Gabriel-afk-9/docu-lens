export class DocumentRenderError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = "DocumentRenderError";
  }
}
