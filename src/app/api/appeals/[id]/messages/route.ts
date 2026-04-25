import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { requireAuth, requireRole } from "@/lib/rbac";

const prisma = new PrismaClient();

// GET /api/appeals/[id]/messages
export async function GET(_: Request, { params }: { params: { id: string } }) {
  const { error } = await requireAuth();
  if (error) return error;

  const messages = await prisma.appealMessage.findMany({
    where: { appealId: params.id },
    orderBy: { createdAt: "asc" },
    include: { author: { select: { name: true, role: true } } },
  });

  return NextResponse.json(messages);
}

// POST /api/appeals/[id]/messages — any authenticated user (student or staff)
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const { user, error } = await requireAuth();
  if (error) return error;

  const { text } = await request.json();
  if (!text?.trim()) {
    return NextResponse.json({ error: "Message text cannot be empty." }, { status: 400 });
  }

  const appeal = await prisma.appeal.findUnique({ where: { id: params.id } });
  if (!appeal) return NextResponse.json({ error: "Appeal not found." }, { status: 404 });

  if (appeal.status === "RESOLVED" || appeal.status === "REJECTED") {
    return NextResponse.json({ error: "This appeal is closed. No more messages can be sent." }, { status: 400 });
  }

  const message = await prisma.appealMessage.create({
    data: {
      appealId: params.id,
      authorId: (user as any).id,
      authorRole: (user as any).role,
      text: text.trim(),
    },
    include: { author: { select: { name: true, role: true } } },
  });

  return NextResponse.json(message, { status: 201 });
}
