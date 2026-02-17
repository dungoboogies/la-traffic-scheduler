import { NextResponse } from "next/server";
import { getSessionUser, unauthorized } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { todayRange } from "@/lib/utils";
import { optimizeRoute } from "@/lib/route-optimizer";

export async function POST() {
  const userId = await getSessionUser();
  if (!userId) return unauthorized();

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { homeLat: true, homeLng: true },
  });

  if (!user?.homeLat || !user?.homeLng) {
    return NextResponse.json(
      { error: "Set your home address in Settings first" },
      { status: 400 }
    );
  }

  const { start, end } = todayRange();
  const appointments = await prisma.appointment.findMany({
    where: {
      userId,
      startTime: { gte: start, lt: end },
      lat: { not: null },
      lng: { not: null },
    },
    orderBy: [{ sequenceOrder: "asc" }, { startTime: "asc" }],
  });

  if (appointments.length < 2) {
    return NextResponse.json({ error: "Need at least 2 appointments to optimize" }, { status: 400 });
  }

  const result = optimizeRoute(
    { lat: user.homeLat, lng: user.homeLng },
    appointments.map((a) => ({
      id: a.id,
      lat: a.lat!,
      lng: a.lng!,
      title: a.title,
    }))
  );

  return NextResponse.json(result);
}
