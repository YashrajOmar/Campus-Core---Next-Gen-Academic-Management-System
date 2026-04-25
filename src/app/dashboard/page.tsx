"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";

const schedule = [
  { time: "09:00 AM", hour: 9, subject: "Data Structures", type: "Lecture", room: "Hall A3" },
  { time: "11:00 AM", hour: 11, subject: "Database Management", type: "Lab", room: "Lab 4" },
  { time: "02:00 PM", hour: 14, subject: "Operating Systems", type: "Lecture", room: "Hall B1" },
];

const mockNotifications = [
  { id: 1, text: "Mid-term schedule published", time: "2h ago", unread: true },
  { id: 2, text: "Your appeal for CS301 was resolved", time: "5h ago", unread: true },
  { id: 3, text: "Attendance below 75% in EC350", time: "1d ago", unread: false },
];

export default function DashboardPage() {
  const { data: session } = useSession();
  const userRole = (session?.user as any)?.role || "STUDENT";

  return (
    <div className="space-y-6">
      
      {/* Stats Grid - Role Based */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {userRole === "ADMIN" ? (
          <>
            <StatCard title="Total Enrolled Users" value="2,482" trend="+12 this month" isPositive={true} delay="delay-100" />
            <StatCard title="System Performance" value="99.9%" trend="Uptime Excellent" isPositive={true} delay="delay-200" />
            <StatCard title="Pending Verifications" value="28" trend="Requires Action" isPositive={false} delay="delay-300" />
            <StatCard title="Global Appeals" value="156" trend="Escalated: 12" isPositive={false} delay="delay-400" />
          </>
        ) : userRole === "FACULTY" || userRole === "HOD" || userRole === "COORDINATOR" ? (
          <>
            <StatCard title="Assigned Courses" value="4" trend="Active Classes" isPositive={true} delay="delay-100" />
            <StatCard title="Attendance Average" value="82%" trend="Class Performance" isPositive={true} delay="delay-200" />
            <StatCard title="Pending Grading" value="42" trend="Midterms ready" isPositive={false} delay="delay-300" />
            <StatCard title="Open Appeals" value="8" trend="Action Required" isPositive={false} delay="delay-400" />
          </>
        ) : (
          <>
            <StatCard title="Current Attendance" value="84%" trend="+2% this week" isPositive={true} delay="delay-100" />
            <StatCard title="Internal Marks Avg" value="78.5" trend="Top 15% of class" isPositive={true} delay="delay-200" />
            <StatCard title="Active Appeals" value="1" trend="Reviewing Phase" isPositive={false} delay="delay-300" />
            <StatCard title="Upcoming Exams" value="3" trend="Mid-terms in 12 days" isPositive={false} delay="delay-400" />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Interactive Suite - Role Based */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-3xl animate-slide-up delay-200 border border-white/5 shadow-md">
          {userRole === "ADMIN" ? (
            <AdminSuite />
          ) : userRole === "FACULTY" || userRole === "HOD" || userRole === "COORDINATOR" ? (
            <FacultySuite />
          ) : (
            <StudentSuite />
          )}
        </div>

        {/* Recent Notices */}
        <div className="glass-panel p-6 rounded-3xl animate-slide-up delay-300 border border-white/5 shadow-md flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-white">Recent Notices</h2>
            <Link href="/dashboard/notices" className="text-primary text-sm hover:underline">View All</Link>
          </div>
          
          <div className="space-y-4 flex-1 overflow-y-auto pr-2">
            <NoticeItem title="Mid-term schedule published" date="Oct 12" />
            <NoticeItem title="Guest Lecture by Industry Expert" date="Oct 10" />
            <NoticeItem title="Last date for internal appeals" date="Oct 08" isUrgent />
            <NoticeItem title="Holiday on accounts of festival" date="Oct 05" />
          </div>
        </div>
      </div>
      
    </div>
  );
}

function StudentSuite() {
  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-white">Today&apos;s Schedule</h2>
        <Link href="/dashboard/exams" className="text-primary text-sm hover:underline">View Full Timetable</Link>
      </div>
      <ScheduleList />
    </>
  );
}

function FacultySuite() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-bold text-white">Teaching Schedule</h2>
        <button className="text-primary text-sm hover:underline">Manage Classes</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          { course: "Data Structures", time: "09:00 AM", room: "Hall A3", status: "Active" },
          { course: "Database Management", time: "11:00 AM", room: "Lab 4", status: "Upcoming" },
        ].map((cls, i) => (
          <div key={i} className="bg-black/20 border border-white/5 p-4 rounded-2xl">
            <div className="flex justify-between items-start mb-2">
              <h4 className="font-semibold text-white">{cls.course}</h4>
              <span className={`text-[10px] px-2 py-0.5 rounded ${cls.status === 'Active' ? 'bg-primary/20 text-primary' : 'bg-white/5 text-foreground/40'}`}>{cls.status}</span>
            </div>
            <p className="text-xs text-foreground/60">{cls.time} — {cls.room}</p>
          </div>
        ))}
      </div>
      <div className="pt-4 border-t border-white/10">
        <h3 className="text-sm font-bold text-white mb-3">Pending Grading Tasks</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs p-3 bg-white/5 rounded-xl">
            <span className="text-foreground/80">Midterm Evaluation: CS301 (62 pending)</span>
            <button className="text-primary hover:underline">Resolve Now</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AdminSuite() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-bold text-white">System Health & Control</h2>
        <span className="text-xs text-green-400 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" /> Live Connectivity
        </span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-black/20 border border-white/5 p-5 rounded-2xl flex items-center justify-between">
          <div>
            <h4 className="text-xs text-foreground/50 mb-1">Server Status</h4>
            <p className="text-sm font-bold text-white">Stable (64ms latency)</p>
          </div>
          <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center text-green-400">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
          </div>
        </div>
        <div className="bg-black/20 border border-white/5 p-5 rounded-2xl flex items-center justify-between">
          <div>
            <h4 className="text-xs text-foreground/50 mb-1">Database Sync</h4>
            <p className="text-sm font-bold text-white">Encrypted & Healthy</p>
          </div>
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v4"/><path d="m16.2 7.8 2.9-2.9"/><path d="M21 12h-4"/><path d="m16.2 16.2 2.9 2.9"/><path d="M12 22v-4"/><path d="m7.8 16.2-2.9 2.9"/><path d="M3 12h4"/><path d="m7.8 7.8-2.9-2.9"/></svg>
          </div>
        </div>
      </div>
      <div className="pt-4 border-t border-white/10">
        <h3 className="text-sm font-bold text-white mb-4">Quick Admin Actions</h3>
        <div className="grid grid-cols-2 gap-3">
          <button className="p-3 text-xs bg-white/5 rounded-xl hover:bg-white/10 transition-colors text-foreground/80 text-left border border-white/5">Broadcast Notice</button>
          <button className="p-3 text-xs bg-white/5 rounded-xl hover:bg-white/10 transition-colors text-foreground/80 text-left border border-white/5">Generate System Report</button>
          <button className="p-3 text-xs bg-white/5 rounded-xl hover:bg-white/10 transition-colors text-foreground/80 text-left border border-white/5">Reset User Password</button>
          <button className="p-3 text-xs bg-primary/20 rounded-xl hover:bg-primary/30 transition-colors text-primary text-left border border-primary/20 font-medium">Audit Security Logs</button>
        </div>
      </div>
    </div>
  );
}

