import { renderAsync } from "docx-preview";
import type { DocumentRenderer } from "../domain/DocumentRenderer";
import { DocumentRenderError } from "../domain/errors/DocumentRenderError";

export class DocxPreviewRenderer implements DocumentRenderer {
  private readonly timeoutMs: number;

  public constructor(timeoutMs = 15000) {
    this.timeoutMs = timeoutMs;
  }

  public async render(document: Uint8Array, container: HTMLElement): Promise<void> {
    const timeoutMs = this.timeoutMs;

    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    try {
      // docx-preview não suporta cancelamento real (AbortController não é respeitado).
      // O timeout interrompe o aguardo da aplicação, mas a operação subjacente pode continuar em background.
      const renderPromise = renderAsync(document, container, undefined, {
        inWrapper: false,
        ignoreWidth: false,
        ignoreHeight: false,
      });

      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(new DocumentRenderError(`Render timeout após ${timeoutMs}ms`));
        }, timeoutMs);
      });

      await Promise.race([renderPromise, timeoutPromise]);
    } catch (err: unknown) {
      if (err instanceof DocumentRenderError) {
        throw err;
      }
      const message = err instanceof Error ? err.message : String(err);
      throw new DocumentRenderError(`Failed to render document: ${message}`);
    } finally {
      if (timeoutId !== undefined) {
        clearTimeout(timeoutId);
      }
    }
  }
}
