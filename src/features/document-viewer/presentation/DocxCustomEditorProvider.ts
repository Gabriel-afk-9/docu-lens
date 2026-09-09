import * as vscode from "vscode";
import { getNonce } from "../../../shared/utils/nonce";
import { RenderDocumentUseCase } from "../application/RenderDocumentUseCase";
import { Logger } from "../infrastructure/Logger";
import { DocumentReadError } from "../domain/errors/DocumentReadError";
import { DocumentTooLargeError } from "../domain/errors/DocumentTooLargeError";
import type { DocumentState } from "../domain/DocumentState";
import type { ExtensionToWebviewMessage } from "../domain/types/Messages";

export class DocxCustomEditorProvider implements vscode.CustomReadonlyEditorProvider {
  public static readonly viewType = "doculens.docxViewer";

  private readonly context: vscode.ExtensionContext;
  private readonly renderUseCase: RenderDocumentUseCase;
  private readonly logger: Logger;
  private readonly documentStates = new Map<vscode.WebviewPanel, DocumentState>();

  public constructor(
    context: vscode.ExtensionContext,
    renderUseCase: RenderDocumentUseCase,
    logger: Logger,
  ) {
    this.context = context;
    this.renderUseCase = renderUseCase;
    this.logger = logger;
  }

  public async openCustomDocument(
    uri: vscode.Uri,
    _openContext: vscode.CustomDocumentOpenContext,
    _token: vscode.CancellationToken,
  ): Promise<vscode.CustomDocument> {
    this.logger.info(`openCustomDocument: ${uri.fsPath}`);
    return {
      uri,
      dispose: (): void => {
        // No resources to dispose for readonly document
      },
    };
  }

  public async resolveCustomEditor(
    document: vscode.CustomDocument,
    webviewPanel: vscode.WebviewPanel,
    _token: vscode.CancellationToken,
  ): Promise<void> {
    this.logger.info(`resolveCustomEditor: ${document.uri.fsPath}`);

    const webview = webviewPanel.webview;
    webview.options = {
      enableScripts: true,
      localResourceRoots: [this.context.extensionUri],
    };

    const nonce = getNonce();
    webview.html = this.getWebviewContent(webview, nonce);

    this.documentStates.set(webviewPanel, {
      uri: document.uri.toString(),
      isLoading: true,
    });

    let hasSentDocument = false;

    const disposable = webview.onDidReceiveMessage((message: unknown) => {
      if (
        message !== null &&
        typeof message === "object" &&
        "type" in message &&
        typeof (message as { type: unknown }).type === "string"
      ) {
        const typed = message as { type: string; message?: string };
        if (typed.type === "ready") {
          if (hasSentDocument) {
            this.logger.info("Webview ready (duplicate, ignoring)");
            return;
          }
          hasSentDocument = true;
          this.logger.info("Webview ready, sending document");
          void this.sendDocument(document.uri, webview, webviewPanel);
        } else if (typed.type === "error") {
          this.logger.warn(`Webview error: ${typed.message ?? "unknown"}`);
          const current = this.documentStates.get(webviewPanel);
          if (current) {
            this.documentStates.set(webviewPanel, {
              ...current,
              isLoading: false,
              error: typed.message ?? "Unknown render error",
            });
          }
        }
      }
    });

    webviewPanel.onDidDispose(() => {
      disposable.dispose();
      this.documentStates.delete(webviewPanel);
      this.logger.info(`Disposed editor for: ${document.uri.fsPath}`);
    });
  }

  private async sendDocument(
    uri: vscode.Uri,
    webview: vscode.Webview,
    webviewPanel: vscode.WebviewPanel,
  ): Promise<void> {
    const totalStart = performance.now();
    try {
      const data = await this.renderUseCase.execute(uri);
      // A/B teste: webview.postMessage exige JSON-serializável; Uint8Array via JSON.stringify vira {"0":1,...} (perde tipo).
      // Teste Node: JSON.stringify(new Uint8Array([1,2,3])) → '{"0":1,"1":2,"2":3}' (false para instanceof).
      // Portanto base64 permanece necessário; Uint8Array direto não é suportado pelo protocolo atual.
      const convertStart = performance.now();
      const base64 = Buffer.from(data).toString("base64");
      const convertMs = Math.round(performance.now() - convertStart);
      this.logger.info(`[perf] convert=${convertMs}ms bytes=${data.length} base64=${base64.length}`);
      const postStart = performance.now();
      const message: ExtensionToWebviewMessage = {
        type: "render",
        data: base64,
      };
      await webview.postMessage(message);
      const postMs = Math.round(performance.now() - postStart);
      const totalMs = Math.round(performance.now() - totalStart);
      this.logger.info(`[perf] postMessage=${postMs}ms`);
      this.logger.info(`[perf] total=${totalMs}ms`);
      this.logger.info(`Document sent to webview: ${data.length} bytes`);
      const current = this.documentStates.get(webviewPanel);
      if (current) {
        this.documentStates.set(webviewPanel, {
          ...current,
          isLoading: false,
          error: undefined,
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      const stack = err instanceof Error ? (err.stack ?? msg) : msg;
      this.logger.error(`Failed to send document: ${msg}`);
      this.logger.error(stack);

      const isTooLarge = err instanceof DocumentTooLargeError;
      const isReadError = err instanceof DocumentReadError;
      void isReadError;
      // Para arquivo muito grande, exibe mensagem específica com tamanho; caso contrário usa HTML estático
      const friendlyForWebview = isTooLarge ? msg : "";

      const current = this.documentStates.get(webviewPanel);
      if (current) {
        this.documentStates.set(webviewPanel, {
          ...current,
          isLoading: false,
          error: msg,
        });
      }

      const errorMessage: ExtensionToWebviewMessage = {
        type: "error",
        message: friendlyForWebview,
      };
      await webview.postMessage(errorMessage);
    }
  }

  private getWebviewContent(webview: vscode.Webview, nonce: string): string {
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.context.extensionUri, "dist", "webview.js"),
    );
    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.context.extensionUri, "dist", "webview.css"),
    );
    const renderTimeout = vscode.workspace.getConfiguration("doculens").get<number>("renderTimeout", 15000);

    const csp = [
      "default-src 'none'",
      `img-src ${webview.cspSource} data: blob:`,
      `style-src ${webview.cspSource} 'unsafe-inline'`,
      `script-src 'nonce-${nonce}'`,
      `font-src ${webview.cspSource}`,
      "connect-src 'none'",
    ].join("; ");

    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="Content-Security-Policy" content="${csp}" />
  <link rel="stylesheet" href="${styleUri.toString()}" nonce="${nonce}" />
  <title>DocuLens</title>
</head>
<body>
  <div id="toolbar">
    <span id="toolbar-title">DocuLens — Visualizador DOCX</span>
  </div>
  <div id="loading">Carregando documento...</div>
  <div id="error">
    <h2>Não foi possível visualizar este documento</h2>
    <p id="error-message"></p>
    <ul>
      <li>corrompido</li>
      <li>protegido</li>
      <li>incompleto</li>
      <li>utilizando recursos não suportados</li>
    </ul>
    <p>Tente abrir o documento novamente ou utilize "Reopen Editor With..." para escolher outro editor.</p>
  </div>
  <div id="container" style="display:none"></div>
  <script nonce="${nonce}">window.__doculensRenderTimeout=${renderTimeout};</script>
  <script nonce="${nonce}" src="${scriptUri.toString()}"></script>
</body>
</html>`;
  }
}
