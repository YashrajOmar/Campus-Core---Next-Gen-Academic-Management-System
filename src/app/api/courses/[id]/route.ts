import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { requireRole } from "@/lib/rbac";

const prisma = new PrismaClient();

// PATCH /api/courses/[id] - Admin + Coordinator + HOD + Faculty
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const { error } = await requireRole(["ADMIN", "COORDINATOR", "HOD", "FACULTY"]);
  if (error) return error;

  const body = await request.json();
  try {
    const updated = await prisma.course.update({
      where: { id: params.id },
      data: {
        ...(body.courseCode && { courseCode: body.courseCode }),
        ...(body.courseName && { courseName: body.courseName }),
        ...(body.credits !== undefined && { credits: Number(body.credits) }),
        ...(body.department && { department: body.department }),
        ...(body.semester !== undefined && { semester: Number(body.semester) }),
      },
    });
    return NextResponse.json(updated);
  } catch (e: any) {
    if (e.code === "P2002") return NextResponse.json({ error: "Course code already exists." }, { status: 409 });
    return NextResponse.json({ error: "Failed to update course." }, { status: 500 });
  }
}

// DELETE /api/courses/[id] - Admin + HOD only
export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const { error } = await requireRole(["ADMIN", "HOD"]);
  if (error) return error;

  try {
    await prisma.course.delete({ where: { id: params.id } });
    return NextResponse.json({ message: "Course deleted." });
  } catch {
    return NextResponse.json({ error: "Failed to delete course." }, { status: 500 });
  }
}
