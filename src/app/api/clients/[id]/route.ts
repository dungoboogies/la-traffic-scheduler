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

  const client = await prisma.client.findFirst({ where: { id, userId } });
  if (!client) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await prisma.client.update({
    where: { id },
    data: {
      name: body.name ?? client.name,
      defaultRate: body.defaultRate ? parseFloat(body.defaultRate) : client.defaultRate,
      address: body.address ?? client.address,
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
  const client = await prisma.client.findFirst({ where: { id, userId } });
  if (!client) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.client.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
