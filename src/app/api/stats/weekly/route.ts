import { NextResponse } from "next/server";
import { getSessionUser, unauthorized } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const userId = await getSessionUser();
  if (!userId) return unauthorized();

  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 30);

  const appointments = await prisma.appointment.findMany({
    where: { userId, startTime: { gte: start, lt: end } },
    orderBy: { startTime: "asc" },
  });

  // Group by day
  const days = new Map<string, { sessions: number; revenue: number; driveMin: number; sessionMin: number }>();

  for (const a of appointments) {
    const day = new Date(a.startTime).toISOString().split("T")[0];
    const entry = days.get(day) || { sessions: 0, revenue: 0, driveMin: 0, sessionMin: 0 };
    entry.sessions++;
    entry.revenue += a.sessionRate || 0;
    entry.driveMin += a.driveTimeMin || 0;
    entry.sessionMin += (new Date(a.endTime).getTime() - new Date(a.startTime).getTime()) / 60000;
    days.set(day, entry);
  }

  const data = Array.from(days.entries()).map(([date, d]) => {
    const totalHours = (d.sessionMin + d.driveMin) / 60;
    return {
      date,
      sessions: d.sessions,
      revenue: d.revenue,
      driveHours: +(d.driveMin / 60).toFixed(1),
      effectiveRate: totalHours > 0 ? +((d.revenue / totalHours).toFixed(0)) : 0,
    };
  });

  return NextResponse.json({ data });
}
