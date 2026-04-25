import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { requireRole, requireAuth } from "@/lib/rbac";
import { z } from "zod";

const prisma = new PrismaClient();

const courseSchema = z.object({
  courseCode: z.string().min(1, "Course code is required."),
  courseName: z.string().min(1, "Course name is required."),
  credits: z.number().int().optional(),
  department: z.string().min(1, "Department is required."),
  semester: z.number().int().optional(),
  facultyId: z.string().optional().nullable(),
});

// GET /api/courses - All authenticated users can list courses
export async function GET() {
  const { error } = await requireAuth();
  if (error) return error;

  const courses = await prisma.course.findMany({
    orderBy: { courseCode: "asc" },
    include: { faculty: { include: { user: { select: { name: true } } } } },
  });

  return NextResponse.json(courses);
}

// POST /api/courses - Admin + Coordinator only
export async function POST(request: Request) {
  const { user, error } = await requireRole(["ADMIN", "COORDINATOR", "HOD", "FACULTY"]);
  if (error) return error;

  try {
    const body = await request.json();
    const validatedData = courseSchema.parse(body);

    const course = await prisma.course.create({
      data: {
        courseCode: validatedData.courseCode,
        courseName: validatedData.courseName,
        credits: validatedData.credits || 3,
        department: validatedData.department,
        semester: validatedData.semester || 1,
        facultyId: validatedData.facultyId || null,
      },
    });
    return NextResponse.json(course, { status: 201 });
  } catch (e: any) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.errors[0].message }, { status: 400 });
    }
    if (e.code === "P2002") return NextResponse.json({ error: "Course code already exists." }, { status: 409 });
    return NextResponse.json({ error: "Failed to create course." }, { status: 500 });
  }
}
