/* eslint-disable no-restricted-imports -- Fase 1: UseCase needs vscode.Uri type; runtime vscode API stays in infrastructure */
import * as vscode from "vscode";
import type { FileReader } from "../infrastructure/DocxFileReader";
import { Logger } from "../infrastructure/Logger";
import { DocumentTooLargeError } from "../domain/errors/DocumentTooLargeError";

export class RenderDocumentUseCase {
  private readonly fileReader: FileReader;
  private readonly logger: Logger;

  public constructor(fileReader: FileReader, logger: Logger) {
    this.fileReader = fileReader;
    this.logger = logger;
  }

  public async execute(uri: vscode.Uri): Promise<Uint8Array> {
    const totalStart = performance.now();
    this.logger.info(`Loading document: ${uri.fsPath}`);

    const maxFileSize = vscode.workspace.getConfiguration("doculens").get<number>("maxFileSize", 20971520);
    try {
      const statStart = performance.now();
      const stat = await vscode.workspace.fs.stat(uri);
      const statMs = Math.round(performance.now() - statStart);
      if (stat.size > maxFileSize) {
        const err = new DocumentTooLargeError(stat.size, maxFileSize);
        this.logger.error(`[perf] stat=${statMs}ms size=${stat.size} limit=${maxFileSize} — too large`);
        this.logger.error(err.message);
        throw err;
      }
      this.logger.info(`[perf] stat=${statMs}ms size=${stat.size} bytes maxFileSize=${maxFileSize}`);
    } catch (err: unknown) {
      if (err instanceof DocumentTooLargeError) {
        throw err;
      }
      // Se stat falhar (arquivo remoto, permissão), segue para read e deixa FileReader tratar
      this.logger.warn(`stat failed, proceeding to read: ${err instanceof Error ? err.message : String(err)}`);
    }

    const readStart = performance.now();
    const data = await this.fileReader.read(uri);
    const readMs = Math.round(performance.now() - readStart);
    const totalMs = Math.round(performance.now() - totalStart);
    this.logger.info(`[perf] read=${readMs}ms bytes=${data.length}`);
    this.logger.info(`[perf] loadTotal=${totalMs}ms`);
    this.logger.info(`Document loaded: ${data.length} bytes`);
    return data;
  }
}
