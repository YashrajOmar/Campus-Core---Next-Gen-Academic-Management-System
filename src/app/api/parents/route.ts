import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { requireAuth, requireRole } from "@/lib/rbac";

const prisma = new PrismaClient();

// GET /api/parents?parentUserId=abc
// Admin/Coordinator can fetch linked students for a specific parent user
export async function GET(request: Request) {
  const { error } = await requireRole(["ADMIN", "COORDINATOR", "PARENT"]);
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const parentUserId = searchParams.get("parentUserId");
  
  if (!parentUserId) {
    return NextResponse.json({ error: "parentUserId is required" }, { status: 400 });
  }

  const parent = await prisma.parent.findUnique({
    where: { userId: parentUserId },
    include: {
      students: {
        include: {
          student: {
            include: { user: { select: { name: true, email: true } } }
          }
        }
      }
    }
  });

  return NextResponse.json(parent?.students.map(ps => ps.student) || []);
}

// POST /api/parents
// Link a student to a parent
export async function POST(request: Request) {
  const { error } = await requireRole(["ADMIN", "COORDINATOR"]);
  if (error) return error;

  const { parentUserId, studentUserId } = await request.json();
  if (!parentUserId || !studentUserId) {
    return NextResponse.json({ error: "parentUserId and studentUserId are required" }, { status: 400 });
  }

  const student = await prisma.student.findUnique({ where: { userId: studentUserId } });
  if (!student) {
    return NextResponse.json({ error: "Student profile not found. The student must log in at least once to initialize." }, { status: 404 });
  }

  // Find or create Parent record
  let parent = await prisma.parent.findUnique({ where: { userId: parentUserId } });
  if (!parent) {
    parent = await prisma.parent.create({ data: { userId: parentUserId } });
  }

  // Check if link already exists
  const existing = await prisma.parentStudent.findUnique({
    where: { parentId_studentId: { parentId: parent.id, studentId: student.id } }
  });

  if (existing) {
    return NextResponse.json({ error: "Student is already linked to this parent" }, { status: 400 });
  }

  const link = await prisma.parentStudent.create({
    data: { parentId: parent.id, studentId: student.id },
    include: { student: { include: { user: { select: { name: true, email: true } } } } }
  });

  return NextResponse.json(link.student, { status: 201 });
}

// DELETE /api/parents
// Unlink a student from a parent
export async function DELETE(request: Request) {
  const { error } = await requireRole(["ADMIN", "COORDINATOR"]);
  if (error) return error;

  const { parentUserId, studentUserId } = await request.json();
  if (!parentUserId || !studentUserId) return NextResponse.json({ error: "parentUserId and studentUserId are required" }, { status: 400 });

  const student = await prisma.student.findUnique({ where: { userId: studentUserId } });
  if (!student) return NextResponse.json({ error: "Student profile not found" }, { status: 404 });

  const parent = await prisma.parent.findUnique({ where: { userId: parentUserId } });
  if (!parent) return NextResponse.json({ error: "Parent profile not found" }, { status: 404 });

  await prisma.parentStudent.delete({
    where: { parentId_studentId: { parentId: parent.id, studentId: student.id } }
  }).catch(() => {}); // ignore if doesn't exist

  return NextResponse.json({ success: true });
}
