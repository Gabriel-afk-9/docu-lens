import { beforeEach, describe, expect, it, vi } from "vitest";
import { DocumentRenderError } from "../../src/features/document-viewer/domain/errors/DocumentRenderError";

const mockRenderAsync = vi.fn<() => Promise<void>>();

vi.mock("docx-preview", () => ({
  renderAsync: (...args: unknown[]) => mockRenderAsync(...args),
}));

import { DocxPreviewRenderer } from "../../src/features/document-viewer/infrastructure/DocxPreviewRenderer";

describe("DocxPreviewRenderer", () => {
  beforeEach(() => {
    mockRenderAsync.mockReset();
  });

  it("should call renderAsync with document and container", async () => {
    mockRenderAsync.mockResolvedValue(undefined);
    const renderer = new DocxPreviewRenderer();
    const data = new Uint8Array([10, 20, 30]);
    const container = document.createElement("div");

    await renderer.render(data, container);

    expect(mockRenderAsync).toHaveBeenCalledTimes(1);
    expect(mockRenderAsync).toHaveBeenCalledWith(
      data,
      container,
      undefined,
      expect.objectContaining({
        inWrapper: false,
        ignoreWidth: false,
        ignoreHeight: false,
      }),
    );
  });

  it("should throw DocumentRenderError when renderAsync fails", async () => {
    mockRenderAsync.mockRejectedValue(new Error("invalid docx"));
    const renderer = new DocxPreviewRenderer();
    const container = document.createElement("div");

    await expect(renderer.render(new Uint8Array([1]), container)).rejects.toBeInstanceOf(
      DocumentRenderError,
    );
    await expect(renderer.render(new Uint8Array([1]), container)).rejects.toThrow(
      "Failed to render document",
    );
  });

  it("should throw DocumentRenderError for non-Error throw", async () => {
    mockRenderAsync.mockRejectedValue("string error");
    const renderer = new DocxPreviewRenderer();
    const container = document.createElement("div");

    await expect(renderer.render(new Uint8Array([1]), container)).rejects.toBeInstanceOf(
      DocumentRenderError,
    );
  });
});
