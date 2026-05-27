export interface RawSceneInfo {
  id: string;
  baseDir: string;
  manifestJson: string;
}

export interface Platform {
  appDataDir(): Promise<string>;
  resourceDir(): Promise<string>;
  readTextFile(path: string): Promise<string>;
  readDir(path: string): Promise<string[]>;
  loadScenes(): Promise<RawSceneInfo[]>;

  writeSettingsAtomic(json: string): Promise<void>;
  appendHistoryLine(line: string): Promise<void>;
  readHistoryFile(): Promise<string>;

  toAssetUrl(absolutePath: string): string;

  setWindowSize(width: number, height: number): Promise<void>;
  setAlwaysOnTop(on: boolean): Promise<void>;
  requestUserAttentionCritical(): Promise<void>;

  sendNotification(title: string, body: string): Promise<void>;
  notificationsPermitted(): Promise<boolean>;
  requestNotificationPermission(): Promise<boolean>;
}
