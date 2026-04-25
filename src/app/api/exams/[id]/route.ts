import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { requireRole } from "@/lib/rbac";

const prisma = new PrismaClient();

// PATCH /api/exams/[id] — Admin + Coordinator + HOD + Faculty
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const { error } = await requireRole(["ADMIN", "COORDINATOR", "HOD", "FACULTY"]);
  if (error) return error;

  const body = await request.json();
  try {
    const data: any = {};
    if (body.courseCode) data.courseCode = body.courseCode;
    if (body.courseName) data.courseName = body.courseName;
    if (body.examDate) data.examDate = new Date(body.examDate);
    if (body.startTime) data.startTime = body.startTime;
    if (body.room !== undefined) data.room = body.room;
    if (body.department) data.department = body.department;
    if (body.type) data.type = body.type;

    const updated = await prisma.examSchedule.update({ where: { id: params.id }, data });
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Failed to update exam." }, { status: 500 });
  }
}

// DELETE /api/exams/[id] — Admin + HOD
export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const { error } = await requireRole(["ADMIN", "HOD"]);
  if (error) return error;

  try {
    await prisma.examSchedule.delete({ where: { id: params.id } });
    return NextResponse.json({ message: "Exam deleted." });
  } catch {
    return NextResponse.json({ error: "Failed to delete exam." }, { status: 500 });
  }
}
