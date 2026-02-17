"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import { currency } from "@/lib/utils";
import { Plus, X } from "lucide-react";

interface Client {
  id: string;
  name: string;
  defaultRate: number;
  address?: string | null;
  totalSessions: number;
  totalRevenue: number;
  totalDriveTime: number;
  effectiveRate: number;
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: "", defaultRate: "", address: "" });

  const load = async () => {
    try {
      const data = await apiFetch<Client[]>("/api/clients");
      setClients(data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const addClient = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch("/api/clients", {
        method: "POST",
        body: JSON.stringify(form),
      });
      setForm({ name: "", defaultRate: "", address: "" });
      setShowAdd(false);
      load();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed");
    }
  };

  const deleteClient = async (id: string) => {
    if (!confirm("Delete this client?")) return;
    try {
      await apiFetch(`/api/clients/${id}`, { method: "DELETE" });
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

  return (
    <div className="px-4 pt-4 pb-safe">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">Clients</h1>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="w-9 h-9 bg-primary text-white rounded-full flex items-center justify-center"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {showAdd && (
        <form onSubmit={addClient} className="bg-white rounded-xl border border-border p-4 mb-4 space-y-3">
          <input
            type="text"
            placeholder="Client name"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full px-3 py-2.5 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <input
            type="number"
            placeholder="Session rate ($)"
            required
            value={form.defaultRate}
            onChange={(e) => setForm({ ...form, defaultRate: e.target.value })}
            className="w-full px-3 py-2.5 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <input
            type="text"
            placeholder="Address (optional)"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            className="w-full px-3 py-2.5 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button type="submit" className="w-full py-2.5 bg-primary text-white rounded-lg text-sm font-semibold">
            Add Client
          </button>
        </form>
      )}

      {clients.length === 0 ? (
        <p className="text-center text-muted py-16 text-sm">No clients yet. Add your first client above.</p>
      ) : (
        <div className="space-y-2">
          {clients.map((c) => (
            <div key={c.id} className="bg-white rounded-xl border border-border p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold">{c.name}</h3>
                <button onClick={() => deleteClient(c.id)} className="text-gray-300 hover:text-danger">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-sm font-bold">{currency(c.defaultRate)}</p>
                  <p className="text-[10px] text-muted">Rate</p>
                </div>
                <div>
                  <p className="text-sm font-bold">{c.totalSessions}</p>
                  <p className="text-[10px] text-muted">Sessions</p>
                </div>
                <div>
                  <p className="text-sm font-bold text-success">{currency(c.effectiveRate)}/hr</p>
                  <p className="text-[10px] text-muted">Eff. Rate</p>
                </div>
              </div>
              {c.address && <p className="text-xs text-muted mt-2 truncate">{c.address}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
