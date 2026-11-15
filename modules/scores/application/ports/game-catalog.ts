export interface GameCatalog {
  exists(gameId: string): Promise<boolean>;
}
