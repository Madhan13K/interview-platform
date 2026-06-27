"use client";

import { useState, useEffect } from "react";
import {
  notificationPreferencesService,
  NotificationPreferences,
  NotificationChannel,
} from "@/services/notification-preferences.service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export default function NotificationPreferencesPage() {
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    notificationPreferencesService
      .get()
      .then((res) => setPreferences(res.data))
      .catch(() => setPreferences(null))
      .finally(() => setLoading(false));
  }, []);

  const handleToggle = (category: string, channel: keyof NotificationChannel) => {
    if (!preferences) return;
    setPreferences({
      ...preferences,
      preferences: preferences.preferences.map((pref) =>
        pref.category === category
          ? { ...pref, channels: { ...pref.channels, [channel]: !pref.channels[channel] } }
          : pref
      ),
    });
  };

  const handleSave = async () => {
    if (!preferences) return;
    setSaving(true);
    try {
      await notificationPreferencesService.update(preferences);
    } catch (error) {
      console.error("Save failed:", error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-slate-500">Loading preferences...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Notification Preferences</h1>
          <p className="text-sm text-slate-500 mt-1">
            Control how and when you receive notifications
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      {preferences && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Channels by Category</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <div className="grid grid-cols-5 gap-4 pb-2 border-b border-slate-200 text-xs font-medium text-slate-500">
                  <span className="col-span-1">Category</span>
                  <span className="text-center">Email</span>
                  <span className="text-center">In-App</span>
                  <span className="text-center">Push</span>
                  <span className="text-center">SMS</span>
                </div>
                {preferences.preferences.map((pref) => (
                  <div key={pref.category} className="grid grid-cols-5 gap-4 py-3 border-b border-slate-100 items-center">
                    <div className="col-span-1">
                      <p className="text-sm font-medium text-slate-900">{pref.label}</p>
                      <p className="text-xs text-slate-500">{pref.description}</p>
                    </div>
                    {(["email", "inApp", "push", "sms"] as (keyof NotificationChannel)[]).map((channel) => (
                      <div key={channel} className="flex justify-center">
                        <button
                          onClick={() => handleToggle(pref.category, channel)}
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                            pref.channels[channel] ? "bg-indigo-600" : "bg-slate-300"
                          }`}
                        >
                          <span
                            className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                              pref.channels[channel] ? "translate-x-4.5" : "translate-x-0.5"
                            }`}
                          />
                        </button>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Digest & Quiet Hours</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm text-slate-700">Digest Frequency</Label>
                <p className="text-sm text-slate-900 mt-1">{preferences.digestFrequency}</p>
              </div>
              <div>
                <Label className="text-sm text-slate-700">Quiet Hours</Label>
                <p className="text-sm text-slate-900 mt-1">
                  {preferences.quietHours.enabled
                    ? `${preferences.quietHours.startTime} - ${preferences.quietHours.endTime} (${preferences.quietHours.timezone})`
                    : "Disabled"}
                </p>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
