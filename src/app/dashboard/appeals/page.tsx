"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";

type Message = {
  id: string;
  text: string;
  createdAt: string;
  authorRole: string;
  author: { name: string; role: string };
};

type Appeal = {
  id: string;
  reason: string;
  status: string;
  currentAuthority: string;
  currentStep: number;
  createdAt: string;
  student: { user: { name: string } };
  mark: { marksObtained: number; totalMarks: number; topic: string | null; course: { courseCode: string; courseName: string } };
  messages: Message[];
};

const AUTHORITY_STEPS = ["INSTRUCTOR", "COORDINATOR", "HOD", "ADMIN"];

const STATUS_STYLE: Record<string, string> = {
  OPEN: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  UNDER_REVIEW: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
  RESOLVED: "text-green-400 bg-green-500/10 border-green-500/20",
  REJECTED: "text-red-400 bg-red-500/10 border-red-500/20",
  ESCALATED: "text-orange-400 bg-orange-500/10 border-orange-500/20",
};

export default function AppealsPage() {
  const { data: session } = useSession();
  const userRole = (session?.user as any)?.role || "STUDENT";
  const userId = (session?.user as any)?.id;

  const [appeals, setAppeals] = useState<Appeal[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [msgText, setMsgText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  
  // New appeal state
  const [showNewModal, setShowNewModal] = useState(false);
  const [newSubject, setNewSubject] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const threadEndRef = useRef<HTMLDivElement>(null);

  const selected = appeals.find(a => a.id === selectedId) || null;

  useEffect(() => { fetchAppeals(); }, []);

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selected?.messages?.length]);

  async function fetchAppeals() {
    setLoading(true);
    try {
      const res = await fetch("/api/appeals");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setAppeals(data);
    } catch {
      setError("Failed to load appeals.");
    } finally {
      setLoading(false);
    }
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!msgText.trim() || !selectedId) return;
    setSending(true);
    setError("");

    try {
      const res = await fetch(`/api/appeals/${selectedId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: msgText.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send message.");

      // Optimistically add message to thread
      setAppeals(prev => prev.map(a => a.id === selectedId
        ? { ...a, messages: [...a.messages, data] }
        : a
      ));
      setMsgText("");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSending(false);
    }
  }

  async function handleCreateAppeal(e: React.FormEvent) {
    e.preventDefault();
    if (!newSubject.trim() || !newDescription.trim()) return;
    setIsSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/appeals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject: newSubject, description: newDescription })
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed to create appeal.");
      setShowNewModal(false);
      setNewSubject("");
      setNewDescription("");
      fetchAppeals();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleStatusChange(id: string, status: string, nextStep?: number) {
    try {
      const res = await fetch(`/api/appeals/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, currentStep: nextStep }),
      });
      if (!res.ok) throw new Error("Failed to update appeal.");
      const updated = await res.json();
      setAppeals(prev => prev.map(a => a.id === id ? { ...a, ...updated } : a));
    } catch (e: any) {
      setError(e.message);
    }
  }

  const isStaff = ["ADMIN", "HOD", "COORDINATOR", "FACULTY"].includes(userRole);
  const canAct = isStaff && selected?.status === "PENDING" || selected?.status === "IN_REVIEW";

  return (
    <div className="h-full flex gap-6 animate-slide-up">
      {/* Left Panel — Appeal List */}
      <div className={`${selected ? "hidden md:flex w-80 flex-shrink-0" : "w-full"} flex-col gap-4`}>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">Appeals Portal</h1>
          {userRole === "STUDENT" && (
            <button onClick={() => setShowNewModal(true)} className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-xl text-sm font-medium transition-all shadow-[0_0_15px_rgba(139,92,246,0.3)] hover:-translate-y-0.5">
              + New Appeal
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <span className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        ) : appeals.length === 0 ? (
          <div className="glass-panel p-8 rounded-3xl border border-white/5 text-center">
            <p className="text-foreground/40 text-sm">No appeals yet.</p>
          </div>
        ) : (
          <div className="space-y-3 flex-1 overflow-y-auto pr-1">
            {appeals.map(appeal => (
              <div
                key={appeal.id}
                onClick={() => setSelectedId(appeal.id === selectedId ? null : appeal.id)}
                className={`p-5 rounded-2xl border cursor-pointer transition-all ${
                  selectedId === appeal.id
                    ? "border-primary/40 bg-primary/10"
                    : "bg-black/20 border-white/10 hover:border-primary/30 hover:bg-white/3"
                }`}
              >
                <div className="flex items-start justify-between mb-2 gap-2">
                  <div>
                    <p className="font-semibold text-white text-sm">
                      {appeal.mark.course.courseCode} — {appeal.mark.topic || "Assessment"}
                    </p>
                    {isStaff && (
                      <p className="text-xs text-foreground/50 mt-0.5">{appeal.student.user.name}</p>
                    )}
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border flex-shrink-0 ${STATUS_STYLE[appeal.status]}`}>
                    {appeal.status}
                  </span>
                </div>
                <p className="text-xs text-foreground/60 line-clamp-2 mb-3">{appeal.reason}</p>
                <div className="flex items-center justify-between text-[10px] text-foreground/40 border-t border-white/5 pt-2 mt-1">
                  <span>Step {appeal.currentStep}/4 · {appeal.currentAuthority}</span>
                  <span>{appeal.messages.length} messages</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Right Panel — Thread */}
      {selected ? (
        <div className="flex-1 flex flex-col glass-panel rounded-3xl border border-primary/20 overflow-hidden">
          {/* Thread Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
            <div>
              <h2 className="text-base font-bold text-white">
                {selected.mark.course.courseCode} — {selected.mark.topic || "Assessment"}
              </h2>
              <div className="flex items-center gap-3 mt-1">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${STATUS_STYLE[selected.status]}`}>
                  {selected.status}
                </span>
                <span className="text-[10px] text-foreground/40">
                  With: {selected.currentAuthority} (Step {selected.currentStep}/4)
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Student Action: Escalate */}
              {!isStaff && selected.status === "REJECTED" && (
                <button
                  onClick={() => handleStatusChange(selected.id, "ESCALATED")}
                  className="px-3 py-1.5 text-xs font-semibold bg-orange-500/15 border border-orange-500/30 text-orange-300 rounded-lg hover:bg-orange-500/25 transition-colors"
                >
                  Escalate ↑
                </button>
              )}

              {/* Staff Action Dropdown */}
              {isStaff && (
                <select
                  value={selected.status}
                  onChange={(e) => handleStatusChange(selected.id, e.target.value)}
                  className="bg-black/20 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-primary/50"
                >
                  <option value="OPEN">Mark OPEN</option>
                  <option value="UNDER_REVIEW">Mark UNDER_REVIEW</option>
                  <option value="RESOLVED">Mark RESOLVED</option>
                  <option value="REJECTED">Mark REJECTED</option>
                  <option value="ESCALATED">Mark ESCALATED</option>
                </select>
              )}
              <button onClick={() => setSelectedId(null)} className="text-foreground/40 hover:text-white transition-colors ml-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            {/* Original reason as first message */}
            <div className="flex justify-start">
              <div className="max-w-[75%] bg-white/5 border border-white/10 rounded-2xl rounded-tl-sm px-4 py-3">
                <p className="text-[11px] font-bold text-foreground/50 mb-1">{selected.student.user.name} (Student — Original Reason)</p>
                <p className="text-sm text-foreground/90">{selected.reason}</p>
                <p className="text-[10px] text-foreground/30 mt-2">{new Date(selected.createdAt).toLocaleString()}</p>
              </div>
            </div>

            {selected.messages.map(msg => {
              const isMe = msg.authorRole === userRole;
              return (
                <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[75%] px-4 py-3 rounded-2xl ${
                    isMe
                      ? "bg-primary/20 border border-primary/30 rounded-tr-sm"
                      : "bg-white/5 border border-white/10 rounded-tl-sm"
                  }`}>
                    <p className={`text-[11px] font-bold mb-1 ${isMe ? "text-primary" : "text-foreground/50"}`}>
                      {msg.author.name} ({msg.authorRole})
                    </p>
                    <p className="text-sm text-white">{msg.text}</p>
                    <p className={`text-[10px] mt-2 ${isMe ? "text-foreground/40 text-right" : "text-foreground/30"}`}>
                      {new Date(msg.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={threadEndRef} />
          </div>

          {/* Message Input */}
          {selected.status !== "RESOLVED" && selected.status !== "REJECTED" ? (
            <form onSubmit={sendMessage} className="px-6 py-4 border-t border-white/10">
              {error && <p className="text-xs text-red-400 mb-2">{error}</p>}
              <div className="flex gap-3">
                <input
                  type="text"
                  value={msgText}
                  onChange={e => setMsgText(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-foreground/30 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                />
                <button
                  type="submit"
                  disabled={sending || !msgText.trim()}
                  className="px-5 py-3 bg-primary hover:bg-primary-hover text-white rounded-xl text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(139,92,246,0.3)] hover:shadow-[0_0_25px_rgba(139,92,246,0.5)]"
                >
                  {sending ? (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin block" />
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>
                    </svg>
                  )}
                </button>
              </div>
            </form>
          ) : (
            <div className="px-6 py-4 border-t border-white/10 text-center">
              <p className="text-xs text-foreground/40">
                This appeal is <span className={selected.status === "RESOLVED" ? "text-green-400" : "text-red-400"}>{selected.status.toLowerCase()}</span> and closed.
              </p>
            </div>
          )}
        </div>
      ) : (
        // No appeal selected placeholder 
        <div className="hidden md:flex flex-1 items-center justify-center glass-panel rounded-3xl border border-white/5">
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
            </div>
            <p className="text-sm text-foreground/50">Select an appeal to view the conversation</p>
          </div>
        </div>
      )}

      {/* New Appeal Modal */}
      {showNewModal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md glass-panel p-6 rounded-3xl border border-white/10 shadow-2xl relative animate-slide-up">
            <button onClick={() => setShowNewModal(false)} className="absolute top-4 right-4 text-white/50 hover:text-white pb-1">✕</button>
            <h3 className="text-lg font-bold text-white mb-4">Create New Appeal</h3>
            <form onSubmit={handleCreateAppeal} className="space-y-4">
              {error && (
                <div className="p-3 text-sm text-red-200 bg-red-500/20 border border-red-500/30 rounded-xl text-center">
                  {error}
                </div>
              )}
              <div>
                <label className="text-xs font-medium text-white/70 block mb-1">Subject (Course or Topic)</label>
                <input required type="text" value={newSubject} onChange={e => setNewSubject(e.target.value)} className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/50" placeholder="e.g. CS101 Midterm Grading" />
              </div>
              <div>
                <label className="text-xs font-medium text-white/70 block mb-1">Description (Reason)</label>
                <textarea required value={newDescription} onChange={e => setNewDescription(e.target.value)} rows={4} className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/50" placeholder="Type the reason for your appeal..." />
              </div>
              <button disabled={isSubmitting} type="submit" className="w-full py-3 bg-primary hover:bg-primary-hover text-white rounded-xl text-sm font-semibold transition-all">
                {isSubmitting ? "Submitting..." : "Submit Appeal"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
