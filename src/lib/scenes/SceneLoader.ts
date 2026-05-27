import type { Platform } from "../platform/platform.types";
import { sceneSchema, type SceneManifest } from "./sceneSchema";
import { collectManifestAssetPaths, isSafeRelativeAsset } from "./scenePathSafe";
import type { LoadedScene } from "./scene.types";

// Per-launch cache buster. Tauri's asset protocol does not emit
// cache-control headers, so the WebView caches assetUrl responses
// indefinitely within a session. Appending this token to every
// asset URL guarantees a fresh fetch on each app restart, which is
// the granularity we actually want (no live hot-reload of art).
const LAUNCH_TOKEN = Date.now().toString(36);

export async function loadAllScenes(platform: Platform): Promise<LoadedScene[]> {
  const [resource, appData] = await Promise.all([platform.resourceDir(), platform.appDataDir()]);
  const roots = [`${resource}/scenes`, `${appData}/scenes`];

  const scenes: LoadedScene[] = [];
  for (const root of roots) {
    const folders = await tryReadDir(platform, root);
    for (const folder of folders) {
      const baseDir = `${root}/${folder}`;
      const scene = await tryLoadScene(platform, baseDir);
      if (scene) scenes.push(scene);
    }
  }
  return scenes;
}

async function tryReadDir(platform: Platform, path: string): Promise<string[]> {
  try {
    return await platform.readDir(path);
  } catch {
    return [];
  }
}

async function tryLoadScene(platform: Platform, baseDir: string): Promise<LoadedScene | null> {
  try {
    const raw = await platform.readTextFile(`${baseDir}/scene.json`);
    const parsed = JSON.parse(raw);
    const manifest = sceneSchema.parse(parsed) as SceneManifest;

    const assetPaths = collectManifestAssetPaths(manifest);
    for (const p of assetPaths) {
      if (!isSafeRelativeAsset(p)) {
        console.warn(`[scenes] rejected ${baseDir}: unsafe path ${JSON.stringify(p)}`);
        return null;
      }
    }

    return {
      id: manifest.id,
      manifest,
      baseDir,
      assetUrl: (rel) => `${platform.toAssetUrl(`${baseDir}/${rel}`)}?v=${LAUNCH_TOKEN}`,
    };
  } catch (err) {
    console.warn(`[scenes] failed to load ${baseDir}:`, err);
    return null;
  }
}
