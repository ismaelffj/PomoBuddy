import { invoke, convertFileSrc } from "@tauri-apps/api/core";
import { appDataDir, resourceDir } from "@tauri-apps/api/path";
import { getCurrentWindow, LogicalSize, UserAttentionType } from "@tauri-apps/api/window";
import { readDir, readTextFile } from "@tauri-apps/plugin-fs";
import {
  isPermissionGranted,
  requestPermission,
  sendNotification,
} from "@tauri-apps/plugin-notification";
import type { Platform } from "./platform.types";

export const tauriPlatform: Platform = {
  async appDataDir() {
    return appDataDir();
  },
  async resourceDir() {
    return resourceDir();
  },
  async readTextFile(path) {
    return readTextFile(path);
  },
  async readDir(path) {
    const entries = await readDir(path);
    return entries.filter((e) => e.isDirectory).map((e) => e.name ?? "");
  },
  async getSceneRoots() {
    return invoke<string[]>("get_scene_roots");
  },
  async writeSettingsAtomic(json) {
    await invoke("write_settings_atomic", { json });
  },
  async appendHistoryLine(line) {
    await invoke("append_history_line", { line });
  },
  async readHistoryFile() {
    return invoke<string>("read_history_file");
  },
  toAssetUrl(absolutePath) {
    return convertFileSrc(absolutePath);
  },
  async setWindowSize(width, height) {
    const w = getCurrentWindow();
    await w.setSize(new LogicalSize(width, height));
  },
  async setAlwaysOnTop(on) {
    const w = getCurrentWindow();
    await w.setAlwaysOnTop(on);
  },
  async requestUserAttentionCritical() {
    const w = getCurrentWindow();
    await w.requestUserAttention(UserAttentionType.Critical);
  },
  async sendNotification(title, body) {
    sendNotification({ title, body });
  },
  async notificationsPermitted() {
    return isPermissionGranted();
  },
  async requestNotificationPermission() {
    const result = await requestPermission();
    return result === "granted";
  },
};
