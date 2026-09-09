export interface DocumentRenderer {
  render(document: Uint8Array, container: HTMLElement): Promise<void>;
}
