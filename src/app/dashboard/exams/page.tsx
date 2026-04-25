"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Modal, ModalTitle, ModalError, ModalField, ModalRow, ModalHalf, ModalInput, ModalSelect, ModalSubmit } from "@/components/Modal";

type Exam = { id:string; courseCode:string; courseName:string; examDate:string; startTime:string; room:string|null; department:string; semester:number; type:string; };
const TYPES = ["MIDTERM","FINAL","QUIZ"];
const TYPE_STYLE: Record<string,string> = { MIDTERM:"text-blue-400 bg-blue-500/10 border-blue-500/20", FINAL:"text-red-400 bg-red-500/10 border-red-500/20", QUIZ:"text-green-400 bg-green-500/10 border-green-500/20" };
const BLANK = { courseCode:"", courseName:"", examDate:"", startTime:"09:00", room:"", department:"", semester:"1", type:"MIDTERM" };

export default function ExamsPage() {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role || "";
  const canEdit = ["ADMIN","HOD","COORDINATOR","FACULTY"].includes(role);
  const canDelete = ["ADMIN","HOD"].includes(role);

  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState("");
  const [show, setShow] = useState(false);
  const [editing, setEditing] = useState<Exam|null>(null);
  const [f, setF] = useState({ ...BLANK });
  const [ferr, setFerr] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true); setErr("");
    try { const r = await fetch("/api/exams"); if (!r.ok) throw new Error("Failed to load"); setExams(await r.json()); }
    catch (e:any) { setErr(e.message); } finally { setLoading(false); }
  }

  function openAdd() { setEditing(null); setF({...BLANK}); setFerr(""); setShow(true); }
  function openEdit(ex: Exam) {
    setEditing(ex);
    setF({ courseCode:ex.courseCode, courseName:ex.courseName, examDate:ex.examDate?new Date(ex.examDate).toISOString().split("T")[0]:"", startTime:ex.startTime, room:ex.room||"", department:ex.department, semester:String(ex.semester), type:ex.type });
    setFerr(""); setShow(true);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!f.courseCode.trim()) { setFerr("Course code is required."); return; }
    if (!f.courseName.trim()) { setFerr("Course name is required."); return; }
    if (!f.examDate) { setFerr("Exam date is required."); return; }
    if (!f.department.trim()) { setFerr("Department is required."); return; }

    // Client-side conflict check
    const conflicts = exams.filter(ex => ex.id !== editing?.id && ex.examDate && new Date(ex.examDate).toISOString().split("T")[0] === f.examDate && ex.startTime === f.startTime && ex.room && f.room && ex.room.toLowerCase() === f.room.toLowerCase());
    if (conflicts.length > 0) { setFerr(`Conflict: ${conflicts[0].courseName} is already scheduled at this time in ${conflicts[0].room}.`); return; }

    setSaving(true); setFerr("");
    const payload = { courseCode:f.courseCode.trim(), courseName:f.courseName.trim(), examDate:f.examDate, startTime:f.startTime, room:f.room.trim()||null, department:f.department.trim(), semester:parseInt(f.semester)||1, type:f.type };
    try {
      const url = editing ? `/api/exams/${editing.id}` : "/api/exams";
      const res = await fetch(url, { method: editing?"PATCH":"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error||"Failed to save");
      if (editing) { setExams(p => p.map(ex => ex.id===editing.id ? {...ex,...data} : ex)); }
      else { setExams(p => [...p, data]); }
      setShow(false);
    } catch (e:any) { setFerr(e.message); } finally { setSaving(false); }
  }

  async function del(id: string) {
    if (!confirm("Delete this exam?")) return;
    setBusy(id);
    try { const r = await fetch(`/api/exams/${id}`, {method:"DELETE"}); if (!r.ok) throw new Error("Failed"); setExams(p => p.filter(ex => ex.id!==id)); }
    catch (e:any) { setErr(e.message); } finally { setBusy(""); }
  }

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Exam Schedule & Hall Allocation</h1>
          <p className="text-sm text-foreground/50 mt-1">{exams.length} exams scheduled</p>
        </div>
        {canEdit && <button onClick={openAdd} className="px-5 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-xl text-sm font-semibold transition-all shadow-[0_0_15px_rgba(139,92,246,0.3)]">+ Add Exam</button>}
      </div>

      {err && <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-sm">{err}</div>}

      {loading ? (
        <div className="flex items-center justify-center p-20"><span className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /></div>
      ) : exams.length === 0 ? (
        <div className="glass-panel p-16 rounded-3xl border border-white/5 text-center"><p className="text-foreground/40">No exams scheduled.{canEdit && " Click \"+ Add Exam\" to start."}</p></div>
      ) : (
        <div className="grid gap-4">
          {exams.map(ex => {
            const d = new Date(ex.examDate);
            return (
              <div key={ex.id} className="glass-panel p-5 rounded-2xl border border-white/5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:border-primary/20 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-primary/10 border border-primary/20 flex flex-col items-center justify-center text-primary flex-shrink-0">
                    <span className="text-[10px] font-bold uppercase">{d.toLocaleString("default",{month:"short"})}</span>
                    <span className="text-lg font-bold leading-none">{d.getDate()}</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-base font-bold text-white">{ex.courseName}</h3>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${TYPE_STYLE[ex.type]||"text-white/50 bg-white/5 border-white/10"}`}>{ex.type}</span>
                    </div>
                    <p className="text-sm text-foreground/50">{ex.courseCode} · {ex.department} · Sem {ex.semester}</p>
                  </div>
                </div>
                <div className="flex items-center gap-5 flex-wrap">
                  <span className="text-sm text-foreground/70">⏰ {ex.startTime}</span>
                  <span className="text-sm text-foreground/70">📍 {ex.room||"Venue TBD"}</span>
                  {canEdit && (
                    <div className="flex gap-3 border-l border-white/10 pl-4">
                      <button onClick={()=>openEdit(ex)} className="text-xs text-blue-400 hover:text-blue-300 font-semibold">Edit</button>
                      {canDelete && <button onClick={()=>del(ex.id)} disabled={busy===ex.id} className="text-xs text-red-400 hover:text-red-300 font-semibold disabled:opacity-50">{busy===ex.id?"...":"Delete"}</button>}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {show && (
        <Modal onClose={()=>setShow(false)}>
          <ModalTitle>{editing?"Edit Exam":"Schedule New Exam"}</ModalTitle>
          <form onSubmit={submit}>
            <ModalError msg={ferr} />
            <ModalRow>
              <ModalHalf><ModalField label="Course Code"><ModalInput value={f.courseCode} onChange={e=>setF(p=>({...p,courseCode:e.target.value}))} placeholder="CS301" /></ModalField></ModalHalf>
              <ModalHalf><ModalField label="Type"><ModalSelect value={f.type} onChange={e=>setF(p=>({...p,type:e.target.value}))}>{TYPES.map(t=><option key={t} value={t}>{t}</option>)}</ModalSelect></ModalField></ModalHalf>
            </ModalRow>
            <ModalField label="Course Name"><ModalInput value={f.courseName} onChange={e=>setF(p=>({...p,courseName:e.target.value}))} placeholder="Data Structures" /></ModalField>
            <ModalRow>
              <ModalHalf><ModalField label="Exam Date"><ModalInput type="date" value={f.examDate} onChange={e=>setF(p=>({...p,examDate:e.target.value}))} /></ModalField></ModalHalf>
              <ModalHalf><ModalField label="Start Time"><ModalInput type="time" value={f.startTime} onChange={e=>setF(p=>({...p,startTime:e.target.value}))} /></ModalField></ModalHalf>
            </ModalRow>
            <ModalRow>
              <ModalHalf><ModalField label="Venue / Room"><ModalInput value={f.room} onChange={e=>setF(p=>({...p,room:e.target.value}))} placeholder="Hall A" /></ModalField></ModalHalf>
              <ModalHalf><ModalField label="Department"><ModalInput value={f.department} onChange={e=>setF(p=>({...p,department:e.target.value}))} placeholder="CS" /></ModalField></ModalHalf>
            </ModalRow>
            <ModalField label="Semester"><ModalInput type="number" min="1" max="8" value={f.semester} onChange={e=>setF(p=>({...p,semester:e.target.value}))} /></ModalField>
            <ModalSubmit loading={saving} label={editing?"Save Changes":"Schedule Exam"} />
          </form>
        </Modal>
      )}
    </div>
  );
}
