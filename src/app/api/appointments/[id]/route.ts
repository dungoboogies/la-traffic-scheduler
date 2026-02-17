import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, unauthorized } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getSessionUser();
  if (!userId) return unauthorized();

  const { id } = await params;
  const body = await req.json();

  const appt = await prisma.appointment.findFirst({ where: { id, userId } });
  if (!appt) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updated = await prisma.appointment.update({
    where: { id },
    data: {
      sessionRate: body.sessionRate ?? appt.sessionRate,
      clientName: body.clientName ?? appt.clientName,
      sequenceOrder: body.sequenceOrder ?? appt.sequenceOrder,
      title: body.title ?? appt.title,
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getSessionUser();
  if (!userId) return unauthorized();

  const { id } = await params;

  const appt = await prisma.appointment.findFirst({ where: { id, userId } });
  if (!appt) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.appointment.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
