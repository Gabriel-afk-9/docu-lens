export type ExtensionToWebviewMessage =
  | {
      type: "render";
      data: string;
    }
  | {
      type: "error";
      message: string;
    };

export type WebviewToExtensionMessage =
  | {
      type: "ready";
    }
  | {
      type: "error";
      message: string;
    };
