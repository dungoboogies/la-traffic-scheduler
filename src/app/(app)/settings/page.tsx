"use client";

import { useState, useEffect } from "react";
import { signOut } from "next-auth/react";
import { apiFetch } from "@/lib/api";
import { RefreshCw, Check, ExternalLink, LogOut } from "lucide-react";

interface Settings {
  name: string | null;
  email: string;
  homeAddress: string | null;
  defaultBuffer: number;
  workStart: string;
  workEnd: string;
  googleConnected: boolean;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    name: "",
    homeAddress: "",
    defaultBuffer: "5",
    workStart: "08:00",
    workEnd: "18:00",
  });

  useEffect(() => {
    apiFetch<Settings>("/api/settings")
      .then((data) => {
        setSettings(data);
        setForm({
          name: data.name || "",
          homeAddress: data.homeAddress || "",
          defaultBuffer: String(data.defaultBuffer),
          workStart: data.workStart,
          workEnd: data.workEnd,
        });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      await apiFetch("/api/settings", {
        method: "PUT",
        body: JSON.stringify(form),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to save");
    }
    setSaving(false);
  };

  const connectGoogle = async () => {
    try {
      const data = await apiFetch<{ url: string }>("/api/auth/google");
      window.location.href = data.url;
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed");
    }
  };

  const syncCalendar = async () => {
    setSyncing(true);
    try {
      const data = await apiFetch<{ synced: number }>("/api/calendar/sync", {
        method: "POST",
      });
      alert(`Synced ${data.synced} events`);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Sync failed");
    }
    setSyncing(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="px-4 pt-4 pb-safe">
      <h1 className="text-xl font-bold mb-4">Settings</h1>

      {/* Google Calendar */}
      <div className="bg-white rounded-xl border border-border p-4 mb-4">
        <h2 className="font-semibold text-sm mb-3">Google Calendar</h2>
        {settings?.googleConnected ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-success text-sm">
              <Check className="w-4 h-4" />
              Connected
            </div>
            <button
              onClick={syncCalendar}
              disabled={syncing}
              className="w-full py-2.5 bg-primary text-white rounded-lg text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`} />
              {syncing ? "Syncing..." : "Sync Now"}
            </button>
          </div>
        ) : (
          <button
            onClick={connectGoogle}
            className="w-full py-2.5 bg-white border border-border rounded-lg text-sm font-medium flex items-center justify-center gap-2 hover:bg-gray-50"
          >
            <ExternalLink className="w-4 h-4" />
            Connect Google Calendar
          </button>
        )}
      </div>

      {/* Profile */}
      <div className="bg-white rounded-xl border border-border p-4 mb-4 space-y-3">
        <h2 className="font-semibold text-sm">Profile</h2>
        <div>
          <label className="text-xs text-muted block mb-1">Name</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full px-3 py-2.5 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div>
          <label className="text-xs text-muted block mb-1">Home Address</label>
          <input
            type="text"
            value={form.homeAddress}
            onChange={(e) => setForm({ ...form, homeAddress: e.target.value })}
            placeholder="1000 Westwood Blvd, Los Angeles, CA"
            className="w-full px-3 py-2.5 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div>
          <label className="text-xs text-muted block mb-1">
            Drive Buffer: {form.defaultBuffer} min
          </label>
          <input
            type="range"
            min="0"
            max="15"
            value={form.defaultBuffer}
            onChange={(e) => setForm({ ...form, defaultBuffer: e.target.value })}
            className="w-full"
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-muted block mb-1">Work Start</label>
            <input
              type="time"
              value={form.workStart}
              onChange={(e) => setForm({ ...form, workStart: e.target.value })}
              className="w-full px-3 py-2.5 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="text-xs text-muted block mb-1">Work End</label>
            <input
              type="time"
              value={form.workEnd}
              onChange={(e) => setForm({ ...form, workEnd: e.target.value })}
              className="w-full px-3 py-2.5 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>
        <button
          onClick={save}
          disabled={saving}
          className="w-full py-2.5 bg-primary text-white rounded-lg text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {saved ? <><Check className="w-4 h-4" /> Saved!</> : saving ? "Saving..." : "Save Settings"}
        </button>
      </div>

      {/* Sign out */}
      <button
        onClick={() => signOut({ callbackUrl: "/login" })}
        className="w-full py-2.5 border border-danger text-danger rounded-xl text-sm font-medium flex items-center justify-center gap-2"
      >
        <LogOut className="w-4 h-4" />
        Sign Out
      </button>
    </div>
  );
}
