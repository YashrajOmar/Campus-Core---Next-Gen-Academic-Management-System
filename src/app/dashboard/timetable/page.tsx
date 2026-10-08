"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Modal, ModalTitle, ModalError, ModalField, ModalRow, ModalHalf, ModalInput, ModalSelect, ModalSubmit } from "@/components/Modal";

type Course = { id:string; courseCode:string; courseName:string; department:string; semester:number; };
type Slot = { id:string; courseId:string; dayOfWeek:string; startTime:string; endTime:string; room:string|null; department:string; semester:number; course:{ courseCode:string; courseName:string }; };
const DAYS = ["MON","TUE","WED","THU","FRI","SAT"];
const DAY_LABELS: Record<string,string> = { MON:"Monday", TUE:"Tuesday", WED:"Wednesday", THU:"Thursday", FRI:"Friday", SAT:"Saturday" };
const BLANK = { courseId:"", dayOfWeek:"MON", startTime:"09:00", endTime:"10:00", room:"" };

export default function TimetablePage() {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role || "";
  const canEdit = ["ADMIN","HOD","COORDINATOR","FACULTY"].includes(role);

  const [slots, setSlots] = useState<Slot[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState("");
  const [show, setShow] = useState(false);
  const [editing, setEditing] = useState<Slot|null>(null);
  const [f, setF] = useState({ ...BLANK });
  const [ferr, setFerr] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    setLoading(true);
    try {
      const [sr, cr] = await Promise.all([fetch("/api/timetable"), fetch("/api/courses")]);
      if (sr.ok) setSlots(await sr.json());
      if (cr.ok) setCourses(await cr.json());
    } catch (e:any) { setErr(e.message); } finally { setLoading(false); }
  }

  const selectedCourse = courses.find(c => c.id === f.courseId);

  function openAdd() { setEditing(null); setF({...BLANK, courseId: courses[0]?.id||""}); setFerr(""); setShow(true); }
  function openEdit(s: Slot) {
    setEditing(s);
    setF({ courseId:s.courseId, dayOfWeek:s.dayOfWeek, startTime:s.startTime, endTime:s.endTime, room:s.room||"" });
    setFerr(""); setShow(true);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!f.courseId) { setFerr("Please select a course."); return; }
    const course = courses.find(c => c.id === f.courseId);
    if (!course) { setFerr("Invalid course selected."); return; }

    // Conflict check: same day, overlapping time, same department
    const conflicts = slots.filter(s =>
      s.id !== editing?.id &&
      s.dayOfWeek === f.dayOfWeek &&
      s.department === course.department &&
      s.startTime === f.startTime
    );
    if (conflicts.length > 0) { setFerr(`Conflict: ${conflicts[0].course.courseName} already scheduled on ${f.dayOfWeek} at ${f.startTime} in ${course.department} dept.`); return; }

    setSaving(true); setFerr("");
    const payload = { courseId:f.courseId, dayOfWeek:f.dayOfWeek, startTime:f.startTime, endTime:f.endTime, room:f.room.trim()||null, department:course.department, semester:course.semester };
    try {
      const url = editing ? `/api/timetable/${editing.id}` : "/api/timetable";
      const res = await fetch(url, { method:editing?"PATCH":"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error||"Failed to save");
      if (editing) { setSlots(p => p.map(s => s.id===editing.id ? {...s,...data, course: course} : s)); }
      else { setSlots(p => [...p, {...data, course}]); }
      setShow(false);
    } catch (e:any) { setFerr(e.message); } finally { setSaving(false); }
  }

  async function del(id: string) {
    if (!confirm("Delete this slot?")) return;
    setBusy(id);
    try { const r = await fetch(`/api/timetable/${id}`, {method:"DELETE"}); if (!r.ok) throw new Error("Failed"); setSlots(p => p.filter(s => s.id!==id)); }
    catch (e:any) { setErr(e.message); } finally { setBusy(""); }
  }

  const grouped = DAYS.reduce((a,d) => { a[d]=slots.filter(s=>s.dayOfWeek===d); return a; }, {} as Record<string,Slot[]>);

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Timetable</h1>
          <p className="text-sm text-foreground/50 mt-1">{slots.length} scheduled slots</p>
        </div>
        {canEdit && <button onClick={openAdd} className="px-5 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-xl text-sm font-semibold transition-all shadow-[0_0_15px_rgba(139,92,246,0.3)]">+ Add Slot</button>}
      </div>
      {err && <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-sm">{err}</div>}
      {loading ? (
        <div className="flex items-center justify-center p-20"><span className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /></div>
      ) : slots.length === 0 ? (
        <div className="glass-panel p-16 rounded-3xl border border-white/5 text-center"><p className="text-foreground/40">No slots yet.{canEdit && " Click \"+ Add Slot\"."}</p></div>
      ) : (
        <div className="space-y-4">
          {DAYS.filter(d => grouped[d]?.length > 0).map(day => (
            <div key={day} className="glass-panel rounded-2xl border border-white/5 overflow-hidden">
              <div className="px-5 py-3 border-b border-white/5 bg-primary/5">
                <h3 className="text-sm font-bold text-primary">{DAY_LABELS[day]}</h3>
              </div>
              <div className="divide-y divide-white/5">
                {grouped[day].sort((a,b)=>a.startTime.localeCompare(b.startTime)).map(s => (
                  <div key={s.id} className="flex items-center justify-between px-5 py-4 hover:bg-white/3 transition-colors">
                    <div className="flex items-center gap-5">
                      <span className="text-sm font-mono text-primary/80 w-24 flex-shrink-0">{s.startTime} - {s.endTime}</span>
                      <div>
                        <p className="text-sm font-semibold text-white">{s.course?.courseName}</p>
                        <p className="text-xs text-foreground/50">{s.course?.courseCode} · {s.room||"No Room"} · Sem {s.semester}</p>
                      </div>
                    </div>
                    {canEdit && (
                      <div className="flex gap-3">
                        <button onClick={()=>openEdit(s)} className="text-xs text-blue-400 hover:text-blue-300 font-semibold">Edit</button>
                        <button onClick={()=>del(s.id)} disabled={busy===s.id} className="text-xs text-red-400 hover:text-red-300 font-semibold disabled:opacity-50">{busy===s.id?"...":"Delete"}</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {show && (
        <Modal onClose={()=>setShow(false)}>
          <ModalTitle>{editing?"Edit Timetable Slot":"Add Timetable Slot"}</ModalTitle>
          <form onSubmit={submit}>
            <ModalError msg={ferr} />
            <ModalField label="Course">
              <ModalSelect value={f.courseId} onChange={e=>setF(p=>({...p,courseId:e.target.value}))}>
                <option value="">-- Select Course --</option>
                {courses.map(c=><option key={c.id} value={c.id}>{c.courseCode} - {c.courseName} ({c.department})</option>)}
              </ModalSelect>
            </ModalField>
            {selectedCourse && (
              <p style={{fontSize:"12px", color:"rgba(139,92,246,0.8)", marginBottom:"12px", marginTop:"-8px"}}>
                Dept: {selectedCourse.department} · Sem {selectedCourse.semester} (auto-filled from course)
              </p>
            )}
            <ModalRow>
              <ModalHalf><ModalField label="Day"><ModalSelect value={f.dayOfWeek} onChange={e=>setF(p=>({...p,dayOfWeek:e.target.value}))}>{DAYS.map(d=><option key={d} value={d}>{DAY_LABELS[d]}</option>)}</ModalSelect></ModalField></ModalHalf>
              <ModalHalf><ModalField label="Room"><ModalInput value={f.room} onChange={e=>setF(p=>({...p,room:e.target.value}))} placeholder="Hall A" /></ModalField></ModalHalf>
            </ModalRow>
            <ModalRow>
              <ModalHalf><ModalField label="Start Time"><ModalInput type="time" value={f.startTime} onChange={e=>setF(p=>({...p,startTime:e.target.value}))} /></ModalField></ModalHalf>
              <ModalHalf><ModalField label="End Time"><ModalInput type="time" value={f.endTime} onChange={e=>setF(p=>({...p,endTime:e.target.value}))} /></ModalField></ModalHalf>
            </ModalRow>
            <ModalSubmit loading={saving} label={editing?"Save Changes":"Add Slot"} />
          </form>
        </Modal>
      )}
    </div>
  );
}
