import { beforeEach, describe, expect, it, vi } from "vitest";
import { DocumentRenderError } from "../../../src/features/document-viewer/domain/errors/DocumentRenderError";
import { DocxPreviewRenderer } from "../../../src/features/document-viewer/infrastructure/DocxPreviewRenderer";

const mockRenderAsync = vi.fn();

vi.mock("docx-preview", () => ({
  renderAsync: (...args: unknown[]) => (mockRenderAsync as (...a: unknown[]) => unknown)(...args),
}));

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

    await expect(renderer.render(new Uint8Array([1]), container)).rejects.toBeInstanceOf(DocumentRenderError);
  });

  it("should throw DocumentRenderError for non-Error throw", async () => {
    mockRenderAsync.mockRejectedValue("string error");
    const renderer = new DocxPreviewRenderer();
    const container = document.createElement("div");

    await expect(renderer.render(new Uint8Array([1]), container)).rejects.toBeInstanceOf(DocumentRenderError);
  });

  it("should succeed within timeout", async () => {
    mockRenderAsync.mockImplementation(() => new Promise<void>((resolve) => setTimeout(resolve, 10)));
    const renderer = new DocxPreviewRenderer(100);
    const container = document.createElement("div");

    await expect(renderer.render(new Uint8Array([1]), container)).resolves.toBeUndefined();
  });

  it("should timeout when render exceeds limit", async () => {
    mockRenderAsync.mockImplementation(() => new Promise<void>(() => {}));
    const renderer = new DocxPreviewRenderer(50);
    const container = document.createElement("div");

    await expect(renderer.render(new Uint8Array([1]), container)).rejects.toThrow("Render timeout");
  }, 10000);

  it("should not remain loading after timeout error", async () => {
    mockRenderAsync.mockImplementation(() => new Promise<void>((_, reject) => setTimeout(() => reject(new Error("late")), 200)));
    const renderer = new DocxPreviewRenderer(30);
    const container = document.createElement("div");

    await expect(renderer.render(new Uint8Array([1]), container)).rejects.toBeInstanceOf(DocumentRenderError);
  });
});
