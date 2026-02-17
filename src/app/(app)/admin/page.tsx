"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import { Shield, Check, X, UserX, Users, Calendar, MapPin } from "lucide-react";

interface User {
  id: string;
  email: string;
  name: string | null;
  role: string;
  status: string;
  createdAt: string;
  _count: { appointments: number; clients: number };
}

interface Stats {
  totalUsers: number;
  pendingUsers: number;
  totalAppointments: number;
  totalClients: number;
  googleConnected: number;
}

export default function AdminPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      const [u, s] = await Promise.all([
        apiFetch<User[]>("/api/admin/users"),
        apiFetch<Stats>("/api/admin/stats"),
      ]);
      setUsers(u);
      setStats(s);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Access denied");
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const updateUser = async (id: string, data: Record<string, string>) => {
    try {
      await apiFetch(`/api/admin/users/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
      load();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed");
    }
  };

  const deleteUser = async (id: string) => {
    if (!confirm("Permanently delete this user and all their data?")) return;
    try {
      await apiFetch(`/api/admin/users/${id}`, { method: "DELETE" });
      load();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-4 pt-4">
        <div className="bg-red-50 rounded-xl p-4 text-center text-danger text-sm">{error}</div>
      </div>
    );
  }

  const pending = users.filter((u) => u.status === "pending");
  const active = users.filter((u) => u.status === "approved");
  const disabled = users.filter((u) => u.status === "disabled");

  return (
    <div className="px-4 pt-4 pb-safe">
      <div className="flex items-center gap-2 mb-4">
        <Shield className="w-5 h-5 text-primary" />
        <h1 className="text-xl font-bold">Admin Panel</h1>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            { icon: Users, label: "Users", value: stats.totalUsers },
            { icon: Calendar, label: "Appointments", value: stats.totalAppointments },
            { icon: MapPin, label: "Google Connected", value: stats.googleConnected },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl border border-border p-3 text-center">
              <s.icon className="w-4 h-4 text-muted mx-auto mb-1" />
              <p className="text-lg font-bold">{s.value}</p>
              <p className="text-[10px] text-muted">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Pending approvals */}
      {pending.length > 0 && (
        <div className="mb-4">
          <h2 className="font-semibold text-sm mb-2 text-amber-700">
            Pending Approval ({pending.length})
          </h2>
          <div className="space-y-2">
            {pending.map((u) => (
              <div key={u.id} className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                <div className="flex items-center justify-between mb-1">
                  <div>
                    <p className="font-medium text-sm">{u.name || u.email}</p>
                    <p className="text-xs text-muted">{u.email}</p>
                    <p className="text-[10px] text-muted">
                      Requested {new Date(u.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => updateUser(u.id, { status: "approved" })}
                      className="w-8 h-8 bg-success text-white rounded-lg flex items-center justify-center"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => updateUser(u.id, { status: "disabled" })}
                      className="w-8 h-8 bg-danger text-white rounded-lg flex items-center justify-center"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active users */}
      <div className="mb-4">
        <h2 className="font-semibold text-sm mb-2">Active Users ({active.length})</h2>
        <div className="space-y-2">
          {active.map((u) => (
            <div key={u.id} className="bg-white border border-border rounded-xl p-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm">{u.name || u.email}</p>
                    {u.role === "admin" && (
                      <span className="text-[10px] bg-primary text-white px-1.5 py-0.5 rounded-full">admin</span>
                    )}
                  </div>
                  <p className="text-xs text-muted">{u.email}</p>
                  <p className="text-[10px] text-muted">
                    {u._count.appointments} appts · {u._count.clients} clients
                  </p>
                </div>
                {u.role !== "admin" && (
                  <button
                    onClick={() => updateUser(u.id, { status: "disabled" })}
                    className="text-gray-300 hover:text-danger"
                  >
                    <UserX className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Disabled users */}
      {disabled.length > 0 && (
        <div>
          <h2 className="font-semibold text-sm mb-2 text-muted">Disabled ({disabled.length})</h2>
          <div className="space-y-2">
            {disabled.map((u) => (
              <div key={u.id} className="bg-gray-50 border border-gray-200 rounded-xl p-3 opacity-60">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{u.name || u.email}</p>
                    <p className="text-xs text-muted">{u.email}</p>
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => updateUser(u.id, { status: "approved" })}
                      className="text-xs text-primary underline"
                    >
                      Re-enable
                    </button>
                    <button
                      onClick={() => deleteUser(u.id)}
                      className="text-xs text-danger underline"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
