import { renderAsync } from "docx-preview";
import type { DocumentRenderer } from "../domain/DocumentRenderer";
import { DocumentRenderError } from "../domain/errors/DocumentRenderError";

export class DocxPreviewRenderer implements DocumentRenderer {
  public async render(document: Uint8Array, container: HTMLElement): Promise<void> {
    try {
      // docx-preview expects a Blob or ArrayBuffer; pass Uint8Array directly
      await renderAsync(document, container, undefined, {
        inWrapper: false,
        ignoreWidth: false,
        ignoreHeight: false,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      throw new DocumentRenderError(`Failed to render document: ${message}`);
    }
  }
}
