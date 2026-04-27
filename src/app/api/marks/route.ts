import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { requireAuth, requireRole } from "@/lib/rbac";

const prisma = new PrismaClient();

// GET /api/marks - role-filtered
export async function GET(request: Request) {
  const { user, error } = await requireAuth();
  if (error) return error;

  const role = (user as any).role as string;
  const { searchParams } = new URL(request.url);
  const courseId = searchParams.get("courseId");

  const where: any = {};
  if (courseId) where.courseId = courseId;

  // Students and Parents see only own / their child's marks
  if (role === "STUDENT") {
    const profile = await prisma.student.findUnique({ where: { userId: (user as any).id } });
    if (!profile) return NextResponse.json([]);
    where.studentId = profile.id;
  } else if (role === "PARENT") {
    const parent = await prisma.parent.findUnique({ where: { userId: (user as any).id }, include: { students: true } });
    if (!parent || parent.students.length === 0) return NextResponse.json([]);
    where.studentId = { in: parent.students.map((ps: any) => ps.studentId) };
  } else if (role === "FACULTY") {
    const profile = await prisma.faculty.findUnique({ where: { userId: (user as any).id } });
    if (!profile) return NextResponse.json([]);
    where.facultyId = profile.id;
  }
  // Admin/HOD/Coordinator see all

  const marks = await prisma.mark.findMany({
    where,
    include: {
      student: { include: { user: { select: { name: true, email: true } } } },
      course: true,
    },
    orderBy: { id: "desc" },
    take: 200,
  });

  return NextResponse.json(marks);
}

// POST /api/marks - Faculty + Admin
export async function POST(request: Request) {
  const { user, error } = await requireRole(["FACULTY", "ADMIN", "HOD", "COORDINATOR"]);
  if (error) return error;

  const { studentId, courseId, marksObtained, totalMarks, topic, status } = await request.json();
  if (!studentId || !courseId || marksObtained == null || totalMarks == null) {
    return NextResponse.json({ error: "studentId, courseId, marksObtained, totalMarks are required." }, { status: 400 });
  }

  const faculty = await prisma.faculty.findUnique({ where: { userId: (user as any).id } });
  if (!faculty) {
    const anyFaculty = await prisma.faculty.findFirst();
    if (!anyFaculty) {
      return NextResponse.json({ error: "No faculty found in system to assign these marks to." }, { status: 400 });
    }
    var facultyIdToUse = anyFaculty.id;
  } else {
    var facultyIdToUse = faculty.id;
  }

  // Find the actual Student record
  const studentRecord = await prisma.student.findFirst({ where: { OR: [{ id: studentId }, { userId: studentId }] } });
  if (!studentRecord) {
    return NextResponse.json({ error: "Student profile not found for this user." }, { status: 404 });
  }

  const mark = await prisma.mark.create({
    data: {
      studentId: studentRecord.id,
      courseId,
      facultyId: facultyIdToUse,
      marksObtained,
      totalMarks,
      topic: topic || null,
      status: status || "DRAFT",
    },
  });

  return NextResponse.json(mark, { status: 201 });
}

// PATCH /api/marks - update a mark (Faculty + Admin)
export async function PATCH(request: Request) {
  const { error } = await requireRole(["FACULTY", "ADMIN", "HOD"]);
  if (error) return error;

  const { id, ...data } = await request.json();
  if (!id) return NextResponse.json({ error: "Mark id is required." }, { status: 400 });

  const updated = await prisma.mark.update({ where: { id }, data });
  return NextResponse.json(updated);
}



