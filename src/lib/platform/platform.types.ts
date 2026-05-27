export interface Platform {
  appDataDir(): Promise<string>;
  resourceDir(): Promise<string>;
  readTextFile(path: string): Promise<string>;
  readDir(path: string): Promise<string[]>;

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
