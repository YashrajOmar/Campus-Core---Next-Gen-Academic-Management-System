"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useState, useRef, useEffect } from "react";
import React from "react";
import LiveStatusBar from "@/components/LiveStatusBar";

const notifications = [
  { id: 1, text: "Mid-term schedule has been published.", time: "2h ago", unread: true },
  { id: 2, text: "Your appeal for CS301 was resolved.", time: "5h ago", unread: true },
  { id: 3, text: "Attendance below 75% in EC350.", time: "1d ago", unread: false },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [notifOpen, setNotifOpen] = useState(false);
  const [readIds, setReadIds] = useState<number[]>([]);
  const notifRef = useRef<HTMLDivElement>(null);

  const userName = session?.user?.name || "User";
  const userRole = (session?.user as any)?.role || "STUDENT";
  const initials = userName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
  const unreadCount = notifications.filter(n => n.unread && !readIds.includes(n.id)).length;

  const roleLabels: Record<string, string> = {
    ADMIN: "Administrator", HOD: "Head of Dept.", FACULTY: "Faculty",
    COORDINATOR: "Coordinator", STUDENT: "Student", PARENT: "Parent",
  };

  const navItems = [
    { href: "/dashboard", label: "Overview", roles: ["ANY"] },
    { href: "/dashboard/courses", label: "Courses", roles: ["ADMIN", "HOD", "COORDINATOR", "FACULTY"] },
    { href: "/dashboard/timetable", label: "Timetable", roles: ["ANY"] },
    { href: "/dashboard/attendance", label: "Attendance", roles: ["STUDENT", "PARENT"] },
    { href: "/dashboard/marks", label: "Internal Marks", roles: ["ANY"] },
    { href: "/dashboard/exams", label: "Exam Schedule", roles: ["ANY"] },
    { href: "/dashboard/appeals", label: "Appeals Portal", roles: ["ANY"] },
    { href: "/dashboard/notices", label: "Notices", roles: ["ANY"] },
    { href: "/dashboard/users", label: "User Management", roles: ["ADMIN", "COORDINATOR"] },
  ].filter(item => item.roles.includes("ANY") || item.roles.includes(userRole));

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleOpenNotif = () => {
    setNotifOpen(prev => !prev);
    // Mark all as read when opened
    setReadIds(notifications.map(n => n.id));
  };

  const handleLogout = async () => {
    await signOut({ redirect: false });
    window.location.href = "/";
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      
      {/* Sidebar */}
      <aside className="w-64 glass-panel border-r border-white/10 hidden md:flex flex-col z-20 m-4 rounded-3xl animate-slide-up">
        <div className="h-20 flex items-center px-8 border-b border-white/5">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/30">
              <span className="text-white font-bold text-sm">C</span>
            </div>
            <span className="text-lg font-bold tracking-tight text-white animate-glow">CampusCore</span>
          </Link>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link key={item.href} href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  isActive
                  ? "bg-primary/15 text-primary border border-primary/20 shadow-[0_0_15px_rgba(139,92,246,0.1)]"
                  : "text-foreground/70 hover:bg-white/5 hover:text-white border border-transparent"
                }`}>
                <div className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-primary animate-pulse' : 'bg-transparent'}`} />
                <span className="font-medium text-sm">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/5">
          <button onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-400 group rounded-xl hover:bg-red-400/10 transition-colors w-full">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:-translate-x-1 transition-transform">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/>
            </svg>
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Top Navbar */}
        <header className="h-20 glass-panel border-b border-white/10 flex items-center justify-between px-8 z-10 m-4 mt-4 ml-0 rounded-3xl animate-slide-up delay-100">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold text-white capitalize">
              {pathname === "/dashboard" ? "Overview" : pathname.split("/dashboard/")[1] || "Dashboard"}
            </h1>
            <span className="hidden lg:inline-flex px-3 py-1 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs font-medium backdrop-blur-md">
              Fall Semester 2026
            </span>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="hidden lg:block">
              <LiveStatusBar />
            </div>
            {/* Notification Bell */}
            <div className="relative" ref={notifRef}>
              <button onClick={handleOpenNotif}
                className="text-foreground/70 hover:text-white transition-colors relative p-1">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute -top-2 -right-2 min-w-[18px] h-[18px] bg-yellow-400 rounded-full text-[9px] text-black flex items-center justify-center font-black px-1 shadow-[0_0_8px_rgba(250,204,21,0.8)] border border-yellow-300">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown */}
              {notifOpen && (
                <div className="absolute right-0 top-10 w-80 glass-panel rounded-2xl border border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.4)] z-50 overflow-hidden animate-slide-up">
                  <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white">Notifications</h3>
                    <span className="text-xs text-foreground/50">{notifications.length} total</span>
                  </div>
                  <div className="divide-y divide-white/5 max-h-72 overflow-y-auto">
                    {notifications.map((n) => (
                      <div key={n.id} className={`px-4 py-3 flex gap-3 hover:bg-white/5 transition-colors ${n.unread && !readIds.includes(n.id) ? 'bg-yellow-400/5' : ''}`}>
                        <div className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${n.unread && !readIds.includes(n.id) ? 'bg-yellow-400 animate-pulse' : 'bg-white/20'}`} />
                        <div>
                          <p className="text-sm text-foreground/90">{n.text}</p>
                          <p className="text-xs text-foreground/40 mt-1">{n.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="px-4 py-3 border-t border-white/10">
                    <Link href="/dashboard/notices" onClick={() => setNotifOpen(false)}
                      className="text-xs text-primary hover:underline font-medium">
                      View all notices →
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* User Profile */}
            <div className="flex items-center gap-3 border-l border-white/10 pl-6">
              <div className="w-9 h-9 rounded-full bg-secondary border border-primary/40 flex items-center justify-center">
                <span className="text-xs font-bold text-primary">{initials}</span>
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-white leading-none">{userName}</p>
                <p className="text-xs text-foreground/50 mt-1">{roleLabels[userRole] || userRole}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 pt-0 md:pl-0 animate-slide-up delay-200">
          {children}
        </main>
      </div>
    </div>
  );
}
