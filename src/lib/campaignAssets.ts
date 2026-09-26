import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";

// Campaign assets (currently: uploaded books) are saved to disk under the
// campaign's own asset folder via save_campaign_asset and referenced from
// then on by filename only — same reasoning as the ruleset image assets in
// ruleset-editor.tsx, just for a different owner (campaign, not ruleset).
export async function saveCampaignAssetFile(campaignId: string, file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const ext = file.name.includes(".") ? file.name.split(".").pop() : "pdf";
  const filename = `${crypto.randomUUID()}.${ext}`;
  await invoke("save_campaign_asset", { campaignId, filename, bytes: Array.from(new Uint8Array(buffer)) });
  return filename;
}

const assetUrlCache = new Map<string, string>();

export function deleteCampaignAssetFile(campaignId: string, filename: string) {
  invoke("delete_campaign_asset", { campaignId, filename }).catch(() => {});
  const key = `${campaignId}/${filename}`;
  const cached = assetUrlCache.get(key);
  if (cached) { URL.revokeObjectURL(cached); assetUrlCache.delete(key); }
}

// Reads a saved asset's bytes back and hands out a blob: URL to display it —
// the file lives outside the webview's origin, so it can't be used as a
// <Document file=...> source directly without this.
export function useCampaignAssetUrl(campaignId: string, filename: string | undefined): string | null {
  const cacheKey = filename ? `${campaignId}/${filename}` : null;
  const [url, setUrl] = useState<string | null>(() => (cacheKey && assetUrlCache.get(cacheKey)) || null);

  useEffect(() => {
    if (!cacheKey || !filename) { setUrl(null); return; }
    const cached = assetUrlCache.get(cacheKey);
    if (cached) { setUrl(cached); return; }
    let cancelled = false;
    invoke<number[]>("read_campaign_asset", { campaignId, filename }).then(bytes => {
      if (cancelled) return;
      const objectUrl = URL.createObjectURL(new Blob([new Uint8Array(bytes)]));
      assetUrlCache.set(cacheKey, objectUrl);
      setUrl(objectUrl);
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [cacheKey, campaignId, filename]);

  return url;
}
