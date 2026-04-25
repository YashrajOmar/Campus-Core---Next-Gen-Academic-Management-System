"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

const inp: React.CSSProperties = { width:"100%", background:"rgba(0,0,0,0.4)", border:"1px solid rgba(255,255,255,0.15)", borderRadius:"12px", padding:"10px 14px", fontSize:"14px", color:"white", outline:"none", boxSizing:"border-box", colorScheme:"dark" };

export function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  const [m, setM] = useState(false);
  useEffect(() => { setM(true); }, []);
  if (!m) return null;
  return createPortal(
    <div onClick={e => { if (e.target === e.currentTarget) onClose(); }} style={{ position:"fixed", inset:0, zIndex:9999, display:"flex", alignItems:"center", justifyContent:"center", background:"rgba(0,0,0,0.8)", backdropFilter:"blur(8px)" }}>
      <div style={{ width:"100%", maxWidth:"500px", margin:"16px", maxHeight:"90vh", overflowY:"auto", borderRadius:"24px", background:"rgb(15,10,40)", border:"1px solid rgba(255,255,255,0.12)", boxShadow:"0 25px 60px rgba(0,0,0,0.7)", position:"relative", padding:"28px", colorScheme:"dark" }}>
        <button onClick={onClose} style={{ position:"absolute", top:"14px", right:"18px", background:"none", border:"none", color:"rgba(255,255,255,0.4)", fontSize:"24px", cursor:"pointer", lineHeight:1 }}>x</button>
        {children}
      </div>
    </div>,
    document.body
  );
}
export function ModalTitle({ children }: { children: React.ReactNode }) {
  return <h2 style={{ color:"white", fontSize:"18px", fontWeight:700, marginBottom:"20px", paddingRight:"36px" }}>{children}</h2>;
}
export function ModalError({ msg }: { msg: string }) {
  if (!msg) return null;
  return <div style={{ background:"rgba(239,68,68,0.15)", border:"1px solid rgba(239,68,68,0.4)", color:"#fca5a5", borderRadius:"12px", padding:"10px 14px", fontSize:"13px", marginBottom:"14px" }}>{msg}</div>;
}
export function ModalField({ label, children }: { label: string; children: React.ReactNode }) {
  return <div style={{ marginBottom:"14px" }}>
    <label style={{ display:"block", fontSize:"11px", fontWeight:600, color:"rgba(255,255,255,0.5)", marginBottom:"6px", textTransform:"uppercase", letterSpacing:"0.06em" }}>{label}</label>
    {children}
  </div>;
}
export function ModalRow({ children }: { children: React.ReactNode }) {
  return <div style={{ display:"flex", gap:"12px" }}>{children}</div>;
}
export function ModalHalf({ children }: { children: React.ReactNode }) {
  return <div style={{ flex:1, minWidth:0 }}>{children}</div>;
}
export function ModalInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} style={inp} />;
}
export function ModalSelect(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} style={{ ...inp, cursor:"pointer" }}>{props.children}</select>;
}
export function ModalTextarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} style={{ ...inp, resize:"vertical", minHeight:"90px" }} />;
}
export function ModalSubmit({ loading, label }: { loading: boolean; label: string }) {
  return <button type="submit" disabled={loading} style={{ width:"100%", padding:"13px", background: loading ? "rgba(139,92,246,0.5)" : "rgb(139,92,246)", border:"none", borderRadius:"12px", color:"white", fontSize:"14px", fontWeight:600, cursor: loading ? "not-allowed" : "pointer", marginTop:"8px" }}>{loading ? "Saving..." : label}</button>;
}
