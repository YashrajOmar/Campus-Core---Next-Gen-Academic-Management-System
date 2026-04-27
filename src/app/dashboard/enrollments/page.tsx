"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Modal, ModalTitle, ModalError, ModalField, ModalSelect, ModalSubmit } from "@/components/Modal";

type Course = { id:string; courseCode:string; courseName:string; department:string; semester:number; };
type Enrollment = { id:string; status:string; createdAt:string; course:Course; student:{user:{name:string;email:string}}; };

export default function EnrollmentsPage() {
  const { data: session } = useSession();
  const userRole = (session?.user as any)?.role || "STUDENT";
  const isStaff = ["ADMIN", "HOD", "COORDINATOR", "FACULTY"].includes(userRole);
  const isStudent = userRole === "STUDENT";

  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState("");

  const [showApply, setShowApply] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [applying, setApplying] = useState(false);

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    setLoading(true);
    try {
      const [er, cr] = await Promise.all([fetch("/api/enrollments"), fetch("/api/courses")]);
      if (!er.ok) throw new Error("Failed to load enrollments");
      setEnrollments(await er.json());
      if (cr.ok) setCourses(await cr.json());
    } catch(e:any) { setError(e.message); } finally { setLoading(false); }
  }

  async function submitApplication(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedCourse) return;
    setApplying(true); setError("");
    try {
      const res = await fetch("/api/enrollments", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId: selectedCourse })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to apply");
      setEnrollments(prev => [data, ...prev]);
      setShowApply(false);
    } catch(e:any) { setError(e.message); } finally { setApplying(false); }
  }

  async function changeStatus(id: string, status: string) {
    setActionLoading(id);
    try {
      const res = await fetch("/api/enrollments", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status })
      });
      if (!res.ok) throw new Error("Failed to update status");
      const updated = await res.json();
      setEnrollments(prev => prev.map(e => e.id === id ? { ...e, ...updated } : e));
    } catch(e:any) { setError(e.message); } finally { setActionLoading(""); }
  }

  const getStatusStyle = (s: string) => {
    if (s === "APPROVED") return "text-green-400 bg-green-500/10 border-green-500/20";
    if (s === "REJECTED") return "text-red-400 bg-red-500/10 border-red-500/20";
    return "text-orange-400 bg-orange-500/10 border-orange-500/20";
  };

  const pending = enrollments.filter(e => e.status === "PENDING");
  const processed = enrollments.filter(e => e.status !== "PENDING");

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Course Enrollments</h1>
          <p className="text-sm text-foreground/50 mt-1">{isStaff ? "Manage student course requests" : isStudent ? "Apply for courses" : "Linked student enrollments"}</p>
        </div>
        {isStudent && (
          <button onClick={() => setShowApply(true)} className="px-5 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-xl text-sm font-semibold transition-all shadow-[0_0_15px_rgba(139,92,246,0.3)]">
            + Apply for Course
          </button>
        )}
      </div>

      {error && <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-sm">{error}</div>}

      {loading ? (
        <div className="flex items-center justify-center p-20"><span className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /></div>
      ) : (
        <div className="space-y-6">
          {/* Staff Pending Section */}
          {isStaff && pending.length > 0 && (
            <div className="glass-panel p-5 rounded-3xl border border-orange-500/30 bg-orange-500/5">
              <h2 className="text-sm font-bold text-orange-300 mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" /> Pending Applications ({pending.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pending.map(e => (
                  <div key={e.id} className="p-4 bg-black/30 rounded-2xl border border-white/5 flex flex-col justify-between">
                    <div className="mb-4">
                      <p className="text-sm font-bold text-white">{e.course.courseCode} - {e.course.courseName}</p>
                      <p className="text-xs text-foreground/50 mt-1">{e.student.user?.name || e.student.user?.email}</p>
                      <p className="text-[10px] text-foreground/40 mt-0.5">Applied: {new Date(e.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => changeStatus(e.id, "APPROVED")} disabled={actionLoading === e.id} className="flex-1 py-2 bg-green-500/15 text-green-400 text-xs font-bold rounded-xl border border-green-500/30 hover:bg-green-500/25 transition-colors disabled:opacity-50">Approve</button>
                      <button onClick={() => changeStatus(e.id, "REJECTED")} disabled={actionLoading === e.id} className="flex-1 py-2 bg-red-500/10 text-red-400 text-xs font-bold rounded-xl border border-red-500/20 hover:bg-red-500/20 transition-colors disabled:opacity-50">Reject</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Processed / All List */}
          <div className="glass-panel rounded-3xl border border-white/5 overflow-hidden">
            <div className="px-6 py-4 border-b border-white/5 bg-white/5">
              <h3 className="text-sm font-bold text-white">{isStaff ? "Enrollment History" : "My Applications"}</h3>
            </div>
            {(!isStaff ? enrollments : processed).length === 0 ? (
              <div className="p-12 text-center"><p className="text-foreground/40 text-sm">No records found.</p></div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-white/5 text-foreground/50 text-xs uppercase tracking-wider">
                      <th className="px-6 py-4 font-semibold">Course</th>
                      {isStaff && <th className="px-6 py-4 font-semibold">Student</th>}
                      <th className="px-6 py-4 font-semibold">Date</th>
                      <th className="px-6 py-4 font-semibold text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-sm text-foreground/80">
                    {(!isStaff ? enrollments : processed).map(e => (
                      <tr key={e.id} className="hover:bg-white/3 transition-colors">
                        <td className="px-6 py-4">
                          <p className="font-bold text-white">{e.course.courseCode}</p>
                          <p className="text-xs text-foreground/50">{e.course.courseName}</p>
                        </td>
                        {isStaff && <td className="px-6 py-4">{e.student.user?.name || e.student.user?.email}</td>}
                        <td className="px-6 py-4">{new Date(e.createdAt).toLocaleDateString()}</td>
                        <td className="px-6 py-4 text-right">
                          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border ${getStatusStyle(e.status)}`}>{e.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {showApply && (
        <Modal onClose={() => setShowApply(false)}>
          <ModalTitle>Apply for Course</ModalTitle>
          <form onSubmit={submitApplication}>
            <ModalField label="Select Course">
              <ModalSelect value={selectedCourse} onChange={e => setSelectedCourse(e.target.value)}>
                <option value="">-- Choose a Course --</option>
                {courses.map(c => <option key={c.id} value={c.id}>{c.courseCode} - {c.courseName} (Sem {c.semester})</option>)}
              </ModalSelect>
            </ModalField>
            <ModalSubmit loading={applying} label="Submit Application" />
          </form>
        </Modal>
      )}
    </div>
  );
}
