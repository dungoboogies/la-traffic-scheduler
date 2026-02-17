import { NextResponse } from "next/server";
import { getSessionUser, unauthorized } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { todayRange } from "@/lib/utils";

export async function GET() {
  const userId = await getSessionUser();
  if (!userId) return unauthorized();

  const { start, end } = todayRange();

  const [appointments, user] = await Promise.all([
    prisma.appointment.findMany({
      where: { userId, startTime: { gte: start, lt: end } },
      orderBy: [{ sequenceOrder: "asc" }, { startTime: "asc" }],
    }),
    prisma.user.findUnique({
      where: { id: userId },
      select: { homeLat: true, homeLng: true, defaultBuffer: true },
    }),
  ]);

  return NextResponse.json({
    appointments,
    home: user ? { lat: user.homeLat, lng: user.homeLng } : null,
    buffer: user?.defaultBuffer || 5,
  });
}
