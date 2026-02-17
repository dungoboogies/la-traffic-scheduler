"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import { formatTime, formatDate, currency } from "@/lib/utils";
import { MapPin, Clock, DollarSign } from "lucide-react";

interface Appointment {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  location?: string | null;
  address?: string | null;
  clientName?: string | null;
  sessionRate?: number | null;
}

export default function WeekPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<{ appointments: Appointment[] }>("/api/appointments/week")
      .then((data) => setAppointments(data.appointments))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  // Group by day
  const days = new Map<string, Appointment[]>();
  for (const a of appointments) {
    const day = new Date(a.startTime).toISOString().split("T")[0];
    if (!days.has(day)) days.set(day, []);
    days.get(day)!.push(a);
  }

  return (
    <div className="px-4 pt-4 pb-safe">
      <h1 className="text-xl font-bold mb-4">This Week</h1>

      {days.size === 0 ? (
        <p className="text-center text-muted py-16 text-sm">No appointments this week.</p>
      ) : (
        <div className="space-y-4">
          {Array.from(days.entries()).map(([date, appts]) => {
            const revenue = appts.reduce((sum, a) => sum + (a.sessionRate || 0), 0);
            return (
              <div key={date}>
                <div className="flex items-center justify-between mb-2">
                  <h2 className="font-semibold text-sm">{formatDate(date)}</h2>
                  <span className="text-xs text-muted">
                    {appts.length} sessions · {currency(revenue)}
                  </span>
                </div>
                <div className="space-y-2">
                  {appts.map((a) => (
                    <div key={a.id} className="bg-white rounded-xl border border-border p-3">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-medium text-sm truncate">{a.title}</h3>
                        {a.sessionRate && (
                          <span className="text-xs font-bold text-success flex items-center gap-0.5">
                            <DollarSign className="w-3 h-3" />{a.sessionRate}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatTime(a.startTime)} – {formatTime(a.endTime)}
                        </span>
                        {(a.address || a.location) && (
                          <span className="flex items-center gap-1 truncate">
                            <MapPin className="w-3 h-3 shrink-0" />
                            <span className="truncate">{a.address || a.location}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
