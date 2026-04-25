import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { requireAuth } from "@/lib/rbac";

const prisma = new PrismaClient();

// PATCH /api/appeals/[id]
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { user, error } = await requireAuth();
  if (error) return error;

  const id = params.id;
  const body = await request.json();
  const { status, currentAuthority, currentStep } = body;

  try {
    const updated = await prisma.appeal.update({
      where: { id },
      data: {
        ...(status ? { status } : {}),
        ...(currentAuthority ? { currentAuthority } : {}),
        ...(currentStep !== undefined ? { currentStep } : {}),
      },
      include: {
        student: { include: { user: { select: { name: true } } } },
        mark: { include: { course: true } },
        messages: {
          orderBy: { createdAt: "asc" },
          include: { author: { select: { name: true, role: true } } },
        },
      }
    });

    return NextResponse.json(updated);
  } catch (err: any) {
    console.error("Error updating appeal:", err);
    return NextResponse.json({ error: "Failed to update appeal" }, { status: 500 });
  }
}
