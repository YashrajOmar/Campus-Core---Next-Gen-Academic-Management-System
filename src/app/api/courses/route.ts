import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { requireRole, requireAuth } from "@/lib/rbac";
import { z } from "zod";

// 1. Prevent Prisma Client connection exhaustion in Next.js development
const globalForPrisma = global as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== "development") globalForPrisma.prisma = prisma;

// 2. Ensure GET route isn't aggressively cached by Next.js
export const dynamic = "force-dynamic";

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
  try {
    const { error } = await requireAuth();
    if (error) return error;

    const courses = await prisma.course.findMany({
      orderBy: { courseCode: "asc" },
      include: { faculty: { include: { user: { select: { name: true } } } } },
    });

    return NextResponse.json(courses);
  } catch (err) {
    console.error("GET Courses Error:", err);
    return NextResponse.json({ error: "Failed to fetch courses" }, { status: 500 });
  }
}

// POST /api/courses - Admin + Coordinator only
export async function POST(request: Request) {
  const { user, error } = await requireRole(["ADMIN", "COORDINATOR", "HOD", "FACULTY"]);
  if (error) return error;

  try {
    // 3. Prevent 500 crashes if the body is completely empty or invalid JSON
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
    }

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
    // 4. Fix the TypeScript <unknown> Zod error
    if (e instanceof z.ZodError) {
      const zodError = e as z.ZodError<any>;
      return NextResponse.json({ error: zodError.issues[0].message }, { status: 400 });
    }
    
    // Catch Prisma unique constraint violations (e.g., duplicate courseCode)
    if (e.code === "P2002") {
      return NextResponse.json({ error: "Course code already exists." }, { status: 409 });
    }
    
    console.error("POST Course Error:", e);
    return NextResponse.json({ error: "Failed to create course." }, { status: 500 });
  }
}