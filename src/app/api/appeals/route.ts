import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { requireAuth, requireRole } from "@/lib/rbac";

// 1. Prevent Prisma Client connection exhaustion in Next.js development
const globalForPrisma = global as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== "development") globalForPrisma.prisma = prisma;

// 2. Ensure GET route isn't aggressively cached by Next.js
export const dynamic = "force-dynamic";

// GET /api/appeals - all authenticated users (filtered by role)
export async function GET(request: Request) {
  try {
    const { user, error } = await requireAuth();
    if (error) return error;

    const role = (user as any).role as string;
    const where: any = {};

    if (role === "STUDENT") {
      const profile = await prisma.student.findUnique({ 
        where: { userId: (user as any).id } 
      });
      if (!profile) return NextResponse.json([]);
      where.studentId = profile.id;
    }
    // Staff roles (Admin / HOD / Faculty / Coordinator) see all appeals

    const appeals = await prisma.appeal.findMany({
      where,
      include: {
        student: { include: { user: { select: { name: true } } } },
        mark: { include: { course: true } },
        messages: {
          orderBy: { createdAt: "asc" },
          include: { author: { select: { name: true, role: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(appeals);
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to fetch appeals" }, { status: 500 });
  }
}

// POST /api/appeals - Students only
export async function POST(request: Request) {
  try {
    const { user, error } = await requireRole(["STUDENT"]);
    if (error) return error;

    // 3. Prevent crashes if the body is empty or malformed
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
    }

    const markId = body.markId || body.subject; // Fallback mapping
    const reason = body.reason || body.description; // Fallback mapping

    if (!markId || !reason) {
      return NextResponse.json(
        { error: "subject (or markId) and description (or reason) are required." }, 
        { status: 400 }
      );
    }

    let profile: any = await prisma.student.findUnique({ 
      where: { userId: (user as any).id }, 
      include: { marks: true } 
    });

    if (!profile) {
      profile = await prisma.student.create({
        data: {
          userId: (user as any).id,
          enrollmentNumber: "STU" + Math.floor(Math.random() * 100000),
          department: "General",
          currentSemester: 1,
        },
        include: { marks: true }
      });
    }

    // 4. Strict UUID Check (Removed `|| markId.length > 20` to prevent crashes with long subject names)
    let finalMarkId = markId;
    const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(markId);

    if (!isUuid) {
      if (profile.marks && profile.marks.length > 0) {
        finalMarkId = profile.marks[0].id; 
      } else {
        // Dummy fallback logic for empty marks
        const defaultCourse = await prisma.course.findFirst();
        const defaultFaculty = await prisma.faculty.findFirst();
        if (!defaultCourse || !defaultFaculty) {
           return NextResponse.json(
             { error: "No courses or faculties exist in DB to map dummy appeal to." }, 
             { status: 400 }
           );
        }
        const newMark = await prisma.mark.create({
           data: {
             studentId: profile.id,
             courseId: defaultCourse.id,
             facultyId: defaultFaculty.id,
             marksObtained: 0,
             totalMarks: 100,
             topic: "General Appeal Placeholder"
           }
        });
        finalMarkId = newMark.id;
      }
    }

    const appeal = await prisma.appeal.create({
      data: { markId: finalMarkId, studentId: profile.id, reason },
    });

    return NextResponse.json(appeal, { status: 201 });

  } catch (err: any) {
    console.error("POST Appeal Error:", err);
    return NextResponse.json({ error: "Failed to create appeal. Ensure inputs are valid." }, { status: 500 });
  }
}

// PATCH /api/appeals - Staff can escalate / resolve / reject
export async function PATCH(request: Request) {
  try {
    const { error } = await requireRole(["ADMIN", "HOD", "COORDINATOR", "FACULTY"]);
    if (error) return error;

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
    }

    const { id, status, currentAuthority, currentStep } = body;
    if (!id) return NextResponse.json({ error: "Appeal id is required." }, { status: 400 });

    const updated = await prisma.appeal.update({
      where: { id },
      data: {
        ...(status ? { status } : {}),
        ...(currentAuthority ? { currentAuthority } : {}),
        ...(currentStep != null ? { currentStep } : {}),
      },
    });

    return NextResponse.json(updated);
  } catch (err: any) {
    console.error("PATCH Appeal Error:", err);
    // Handle Prisma "Record to update not found" error safely
    if (err.code === 'P2025') {
      return NextResponse.json({ error: "Appeal not found." }, { status: 404 });
    }
    return NextResponse.json({ error: "Failed to update appeal." }, { status: 500 });
  }
}