import { DocxPreviewRenderer } from "../../infrastructure/DocxPreviewRenderer";
import type {
  ExtensionToWebviewMessage,
  WebviewToExtensionMessage,
} from "../../domain/types/Messages";

declare function acquireVsCodeApi(): {
  postMessage(message: WebviewToExtensionMessage): void;
  getState(): unknown;
  setState(state: unknown): void;
};

const vscodeApi = acquireVsCodeApi();
const renderer = new DocxPreviewRenderer();

const container = document.getElementById("container") as HTMLElement | null;
const loading = document.getElementById("loading") as HTMLElement | null;
const errorEl = document.getElementById("error") as HTMLElement | null;
const errorMessage = document.getElementById("error-message") as HTMLElement | null;

function showLoading(): void {
  if (loading) {
    loading.style.display = "flex";
  }
  if (errorEl) {
    errorEl.classList.remove("visible");
  }
  if (container) {
    container.style.display = "none";
    container.innerHTML = "";
  }
}

function showContainer(): void {
  if (loading) {
    loading.style.display = "none";
  }
  if (errorEl) {
    errorEl.classList.remove("visible");
  }
  if (container) {
    container.style.display = "flex";
  }
}

function showError(message?: string): void {
  if (loading) {
    loading.style.display = "none";
  }
  if (container) {
    container.style.display = "none";
  }
  if (errorEl) {
    errorEl.classList.add("visible");
  }
  if (errorMessage) {
    if (message !== undefined && message !== "" && !message.includes("Não foi possível")) {
      errorMessage.textContent = message;
    } else {
      errorMessage.textContent = "";
    }
  }
  if (message !== undefined) {
    vscodeApi.postMessage({ type: "error", message });
  }
}

function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function handleRender(dataBase64: string): Promise<void> {
  if (!container) {
    showError("Container not found");
    return;
  }

  showLoading();

  try {
    const data = base64ToUint8Array(dataBase64);
    container.innerHTML = "";
    await renderer.render(data, container);
    showContainer();
  } catch (err: unknown) {
    const technical = err instanceof Error ? err.message : String(err);
    showError();
    vscodeApi.postMessage({ type: "error", message: technical });
  }
}

window.addEventListener("message", (event: MessageEvent<ExtensionToWebviewMessage>) => {
  const message = event.data;
  if (!message || typeof message.type !== "string") {
    return;
  }

  switch (message.type) {
    case "render": {
      void handleRender(message.data);
      break;
    }
    case "error": {
      showError(message.message);
      break;
    }
    default: {
      break;
    }
  }
});

// Notify extension that webview is ready to receive data
vscodeApi.postMessage({ type: "ready" });
