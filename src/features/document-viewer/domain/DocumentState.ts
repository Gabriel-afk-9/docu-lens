export interface DocumentState {
  readonly uri: string;
  readonly isLoading: boolean;
  readonly error?: string;
}
