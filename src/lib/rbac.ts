import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "./auth";

export type UserRole = "ADMIN" | "HOD" | "COORDINATOR" | "FACULTY" | "STUDENT" | "PARENT";

/** Roles that have elevated / staff privileges */
export const STAFF_ROLES: UserRole[] = ["ADMIN", "HOD", "COORDINATOR", "FACULTY"];

/** Returns the session, or throws a 401 / 403 response if access is denied.
 *  Usage inside any API route:
 *    const { user } = await requireRole(request, ["ADMIN", "HOD"]);
 */
export async function requireRole(allowedRoles: UserRole[]) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return {
      user: null,
      error: NextResponse.json({ error: "Unauthorized: You must be logged in." }, { status: 401 }),
    };
  }

  const userRole = (session.user as any).role as UserRole;

  if (!allowedRoles.includes(userRole)) {
    return {
      user: null,
      error: NextResponse.json(
        { error: `Forbidden: Role '${userRole}' is not permitted to perform this action.` },
        { status: 403 }
      ),
    };
  }

  return { user: session.user as { id: string; name: string; email: string; role: UserRole }, error: null };
}

/** Helper to get any authenticated session (no role restriction). */
export async function requireAuth() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return {
      user: null,
      error: NextResponse.json({ error: "Unauthorized: You must be logged in." }, { status: 401 }),
    };
  }

  return { user: session.user as { id: string; name: string; email: string; role: UserRole }, error: null };
}
