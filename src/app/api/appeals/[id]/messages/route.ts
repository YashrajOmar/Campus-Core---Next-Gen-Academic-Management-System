import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { requireAuth, requireRole } from "@/lib/rbac";

const prisma = new PrismaClient();

// GET /api/appeals/[id]/messages
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { error } = await requireAuth();
  if (error) return error;

  const messages = await prisma.appealMessage.findMany({
    where: { appealId: id },
    orderBy: { createdAt: "asc" },
    include: { author: { select: { name: true, role: true } } },
  });

  return NextResponse.json(messages);
}

// POST /api/appeals/[id]/messages — any authenticated user (student or staff)
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { user, error } = await requireAuth();
  if (error) return error;

  const { text } = await request.json();
  if (!text?.trim()) {
    return NextResponse.json({ error: "Message text cannot be empty." }, { status: 400 });
  }

  const appeal = await prisma.appeal.findUnique({ where: { id } });
  if (!appeal) return NextResponse.json({ error: "Appeal not found." }, { status: 404 });

  if (appeal.status === "RESOLVED" || appeal.status === "REJECTED") {
    return NextResponse.json({ error: "This appeal is closed. No more messages can be sent." }, { status: 400 });
  }

  const message = await prisma.appealMessage.create({
    data: {
      appealId: id,
      authorId: (user as any).id,
      authorRole: (user as any).role,
      text: text.trim(),
    },
    include: { author: { select: { name: true, role: true } } },
  });

  return NextResponse.json(message, { status: 201 });
}
