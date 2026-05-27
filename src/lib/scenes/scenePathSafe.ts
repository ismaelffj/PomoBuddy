const ALLOWED_EXTENSIONS = [".webp", ".png", ".jpg", ".jpeg", ".svg"];

export function isSafeRelativeAsset(input: string): boolean {
  if (typeof input !== "string") return false;
  if (input.length === 0) return false;
  if (input !== input.trim()) return false;

  if (input.startsWith("/") || input.startsWith("\\")) return false;
  if (/^[a-zA-Z]:[\\/]/.test(input)) return false;
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(input)) return false;

  const segments = input.replace(/\\/g, "/").split("/");
  if (segments.some((s) => s === ".." || s === "")) return false;

  const lower = input.toLowerCase();
  if (!ALLOWED_EXTENSIONS.some((ext) => lower.endsWith(ext))) return false;

  return true;
}

type AssetSource = {
  layers: { background: string; foreground?: string };
  preview?: string;
  timeOfDay: { mode: "tint" } | { mode: "variants"; variants: Record<string, string> };
};

export function collectManifestAssetPaths(manifest: AssetSource): string[] {
  const out: string[] = [manifest.layers.background];
  if (manifest.layers.foreground) out.push(manifest.layers.foreground);
  if (manifest.preview) out.push(manifest.preview);
  if (manifest.timeOfDay.mode === "variants") {
    out.push(...Object.values(manifest.timeOfDay.variants));
  }
  return out;
}
