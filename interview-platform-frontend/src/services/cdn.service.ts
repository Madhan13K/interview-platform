import api from "@/lib/api";

export const cdnService = {
  listAssets: () => api.get("/api/v1/cdn/assets"),
  registerAsset: (data: { assetKey: string; originalUrl: string; contentType: string; sizeBytes: number }) => api.post("/api/v1/cdn/assets", data),
  purge: (data: { assetKeys?: string[]; purgeAll?: boolean }) => api.post("/api/v1/cdn/purge", data),
  getCdnUrl: (assetKey: string) => api.get(`/api/v1/cdn/assets/${assetKey}/url`),
};
