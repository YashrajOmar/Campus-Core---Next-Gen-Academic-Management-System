import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { requireAuth, requireRole } from "@/lib/rbac";

const prisma = new PrismaClient();

// GET /api/attendance — role-filtered
export async function GET(request: Request) {
  const { user, error } = await requireAuth();
  if (error) return error;

  const role = (user as any).role as string;
  const { searchParams } = new URL(request.url);
  const studentId = searchParams.get("studentId");
  const courseId = searchParams.get("courseId");

  const where: any = {};
  if (courseId) where.courseId = courseId;

  if (role === "STUDENT") {
    // Students only see their own attendance
    const profile = await prisma.student.findUnique({ where: { userId: (user as any).id } });
    if (!profile) return NextResponse.json([]);
    where.studentId = profile.id;
  } else if (role === "FACULTY") {
    // Faculty see attendance for their classes
    const profile = await prisma.faculty.findUnique({ where: { userId: (user as any).id } });
    if (!profile) return NextResponse.json([]);
    where.facultyId = profile.id;
  } else if (role === "PARENT") {
    if (!studentId) return NextResponse.json({ error: "studentId required for parent view." }, { status: 400 });
    where.studentId = studentId;
  }
  // ADMIN, HOD, COORDINATOR see all (with optional filters)

  const attendance = await prisma.attendance.findMany({
    where,
    include: {
      student: { include: { user: { select: { name: true } } } },
      course: true,
    },
    orderBy: { date: "desc" },
    take: 200,
  });

  return NextResponse.json(attendance);
}

// POST /api/attendance — Faculty, Admin only
export async function POST(request: Request) {
  const { user, error } = await requireRole(["FACULTY", "ADMIN", "HOD"]);
  if (error) return error;

  const { studentId, courseId, status } = await request.json();
  if (!studentId || !courseId || !status) {
    return NextResponse.json({ error: "studentId, courseId, status are required." }, { status: 400 });
  }

  const faculty = await prisma.faculty.findUnique({ where: { userId: (user as any).id } });
  const facultyId = faculty?.id || "system";

  const record = await prisma.attendance.create({
    data: { studentId, courseId, facultyId, status },
  });

  return NextResponse.json(record, { status: 201 });
}
