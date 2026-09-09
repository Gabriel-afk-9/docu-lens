import { vi } from "vitest";

export const workspace = {
  fs: {
    stat: vi.fn().mockResolvedValue({ size: 1024, type: 1, ctime: 0, mtime: 0 }),
    readFile: vi.fn().mockResolvedValue(new Uint8Array([1, 2])),
  },
  getConfiguration: vi.fn().mockReturnValue({
    get: vi.fn((_key: string, defaultValue: unknown) => defaultValue),
  }),
};

export const Uri = {
  file: (p: string) => ({ fsPath: p, toString: () => p }),
  joinPath: vi.fn((base: { fsPath: string } | string, ...parts: string[]) => ({
    fsPath: `${typeof base === "string" ? base : base.fsPath}/${parts.join("/")}`,
  })),
};

export const window = {
  createOutputChannel: vi.fn(() => ({
    appendLine: vi.fn(),
  })),
};
