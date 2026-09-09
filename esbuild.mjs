import * as esbuild from "esbuild";
import { copyFile, mkdir } from "node:fs/promises";
import { dirname } from "node:path";

const isProduction = process.argv.includes("--production");
const isWatch = process.argv.includes("--watch");

async function copyCss() {
  await mkdir("dist", { recursive: true });
  await copyFile(
    "src/features/document-viewer/presentation/webview/styles.css",
    "dist/webview.css",
  );
  console.log("[esbuild] Copied styles.css -> dist/webview.css");
}

const extensionConfig = {
  entryPoints: ["src/extension/activate.ts"],
  bundle: true,
  outfile: "dist/extension.js",
  platform: "node",
  target: "node20",
  format: "cjs",
  external: ["vscode"],
  sourcemap: true,
  minify: isProduction,
  logLevel: "info",
};

const webviewConfig = {
  entryPoints: ["src/features/document-viewer/presentation/webview/index.ts"],
  bundle: true,
  outfile: "dist/webview.js",
  platform: "browser",
  target: "es2022",
  format: "iife",
  sourcemap: true,
  minify: isProduction,
  logLevel: "info",
};

async function build() {
  if (isWatch) {
    const extCtx = await esbuild.context(extensionConfig);
    const webCtx = await esbuild.context(webviewConfig);
    await Promise.all([extCtx.watch(), webCtx.watch()]);
    await copyCss();
    console.log("[esbuild] Watching...");
  } else {
    await esbuild.build(extensionConfig);
    await esbuild.build(webviewConfig);
    await copyCss();
    console.log("[esbuild] Build complete");
  }
}

build().catch((e) => {
  console.error(e);
  process.exit(1);
});
