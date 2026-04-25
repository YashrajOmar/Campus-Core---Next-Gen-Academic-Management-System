"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Modal, ModalTitle, ModalError, ModalField, ModalInput, ModalSelect, ModalSubmit, ModalRow, ModalHalf } from "@/components/Modal";

type User = {
  id: string;
  name: string | null;
  email: string;
  role: string;
  isVerified: boolean;
  department: string | null;
  createdAt: string;
};

const ROLE_COLORS: Record<string, string> = {
  ADMIN: "text-red-400 bg-red-500/10 border-red-500/20",
  HOD: "text-orange-400 bg-orange-500/10 border-orange-500/20",
  COORDINATOR: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
  FACULTY: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  STUDENT: "text-green-400 bg-green-500/10 border-green-500/20",
  PARENT: "text-purple-400 bg-purple-500/10 border-purple-500/20",
};

export default function UserManagementPage() {
  const { data: session, status } = useSession({ required: true });
  const router = useRouter();
  const userRole = (session?.user as any)?.role;

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterRole, setFilterRole] = useState("");
  const [filterVerified, setFilterVerified] = useState("all");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Edit Modal State
  const [editing, setEditing] = useState<User | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [f, setF] = useState({ role: "", department: "", isVerified: "false" });
  const [ferr, setFerr] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (status === "authenticated") {
      if (userRole !== "ADMIN" && userRole !== "COORDINATOR") {
        router.replace("/unauthorized");
        return;
      }
      fetchUsers();
    }
  }, [status, userRole]);

  async function fetchUsers() {
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/users");
      if (!res.ok) throw new Error("Failed to fetch users.");
      setUsers(await res.json());
    } catch (e: any) { setError(e.message); } finally { setLoading(false); }
  }

  async function handleApprove(userId: string) {
    setActionLoading(userId + "_approve");
    try {
      const res = await fetch("/api/users", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId, isVerified: true }) });
      if (!res.ok) throw new Error("Failed to approve user.");
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, isVerified: true } : u));
    } catch (e: any) { setError(e.message); } finally { setActionLoading(null); }
  }

  async function handleRevoke(userId: string) {
    setActionLoading(userId + "_revoke");
    try {
      const res = await fetch("/api/users", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId, isVerified: false }) });
      if (!res.ok) throw new Error("Failed to revoke access.");
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, isVerified: false } : u));
    } catch (e: any) { setError(e.message); } finally { setActionLoading(null); }
  }

  async function handleDelete(userId: string) {
    if (!confirm("Are you sure? This action cannot be undone.")) return;
    setActionLoading(userId + "_delete");
    try {
      const res = await fetch("/api/users", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId }) });
      if (!res.ok) throw new Error("Failed to delete user.");
      setUsers(prev => prev.filter(u => u.id !== userId));
    } catch (e: any) { setError(e.message); } finally { setActionLoading(null); }
  }

  function openEdit(u: User) {
    setEditing(u);
    setF({ role: u.role, department: u.department || "", isVerified: String(u.isVerified) });
    setFerr("");
    setShowModal(true);
  }

  async function submitEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setSaving(true); setFerr("");
    try {
      const res = await fetch("/api/users", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: editing.id, role: f.role, department: f.department.trim() || null, isVerified: f.isVerified === "true" })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update user.");
      setUsers(prev => prev.map(u => u.id === editing.id ? { ...u, ...data } : u));
      setShowModal(false);
    } catch (e: any) { setFerr(e.message); } finally { setSaving(false); }
  }

  const pendingApprovals = users.filter(u => !u.isVerified);
  const filteredUsers = users.filter(u => {
    const roleMatch = filterRole ? u.role === filterRole : true;
    const verifiedMatch = filterVerified === "all" ? true : filterVerified === "verified" ? u.isVerified : !u.isVerified;
    return roleMatch && verifiedMatch;
  });

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">User Management</h1>
          <p className="text-sm text-foreground/50 mt-1">
            {userRole === "ADMIN" ? "Manage all campus users" : "Manage users in your department"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {pendingApprovals.length > 0 && (
            <span className="px-3 py-1.5 bg-orange-500/15 border border-orange-500/30 text-orange-300 text-xs font-bold rounded-xl animate-pulse">
              {pendingApprovals.length} Pending
            </span>
          )}
          <button onClick={fetchUsers} className="px-4 py-2 text-sm border border-white/10 rounded-xl hover:bg-white/5 transition-colors text-foreground/70">
            Refresh
          </button>
        </div>
      </div>

      {pendingApprovals.length > 0 && (
        <div className="glass-panel p-5 rounded-2xl border border-orange-500/20 bg-orange-500/5">
          <h2 className="text-sm font-bold text-orange-300 mb-3 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
            Pending Role Approvals
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {pendingApprovals.map(u => (
              <div key={u.id} className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between p-4 bg-black/30 rounded-xl border border-white/5">
                <div>
                  <p className="text-sm font-semibold text-white">{u.name || "Unnamed"}</p>
                  <p className="text-xs text-foreground/50">{u.email} · <span className={`font-medium ${ROLE_COLORS[u.role]?.split(" ")[0]}`}>{u.role}</span></p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleApprove(u.id)} disabled={actionLoading === u.id + "_approve"} className="px-4 py-2 bg-green-500/15 border border-green-500/30 text-green-400 text-xs font-semibold rounded-lg hover:bg-green-500/25 transition-colors disabled:opacity-50">
                    {actionLoading === u.id + "_approve" ? "..." : "Approve"}
                  </button>
                  {userRole === "ADMIN" && (
                    <button onClick={() => handleDelete(u.id)} disabled={actionLoading === u.id + "_delete"} className="px-4 py-2 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold rounded-lg hover:bg-red-500/20 transition-colors disabled:opacity-50">
                      {actionLoading === u.id + "_delete" ? "..." : "Deny"}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <select value={filterRole} onChange={e => setFilterRole(e.target.value)} className="bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/50">
          <option value="" className="bg-[#1e1b4b]">All Roles</option>
          {userRole === "ADMIN" && <option value="ADMIN" className="bg-[#1e1b4b]">Admin</option>}
          <option value="HOD" className="bg-[#1e1b4b]">HOD</option>
          <option value="COORDINATOR" className="bg-[#1e1b4b]">Coordinator</option>
          <option value="FACULTY" className="bg-[#1e1b4b]">Faculty</option>
          <option value="STUDENT" className="bg-[#1e1b4b]">Student</option>
          <option value="PARENT" className="bg-[#1e1b4b]">Parent</option>
        </select>
        <select value={filterVerified} onChange={e => setFilterVerified(e.target.value)} className="bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/50">
          <option value="all" className="bg-[#1e1b4b]">All Status</option>
          <option value="verified" className="bg-[#1e1b4b]">Verified</option>
          <option value="pending" className="bg-[#1e1b4b]">Pending</option>
        </select>
        <span className="ml-auto text-xs text-foreground/40 self-center">{filteredUsers.length} users</span>
      </div>

      {error && <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-sm">{error}</div>}

      <div className="glass-panel rounded-3xl border border-white/5 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center p-16">
            <span className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-16"><p className="text-foreground/40 text-sm">No users found.</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left text-xs font-semibold text-foreground/50 px-6 py-4 uppercase tracking-wider">User</th>
                  <th className="text-left text-xs font-semibold text-foreground/50 px-6 py-4 uppercase tracking-wider">Role</th>
                  <th className="text-left text-xs font-semibold text-foreground/50 px-6 py-4 uppercase tracking-wider">Dept.</th>
                  <th className="text-left text-xs font-semibold text-foreground/50 px-6 py-4 uppercase tracking-wider">Status</th>
                  <th className="text-right text-xs font-semibold text-foreground/50 px-6 py-4 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredUsers.map(u => (
                  <tr key={u.id} className="hover:bg-white/3 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center text-xs font-bold text-primary">
                          {(u.name || u.email)[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">{u.name || "—"}</p>
                          <p className="text-xs text-foreground/40">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-bold px-2 py-1 rounded-lg border ${ROLE_COLORS[u.role] || "text-white bg-white/10 border-white/20"}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-foreground/60">{u.department || "—"}</td>
                    <td className="px-6 py-4">
                      {u.isVerified ? (
                        <span className="text-xs font-medium text-green-400 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-green-400" /> Active</span>
                      ) : (
                        <span className="text-xs font-medium text-orange-400 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" /> Pending</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-3">
                        <button onClick={() => openEdit(u)} className="text-xs text-blue-400 hover:text-blue-300 font-medium transition-colors">Edit</button>
                        {userRole === "ADMIN" && (
                          <button onClick={() => handleDelete(u.id)} disabled={!!actionLoading} className="text-xs text-red-400 hover:text-red-300 font-medium transition-colors disabled:opacity-50">Delete</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && editing && (
        <Modal onClose={() => setShowModal(false)}>
          <ModalTitle>Edit User Profile</ModalTitle>
          <form onSubmit={submitEdit}>
            <ModalError msg={ferr} />
            <div className="mb-4">
              <p className="text-sm font-semibold text-white">{editing.name || "—"}</p>
              <p className="text-xs text-foreground/50">{editing.email}</p>
            </div>
            <ModalRow>
              <ModalHalf>
                <ModalField label="Role">
                  <ModalSelect value={f.role} onChange={e => setF(p => ({ ...p, role: e.target.value }))}>
                    <option value="STUDENT">Student</option>
                    <option value="FACULTY">Faculty</option>
                    <option value="COORDINATOR">Coordinator</option>
                    <option value="HOD">HOD</option>
                    {userRole === "ADMIN" && <option value="ADMIN">Admin</option>}
                    <option value="PARENT">Parent</option>
                  </ModalSelect>
                </ModalField>
              </ModalHalf>
              <ModalHalf>
                <ModalField label="Verification Status">
                  <ModalSelect value={f.isVerified} onChange={e => setF(p => ({ ...p, isVerified: e.target.value }))}>
                    <option value="true">Active (Verified)</option>
                    <option value="false">Pending (Unverified)</option>
                  </ModalSelect>
                </ModalField>
              </ModalHalf>
            </ModalRow>
            <ModalField label="Department (Optional)">
              <ModalInput value={f.department} onChange={e => setF(p => ({ ...p, department: e.target.value }))} placeholder="e.g. Computer Science" />
            </ModalField>
            <ModalSubmit loading={saving} label="Save Changes" />
          </form>
        </Modal>
      )}
    </div>
  );
}
