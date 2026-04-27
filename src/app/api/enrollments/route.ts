import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { requireAuth, requireRole } from "@/lib/rbac";

const prisma = new PrismaClient();

// GET /api/enrollments
export async function GET(request: Request) {
  const { user, error } = await requireAuth();
  if (error) return error;

  const role = (user as any).role as string;
  const where: any = {};

  if (role === "STUDENT") {
    const profile = await prisma.student.findUnique({ where: { userId: (user as any).id } });
    if (!profile) return NextResponse.json([]);
    where.studentId = profile.id;
  } else if (role === "PARENT") {
    const parent = await prisma.parent.findUnique({
      where: { userId: (user as any).id },
      include: { students: true }
    });
    if (!parent || parent.students.length === 0) return NextResponse.json([]);
    where.studentId = { in: parent.students.map(ps => ps.studentId) };
  }
  // Staff see all enrollments

  const enrollments = await prisma.enrollment.findMany({
    where,
    include: {
      student: { include: { user: { select: { name: true, email: true } } } },
      course: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(enrollments);
}

// POST /api/enrollments - Students apply for a course
export async function POST(request: Request) {
  const { user, error } = await requireRole(["STUDENT"]);
  if (error) return error;

  const { courseId } = await request.json();
  if (!courseId) return NextResponse.json({ error: "courseId is required." }, { status: 400 });

  const profile = await prisma.student.findUnique({ where: { userId: (user as any).id } });
  if (!profile) return NextResponse.json({ error: "Student profile not found." }, { status: 404 });

  // Check if already enrolled or pending
  const existing = await prisma.enrollment.findUnique({
    where: { studentId_courseId: { studentId: profile.id, courseId } }
  });

  if (existing) {
    return NextResponse.json({ error: `You have already applied for this course. Status: ${existing.status}` }, { status: 400 });
  }

  const enrollment = await prisma.enrollment.create({
    data: {
      studentId: profile.id,
      courseId,
      status: "PENDING",
    },
    include: { course: true }
  });

  return NextResponse.json(enrollment, { status: 201 });
}

// PATCH /api/enrollments - Staff approve/reject
export async function PATCH(request: Request) {
  const { error } = await requireRole(["ADMIN", "HOD", "COORDINATOR", "FACULTY"]);
  if (error) return error;

  const { id, status } = await request.json();
  if (!id || !status) return NextResponse.json({ error: "id and status are required." }, { status: 400 });

  const updated = await prisma.enrollment.update({
    where: { id },
    data: { status },
    include: {
      student: { include: { user: { select: { name: true, email: true } } } },
      course: true,
    }
  });

  return NextResponse.json(updated);
}

