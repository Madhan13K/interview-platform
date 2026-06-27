"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface CachedItem {
  id: string;
  type: "page" | "data" | "asset";
  url: string;
  size: number;
  cachedAt: string;
  expiresAt: string;
}

interface SyncQueueItem {
  id: string;
  action: "CREATE" | "UPDATE" | "DELETE";
  entity: string;
  payload: Record<string, unknown>;
  createdAt: string;
  retries: number;
}

export default function OfflinePage() {
  const [isOnline, setIsOnline] = useState(true);
  const [cachedItems, setCachedItems] = useState<CachedItem[]>([]);
  const [syncQueue, setSyncQueue] = useState<SyncQueueItem[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null);
  const [cacheSize, setCacheSize] = useState(0);
  const [swRegistered, setSwRegistered] = useState(false);

  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Check service worker registration
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistration().then((reg) => {
        setSwRegistered(!!reg);
      });
    }

    loadCachedData();

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const loadCachedData = async () => {
    // Simulate loading cached data from IndexedDB/Cache API
    const mockCached: CachedItem[] = [
      { id: "1", type: "page", url: "/dashboard", size: 45000, cachedAt: new Date(Date.now() - 3600000).toISOString(), expiresAt: new Date(Date.now() + 86400000).toISOString() },
      { id: "2", type: "data", url: "/api/v1/candidates", size: 128000, cachedAt: new Date(Date.now() - 7200000).toISOString(), expiresAt: new Date(Date.now() + 43200000).toISOString() },
      { id: "3", type: "data", url: "/api/v1/interviews", size: 96000, cachedAt: new Date(Date.now() - 1800000).toISOString(), expiresAt: new Date(Date.now() + 86400000).toISOString() },
      { id: "4", type: "page", url: "/pipelines", size: 38000, cachedAt: new Date(Date.now() - 5400000).toISOString(), expiresAt: new Date(Date.now() + 86400000).toISOString() },
      { id: "5", type: "asset", url: "/fonts/inter.woff2", size: 220000, cachedAt: new Date(Date.now() - 86400000).toISOString(), expiresAt: new Date(Date.now() + 604800000).toISOString() },
    ];
    setCachedItems(mockCached);
    setCacheSize(mockCached.reduce((sum, item) => sum + item.size, 0));

    const mockQueue: SyncQueueItem[] = [
      { id: "q1", action: "UPDATE", entity: "candidate", payload: { id: "c1", status: "interviewed" }, createdAt: new Date(Date.now() - 300000).toISOString(), retries: 0 },
      { id: "q2", action: "CREATE", entity: "note", payload: { interviewId: "i1", text: "Great technical skills" }, createdAt: new Date(Date.now() - 120000).toISOString(), retries: 0 },
    ];
    setSyncQueue(mockQueue);
    setLastSyncAt(new Date(Date.now() - 600000).toISOString());
  };

  const handleSync = async () => {
    if (!isOnline) return;
    setSyncing(true);
    // Simulate sync process
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setSyncQueue([]);
    setLastSyncAt(new Date().toISOString());
    setSyncing(false);
  };

  const handleClearCache = async () => {
    if ("caches" in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
    }
    setCachedItems([]);
    setCacheSize(0);
  };

  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  const formatRelativeTime = (dateStr: string): string => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return "just now";
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Offline Mode</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage cached data and sync queue for offline access
          </p>
        </div>
        <Button
          onClick={handleSync}
          disabled={!isOnline || syncing || syncQueue.length === 0}
          className="bg-indigo-600 hover:bg-indigo-700 text-white"
        >
          {syncing ? "Syncing..." : "Sync Now"}
        </Button>
      </div>

      {/* Status Banner */}
      <div className={`p-4 rounded-lg border-2 flex items-center gap-3 ${
        isOnline
          ? "bg-green-50 border-green-200"
          : "bg-amber-50 border-amber-200"
      }`}>
        <div className={`w-3 h-3 rounded-full ${
          isOnline ? "bg-green-500 animate-pulse" : "bg-amber-500"
        }`} />
        <div>
          <p className={`text-sm font-medium ${isOnline ? "text-green-800" : "text-amber-800"}`}>
            {isOnline ? "You are online" : "You are offline"}
          </p>
          <p className={`text-xs ${isOnline ? "text-green-600" : "text-amber-600"}`}>
            {isOnline
              ? "All data is being synced in real-time"
              : "Changes will be synced when connection is restored"}
          </p>
        </div>
        {lastSyncAt && (
          <span className="ml-auto text-xs text-slate-500">
            Last sync: {formatRelativeTime(lastSyncAt)}
          </span>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-slate-900">{formatSize(cacheSize)}</p>
            <p className="text-xs text-slate-500 mt-1">Cache Size</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-slate-900">{cachedItems.length}</p>
            <p className="text-xs text-slate-500 mt-1">Cached Items</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-amber-600">{syncQueue.length}</p>
            <p className="text-xs text-slate-500 mt-1">Pending Syncs</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-slate-900">
              {swRegistered ? "Active" : "Inactive"}
            </p>
            <p className="text-xs text-slate-500 mt-1">Service Worker</p>
          </CardContent>
        </Card>
      </div>

      {/* Sync Queue */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Sync Queue</CardTitle>
          {syncQueue.length > 0 && (
            <Badge className="bg-amber-100 text-amber-700">{syncQueue.length} pending</Badge>
          )}
        </CardHeader>
        <CardContent>
          {syncQueue.length > 0 ? (
            <div className="space-y-2">
              {syncQueue.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-slate-50">
                  <div className="flex items-center gap-3">
                    <Badge className={
                      item.action === "CREATE" ? "bg-green-100 text-green-700" :
                      item.action === "UPDATE" ? "bg-blue-100 text-blue-700" :
                      "bg-red-100 text-red-700"
                    }>
                      {item.action}
                    </Badge>
                    <div>
                      <p className="text-sm font-medium text-slate-700">{item.entity}</p>
                      <p className="text-xs text-slate-500">{formatRelativeTime(item.createdAt)}</p>
                    </div>
                  </div>
                  {item.retries > 0 && (
                    <span className="text-xs text-amber-600">{item.retries} retries</span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400 text-center py-6">No pending sync operations</p>
          )}
        </CardContent>
      </Card>

      {/* Cached Data */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Cached Data</CardTitle>
          <Button size="sm" variant="outline" onClick={handleClearCache} className="text-red-600 border-red-200">
            Clear Cache
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {cachedItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-200">
                <div className="flex items-center gap-3">
                  <span className="text-lg">
                    {item.type === "page" ? "📄" : item.type === "data" ? "📊" : "🎨"}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-slate-700">{item.url}</p>
                    <p className="text-xs text-slate-500">
                      Cached {formatRelativeTime(item.cachedAt)} | {formatSize(item.size)}
                    </p>
                  </div>
                </div>
                <Badge variant="secondary" className="text-xs">{item.type}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
