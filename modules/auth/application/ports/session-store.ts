export interface SessionStore {
  getUserId(): Promise<string | null>;
  start(userId: string): Promise<void>;
  end(): Promise<void>;
}