function ScheduleList() {
  const [currentHour, setCurrentHour] = useState<number>(new Date().getHours());

  useEffect(() => {
    // Update every minute
    const interval = setInterval(() => {
      setCurrentHour(new Date().getHours());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Find the active class: the one whose hour <= now AND now < hour + 1
  const activeIndex = schedule.findIndex((item) => {
    return item.hour <= currentHour && currentHour < item.hour + 1;
  });

  return (
    <div className="space-y-4">
      {schedule.map((item, i) => {
        const isActive = i === activeIndex;
        const isPast = i < activeIndex;
        return (
          <div key={i} className={`flex items-stretch gap-4 p-4 rounded-2xl border transition-all ${
            isActive ? 'bg-primary/10 border-primary/30' : isPast ? 'opacity-50 bg-black/10 border-white/5' : 'bg-black/20 border-white/5'
          }`}>
            <div className="flex flex-col justify-center items-center w-24 border-r border-white/10 pr-4">
              <span className={`text-sm font-bold ${isActive ? 'text-primary' : 'text-white'}`}>{item.time}</span>
              {isPast && <span className="text-[10px] text-foreground/40 mt-1">Done</span>}
            </div>
            <div className="flex-1 py-1">
              <h4 className="font-semibold text-white mb-1">{item.subject}</h4>
              <div className="flex items-center gap-3 text-xs text-foreground/60">
                <span className="bg-white/10 px-2 py-0.5 rounded">{item.type}</span>
                <span>{item.room}</span>
              </div>
            </div>
            {isActive && (
              <div className="flex items-center">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                </span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function StatCard({ title, value, trend, isPositive, delay }: { title: string, value: string, trend: string, isPositive: boolean, delay: string }) {
  return (
    <div className={`glass-panel p-6 rounded-3xl border border-white/5 shadow-md hover:-translate-y-1 transition-transform animate-slide-up ${delay}`}>
      <h3 className="text-sm font-medium text-foreground/60 mb-2">{title}</h3>
      <div className="flex items-end justify-between">
        <span className="text-3xl font-bold text-white">{value}</span>
        <span className={`text-xs px-2 py-1 rounded-md ${isPositive ? 'bg-green-500/10 text-green-400' : 'bg-orange-500/10 text-orange-400'}`}>
          {trend}
        </span>
      </div>
    </div>
  );
}

function NoticeItem({ title, date, isUrgent = false }: { title: string, date: string, isUrgent?: boolean }) {
  return (
    <Link href="/dashboard/notices" className="group cursor-pointer block">
      <div className="flex flex-col gap-1 py-3 border-b border-white/5 group-hover:border-primary/30 transition-colors">
        <div className="flex items-center justify-between">
          <span className={`text-xs font-medium ${isUrgent ? 'text-red-400' : 'text-primary'}`}>{date}</span>
          {isUrgent && <span className="text-[10px] bg-red-500/20 text-red-300 px-1.5 py-0.5 rounded">Action Required</span>}
        </div>
        <p className="text-sm text-foreground/80 group-hover:text-white transition-colors line-clamp-2">{title}</p>
      </div>
    </Link>
  );
}

export { mockNotifications };
