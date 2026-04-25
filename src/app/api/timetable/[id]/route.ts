import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { requireRole } from "@/lib/rbac";

const prisma = new PrismaClient();

// PATCH /api/timetable/[id] — Admin + Coordinator + HOD + Faculty
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const { error } = await requireRole(["ADMIN", "COORDINATOR", "HOD", "FACULTY"]);
  if (error) return error;

  const body = await request.json();
  try {
    const updated = await prisma.timetable.update({
      where: { id: params.id },
      data: {
        ...(body.room !== undefined && { room: body.room }),
        ...(body.startTime && { startTime: body.startTime }),
        ...(body.endTime && { endTime: body.endTime }),
        ...(body.dayOfWeek && { dayOfWeek: body.dayOfWeek }),
      },
      include: { course: true },
    });
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Failed to update timetable slot." }, { status: 500 });
  }
}

// DELETE /api/timetable/[id] — Admin + Coordinator + HOD
export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const { error } = await requireRole(["ADMIN", "COORDINATOR", "HOD"]);
  if (error) return error;

  try {
    await prisma.timetable.delete({ where: { id: params.id } });
    return NextResponse.json({ message: "Timetable slot deleted." });
  } catch {
    return NextResponse.json({ error: "Failed to delete timetable slot." }, { status: 500 });
  }
}
