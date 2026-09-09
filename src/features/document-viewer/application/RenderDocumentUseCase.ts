/* eslint-disable no-restricted-imports -- Fase 1: UseCase needs vscode.Uri type; runtime vscode API stays in infrastructure */
import * as vscode from "vscode";
import type { FileReader } from "../infrastructure/DocxFileReader";
import { Logger } from "../infrastructure/Logger";

export class RenderDocumentUseCase {
  private readonly fileReader: FileReader;
  private readonly logger: Logger;

  public constructor(fileReader: FileReader, logger: Logger) {
    this.fileReader = fileReader;
    this.logger = logger;
  }

  public async execute(uri: vscode.Uri): Promise<Uint8Array> {
    this.logger.info(`Loading document: ${uri.fsPath}`);
    const data = await this.fileReader.read(uri);
    this.logger.info(`Document loaded: ${data.length} bytes`);
    return data;
  }
}
