import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { requireAuth, requireRole } from "@/lib/rbac";
import { z } from "zod";

const prisma = new PrismaClient();

const noticeSchema = z.object({
  title: z.string().min(1, "Title is required."),
  content: z.string().min(1, "Content is required."),
  category: z.string().optional(),
  department: z.string().optional().nullable(),
});

// GET /api/notices - all authenticated users
export async function GET() {
  const { error } = await requireAuth();
  if (error) return error;

  const notices = await prisma.notice.findMany({
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(notices);
}

// POST /api/notices - Admin, HOD, Coordinator
export async function POST(request: Request) {
  const { user, error } = await requireRole(["ADMIN", "HOD", "COORDINATOR", "FACULTY"]);
  if (error) return error;

  try {
    const body = await request.json();
    const validatedData = noticeSchema.parse(body);

    const notice = await prisma.notice.create({
      data: {
        title: validatedData.title,
        content: validatedData.content,
        category: validatedData.category || "GENERAL",
        department: validatedData.department || null,
        authorId: (user as any).id,
      },
    });

    return NextResponse.json(notice, { status: 201 });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create notice." }, { status: 500 });
  }
}

// DELETE /api/notices/[id] - Admin only (inline handler for simplicity)
export async function DELETE(request: Request) {
  const { error } = await requireRole(["ADMIN"]);
  if (error) return error;

  const { id } = await request.json();
  await prisma.notice.delete({ where: { id } });
  return NextResponse.json({ message: "Notice deleted." });
}

