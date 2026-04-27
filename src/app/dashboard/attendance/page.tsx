"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Modal, ModalTitle, ModalError, ModalField, ModalRow, ModalHalf, ModalInput, ModalSelect, ModalSubmit } from "@/components/Modal";

type Attendance = { id:string; studentId:string; courseId:string; date:string; status:string; student:{ user:{ name:string } }; course:{ courseCode:string; courseName:string }; };
type Course = { id:string; courseCode:string; courseName:string; };
type Student = { id:string; user:{ name:string; email:string }; };

export default function AttendancePage() {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role || "";
  const isStaff = ["ADMIN","HOD","COORDINATOR","FACULTY"].includes(role);

  const [records, setRecords] = useState<Attendance[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [allEnrollments, setAllEnrollments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [show, setShow] = useState(false);
  const [f, setF] = useState({ studentId:"", courseId:"", status:"PRESENT", date: new Date().toISOString().split("T")[0] });
  const [ferr, setFerr] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true); setErr("");
    try {
      const [ar, cr] = await Promise.all([fetch("/api/attendance"), fetch("/api/courses")]);
      if (!ar.ok) throw new Error("Failed to load attendance");
      setRecords(await ar.json());
      if (cr.ok) setCourses(await cr.json());

      if (isStaff) {
        const er = await fetch("/api/enrollments");
        if (er.ok) {
          const enrollmentsData = await er.json();
          setAllEnrollments(enrollmentsData.filter((e: any) => e.status === "APPROVED"));
        }
      }
    } catch (e:any) { setErr(e.message); } finally { setLoading(false); }
  }

  function updateStudentsList(courseId: string) {
    const enrolled = allEnrollments
      .filter((e: any) => e.courseId === courseId)
      .map((e: any) => ({
        id: e.student.id,
        user: { name: e.student.user?.name || e.student.user?.email || "Unknown", email: e.student.user?.email || "" }
      }));
    setStudents(enrolled);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!f.courseId || !f.studentId) { setFerr("Please select a course and a student."); return; }
    setSaving(true); setFerr("");
    try {
      const res = await fetch("/api/attendance", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(f)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save record");
      setShow(false); load();
    } catch (e:any) { setFerr(e.message); } finally { setSaving(false); }
  }

  const courseStats = new Map();
  records.forEach(att => {
    const code = att.course.courseCode;
    if (!courseStats.has(code)) courseStats.set(code, { name: att.course.courseName, total: 0, attended: 0 });
    const s = courseStats.get(code);
    s.total++;
    if (att.status === "PRESENT") s.attended++;
  });

  const totalRecs = records.length;
  const totalPres = records.filter(r => r.status === "PRESENT").length;
  const overallPct = totalRecs > 0 ? Math.round((totalPres / totalRecs) * 100) : 0;

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Attendance Records</h1>
          <p className="text-sm text-foreground/50 mt-1">{isStaff ? "Manage student presence" : "Track your attendance history"}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className={`px-4 py-2 rounded-lg text-sm font-medium border ${overallPct >= 75 ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-orange-500/20 text-orange-400 border-orange-500/30'}`}>
            Overall: {overallPct}%
          </div>
          {isStaff && <button onClick={() => setShow(true)} className="px-5 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-xl text-sm font-semibold transition-all">+ Upload Attendance</button>}
        </div>
      </div>

      {err && <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-sm">{err}</div>}

      <div className="glass-panel p-6 rounded-3xl border border-white/5">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-foreground/60 text-sm">
                <th className="py-4 font-medium">Course</th>
                <th className="py-4 font-medium">Student</th>
                <th className="py-4 font-medium text-center">Total Classes</th>
                <th className="py-4 font-medium text-center">Attended</th>
                <th className="py-4 font-medium text-right">Percentage</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {Array.from(courseStats.entries()).map(([code, stat]) => {
                const pct = stat.total > 0 ? Math.round((stat.attended / stat.total) * 100) : 0;
                return (
                  <tr key={code} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="py-4 font-medium text-white">{code} - {stat.name}</td>
                    <td className="py-4 text-foreground/80">
                      {records.filter(r => r.course.courseCode === code).map(r => r.student.user.name).filter((v, i, a) => a.indexOf(v) === i).join(", ")}
                    </td>
                    <td className="py-4 text-center text-foreground/80">{stat.total}</td>
                    <td className="py-4 text-center text-foreground/80">{stat.attended}</td>
                    <td className="py-4 text-right">
                      <span className={`px-2 py-1 rounded ${pct >= 75 ? 'text-green-400 bg-green-500/10' : 'text-orange-400 bg-orange-500/10'}`}>{pct}%</span>
                    </td>
                  </tr>
                );
              })}
              {records.length === 0 && <tr><td colSpan={isStaff ? 5 : 4} className="py-8 text-center text-foreground/50">No records found.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {show && (
        <Modal onClose={() => setShow(false)}>
          <ModalTitle>Upload Attendance</ModalTitle>
          <form onSubmit={submit}>
            <ModalError msg={ferr} />
            <ModalField label="Course">
              <ModalSelect value={f.courseId} onChange={e => { const cid = e.target.value; setF(p => ({...p, courseId: cid, studentId: ""})); updateStudentsList(cid); }}>
                <option value="">-- Select --</option>
                {courses.map(c => <option key={c.id} value={c.id}>{c.courseCode} - {c.courseName}</option>)}
              </ModalSelect>
            </ModalField>
            <ModalField label="Student">
              <ModalSelect value={f.studentId} onChange={e => setF(p => ({...p, studentId: e.target.value}))}>
                <option value="">-- Select --</option>
                {students.map(s => <option key={s.id} value={s.id}>{s.user.name} ({s.user.email})</option>)}
              </ModalSelect>
            </ModalField>
            <ModalRow>
              <ModalHalf><ModalField label="Date"><ModalInput type="date" value={f.date} onChange={e => setF(p => ({...p, date: e.target.value}))} /></ModalField></ModalHalf>
              <ModalHalf><ModalField label="Status"><ModalSelect value={f.status} onChange={e => setF(p => ({...p, status: e.target.value}))}><option value="PRESENT">Present</option><option value="ABSENT">Absent</option><option value="LATE">Late</option></ModalSelect></ModalField></ModalHalf>
            </ModalRow>
            <ModalSubmit loading={saving} label="Log Attendance" />
          </form>
        </Modal>
      )}
    </div>
  );
}
