"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Modal, ModalTitle, ModalError, ModalField, ModalInput, ModalSelect, ModalTextarea, ModalSubmit } from "@/components/Modal";

type Notice = { id:string; title:string; content:string; category:string; department:string|null; authorId:string; createdAt:string; };

export default function NoticesPage() {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role || "";
  const canPost = ["ADMIN","HOD","COORDINATOR","FACULTY"].includes(role);

  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [filter, setFilter] = useState("All");
  const [show, setShow] = useState(false);
  const [f, setF] = useState({ title:"", content:"", category:"GENERAL", department:"" });
  const [ferr, setFerr] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const r = await fetch("/api/notices");
      if (!r.ok) throw new Error("Failed to load notices");
      setNotices(await r.json());
    } catch (e:any) { setErr(e.message); } finally { setLoading(false); }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!f.title.trim()) { setFerr("Title is required."); return; }
    if (!f.content.trim()) { setFerr("Content is required."); return; }
    setSaving(true); setFerr("");
    try {
      const res = await fetch("/api/notices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title:f.title.trim(), content:f.content.trim(), category:f.category, department:f.department.trim()||null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to post notice");
      setNotices(prev => [data, ...prev]);
      setShow(false);
      setF({ title:"", content:"", category:"GENERAL", department:"" });
    } catch (e:any) { setFerr(e.message); } finally { setSaving(false); }
  }

  const filtered = notices.filter(n => {
    if (filter === "All") return true;
    if (filter === "Urgent") return n.category === "URGENT";
    if (filter === "Academic") return n.category === "EXAM" || n.category === "ACADEMIC";
    return true;
  });

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-bold text-white">Campus Notices</h1>
        <div className="flex gap-2 items-center">
          {(["All","Urgent","Academic"] as const).map(fl => (
            <button key={fl} onClick={() => setFilter(fl)}
              className={`px-4 py-1.5 text-xs font-medium rounded-lg transition-all border ${filter===fl ? "bg-primary text-white border-primary shadow-[0_0_12px_rgba(139,92,246,0.4)]" : "bg-white/5 border-white/10 text-foreground/70 hover:bg-white/10 hover:text-white"}`}>
              {fl}
            </button>
          ))}
          {canPost && (
            <button onClick={() => { setFerr(""); setShow(true); }}
              className="px-4 py-1.5 bg-primary hover:bg-primary-hover text-white rounded-lg text-xs font-semibold transition-all ml-2">
              + Post Notice
            </button>
          )}
        </div>
      </div>

      {err && <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-sm">{err}</div>}

      {loading ? (
        <div className="flex items-center justify-center p-20"><span className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="glass-panel p-12 rounded-3xl border border-white/5 text-center text-foreground/50">No notices found.</div>
      ) : (
        <div className="space-y-4">
          {filtered.map(notice => (
            <div key={notice.id} className={`glass-panel p-6 rounded-2xl border transition-all hover:-translate-y-0.5 hover:shadow-lg ${notice.category === "URGENT" ? "border-red-500/30 bg-red-500/5" : "border-white/5 hover:border-primary/30"}`}>
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-3 gap-2">
                <h2 className="text-lg font-bold text-white">{notice.title}</h2>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${notice.category === "URGENT" ? "bg-red-500/10 text-red-400 border-red-500/20" : notice.category === "EXAM" ? "bg-blue-500/10 text-blue-400 border-blue-500/20" : "bg-white/10 text-foreground/60 border-white/10"}`}>
                    {notice.category}
                  </span>
                  <span className="text-xs text-foreground/50">{new Date(notice.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
              <p className="text-sm text-foreground/70 mb-3">{notice.content}</p>
              {notice.department && <p className="text-xs text-foreground/40">Department: {notice.department}</p>}
            </div>
          ))}
        </div>
      )}

      {show && (
        <Modal onClose={() => setShow(false)}>
          <ModalTitle>Post New Notice</ModalTitle>
          <form onSubmit={submit}>
            <ModalError msg={ferr} />
            <ModalField label="Title"><ModalInput value={f.title} onChange={e => setF(p => ({...p, title:e.target.value}))} placeholder="Mid-term schedule released" /></ModalField>
            <ModalField label="Content"><ModalTextarea value={f.content} onChange={e => setF(p => ({...p, content:e.target.value}))} placeholder="Write your announcement here..." rows={5} /></ModalField>
            <ModalField label="Category">
              <ModalSelect value={f.category} onChange={e => setF(p => ({...p, category:e.target.value}))}>
                <option value="GENERAL">General</option>
                <option value="EXAM">Exam</option>
                <option value="HOLIDAY">Holiday</option>
                <option value="URGENT">Urgent</option>
              </ModalSelect>
            </ModalField>
            <ModalField label="Department (leave empty for global)"><ModalInput value={f.department} onChange={e => setF(p => ({...p, department:e.target.value}))} placeholder="CS or leave empty" /></ModalField>
            <ModalSubmit loading={saving} label="Publish Notice" />
          </form>
        </Modal>
      )}
    </div>
  );
}
