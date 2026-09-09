import * as vscode from "vscode";

export class Logger {
  private readonly output: vscode.OutputChannel;

  public constructor(output: vscode.OutputChannel) {
    this.output = output;
  }

  public info(message: string): void {
    this.output.appendLine(`[DocuLens] ${message}`);
  }

  public warn(message: string): void {
    this.output.appendLine(`[DocuLens] WARN: ${message}`);
  }

  public error(message: string): void {
    this.output.appendLine(`[DocuLens] ERROR: ${message}`);
  }
}
