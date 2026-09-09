import * as vscode from "vscode";
import { DocxCustomEditorProvider } from "../features/document-viewer/presentation/DocxCustomEditorProvider";
import { DocxFileReader } from "../features/document-viewer/infrastructure/DocxFileReader";
import { Logger } from "../features/document-viewer/infrastructure/Logger";
import { RenderDocumentUseCase } from "../features/document-viewer/application/RenderDocumentUseCase";

export function activate(context: vscode.ExtensionContext): void {
  const outputChannel = vscode.window.createOutputChannel("DocuLens");
  const logger = new Logger(outputChannel);
  logger.info("Activating DocuLens extension");

  const fileReader = new DocxFileReader();
  const renderUseCase = new RenderDocumentUseCase(fileReader, logger);
  const provider = new DocxCustomEditorProvider(context, renderUseCase, logger);

  const registration = vscode.window.registerCustomEditorProvider(
    DocxCustomEditorProvider.viewType,
    provider,
    {
      webviewOptions: {
        retainContextWhenHidden: true,
      },
      supportsMultipleEditorsPerDocument: true,
    },
  );

  context.subscriptions.push(outputChannel, registration);
  logger.info("DocuLens extension activated");
}

export function deactivate(): void {
  // no-op
}
