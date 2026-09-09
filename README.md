# DocuLens — Document Viewer for VS Code

> Visualize seus documentos DOCX sem sair do VS Code.

DocuLens é uma extensão VS Code que abre arquivos `.docx` diretamente em uma aba do editor, com renderização visual semelhante a um leitor de PDF. Duplo clique no arquivo → documento renderizado, sem Word, sem LibreOffice e sem sair do editor.

## Como funciona

```
Explorer → duplo clique em arquivo.docx
  → VS Code Custom Editor (doculens.docxViewer, priority: default)
  → DocxCustomEditorProvider (Extension Host)
  → vscode.workspace.fs.readFile → Uint8Array → base64
  → Webview (postMessage tipado, CSP com nonce)
  → DocumentRenderer → DocxPreviewRenderer → docx-preview (renderAsync)
  → HTML/CSS no container → documento exibido
```

- **Custom Editor:** `vscode.CustomReadonlyEditorProvider` registrado via `package.json:contributes.customEditors` (`viewType: doculens.docxViewer`, `selector: *.docx`, `priority: default`). Suporta `Reopen Editor With...` para abrir com outro editor.
- **Sem estado global:** cada `WebviewPanel` possui `DocumentState { uri, isLoading, error }` isolado em `Map<WebviewPanel, DocumentState>` e `hasSentDocument` por painel. Fechar a aba remove o estado (`onDidDispose`).
- **Mensagens tipadas:** `ExtensionToWebviewMessage | WebviewToExtensionMessage` em `src/features/document-viewer/domain/types/Messages.ts` (única fonte de tipos para `postMessage`).

## Instalação

### Via VSIX (recomendado)

```bash
pnpm build
pnpm package   # gera doculens-0.1.0.vsix
code --install-extension doculens-0.1.0.vsix
```

### Desenvolvimento

```bash
pnpm install
pnpm build        # produção
pnpm dev          # watch (esbuild)
pnpm lint         # eslint
pnpm format       # prettier
pnpm test         # vitest (jsdom)
pnpm package
```

**Extension Development Host:** pressione `F5` no VS Code (usa `.vscode/launch.json` → `preLaunchTask: build` → `pnpm build` via `tasks.json`). No host aberto, abra um `.docx` em `assets/fixtures/docx/` por duplo clique.

- Fixtures incluídos: `01-texto-simples.docx` (texto PT-BR, listas, tabela, 3 páginas) e `corrupted.docx` (binário inválido para testar erro).

## Funcionamento offline

Todo o processamento é local:

```
DOCX → processamento local → Webview → renderização
```

- Nenhum documento sai da máquina do usuário.
- `Content-Security-Policy: default-src 'none'; script-src 'nonce-...'; style-src 'unsafe-inline' (necessário para docx-preview); connect-src 'none'` — sem CDN, sem fetch externo.
- Assets via `webview.asWebviewUri()` ( `dist/webview.js` + `dist/webview.css` bundlados com esbuild).
- `docx-preview@0.4.0` isolado em `src/features/document-viewer/infrastructure/DocxPreviewRenderer.ts` atrás da abstração `DocumentRenderer` (Dependency Inversion, permite trocar motor futuramente).

## Privacidade

- **Local-first / Offline-first / Privacy-first.**
- Não há telemetria no MVP, não há upload para APIs/servidores/analytics.
- Logs técnicos vão apenas para `OutputChannel` `DocuLens` (`[DocuLens] Loading document`, `[DocuLens] ERROR: ...`) — nunca o conteúdo do documento ou dados sensíveis.

## Tratamento de erros

Erros diferenciados no domínio:

- `DocumentReadError` (falha `workspace.fs.readFile` — arquivo corrompido/protegido/incompleto/caminho inacessível) → mensagem no Webview: “Não foi possível ler este documento...” + bullets; detalhe técnico apenas no OutputChannel.
- `DocumentRenderError` (falha `docx-preview renderAsync`) → mensagem: “Não foi possível visualizar este documento...” sem stack trace.
- Webview `showError` exibe somente texto amigável (bullets + “Reopen Editor With...”); nunca stack trace.

Teste manual: duplo clique em `assets/fixtures/docx/corrupted.docx` deve mostrar mensagem amigável e logar `ERROR: Failed to send document` no `View → Output → DocuLens`.

## Temas

Interface usa tokens do VS Code (`styles.css:1`):

```css
--doculens-background: var(--vscode-editor-background);
--doculens-foreground: var(--vscode-editor-foreground);
--doculens-border: var(--vscode-panel-border);
--doculens-toolbar: var(--vscode-titleBar-activeBackground, var(--vscode-sideBar-background));
```

- Validado em **Light**, **Dark** e **High Contrast** (`forced-colors: active` → borda `CanvasText`, `forced-color-adjust: auto`).
- Documento renderizado simula papel (`#container .docx { background:white; color:black }`) — decisão visual deliberada, legível em todos os temas; não é hardcode indevido.

## Limitações atuais (MVP Fase 2)

- Apenas `.docx`; não suporta `.doc`, `.docm`, `.odt`, `.xlsx`, `.pptx`.
- Somente leitura (sem edição/salvamento).
- Sem zoom, busca, reload automático, outline, cache, performance para docs muito grandes (Fases 3-5 previstas).
- `maxFileSize`/`renderTimeout` não configuráveis no MVP — docs muito grandes falham de forma controlada com mensagem amigável.

## Stack

TypeScript (strict), VS Code Extension API (`CustomReadonlyEditorProvider`, `Webview`, `workspace.fs`), `docx-preview`, esbuild, pnpm, ESLint, Prettier, Vitest.

## Licença

MIT — ver `LICENSE` e `THIRD_PARTY_NOTICES.md`.
