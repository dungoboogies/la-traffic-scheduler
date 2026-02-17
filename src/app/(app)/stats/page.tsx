"use client";

import { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { apiFetch } from "@/lib/api";
import { currency } from "@/lib/utils";
import { TrendingUp, DollarSign, Clock, Car } from "lucide-react";

interface DayData {
  date: string;
  sessions: number;
  revenue: number;
  driveHours: number;
  effectiveRate: number;
}

export default function StatsPage() {
  const [data, setData] = useState<DayData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<{ data: DayData[] }>("/api/stats/weekly")
      .then((res) => setData(res.data))
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

  const totalRevenue = data.reduce((s, d) => s + d.revenue, 0);
  const totalSessions = data.reduce((s, d) => s + d.sessions, 0);
  const totalDriveHours = data.reduce((s, d) => s + d.driveHours, 0);
  const avgRate =
    data.length > 0
      ? Math.round(data.reduce((s, d) => s + d.effectiveRate, 0) / data.length)
      : 0;

  const chartData = data.map((d) => ({
    name: new Date(d.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    revenue: d.revenue,
    rate: d.effectiveRate,
  }));

  return (
    <div className="px-4 pt-4 pb-safe">
      <h1 className="text-xl font-bold mb-4">Stats (30 days)</h1>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-2 mb-6">
        {[
          { icon: DollarSign, label: "Revenue", value: currency(totalRevenue), color: "text-success" },
          { icon: TrendingUp, label: "Avg Rate", value: `${currency(avgRate)}/hr`, color: "text-primary" },
          { icon: Clock, label: "Sessions", value: totalSessions.toString(), color: "text-foreground" },
          { icon: Car, label: "Driving", value: `${totalDriveHours.toFixed(1)}h`, color: "text-warning" },
        ].map((card) => (
          <div key={card.label} className="bg-white rounded-xl border border-border p-4">
            <div className="flex items-center gap-2 mb-1">
              <card.icon className={`w-4 h-4 ${card.color}`} />
              <span className="text-xs text-muted">{card.label}</span>
            </div>
            <p className={`text-lg font-bold ${card.color}`}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* Revenue chart */}
      {chartData.length > 0 && (
        <>
          <h2 className="font-semibold text-sm mb-3">Daily Revenue</h2>
          <div className="bg-white rounded-xl border border-border p-4 mb-6">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData}>
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip
                  formatter={(value) => [`$${value}`, "Revenue"]}
                  contentStyle={{ fontSize: 12 }}
                />
                <Bar dataKey="revenue" fill="#2563eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <h2 className="font-semibold text-sm mb-3">Effective Rate</h2>
          <div className="bg-white rounded-xl border border-border p-4">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData}>
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip
                  formatter={(value) => [`$${value}/hr`, "Rate"]}
                  contentStyle={{ fontSize: 12 }}
                />
                <Bar dataKey="rate" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      {chartData.length === 0 && (
        <p className="text-center text-muted py-8 text-sm">
          No data yet. Add appointments to see stats.
        </p>
      )}
    </div>
  );
}
