import { NextResponse } from "next/server";
import { getSessionUser, unauthorized } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { weekRange } from "@/lib/utils";

export async function GET() {
  const userId = await getSessionUser();
  if (!userId) return unauthorized();

  const { start, end } = weekRange();

  const appointments = await prisma.appointment.findMany({
    where: { userId, startTime: { gte: start, lt: end } },
    orderBy: { startTime: "asc" },
  });

  return NextResponse.json({ appointments });
}
