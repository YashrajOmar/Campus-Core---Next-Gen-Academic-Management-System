"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Modal, ModalTitle, ModalError, ModalField, ModalRow, ModalHalf, ModalInput, ModalSelect, ModalSubmit } from "@/components/Modal";

type User = { 
  id:string; name:string|null; email:string; role:string; department:string|null; isVerified:boolean; createdAt:string; 
  parentProfile?: { students: { student: { user: { name: string } } }[] };
};

const ROLE_COLORS: Record<string, string> = {
  ADMIN: "text-purple-400 bg-purple-500/10 border-purple-500/20",
  HOD: "text-rose-400 bg-rose-500/10 border-rose-500/20",
  COORDINATOR: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  FACULTY: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
  STUDENT: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  PARENT: "text-amber-400 bg-amber-500/10 border-amber-500/20",
};

export default function UsersPage() {
  const { data: session, status } = useSession();
  const userRole = (session?.user as any)?.role || "";

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string|null>(null);
  const [error, setError] = useState("");
  const [filterRole, setFilterRole] = useState("");
  const [filterVerified, setFilterVerified] = useState("all");

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<User|null>(null);
  const [f, setF] = useState({ role:"STUDENT", department:"", isVerified:"true" });
  const [ferr, setFerr] = useState("");
  const [saving, setSaving] = useState(false);

  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkingParent, setLinkingParent] = useState<User|null>(null);
  const [allStudents, setAllStudents] = useState<any[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [linkErr, setLinkErr] = useState("");
  const [linkSaving, setLinkSaving] = useState(false);

  useEffect(() => { if (status==="authenticated" && ["ADMIN","COORDINATOR"].includes(userRole)) fetchUsers(); }, [status, userRole]);

  async function fetchUsers() {
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/users");
      if(!res.ok) throw new Error("Failed to fetch users");
      setUsers(await res.json());
    } catch(e:any) { setError(e.message); } finally { setLoading(false); }
  }

  async function handleApprove(id:string) {
    setActionLoading(id+"_approve");
    try {
      const r = await fetch("/api/users", { method:"PATCH", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ userId:id, isVerified:true }) });
      if(!r.ok) throw new Error("Failed");
      setUsers(p => p.map(u => u.id===id ? {...u, isVerified:true} : u));
    } catch(e:any) { setError(e.message); } finally { setActionLoading(null); }
  }

  async function handleDelete(id:string) {
    if(!confirm("Are you sure?")) return;
    setActionLoading(id+"_delete");
    try {
      const r = await fetch("/api/users", { method:"DELETE", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ userId:id }) });
      if(!r.ok) throw new Error("Failed");
      setUsers(p => p.filter(u => u.id!==id));
    } catch(e:any) { setError(e.message); } finally { setActionLoading(null); }
  }

  function openEdit(u: User) {
    setEditing(u); setF({ role:u.role, department:u.department||"", isVerified:String(u.isVerified) }); setFerr(""); setShowModal(true);
  }

  async function submitEdit(e: React.FormEvent) {
    e.preventDefault(); if(!editing) return;
    setSaving(true); setFerr("");
    try {
      const r = await fetch("/api/users", { method:"PATCH", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ userId:editing.id, role:f.role, department:f.department.trim()||null, isVerified:f.isVerified==="true" }) });
      const d = await r.json();
      if(!r.ok) throw new Error(d.error||"Failed");
      setUsers(p => p.map(u => u.id===editing.id ? {...u, ...d} : u)); setShowModal(false);
    } catch(e:any) { setFerr(e.message); } finally { setSaving(false); }
  }

  function openLinkModal(u: User) {
    setLinkingParent(u); setShowLinkModal(true); setLinkErr("");
    if(allStudents.length===0) fetch("/api/users?role=STUDENT").then(r=>{if(r.ok) return r.json(); throw new Error();}).then(setAllStudents).catch(()=>{});
  }

  async function submitLink(e: React.FormEvent) {
    e.preventDefault(); if(!selectedStudentId||!linkingParent) return;
    setLinkSaving(true); setLinkErr("");
    try {
      const r = await fetch("/api/parents", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ parentUserId:linkingParent.id, studentUserId:selectedStudentId }) });
      const d = await r.json();
      if(!r.ok) throw new Error(d.error||"Failed");
      setShowLinkModal(false); 
      fetchUsers(); // Refresh the list to show the new link
      alert("Linked successfully!");
    } catch(e:any) { setLinkErr(e.message); } finally { setLinkSaving(false); }
  }

  if (status==="loading") return <div className="p-10 flex justify-center"><span className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin"/></div>;
  if (!["ADMIN","COORDINATOR"].includes(userRole)) return <div className="p-10 text-center text-red-400">Unauthorized</div>;

  const filteredUsers = users.filter(u => (!filterRole || u.role===filterRole) && (filterVerified==="all" || (filterVerified==="verified"?u.isVerified:!u.isVerified)));
  const pendingApprovals = users.filter(u => !u.isVerified);

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-white">User Management</h1><p className="text-sm text-foreground/50 mt-1">Manage roles and permissions</p></div>
      </div>
      
      {pendingApprovals.length > 0 && (
        <div className="glass-panel p-5 rounded-3xl border border-orange-500/30 bg-orange-500/5">
          <h2 className="text-sm font-bold text-orange-300 mb-4 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse"/> Pending Approvals ({pendingApprovals.length})</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {pendingApprovals.map(u => (
              <div key={u.id} className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between p-4 bg-black/30 rounded-xl border border-white/5">
                <div><p className="text-sm font-semibold text-white">{u.name||"Unnamed"}</p><p className="text-xs text-foreground/50">{u.email} · <span className={`font-medium ${ROLE_COLORS[u.role]?.split(" ")[0]}`}>{u.role}</span></p></div>
                <div className="flex gap-2">
                  <button onClick={()=>handleApprove(u.id)} disabled={actionLoading===u.id+"_approve"} className="px-4 py-2 bg-green-500/15 border border-green-500/30 text-green-400 text-xs font-semibold rounded-lg hover:bg-green-500/25 transition-colors disabled:opacity-50">Approve</button>
                  {userRole==="ADMIN" && <button onClick={()=>handleDelete(u.id)} disabled={actionLoading===u.id+"_delete"} className="px-4 py-2 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold rounded-lg hover:bg-red-500/20 transition-colors disabled:opacity-50">Deny</button>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <select value={filterRole} onChange={e=>setFilterRole(e.target.value)} className="bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/50"><option value="" className="bg-[#1e1b4b]">All Roles</option>{userRole==="ADMIN"&&<option value="ADMIN" className="bg-[#1e1b4b]">Admin</option>}<option value="HOD" className="bg-[#1e1b4b]">HOD</option><option value="COORDINATOR" className="bg-[#1e1b4b]">Coordinator</option><option value="FACULTY" className="bg-[#1e1b4b]">Faculty</option><option value="STUDENT" className="bg-[#1e1b4b]">Student</option><option value="PARENT" className="bg-[#1e1b4b]">Parent</option></select>
        <select value={filterVerified} onChange={e=>setFilterVerified(e.target.value)} className="bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/50"><option value="all" className="bg-[#1e1b4b]">All Status</option><option value="verified" className="bg-[#1e1b4b]">Verified</option><option value="pending" className="bg-[#1e1b4b]">Pending</option></select>
        <span className="ml-auto text-xs text-foreground/40 self-center">{filteredUsers.length} users</span>
      </div>
      
      {error && <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-sm">{error}</div>}

      <div className="glass-panel rounded-3xl border border-white/5 overflow-hidden">
        {loading ? <div className="flex justify-center p-16"><span className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin"/></div> : filteredUsers.length===0 ? <div className="text-center py-16"><p className="text-foreground/40 text-sm">No users found.</p></div> : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5"><th className="text-left text-xs font-semibold text-foreground/50 px-6 py-4 uppercase">User</th><th className="text-left text-xs font-semibold text-foreground/50 px-6 py-4 uppercase">Role</th><th className="text-left text-xs font-semibold text-foreground/50 px-6 py-4 uppercase">Dept.</th><th className="text-left text-xs font-semibold text-foreground/50 px-6 py-4 uppercase">Status</th><th className="text-right text-xs font-semibold text-foreground/50 px-6 py-4 uppercase">Actions</th></tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredUsers.map(u => (
                  <tr key={u.id} className="hover:bg-white/3 transition-colors">
                    <td className="px-6 py-4"><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center text-xs font-bold text-primary">{(u.name||u.email)[0].toUpperCase()}</div><div><p className="text-sm font-medium text-white">{u.name||"-"}</p><p className="text-xs text-foreground/40">{u.email}</p></div></div></td>
                    <td className="px-6 py-4"><span className={`text-xs font-bold px-2 py-1 rounded-lg border ${ROLE_COLORS[u.role]||"text-white bg-white/10 border-white/20"}`}>{u.role}</span></td>
                    <td className="px-6 py-4 text-sm text-foreground/60">
                      {u.department || "-"}
                      {u.role === "PARENT" && u.parentProfile?.students && u.parentProfile.students.length > 0 && (
                        <div className="mt-1">
                          <p className="text-[10px] text-purple-400 font-bold uppercase tracking-wider">Children:</p>
                          <div className="flex flex-wrap gap-1">
                            {u.parentProfile.students.map((s, i) => (
                              <span key={i} className="text-[10px] bg-purple-500/10 text-purple-300 px-1.5 py-0.5 rounded border border-purple-500/20">{s.student.user.name}</span>
                            ))}
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">{u.isVerified ? <span className="text-xs font-medium text-green-400 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-green-400"/> Active</span> : <span className="text-xs font-medium text-orange-400 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse"/> Pending</span>}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-3">
                        {u.role === "PARENT" && <button onClick={()=>openLinkModal(u)} className="text-xs text-purple-400 hover:text-purple-300 font-medium">Link Child</button>}
                        <button onClick={()=>openEdit(u)} className="text-xs text-blue-400 hover:text-blue-300 font-medium">Edit</button>
                        {userRole==="ADMIN" && <button onClick={()=>handleDelete(u.id)} disabled={!!actionLoading} className="text-xs text-red-400 hover:text-red-300 font-medium disabled:opacity-50">Delete</button>}
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
        <Modal onClose={()=>setShowModal(false)}>
          <ModalTitle>Edit User Profile</ModalTitle>
          <form onSubmit={submitEdit}>
            <ModalError msg={ferr}/>
            <div className="mb-4"><p className="text-sm font-semibold text-white">{editing.name||"-"}</p><p className="text-xs text-foreground/50">{editing.email}</p></div>
            <ModalRow>
              <ModalHalf><ModalField label="Role"><ModalSelect value={f.role} onChange={e=>setF(p=>({...p,role:e.target.value}))}><option value="STUDENT">Student</option><option value="FACULTY">Faculty</option><option value="COORDINATOR">Coordinator</option><option value="HOD">HOD</option>{userRole==="ADMIN"&&<option value="ADMIN">Admin</option>}<option value="PARENT">Parent</option></ModalSelect></ModalField></ModalHalf>
              <ModalHalf><ModalField label="Verification"><ModalSelect value={f.isVerified} onChange={e=>setF(p=>({...p,isVerified:e.target.value}))}><option value="true">Active</option><option value="false">Pending</option></ModalSelect></ModalField></ModalHalf>
            </ModalRow>
            <ModalField label="Department"><ModalInput value={f.department} onChange={e=>setF(p=>({...p,department:e.target.value}))} placeholder="e.g. Computer Science"/></ModalField>
            <ModalSubmit loading={saving} label="Save Changes"/>
          </form>
        </Modal>
      )}

      {showLinkModal && linkingParent && (
        <Modal onClose={()=>setShowLinkModal(false)}>
          <ModalTitle>Link Student</ModalTitle>
          <form onSubmit={submitLink}>
            <ModalError msg={linkErr}/>
            <div className="mb-4"><p className="text-sm font-semibold text-white">{linkingParent.name||"-"}</p><p className="text-xs text-foreground/50">{linkingParent.email} (Parent)</p></div>
            <ModalField label="Select Student">
              <ModalSelect value={selectedStudentId} onChange={e=>setSelectedStudentId(e.target.value)}>
                <option value="">-- Choose Student --</option>
                {allStudents.map(s => <option key={s.id} value={s.id}>{s.name||s.email}</option>)}
              </ModalSelect>
            </ModalField>
            <ModalSubmit loading={linkSaving} label="Link Student"/>
          </form>
        </Modal>
      )}
    </div>
  );
}

