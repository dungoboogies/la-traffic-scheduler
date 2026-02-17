import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, unauthorized } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const userId = await getSessionUser();
  if (!userId) return unauthorized();

  const clients = await prisma.client.findMany({
    where: { userId },
    orderBy: { name: "asc" },
  });

  // Calculate effective rate for each client
  const enriched = clients.map((c) => {
    const totalTime = (c.totalDriveTime + c.totalSessions * 60) / 60; // hours
    const effectiveRate = totalTime > 0 ? c.totalRevenue / totalTime : c.defaultRate;
    return { ...c, effectiveRate: +effectiveRate.toFixed(0) };
  });

  return NextResponse.json(enriched);
}

export async function POST(req: NextRequest) {
  const userId = await getSessionUser();
  if (!userId) return unauthorized();

  const body = await req.json();

  if (!body.name || !body.defaultRate) {
    return NextResponse.json({ error: "Name and rate required" }, { status: 400 });
  }

  const client = await prisma.client.create({
    data: {
      userId,
      name: body.name,
      defaultRate: parseFloat(body.defaultRate),
      address: body.address || null,
    },
  });

  return NextResponse.json(client);
}
