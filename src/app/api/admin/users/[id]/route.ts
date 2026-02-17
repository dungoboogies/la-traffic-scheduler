import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, requireAdmin, unauthorized, forbidden } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getSessionUser();
  if (!userId) return unauthorized();
  if (!(await requireAdmin())) return forbidden();

  const { id } = await params;
  const body = await req.json();

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const data: Record<string, unknown> = {};
  if (body.status !== undefined) data.status = body.status;
  if (body.role !== undefined) data.role = body.role;

  const updated = await prisma.user.update({ where: { id }, data });
  return NextResponse.json({ id: updated.id, status: updated.status, role: updated.role });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getSessionUser();
  if (!userId) return unauthorized();
  if (!(await requireAdmin())) return forbidden();

  const { id } = await params;

  // Don't allow deleting yourself
  if (id === userId) {
    return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 });
  }

  await prisma.user.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
