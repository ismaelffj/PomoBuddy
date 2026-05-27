export type { SceneManifest } from "./sceneSchema";

import type { SceneManifest } from "./sceneSchema";

export interface LoadedScene {
  id: string;
  manifest: SceneManifest;
  baseDir: string;
  assetUrl: (relativePath: string) => string;
}
