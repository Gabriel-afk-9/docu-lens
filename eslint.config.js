// @ts-check
import eslint from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    files: ["src/**/*.ts"],
    rules: {
      "no-console": "error",
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      "@typescript-eslint/no-floating-promises": "error",
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "docx-preview",
              message: "Import docx-preview only in DocxPreviewRenderer.ts (infrastructure). Use DocumentRenderer abstraction.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/features/document-viewer/domain/**/*"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            { name: "vscode", message: "Domain must not depend on vscode API." },
            { name: "docx-preview", message: "Domain must not depend on docx-preview." },
          ],
        },
      ],
    },
  },
  {
    files: ["src/features/document-viewer/application/**/*"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            { name: "vscode", message: "Application must not depend on vscode API. Use infrastructure adapters." },
          ],
        },
      ],
    },
  },
  {
    files: ["src/features/document-viewer/presentation/webview/**/*"],
    rules: {
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-argument": "off",
      "@typescript-eslint/no-unnecessary-type-assertion": "off",
      "@typescript-eslint/no-redundant-type-constituents": "off",
    },
  },
  {
    files: ["src/features/document-viewer/infrastructure/DocxPreviewRenderer.ts"],
    rules: {
      "no-restricted-imports": "off",
    },
  },
  {
    files: ["src/features/document-viewer/presentation/DocxCustomEditorProvider.ts"],
    rules: {
      "@typescript-eslint/require-await": "off",
      "@typescript-eslint/no-unnecessary-type-assertion": "off",
    },
  },
  {
    ignores: ["dist/**", "node_modules/**", "esbuild.mjs"],
  }
);
