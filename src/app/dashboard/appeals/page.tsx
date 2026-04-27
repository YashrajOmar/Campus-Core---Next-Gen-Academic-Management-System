"use client";
import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { Modal, ModalTitle, ModalError, ModalField, ModalSelect, ModalTextarea, ModalSubmit } from "@/components/Modal";

type Message = { id:string; text:string; createdAt:string; authorRole:string; author:{name:string;role:string}; };
type Mark = { id:string; marksObtained:number; totalMarks:number; topic:string|null; course:{courseCode:string;courseName:string}; };
type Appeal = { id:string; reason:string; status:string; currentAuthority:string; currentStep:number; createdAt:string; student:{user:{name:string}}; mark:Mark; messages:Message[]; };

const STATUS_STYLE: Record<string,string> = { OPEN:"text-blue-400 bg-blue-500/10 border-blue-500/20", UNDER_REVIEW:"text-yellow-400 bg-yellow-500/10 border-yellow-500/20", RESOLVED:"text-green-400 bg-green-500/10 border-green-500/20", REJECTED:"text-red-400 bg-red-500/10 border-red-500/20", ESCALATED:"text-orange-400 bg-orange-500/10 border-orange-500/20" };

export default function AppealsPage() {
  const { data: session } = useSession();
  const userRole = (session?.user as any)?.role || "STUDENT";
  
  const [appeals, setAppeals] = useState<Appeal[]>([]);
  const [marks, setMarks] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<string|null>(null);
  const [loading, setLoading] = useState(true);
  const [msgText, setMsgText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  
  const [showNew, setShowNew] = useState(false);
  const [f, setF] = useState({ markId:"", reason:"" });
  const [isSub, setIsSub] = useState(false);

  const threadEndRef = useRef<HTMLDivElement>(null);
  const selected = appeals.find(a => a.id === selectedId) || null;

  useEffect(() => {
    fetchAppeals();
    if (userRole === "STUDENT") {
      fetch("/api/marks").then(r => r.json()).then(data => setMarks(data)).catch(()=>{});
    }
  }, [userRole]);

  useEffect(() => { threadEndRef.current?.scrollIntoView({behavior:"smooth"}); }, [selected?.messages?.length]);

  async function fetchAppeals() {
    setLoading(true);
    try { const r = await fetch("/api/appeals"); if(!r.ok) throw new Error(); setAppeals(await r.json()); }
    catch { setError("Failed to load"); } finally { setLoading(false); }
  }

  async function sendMsg(e: React.FormEvent) {
    e.preventDefault(); if(!msgText.trim()||!selectedId) return;
    setSending(true); setError("");
    try {
      const res = await fetch(`/api/appeals/${selectedId}/messages`, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({text:msgText.trim()}) });
      const d = await res.json();
      if(!res.ok) throw new Error(d.error||"Failed");
      setAppeals(p => p.map(a => a.id===selectedId ? {...a, messages:[...a.messages, d]} : a));
      setMsgText("");
    } catch(e:any) { setError(e.message); } finally { setSending(false); }
  }

  async function createAppeal(e: React.FormEvent) {
    e.preventDefault(); if(!f.markId||!f.reason.trim()) return;
    setIsSub(true); setError("");
    try {
      const res = await fetch("/api/appeals", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ subject:f.markId, description:f.reason }) });
      if(!res.ok) throw new Error((await res.json()).error||"Failed");
      setShowNew(false); setF({markId:"",reason:""}); fetchAppeals();
    } catch(e:any) { setError(e.message); } finally { setIsSub(false); }
  }

  async function changeStatus(id:string, st:string, esc:boolean=false) {
    try {
      const res = await fetch(`/api/appeals/${id}`, { method:"PATCH", headers:{"Content-Type":"application/json"}, body:JSON.stringify({status:st, escalate:esc}) });
      const d = await res.json();
      if(!res.ok) throw new Error(d.error||"Failed");
      setAppeals(p => p.map(a => a.id===id ? {...a, ...d} : a));
    } catch(e:any) { setError(e.message); }
  }

  const isStaff = ["ADMIN","HOD","COORDINATOR","FACULTY"].includes(userRole);

  return (
    <div className="h-full flex gap-6 animate-slide-up">
      <div className={`${selected?"hidden md:flex w-80 flex-shrink-0":"w-full"} flex-col gap-4`}>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">Appeals Portal</h1>
          {userRole==="STUDENT" && <button onClick={()=>setShowNew(true)} className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-xl text-sm font-medium transition-all shadow-[0_0_15px_rgba(139,92,246,0.3)]">+ New Appeal</button>}
        </div>
        {loading ? <div className="flex-1 flex items-center justify-center"><span className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin"/></div> : appeals.length===0 ? <div className="glass-panel p-8 rounded-3xl border border-white/5 text-center"><p className="text-foreground/40 text-sm">No appeals yet.</p></div> : (
          <div className="space-y-3 flex-1 overflow-y-auto pr-1">
            {appeals.map(a => (
              <div key={a.id} onClick={()=>setSelectedId(a.id===selectedId?null:a.id)} className={`p-5 rounded-2xl border cursor-pointer transition-all ${selectedId===a.id?"border-primary/40 bg-primary/10":"bg-black/20 border-white/10 hover:border-primary/30 hover:bg-white/3"}`}>
                <div className="flex items-start justify-between mb-2 gap-2">
                  <div><p className="font-semibold text-white text-sm">{a.mark.course.courseCode} — {a.mark.topic||"Assmt"}</p>{isStaff && <p className="text-xs text-foreground/50 mt-0.5">{a.student.user.name}</p>}</div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border flex-shrink-0 ${STATUS_STYLE[a.status]}`}>{a.status}</span>
                </div>
                <p className="text-xs text-foreground/60 line-clamp-2 mb-3">{a.reason}</p>
                <div className="flex items-center justify-between text-[10px] text-foreground/40 border-t border-white/5 pt-2 mt-1"><span>Step {a.currentStep}/4 · {a.currentAuthority}</span><span>{a.messages.length} msgs</span></div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selected ? (
        <div className="flex-1 flex flex-col glass-panel rounded-3xl border border-primary/20 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
            <div><h2 className="text-base font-bold text-white">{selected.mark.course.courseCode} — {selected.mark.topic||"Assessment"}</h2><div className="flex items-center gap-3 mt-1"><span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${STATUS_STYLE[selected.status]}`}>{selected.status}</span><span className="text-[10px] text-foreground/40">With: {selected.currentAuthority} (Step {selected.currentStep}/4)</span></div></div>
            <div className="flex items-center gap-2">
              {(() => {
                const AUTHORITY_RANK: Record<string, number> = { "INSTRUCTOR": 1, "COORDINATOR": 2, "HOD": 3, "ADMIN": 4 };
                const ROLE_RANK: Record<string, number> = { "FACULTY": 1, "COORDINATOR": 2, "HOD": 3, "ADMIN": 4 };
                const currentLevel = AUTHORITY_RANK[selected.currentAuthority] || 1;
                const userLevel = ROLE_RANK[userRole] || 0;
                const canAct = userLevel >= currentLevel;

                return (
                  <>
                    {!isStaff && selected.status==="REJECTED" && currentLevel < 4 && <button onClick={()=>changeStatus(selected.id, "", true)} className="px-3 py-1.5 text-xs font-semibold bg-orange-500/15 border border-orange-500/30 text-orange-300 rounded-lg">Escalate ↑</button>}
                    {isStaff && (
                      <div className="flex items-center gap-2">
                        {canAct && selected.status !== "RESOLVED" && selected.status !== "REJECTED" ? (
                          <>
                            {currentLevel < 4 && <button onClick={()=>changeStatus(selected.id, "", true)} className="px-3 py-1.5 text-xs font-semibold bg-orange-500/15 border border-orange-500/30 text-orange-300 rounded-lg hover:bg-orange-500/25 transition-colors">Escalate ↑</button>}
                            <select value={selected.status} onChange={(e)=>changeStatus(selected.id, e.target.value)} className="bg-black/20 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-primary/50"><option value="OPEN">OPEN</option><option value="UNDER_REVIEW">UNDER_REVIEW</option><option value="RESOLVED">RESOLVED</option><option value="REJECTED">REJECTED</option></select>
                          </>
                        ) : canAct ? (
                          <span className="text-[10px] text-foreground/40 italic px-2 uppercase tracking-widest">{selected.status}</span>
                        ) : (
                          <span className="text-[10px] text-foreground/40 italic px-2">Awaiting {selected.currentAuthority}</span>
                        )}
                      </div>
                    )}
                  </>
                );
              })()}
              <button onClick={()=>setSelectedId(null)} className="text-foreground/40 hover:text-white transition-colors ml-2 p-1">✕</button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            <div className="flex justify-start"><div className="max-w-[75%] bg-white/5 border border-white/10 rounded-2xl rounded-tl-sm px-4 py-3"><p className="text-[11px] font-bold text-foreground/50 mb-1">{selected.student.user.name} (Student)</p><p className="text-sm text-foreground/90">{selected.reason}</p><p className="text-[10px] text-foreground/30 mt-2">{new Date(selected.createdAt).toLocaleString()}</p></div></div>
            {selected.messages.map(m => {
              const me = m.authorRole===userRole;
              return <div key={m.id} className={`flex ${me?"justify-end":"justify-start"}`}><div className={`max-w-[75%] px-4 py-3 rounded-2xl ${me?"bg-primary/20 border border-primary/30 rounded-tr-sm":"bg-white/5 border border-white/10 rounded-tl-sm"}`}><p className={`text-[11px] font-bold mb-1 ${me?"text-primary":"text-foreground/50"}`}>{m.author.name} ({m.authorRole})</p><p className="text-sm text-white">{m.text}</p><p className={`text-[10px] mt-2 ${me?"text-foreground/40 text-right":"text-foreground/30"}`}>{new Date(m.createdAt).toLocaleString()}</p></div></div>
            })}
            <div ref={threadEndRef}/>
          </div>
          {selected.status!=="RESOLVED" && selected.status!=="REJECTED" ? (
            <form onSubmit={sendMsg} className="px-6 py-4 border-t border-white/10 flex gap-3"><input type="text" value={msgText} onChange={e=>setMsgText(e.target.value)} placeholder="Type your reply..." className="flex-1 bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/50"/><button type="submit" disabled={sending||!msgText.trim()} className="px-5 py-3 bg-primary text-white rounded-xl text-sm font-bold disabled:opacity-50">{sending?"...":"Send"}</button></form>
          ) : <div className="px-6 py-4 border-t border-white/10 text-center"><p className="text-xs text-foreground/40">This appeal is closed.</p></div>}
        </div>
      ) : <div className="hidden md:flex flex-1 items-center justify-center glass-panel rounded-3xl border border-white/5"><p className="text-sm text-foreground/50">Select an appeal to view conversation</p></div>}

      {showNew && (
        <Modal onClose={()=>setShowNew(false)}>
          <ModalTitle>Create New Appeal</ModalTitle>
          <form onSubmit={createAppeal}>
            <ModalError msg={error}/>
            <ModalField label="Assessment / Course">
              <ModalSelect value={f.markId} onChange={e=>setF(p=>({...p,markId:e.target.value}))}>
                <option value="">-- Select Mark --</option>
                {marks.map(m=><option key={m.id} value={m.id}>{m.course?.courseCode} - {m.topic||"Assessment"} ({m.marksObtained}/{m.totalMarks})</option>)}
              </ModalSelect>
            </ModalField>
            <ModalField label="Reason"><ModalTextarea value={f.reason} onChange={e=>setF(p=>({...p,reason:e.target.value}))} rows={4}/></ModalField>
            <ModalSubmit loading={isSub} label="Submit Appeal"/>
          </form>
        </Modal>
      )}
    </div>
  );
}
