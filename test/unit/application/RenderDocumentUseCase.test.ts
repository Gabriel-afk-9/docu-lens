import { describe, it, expect, vi, beforeEach } from "vitest";
import * as vscode from "vscode";
import { RenderDocumentUseCase } from "../../../src/features/document-viewer/application/RenderDocumentUseCase";
import { DocumentReadError } from "../../../src/features/document-viewer/domain/errors/DocumentReadError";
import { DocumentTooLargeError } from "../../../src/features/document-viewer/domain/errors/DocumentTooLargeError";
import type { FileReader } from "../../../src/features/document-viewer/infrastructure/DocxFileReader";

function createMockLogger() {
  return {
    info: vi.fn<[string], void>(),
    warn: vi.fn<[string], void>(),
    error: vi.fn<[string], void>(),
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
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(vscode.workspace.getConfiguration).mockReturnValue({
      get: vi.fn<[string, unknown], unknown>().mockImplementation((_key: string, def: unknown) => def),
    } as unknown as vscode.WorkspaceConfiguration);
    vi.mocked(vscode.workspace.fs.stat).mockResolvedValue({ size: 1024, type: 1, ctime: 0, mtime: 0 } as unknown as vscode.FileStat);
  });

  it("should load document via FileReader and log", async () => {
    const fakeData = new Uint8Array([1, 2, 3, 4]);
    const fileReader = {
      read: vi.fn<Parameters<FileReader["read"]>, ReturnType<FileReader["read"]>>().mockResolvedValue(fakeData),
    };
    const logger = createMockLogger();
    const useCase = new RenderDocumentUseCase(
      fileReader as unknown as FileReader,
      logger as unknown as import("../../../src/features/document-viewer/infrastructure/Logger").Logger,
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
      read: vi.fn<Parameters<FileReader["read"]>, ReturnType<FileReader["read"]>>().mockRejectedValue(readError),
    };
    const logger = createMockLogger();
    const useCase = new RenderDocumentUseCase(
      fileReader as unknown as FileReader,
      logger as unknown as import("../../../src/features/document-viewer/infrastructure/Logger").Logger,
    );

    await expect(
      useCase.execute(createUri() as unknown as import("vscode").Uri),
    ).rejects.toBe(readError);
    expect(logger.info).toHaveBeenCalledTimes(2);
  });

  it("should propagate generic read error as rejection", async () => {
    const err = new Error("ENOENT");
    const fileReader = {
      read: vi.fn<Parameters<FileReader["read"]>, ReturnType<FileReader["read"]>>().mockRejectedValue(err),
    };
    const logger = createMockLogger();
    const useCase = new RenderDocumentUseCase(
      fileReader as unknown as FileReader,
      logger as unknown as import("../../../src/features/document-viewer/infrastructure/Logger").Logger,
    );

    await expect(
      useCase.execute(createUri() as unknown as import("vscode").Uri),
    ).rejects.toBe(err);
  });

  it("should throw DocumentTooLargeError before read when size exceeds limit", async () => {
    vi.mocked(vscode.workspace.fs.stat).mockResolvedValueOnce({ size: 20971521, type: 1, ctime: 0, mtime: 0 } as unknown as vscode.FileStat);
    vi.mocked(vscode.workspace.getConfiguration).mockReturnValueOnce({
      get: vi.fn<[string, unknown], unknown>().mockImplementation((key: string, def: unknown) => {
        if (key === "maxFileSize") return 20971520;
        return def;
      }),
    } as unknown as vscode.WorkspaceConfiguration);

    const fileReader = {
      read: vi.fn<Parameters<FileReader["read"]>, ReturnType<FileReader["read"]>>().mockResolvedValue(new Uint8Array([1])),
    };
    const logger = createMockLogger();
    const useCase = new RenderDocumentUseCase(
      fileReader as unknown as FileReader,
      logger as unknown as import("../../../src/features/document-viewer/infrastructure/Logger").Logger,
    );

    await expect(useCase.execute(createUri() as unknown as import("vscode").Uri)).rejects.toBeInstanceOf(
      DocumentTooLargeError,
    );
    expect(fileReader.read).not.toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalledWith(expect.stringContaining("too large"));
  });

  it("should allow file below limit", async () => {
    vi.mocked(vscode.workspace.fs.stat).mockResolvedValueOnce({ size: 1024, type: 1, ctime: 0, mtime: 0 } as unknown as vscode.FileStat);
    const fileReader = {
      read: vi.fn<Parameters<FileReader["read"]>, ReturnType<FileReader["read"]>>().mockResolvedValue(new Uint8Array([1, 2])),
    };
    const logger = createMockLogger();
    const useCase = new RenderDocumentUseCase(
      fileReader as unknown as FileReader,
      logger as unknown as import("../../../src/features/document-viewer/infrastructure/Logger").Logger,
    );

    const result = await useCase.execute(createUri() as unknown as import("vscode").Uri);
    expect(result.length).toBe(2);
    expect(fileReader.read).toHaveBeenCalledTimes(1);
  });

  it("should proceed to read if stat fails", async () => {
    vi.mocked(vscode.workspace.fs.stat).mockRejectedValueOnce(new Error("stat failed"));
    const fileReader = {
      read: vi.fn<Parameters<FileReader["read"]>, ReturnType<FileReader["read"]>>().mockResolvedValue(new Uint8Array([9])),
    };
    const logger = createMockLogger();
    const useCase = new RenderDocumentUseCase(
      fileReader as unknown as FileReader,
      logger as unknown as import("../../../src/features/document-viewer/infrastructure/Logger").Logger,
    );

    const result = await useCase.execute(createUri() as unknown as import("vscode").Uri);
    expect(result.length).toBe(1);
    expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining("stat failed"));
  });
});
