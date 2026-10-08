"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Modal, ModalTitle, ModalError, ModalField, ModalRow, ModalHalf, ModalInput, ModalSelect, ModalSubmit } from "@/components/Modal";

type Mark = { id:string; studentId:string; courseId:string; marksObtained:number; totalMarks:number; topic:string|null; status:string; student?:{ user:{ name:string }; enrollmentNumber:string }; course?:{ courseCode:string; courseName:string }; };
type Course = { id:string; courseCode:string; courseName:string; };
type Student = { id:string; enrollmentNumber:string; user:{ name:string }; };

export default function MarksPage() {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role || "";
  const canUpload = ["ADMIN","HOD","COORDINATOR","FACULTY"].includes(role);

  const [marks, setMarks] = useState<Mark[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [allEnrollments, setAllEnrollments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [show, setShow] = useState(false);
  const [f, setF] = useState({ studentId:"", courseId:"", marksObtained:"", totalMarks:"100", topic:"", status:"DRAFT" });
  const [ferr, setFerr] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const [mr, cr] = await Promise.all([fetch("/api/marks"), fetch("/api/courses")]);
      if (!mr.ok) throw new Error("Failed to load marks");
      const marksData = await mr.json();
      setMarks(marksData);
      if (cr.ok) setCourses(await cr.json());
      // Load enrollments for filtering students
      if (canUpload) {
        try {
          const er = await fetch("/api/enrollments");
          if (er.ok) {
            const enrollmentsData = await er.json();
            setAllEnrollments(enrollmentsData.filter((e: any) => e.status === "APPROVED"));
          }
        } catch {}
      }
    } catch (e:any) { setErr(e.message); } finally { setLoading(false); }
  }

  function openAdd() {
    const firstCourseId = courses[0]?.id || "";
    setF({ studentId: "", courseId: firstCourseId, marksObtained: "", totalMarks: "100", topic: "", status: "DRAFT" });
    updateStudentsList(firstCourseId);
    setFerr(""); setShow(true);
  }

  function updateStudentsList(courseId: string) {
    const enrolled = allEnrollments
      .filter((e: any) => e.courseId === courseId)
      .map((e: any) => ({
        id: e.student.id,
        enrollmentNumber: e.student.enrollmentNumber || "N/A",
        user: { name: e.student.user?.name || "Unknown" }
      }));
    setStudents(enrolled);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!f.courseId) { setFerr("Please select a course."); return; }
    if (!f.studentId) { setFerr("Please enter a student ID or enrollment number."); return; }
    if (!f.marksObtained) { setFerr("Marks obtained is required."); return; }

    setSaving(true); setFerr("");
    try {
      const res = await fetch("/api/marks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: f.studentId.trim(),
          courseId: f.courseId,
          marksObtained: parseFloat(f.marksObtained),
          totalMarks: parseFloat(f.totalMarks) || 100,
          topic: f.topic.trim() || null,
          status: f.status,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to upload marks");
      const course = courses.find(c => c.id === f.courseId);
      setMarks(prev => [{ ...data, course: course || { courseCode:"", courseName:"" } }, ...prev]);
      setShow(false);
    } catch (e:any) { setFerr(e.message); } finally { setSaving(false); }
  }

  const statusColor = (s: string) => {
    if (s === "FINAL") return "text-green-400 bg-green-500/10";
    if (s === "PUBLISHED") return "text-blue-400 bg-blue-500/10";
    return "text-orange-400 bg-orange-500/10";
  };

  // Calculate average
  const total = marks.reduce((a,m) => a + m.marksObtained, 0);
  const possible = marks.reduce((a,m) => a + m.totalMarks, 0);
  const avg = possible > 0 ? Math.round((total/possible)*100) : 0;

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Internal Marks</h1>
        <div className="flex items-center gap-3">
          {marks.length > 0 && (
            <div className="px-4 py-2 bg-primary/20 text-primary border border-primary/30 rounded-lg text-sm font-medium">
              Average: {avg}%
            </div>
          )}
          {canUpload && (
            <button onClick={openAdd}
              className="px-5 py-2 bg-primary hover:bg-primary-hover text-white rounded-xl text-sm font-semibold transition-all shadow-[0_0_15px_rgba(139,92,246,0.3)]">
              + Upload Marks
            </button>
          )}
        </div>
      </div>

      {err && <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-sm">{err}</div>}

      {loading ? (
        <div className="flex items-center justify-center p-20"><span className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /></div>
      ) : marks.length === 0 ? (
        <div className="glass-panel p-16 rounded-3xl border border-white/5 text-center"><p className="text-foreground/40">No marks records found.{canUpload && " Click \"+ Upload Marks\" to add."}</p></div>
      ) : (
        <div className="glass-panel p-6 rounded-3xl border border-white/5">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-foreground/60 text-sm">
                  <th className="py-4 font-medium">Course</th>
                  {canUpload && <th className="py-4 font-medium">Student</th>}
                  <th className="py-4 font-medium">Topic</th>
                  <th className="py-4 font-medium">Obtained</th>
                  <th className="py-4 font-medium">Total</th>
                  <th className="py-4 font-medium text-right">Status</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {marks.map(m => (
                  <tr key={m.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="py-4 font-medium text-white">{m.course?.courseCode || "-"}</td>
                    {canUpload && <td className="py-4 text-foreground/80">{m.student?.user?.name || m.studentId}</td>}
                    <td className="py-4 text-foreground/80">{m.topic || "General"}</td>
                    <td className="py-4 text-foreground/80">{m.status === "DRAFT" ? "--" : m.marksObtained}</td>
                    <td className="py-4 text-foreground/80">{m.totalMarks}</td>
                    <td className="py-4 text-right">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${statusColor(m.status)}`}>{m.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {show && (
        <Modal onClose={() => setShow(false)}>
          <ModalTitle>Upload Marks</ModalTitle>
          <form onSubmit={submit}>
            <ModalError msg={ferr} />
            <ModalField label="Course">
              <ModalSelect value={f.courseId} onChange={e => {
                const cid = e.target.value;
                setF(p => ({...p, courseId: cid, studentId: ""}));
                updateStudentsList(cid);
              }}>
                <option value="">-- Select --</option>
                {courses.map(c => <option key={c.id} value={c.id}>{c.courseCode} - {c.courseName}</option>)}
              </ModalSelect>
            </ModalField>
            <ModalField label="Student">
              <ModalSelect value={f.studentId} onChange={e => setF(p => ({...p, studentId:e.target.value}))}>
                <option value="">-- Select Student --</option>
                {students.map(s => <option key={s.id} value={s.id}>{s.user?.name} ({s.enrollmentNumber})</option>)}
              </ModalSelect>
            </ModalField>
            <ModalRow>
              <ModalHalf>
                <ModalField label="Marks Obtained"><ModalInput type="number" step="0.5" min="0" value={f.marksObtained} onChange={e => setF(p => ({...p, marksObtained:e.target.value}))} placeholder="38" /></ModalField>
              </ModalHalf>
              <ModalHalf>
                <ModalField label="Total Marks"><ModalInput type="number" step="0.5" min="1" value={f.totalMarks} onChange={e => setF(p => ({...p, totalMarks:e.target.value}))} placeholder="50" /></ModalField>
              </ModalHalf>
            </ModalRow>
            <ModalField label="Topic / Assessment Name"><ModalInput value={f.topic} onChange={e => setF(p => ({...p, topic:e.target.value}))} placeholder="Midterm 1, Assignment 2..." /></ModalField>
            <ModalField label="Status">
              <ModalSelect value={f.status} onChange={e => setF(p => ({...p, status:e.target.value}))}>
                <option value="DRAFT">Draft</option>
                <option value="PUBLISHED">Published</option>
                <option value="FINAL">Final</option>
              </ModalSelect>
            </ModalField>
            <ModalSubmit loading={saving} label="Upload Marks" />
          </form>
        </Modal>
      )}
    </div>
  );
}



