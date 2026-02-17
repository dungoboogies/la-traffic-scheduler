import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, unauthorized } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { todayRange, dateRange } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const userId = await getSessionUser();
  if (!userId) return unauthorized();

  const dateParam = req.nextUrl.searchParams.get("date");
  const { start, end } = dateParam ? dateRange(dateParam) : todayRange();

  const appointments = await prisma.appointment.findMany({
    where: { userId, startTime: { gte: start, lt: end } },
    orderBy: { startTime: "asc" },
  });

  const sessions = appointments.length;
  const revenue = appointments.reduce((sum, a) => sum + (a.sessionRate || 0), 0);

  let sessionMinutes = 0;
  let driveMinutes = 0;
  for (const a of appointments) {
    sessionMinutes += (new Date(a.endTime).getTime() - new Date(a.startTime).getTime()) / 60000;
    driveMinutes += a.driveTimeMin || 0;
  }

  const totalHours = (sessionMinutes + driveMinutes) / 60;
  const sessionHours = sessionMinutes / 60;
  const driveHours = driveMinutes / 60;
  const effectiveRate = totalHours > 0 ? revenue / totalHours : 0;

  return NextResponse.json({
    sessions,
    revenue,
    sessionHours: +sessionHours.toFixed(1),
    driveHours: +driveHours.toFixed(1),
    totalHours: +totalHours.toFixed(1),
    effectiveRate: +effectiveRate.toFixed(0),
  });
}
