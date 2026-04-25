"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Modal, ModalTitle, ModalError, ModalField, ModalRow, ModalHalf, ModalInput, ModalSubmit } from "@/components/Modal";

type Course = { id:string; courseCode:string; courseName:string; credits:number; department:string; semester:number; faculty?:{user:{name:string}}|null; };
const ALLOWED_ROLES = ["ADMIN", "HOD", "COORDINATOR", "FACULTY"];

export default function CoursesPage() {
  const { data: session } = useSession();
  const userRole = (session?.user as any)?.role || "";
  const canEdit = ALLOWED_ROLES.includes(userRole);
  const canDelete = ["ADMIN", "HOD"].includes(userRole);

  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState("");
  const [show, setShow] = useState(false);
  const [editing, setEditing] = useState<Course|null>(null);
  const [f, setF] = useState({ courseCode:"", courseName:"", credits:"3", department:"", semester:"1" });
  const [ferr, setFerr] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true); setErr("");
    try { const r = await fetch("/api/courses"); if(!r.ok) throw new Error("Failed to load"); setCourses(await r.json()); }
    catch(e:any) { setErr(e.message); } finally { setLoading(false); }
  }

  function openAdd() { setEditing(null); setF({courseCode:"", courseName:"", credits:"3", department:"", semester:"1"}); setFerr(""); setShow(true); }
  function openEdit(c: Course) { setEditing(c); setF({courseCode:c.courseCode, courseName:c.courseName, credits:String(c.credits), department:c.department, semester:String(c.semester)}); setFerr(""); setShow(true); }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!f.courseCode.trim()) { setFerr("Course code is required."); return; }
    if (!f.courseName.trim()) { setFerr("Course name is required."); return; }
    if (!f.department.trim()) { setFerr("Department is required."); return; }
    setSaving(true); setFerr("");
    const payload = { courseCode:f.courseCode.trim(), courseName:f.courseName.trim(), credits:parseInt(f.credits)||3, department:f.department.trim(), semester:parseInt(f.semester)||1 };
    try {
      const url = editing ? `/api/courses/${editing.id}` : "/api/courses";
      const res = await fetch(url, { method:editing?"PATCH":"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error||"Failed to save");
      if (editing) setCourses(p => p.map(c => c.id===editing.id ? {...c,...data} : c)); else setCourses(p => [data, ...p]);
      setShow(false);
    } catch(e:any) { setFerr(e.message); } finally { setSaving(false); }
  }

  async function del(id: string) {
    if (!confirm("Delete this course?")) return;
    setBusy(id);
    try { const r = await fetch(`/api/courses/${id}`, {method:"DELETE"}); if(!r.ok) throw new Error("Failed"); setCourses(p => p.filter(c => c.id!==id)); }
    catch(e:any) { setErr(e.message); } finally { setBusy(""); }
  }

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-white">Courses</h1><p className="text-sm text-foreground/50 mt-1">{courses.length} courses</p></div>
        {canEdit && <button onClick={openAdd} className="px-5 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-xl text-sm font-semibold transition-all shadow-[0_0_15px_rgba(139,92,246,0.3)]">+ Add Course</button>}
      </div>

      {err && <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-sm">{err}</div>}

      {loading ? (
        <div className="flex items-center justify-center p-20"><span className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /></div>
      ) : courses.length === 0 ? (
        <div className="glass-panel p-16 rounded-3xl border border-white/5 text-center"><p className="text-foreground/40">No courses yet.</p></div>
      ) : (
        <div className="glass-panel rounded-3xl border border-white/5 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left text-xs font-semibold text-foreground/50 px-6 py-4 uppercase">Code</th>
                  <th className="text-left text-xs font-semibold text-foreground/50 px-6 py-4 uppercase">Name</th>
                  <th className="text-left text-xs font-semibold text-foreground/50 px-6 py-4 uppercase">Dept.</th>
                  <th className="text-left text-xs font-semibold text-foreground/50 px-6 py-4 uppercase">Credits</th>
                  <th className="text-left text-xs font-semibold text-foreground/50 px-6 py-4 uppercase">Sem.</th>
                  {canEdit && <th className="text-right text-xs font-semibold text-foreground/50 px-6 py-4 uppercase">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {courses.map(c => (
                  <tr key={c.id} className="hover:bg-white/3 transition-colors">
                    <td className="px-6 py-4"><span className="text-sm font-bold text-primary">{c.courseCode}</span></td>
                    <td className="px-6 py-4 text-sm font-medium text-white">{c.courseName}</td>
                    <td className="px-6 py-4 text-sm text-foreground/60">{c.department}</td>
                    <td className="px-6 py-4 text-sm text-foreground/60">{c.credits}</td>
                    <td className="px-6 py-4 text-sm text-foreground/60">Sem {c.semester}</td>
                    {canEdit && (
                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-3">
                          <button onClick={()=>openEdit(c)} className="text-xs text-blue-400 hover:text-blue-300 font-medium">Edit</button>
                          {canDelete && <button onClick={()=>del(c.id)} disabled={busy===c.id} className="text-xs text-red-400 hover:text-red-300 font-medium disabled:opacity-50">{busy===c.id?"...":"Delete"}</button>}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {show && (
        <Modal onClose={()=>setShow(false)}>
          <ModalTitle>{editing?"Edit Course":"Add New Course"}</ModalTitle>
          <form onSubmit={submit}>
            <ModalError msg={ferr} />
            <ModalRow>
              <ModalHalf><ModalField label="Course Code"><ModalInput value={f.courseCode} onChange={e=>setF(p=>({...p,courseCode:e.target.value}))} placeholder="CS301" /></ModalField></ModalHalf>
              <ModalHalf><ModalField label="Department"><ModalInput value={f.department} onChange={e=>setF(p=>({...p,department:e.target.value}))} placeholder="CS" /></ModalField></ModalHalf>
            </ModalRow>
            <ModalField label="Course Name"><ModalInput value={f.courseName} onChange={e=>setF(p=>({...p,courseName:e.target.value}))} placeholder="Data Structures" /></ModalField>
            <ModalRow>
              <ModalHalf><ModalField label="Credits"><ModalInput type="number" min="1" max="10" value={f.credits} onChange={e=>setF(p=>({...p,credits:e.target.value}))} /></ModalField></ModalHalf>
              <ModalHalf><ModalField label="Semester"><ModalInput type="number" min="1" max="8" value={f.semester} onChange={e=>setF(p=>({...p,semester:e.target.value}))} /></ModalField></ModalHalf>
            </ModalRow>
            <ModalSubmit loading={saving} label={editing?"Save Changes":"Add Course"} />
          </form>
        </Modal>
      )}
    </div>
  );
}
