import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { requireAuth } from "@/lib/rbac";

// 1. Prevent Prisma connection exhaustion in Next.js development
const globalForPrisma = global as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== "development") globalForPrisma.prisma = prisma;

// GET /api/appeals/[id]/messages
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { error } = await requireAuth();
    if (error) return error;

    const messages = await prisma.appealMessage.findMany({
      where: { appealId: id },
      orderBy: { createdAt: "asc" },
      include: { author: { select: { name: true, role: true } } },
    });

    return NextResponse.json(messages);
  } catch (err) {
    console.error("GET Messages Error:", err);
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
  }
}

// POST /api/appeals/[id]/messages — any authenticated user (student or staff)
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { user, error } = await requireAuth();
    if (error) return error;

    // 2. Wrap JSON parsing in try/catch to prevent 500 crashes on empty body
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
    }

    const { text } = body;
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
  } catch (err) {
    console.error("POST Message Error:", err);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}