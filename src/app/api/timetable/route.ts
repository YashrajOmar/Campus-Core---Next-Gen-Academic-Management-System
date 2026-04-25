import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { requireAuth, requireRole } from "@/lib/rbac";

const prisma = new PrismaClient();

// GET /api/timetable — all authenticated users, filtered by dept/semester
export async function GET(request: Request) {
  const { user, error } = await requireAuth();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const department = searchParams.get("department");
  const semester = searchParams.get("semester");

  const timetables = await prisma.timetable.findMany({
    where: {
      ...(department ? { department } : {}),
      ...(semester ? { semester: parseInt(semester) } : {}),
    },
    include: { course: { include: { faculty: { include: { user: { select: { name: true } } } } } } },
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
  });

  return NextResponse.json(timetables);
}

// POST /api/timetable — Admin + Coordinator
export async function POST(request: Request) {
  const { error } = await requireRole(["ADMIN", "COORDINATOR", "HOD", "FACULTY"]);
  if (error) return error;

  const body = await request.json();
  const { courseId, dayOfWeek, startTime, endTime, room, department, semester } = body;

  if (!courseId || !dayOfWeek || !startTime || !endTime || !department) {
    return NextResponse.json({ error: "courseId, dayOfWeek, startTime, endTime, department are required." }, { status: 400 });
  }

  const slot = await prisma.timetable.create({
    data: { courseId, dayOfWeek, startTime, endTime, room: room || null, department, semester: semester || 1 },
    include: { course: true },
  });

  return NextResponse.json(slot, { status: 201 });
}

// DELETE /api/timetable — Admin + Coordinator
export async function DELETE(request: Request) {
  const { error } = await requireRole(["ADMIN", "COORDINATOR"]);
  if (error) return error;

  const { id } = await request.json();
  await prisma.timetable.delete({ where: { id } });
  return NextResponse.json({ message: "Timetable slot removed." });
}
