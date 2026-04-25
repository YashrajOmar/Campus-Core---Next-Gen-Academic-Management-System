import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { requireRole } from "@/lib/rbac";

const prisma = new PrismaClient();

// GET /api/users â€” Admin: all users | Coordinator: their dept only
export async function GET(request: Request) {
  const { user, error } = await requireRole(["ADMIN", "COORDINATOR"]);
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const department = searchParams.get("department");
  const role = searchParams.get("role");

  const where: any = {};

  // Coordinators can ONLY see their own department
  if ((user as any).role === "COORDINATOR") {
    // Coordinator's dept is stored on their User record
    const coordinatorUser = await prisma.user.findUnique({ where: { id: (user as any).id } });
    if (coordinatorUser?.department) {
      where.department = coordinatorUser.department;
    }
    // Coordinators cannot see Admin accounts
    where.role = { notIn: ["ADMIN"] };
  } else {
    // Admin can filter optionally
    if (department) where.department = department;
    if (role) where.role = role;
  }

  const users = await prisma.user.findMany({
    where,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isVerified: true,
      department: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(users);
}

// PATCH /api/users â€” approve or update a user
export async function PATCH(request: Request) {
  const { user, error } = await requireRole(["ADMIN", "COORDINATOR"]);
  if (error) return error;

  const body = await request.json();
  const { userId, isVerified, role: newRole, department } = body;

  if (!userId) return NextResponse.json({ error: "userId is required." }, { status: 400 });

  const targetUser = await prisma.user.findUnique({ where: { id: userId } });
  if (!targetUser) return NextResponse.json({ error: "User not found." }, { status: 404 });

  // Coordinators cannot change Admin accounts
  if ((user as any).role === "COORDINATOR" && targetUser.role === "ADMIN") {
    return NextResponse.json({ error: "Coordinators cannot modify Admin accounts." }, { status: 403 });
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(isVerified !== undefined ? { isVerified } : {}),
      ...(newRole ? { role: newRole } : {}),
      ...(department !== undefined ? { department } : {}),
    },
    select: { id: true, name: true, email: true, role: true, isVerified: true, department: true },
  });

  return NextResponse.json(updated);
}

// DELETE /api/users â€” Admin only
export async function DELETE(request: Request) {
  const { error } = await requireRole(["ADMIN"]);
  if (error) return error;

  const { userId } = await request.json();
  if (!userId) return NextResponse.json({ error: "userId is required." }, { status: 400 });

  await prisma.user.delete({ where: { id: userId } });
  return NextResponse.json({ message: "User deleted." });
}

