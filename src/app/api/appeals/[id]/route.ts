import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { requireAuth } from "@/lib/rbac";

const prisma = new PrismaClient();

// PATCH /api/appeals/[id]
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { user, error } = await requireAuth();
  if (error) return error;

  const id = params.id;
  const body = await request.json();
  const { status, escalate } = body;

  const appeal = await prisma.appeal.findUnique({ where: { id } });
  if (!appeal) return NextResponse.json({ error: "Appeal not found." }, { status: 404 });

  // 1. Authority Check
  const AUTHORITY_RANK: Record<string, number> = { "INSTRUCTOR": 1, "COORDINATOR": 2, "HOD": 3, "ADMIN": 4 };
  const ROLE_RANK: Record<string, number> = { "FACULTY": 1, "COORDINATOR": 2, "HOD": 3, "ADMIN": 4 };

  const currentLevel = AUTHORITY_RANK[appeal.currentAuthority] || 1;
  const userLevel = ROLE_RANK[(user as any).role] || 0;

  // Student can only escalate if REJECTED
  if ((user as any).role === "STUDENT") {
    if (escalate && appeal.status === "REJECTED" && currentLevel < 4) {
      // Allow student to move it to next authority
    } else {
      return NextResponse.json({ error: "Students cannot modify appeal status directly." }, { status: 403 });
    }
  } else {
    // Staff must have equal or higher rank than the current authority to act
    if (userLevel < currentLevel) {
      return NextResponse.json({ error: `Insufficient authority. Only ${appeal.currentAuthority} or higher can act.` }, { status: 403 });
    }
  }

  // 2. Escalation Logic
  let nextAuthority = appeal.currentAuthority;
  let nextStep = appeal.currentStep;
  let nextStatus = status || appeal.status;

  if (escalate) {
    if (currentLevel >= 4) return NextResponse.json({ error: "Already at highest authority." }, { status: 400 });
    const ranks = ["INSTRUCTOR", "COORDINATOR", "HOD", "ADMIN"];
    nextAuthority = ranks[currentLevel]; // move to next
    nextStep = currentLevel + 1;
    nextStatus = "ESCALATED";
  }

  try {
    const updated = await prisma.appeal.update({
      where: { id },
      data: {
        status: nextStatus as any,
        currentAuthority: nextAuthority,
        currentStep: nextStep,
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
