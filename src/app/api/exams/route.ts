import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { requireAuth, requireRole } from "@/lib/rbac";

const prisma = new PrismaClient();

// GET /api/exams — all authenticated users
export async function GET(request: Request) {
  const { error } = await requireAuth();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const department = searchParams.get("department");
  const semester = searchParams.get("semester");

  const exams = await prisma.examSchedule.findMany({
    where: {
      ...(department ? { department } : {}),
      ...(semester ? { semester: parseInt(semester) } : {}),
    },
    orderBy: { examDate: "asc" },
  });

  return NextResponse.json(exams);
}

// POST /api/exams — Admin + Coordinator
export async function POST(request: Request) {
  const { error } = await requireRole(["ADMIN", "COORDINATOR", "HOD", "FACULTY"]);
  if (error) return error;

  const body = await request.json();
  const { courseCode, courseName, examDate, startTime, room, department, semester, type } = body;

  if (!courseCode || !courseName || !examDate || !startTime || !department) {
    return NextResponse.json({ error: "courseCode, courseName, examDate, startTime, department are required." }, { status: 400 });
  }

  const exam = await prisma.examSchedule.create({
    data: {
      courseCode,
      courseName,
      examDate: new Date(examDate),
      startTime,
      room: room || null,
      department,
      semester: semester || 1,
      type: type || "MIDTERM",
    },
  });

  return NextResponse.json(exam, { status: 201 });
}

// DELETE /api/exams — Admin only
export async function DELETE(request: Request) {
  const { error } = await requireRole(["ADMIN"]);
  if (error) return error;

  const { id } = await request.json();
  await prisma.examSchedule.delete({ where: { id } });
  return NextResponse.json({ message: "Exam schedule removed." });
}
