import { describe, it, expect, vi } from "vitest";
import { RenderDocumentUseCase } from "../../src/features/document-viewer/application/RenderDocumentUseCase";
import { DocumentReadError } from "../../src/features/document-viewer/domain/errors/DocumentReadError";

// Mock Logger (infrastructure) with same interface
function createMockLogger() {
  return {
    info: vi.fn<(message: string) => void>(),
    warn: vi.fn<(message: string) => void>(),
    error: vi.fn<(message: string) => void>(),
  };
}

type FakeUri = { fsPath: string; toString: () => string };

function createUri(): FakeUri {
  return {
    fsPath: "/tmp/test.docx",
    toString: () => "/tmp/test.docx",
  };
}

describe("RenderDocumentUseCase", () => {
  it("should load document via FileReader and log", async () => {
    const fakeData = new Uint8Array([1, 2, 3, 4]);
    const fileReader = {
      read: vi.fn<() => Promise<Uint8Array>>().mockResolvedValue(fakeData),
    };
    const logger = createMockLogger();
    const useCase = new RenderDocumentUseCase(
      fileReader as unknown as import("../../src/features/document-viewer/infrastructure/DocxFileReader").FileReader,
      logger as unknown as import("../../src/features/document-viewer/infrastructure/Logger").Logger,
    );

    const uri = createUri() as unknown as import("vscode").Uri;
    const result = await useCase.execute(uri);

    expect(result).toBe(fakeData);
    expect(fileReader.read).toHaveBeenCalledTimes(1);
    expect(fileReader.read).toHaveBeenCalledWith(uri);
    expect(logger.info).toHaveBeenCalledWith(expect.stringContaining("Loading document"));
    expect(logger.info).toHaveBeenCalledWith(expect.stringContaining("Document loaded: 4 bytes"));
  });

  it("should propagate DocumentReadError from FileReader", async () => {
    const readError = new DocumentReadError("Failed to read document: file not found");
    const fileReader = {
      read: vi.fn<() => Promise<Uint8Array>>().mockRejectedValue(readError),
    };
    const logger = createMockLogger();
    const useCase = new RenderDocumentUseCase(
      fileReader as unknown as import("../../src/features/document-viewer/infrastructure/DocxFileReader").FileReader,
      logger as unknown as import("../../src/features/document-viewer/infrastructure/Logger").Logger,
    );

    await expect(
      useCase.execute(createUri() as unknown as import("vscode").Uri),
    ).rejects.toBe(readError);
    expect(logger.info).toHaveBeenCalledTimes(1);
  });

  it("should propagate generic read error as rejection", async () => {
    const err = new Error("ENOENT");
    const fileReader = {
      read: vi.fn<() => Promise<Uint8Array>>().mockRejectedValue(err),
    };
    const logger = createMockLogger();
    const useCase = new RenderDocumentUseCase(
      fileReader as unknown as import("../../src/features/document-viewer/infrastructure/DocxFileReader").FileReader,
      logger as unknown as import("../../src/features/document-viewer/infrastructure/Logger").Logger,
    );

    await expect(
      useCase.execute(createUri() as unknown as import("vscode").Uri),
    ).rejects.toBe(err);
  });
});
