import * as vscode from "vscode";
import { DocumentReadError } from "../domain/errors/DocumentReadError";

export interface FileReader {
  read(uri: vscode.Uri): Promise<Uint8Array>;
}

export class DocxFileReader implements FileReader {
  public async read(uri: vscode.Uri): Promise<Uint8Array> {
    try {
      const data = await vscode.workspace.fs.readFile(uri);
      return data;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      throw new DocumentReadError(`Failed to read document: ${message}`);
    }
  }
}
