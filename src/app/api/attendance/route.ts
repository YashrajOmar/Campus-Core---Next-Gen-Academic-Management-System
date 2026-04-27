import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { requireAuth, requireRole } from "@/lib/rbac";

const prisma = new PrismaClient();

// GET /api/attendance - role-filtered
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
    if (studentId) {
      where.studentId = studentId;
    } else {
      const parent = await prisma.parent.findUnique({
        where: { userId: (user as any).id },
        include: { students: true }
      });
      if (!parent || parent.students.length === 0) return NextResponse.json([]);
      where.studentId = { in: parent.students.map(ps => ps.studentId) };
    }
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

// POST /api/attendance - Faculty, Admin only
export async function POST(request: Request) {
  const { user, error } = await requireRole(["FACULTY", "ADMIN", "HOD", "COORDINATOR"]);
  if (error) return error;

  const { studentId, courseId, status, date } = await request.json();
  if (!studentId || !courseId || !status) {
    return NextResponse.json({ error: "studentId, courseId, status are required." }, { status: 400 });
  }

  // Future date check
  const logDate = date ? new Date(date) : new Date();
  if (logDate > new Date()) {
    return NextResponse.json({ error: "Cannot log attendance for a future date." }, { status: 400 });
  }

  // Find faculty profile
  let facultyProfile = await prisma.faculty.findUnique({ where: { userId: (user as any).id } });
  
  // If user is Admin but has no faculty profile, find ANY faculty or create a system one to satisfy relation
  if (!facultyProfile) {
    facultyProfile = await prisma.faculty.findFirst(); 
    if (!facultyProfile) {
      // Create a fallback faculty if none exists (required by schema relation)
      const systemUser = await prisma.user.findFirst({ where: { role: "ADMIN" } });
      if (systemUser) {
        facultyProfile = await prisma.faculty.upsert({
          where: { userId: systemUser.id },
          update: {},
          create: { userId: systemUser.id, department: "SYSTEM" }
        });
      }
    }
  }

  if (!facultyProfile) return NextResponse.json({ error: "No faculty profile found to assign this record." }, { status: 500 });

  const record = await prisma.attendance.create({
    data: { 
      studentId, 
      courseId, 
      facultyId: facultyProfile.id, 
      status,
      date: logDate
    },
  });

  return NextResponse.json(record, { status: 201 });
}

