import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const PRIVILEGED_ROLES = ["ADMIN", "HOD", "FACULTY", "COORDINATOR"];
const VALID_ADMIN_CODE = process.env.ADMIN_CODE || "CAMPUS2026";

export async function POST(request: Request) {
  try {
    const { name, email, password, role } = await request.json();

    if (!email || !password || !name) {
      return NextResponse.json({ error: "Name, email, and password are required." }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Privileged roles start as unverified until an Admin approves them
    const isPrivileged = PRIVILEGED_ROLES.includes(role);
    const isVerified = !isPrivileged; // Students/Parents are auto-verified

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash: hashedPassword,
        role: role || "STUDENT",
        isVerified,
      },
    });

    return NextResponse.json(
      {
        message: isPrivileged
          ? "Account created! An administrator must approve your account before you can log in."
          : "Account created successfully!",
        userId: user.id,
        pendingApproval: isPrivileged,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
