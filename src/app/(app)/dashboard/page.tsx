"use client";

import { useState, useEffect, useCallback } from "react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";
import { Route, Sparkles, Plus, RefreshCw } from "lucide-react";
import AppointmentCard from "@/components/AppointmentCard";
import AddressAutocomplete from "@/components/AddressAutocomplete";
import { apiFetch } from "@/lib/api";
import { formatDate, currency, cn, minutesUntil, getLeaveStatus } from "@/lib/utils";

interface Appointment {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  location?: string | null;
  address?: string | null;
  clientName?: string | null;
  sessionRate?: number | null;
  driveTimeMin?: number | null;
  driveDistMiles?: number | null;
  sequenceOrder: number;
}

interface OptResult {
  originalMiles: number;
  optimizedMiles: number;
  savingsMinutes: number;
  savingsMiles: number;
  optimizedOrder: string[];
  swaps: string[];
}

export default function DashboardPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [optimizing, setOptimizing] = useState(false);
  const [optResult, setOptResult] = useState<OptResult | null>(null);
  const [dailyStats, setDailyStats] = useState<{
    sessions: number;
    revenue: number;
    driveHours: number;
    totalHours: number;
    effectiveRate: number;
  } | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({
    title: "",
    startTime: "",
    endTime: "",
    location: "",
    sessionRate: "",
  });

  const load = useCallback(async () => {
    try {
      const [todayData, stats] = await Promise.all([
        apiFetch<{ appointments: Appointment[] }>("/api/appointments/today"),
        apiFetch<{ sessions: number; revenue: number; driveHours: number; totalHours: number; effectiveRate: number }>("/api/stats/daily"),
      ]);
      setAppointments(todayData.appointments);
      setDailyStats(stats);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 60000);
    return () => clearInterval(interval);
  }, [load]);

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;
    const items = [...appointments];
    const [moved] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, moved);
    setAppointments(items);

    await apiFetch("/api/appointments/reorder", {
      method: "PUT",
      body: JSON.stringify({
        order: items.map((a, i) => ({ id: a.id, sequenceOrder: i + 1 })),
      }),
    });
  };

  const optimize = async () => {
    setOptimizing(true);
    try {
      const result = await apiFetch<OptResult>("/api/routes/optimize", {
        method: "POST",
      });
      setOptResult(result);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Optimization failed");
    }
    setOptimizing(false);
  };

  const applyOptimization = async () => {
    if (!optResult) return;
    await apiFetch("/api/routes/apply", {
      method: "POST",
      body: JSON.stringify({ optimizedOrder: optResult.optimizedOrder }),
    });
    setOptResult(null);
    load();
  };

  const addAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch("/api/appointments", {
        method: "POST",
        body: JSON.stringify(addForm),
      });
      setShowAdd(false);
      setAddForm({ title: "", startTime: "", endTime: "", location: "", sessionRate: "" });
      load();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to add");
    }
  };

  // Find next appointment for leave-time alert
  const now = new Date();
  const nextAppt = appointments.find(
    (a) => new Date(a.startTime) > now
  );
  const leaveMinutes = nextAppt
    ? minutesUntil(nextAppt.startTime) - (nextAppt.driveTimeMin || 15) - 5
    : null;
  const leaveStatus = leaveMinutes != null ? getLeaveStatus(leaveMinutes) : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="px-4 pt-4 pb-safe">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h1 className="text-xl font-bold">{formatDate(new Date())}</h1>
          {dailyStats && (
            <p className="text-xs text-muted">
              Effective rate: <strong className="text-success">{currency(dailyStats.effectiveRate)}/hr</strong>
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="w-9 h-9 bg-primary text-white rounded-full flex items-center justify-center"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Leave-time alert */}
      {nextAppt && leaveMinutes != null && leaveMinutes < 30 && (
        <div
          className={cn(
            "rounded-xl p-3 mb-3 text-sm font-medium",
            leaveStatus === "green" && "bg-emerald-50 text-emerald-700",
            leaveStatus === "yellow" && "bg-amber-50 text-amber-700",
            leaveStatus === "red" && "bg-red-50 text-red-700 animate-pulse"
          )}
        >
          {leaveMinutes <= 0
            ? `⚠️ Leave NOW for ${nextAppt.clientName || nextAppt.title}!`
            : `🚗 Leave in ${leaveMinutes} min for ${nextAppt.clientName || nextAppt.title} (${new Date(nextAppt.startTime).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })})`}
        </div>
      )}

      {/* Daily summary */}
      {dailyStats && dailyStats.sessions > 0 && (
        <div className="grid grid-cols-4 gap-2 mb-4">
          {[
            { label: "Sessions", value: dailyStats.sessions },
            { label: "Revenue", value: currency(dailyStats.revenue) },
            { label: "Driving", value: `${dailyStats.driveHours}h` },
            { label: "Total", value: `${dailyStats.totalHours}h` },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl border border-border p-2.5 text-center">
              <p className="text-sm font-bold">{s.value}</p>
              <p className="text-[10px] text-muted">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Optimize button */}
      {appointments.length >= 2 && (
        <button
          onClick={optimize}
          disabled={optimizing}
          className="w-full mb-3 py-2.5 bg-gradient-to-r from-primary to-blue-500 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {optimizing ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Route className="w-4 h-4" />
          )}
          {optimizing ? "Optimizing..." : "Optimize Route"}
        </button>
      )}

      {/* Optimization results */}
      {optResult && optResult.savingsMinutes > 0 && (
        <div className="bg-emerald-50 rounded-xl border border-emerald-100 p-4 mb-3">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-5 h-5 text-emerald-600" />
            <h3 className="font-semibold text-emerald-800">Route Optimized!</h3>
          </div>
          <p className="text-sm text-emerald-700 mb-2">
            Save <strong>{optResult.savingsMinutes} minutes</strong> and{" "}
            <strong>{optResult.savingsMiles} miles</strong> by reordering
          </p>
          {optResult.swaps.length > 0 && (
            <ul className="text-xs text-emerald-600 space-y-1 mb-3">
              {optResult.swaps.slice(0, 3).map((s, i) => (
                <li key={i}>• {s}</li>
              ))}
            </ul>
          )}
          <div className="flex gap-2">
            <button
              onClick={applyOptimization}
              className="flex-1 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold"
            >
              Apply
            </button>
            <button
              onClick={() => setOptResult(null)}
              className="flex-1 py-2 border border-emerald-200 text-emerald-700 rounded-lg text-sm"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {optResult && optResult.savingsMinutes === 0 && (
        <div className="bg-blue-50 rounded-xl p-3 mb-3 text-sm text-blue-700">
          Your current route is already optimal!
        </div>
      )}

      {/* Add form */}
      {showAdd && (
        <form onSubmit={addAppointment} className="bg-white rounded-xl border border-border p-4 mb-3 space-y-3">
          <input
            type="text"
            placeholder="Title (e.g. Spencer - Tutoring)"
            required
            value={addForm.title}
            onChange={(e) => setAddForm({ ...addForm, title: e.target.value })}
            className="w-full px-3 py-2.5 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              type="datetime-local"
              required
              value={addForm.startTime}
              onChange={(e) => setAddForm({ ...addForm, startTime: e.target.value })}
              className="px-3 py-2.5 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <input
              type="datetime-local"
              required
              value={addForm.endTime}
              onChange={(e) => setAddForm({ ...addForm, endTime: e.target.value })}
              className="px-3 py-2.5 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <AddressAutocomplete
            value={addForm.location}
            onChange={(address) => setAddForm({ ...addForm, location: address })}
            placeholder="Address"
          />
          <input
            type="number"
            placeholder="Session rate ($)"
            value={addForm.sessionRate}
            onChange={(e) => setAddForm({ ...addForm, sessionRate: e.target.value })}
            className="w-full px-3 py-2.5 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button type="submit" className="w-full py-2.5 bg-primary text-white rounded-lg text-sm font-semibold">
            Add Appointment
          </button>
        </form>
      )}

      {/* Appointments list */}
      {appointments.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-muted text-sm">No appointments today.</p>
          <p className="text-xs text-muted mt-1">Add one above or sync your Google Calendar in Settings.</p>
        </div>
      ) : (
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="appointments">
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="space-y-2"
              >
                {appointments.map((appt, index) => {
                  const apptStart = new Date(appt.startTime);
                  const apptEnd = new Date(appt.endTime);
                  const isPast = apptEnd < now;
                  const isCurrent = apptStart <= now && apptEnd > now;

                  return (
                    <Draggable key={appt.id} draggableId={appt.id} index={index}>
                      {(prov, snap) => (
                        <div ref={prov.innerRef} {...prov.draggableProps}>
                          <AppointmentCard
                            appointment={appt}
                            isPast={isPast}
                            isCurrent={isCurrent}
                            isDragging={snap.isDragging}
                            dragHandleProps={prov.dragHandleProps || undefined}
                          />
                        </div>
                      )}
                    </Draggable>
                  );
                })}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      )}
    </div>
  );
}
