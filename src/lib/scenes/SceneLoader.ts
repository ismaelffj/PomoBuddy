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
  const infos = await platform.loadScenes();
  const scenes: LoadedScene[] = [];
  for (const info of infos) {
    const scene = parseScene(platform, info);
    if (scene) scenes.push(scene);
  }
  return scenes;
}

function parseScene(
  platform: Platform,
  info: { id: string; baseDir: string; manifestJson: string },
): LoadedScene | null {
  let manifest: SceneManifest;
  try {
    manifest = sceneSchema.parse(JSON.parse(info.manifestJson));
  } catch (err) {
    console.warn(`[scenes] invalid manifest in ${info.baseDir}:`, err);
    return null;
  }

  for (const p of collectManifestAssetPaths(manifest)) {
    if (!isSafeRelativeAsset(p)) {
      console.warn(`[scenes] rejected ${info.baseDir}: unsafe path ${JSON.stringify(p)}`);
      return null;
    }
  }

  return {
    id: manifest.id,
    manifest,
    baseDir: info.baseDir,
    assetUrl: (rel) => `${platform.toAssetUrl(`${info.baseDir}/${rel}`)}?v=${LAUNCH_TOKEN}`,
  };
}
