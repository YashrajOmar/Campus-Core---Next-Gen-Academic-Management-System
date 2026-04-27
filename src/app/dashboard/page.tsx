"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";

export default function DashboardPage() {
  const { data: session } = useSession();
  const userRole = (session?.user as any)?.role || "STUDENT";
  
  const [notices, setNotices] = useState<any[]>([]);
  const [timetable, setTimetable] = useState<any[]>([]);
  const [appeals, setAppeals] = useState<any[]>([]);
  
  useEffect(() => {
    fetch("/api/notices").then(r=>r.json()).then(data => {
      setNotices(Array.isArray(data) ? data.slice(0, 4) : []);
    }).catch(()=>{});

    fetch("/api/timetable").then(r=>r.json()).then(data => {
      if(Array.isArray(data)){
        const days = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
        const today = days[new Date().getDay()];
        const todaysClasses = data.filter((t:any) => t.dayOfWeek === today).sort((a:any, b:any) => a.startTime.localeCompare(b.startTime));
        setTimetable(todaysClasses);
      }
    }).catch(()=>{});

    if (userRole !== "STUDENT" && userRole !== "PARENT") {
      fetch("/api/appeals").then(r=>r.json()).then(data => {
        setAppeals(Array.isArray(data) ? data : []);
      }).catch(()=>{});
    }
  }, [userRole]);

  return (
    <div className="space-y-6">
      
      {/* Stats Grid - Role Based */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {userRole === "ADMIN" ? (
          <>
            <StatCard title="System Performance" value="99.9%" trend="Uptime Excellent" isPositive={true} delay="delay-100" />
            <StatCard title="Global Appeals" value={appeals.length.toString()} trend="Active in system" isPositive={false} delay="delay-200" />
            <StatCard title="Total Notices" value={notices.length.toString()} trend="Recent updates" isPositive={true} delay="delay-300" />
            <StatCard title="Daily Classes" value={timetable.length.toString()} trend="Scheduled today" isPositive={true} delay="delay-400" />
          </>
        ) : userRole === "FACULTY" || userRole === "HOD" || userRole === "COORDINATOR" ? (
          <>
            <StatCard title="Today's Classes" value={timetable.length.toString()} trend="Scheduled today" isPositive={true} delay="delay-100" />
            <StatCard title="Open Appeals" value={appeals.filter(a=>a.status!=="RESOLVED"&&a.status!=="REJECTED").length.toString()} trend="Action Required" isPositive={false} delay="delay-200" />
            <StatCard title="Notices" value={notices.length.toString()} trend="Recent updates" isPositive={true} delay="delay-300" />
            <StatCard title="System Health" value="Stable" trend="All services online" isPositive={true} delay="delay-400" />
          </>
        ) : (
          <>
            <StatCard title="Today's Classes" value={timetable.length.toString()} trend="Scheduled today" isPositive={true} delay="delay-100" />
            <StatCard title="Internal Marks" value="View" trend="Check portal" isPositive={true} delay="delay-200" />
            <StatCard title="Notices" value={notices.length.toString()} trend="Recent updates" isPositive={true} delay="delay-300" />
            <StatCard title="Attendance" value="Track" trend="Maintain >75%" isPositive={false} delay="delay-400" />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Interactive Suite - Role Based */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-3xl animate-slide-up delay-200 border border-white/5 shadow-md">
          {userRole === "ADMIN" ? (
            <AdminSuite />
          ) : userRole === "FACULTY" || userRole === "HOD" || userRole === "COORDINATOR" ? (
            <FacultySuite timetable={timetable} appeals={appeals} />
          ) : (
            <StudentSuite timetable={timetable} />
          )}
        </div>

        {/* Recent Notices */}
        <div className="glass-panel p-6 rounded-3xl animate-slide-up delay-300 border border-white/5 shadow-md flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-white">Recent Notices</h2>
            <Link href="/dashboard/notices" className="text-primary text-sm hover:underline">View All</Link>
          </div>
          
          <div className="space-y-4 flex-1 overflow-y-auto pr-2">
            {notices.length === 0 ? <p className="text-foreground/40 text-sm">No recent notices.</p> : notices.map(n => (
              <NoticeItem key={n.id} title={n.title} date={new Date(n.createdAt).toLocaleDateString()} isUrgent={n.title.toLowerCase().includes("urgent")} />
            ))}
          </div>
        </div>
      </div>
      
    </div>
  );
}

function StudentSuite({ timetable }: { timetable: any[] }) {
  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-white">Today's Schedule</h2>
        <Link href="/dashboard/timetable" className="text-primary text-sm hover:underline">View Full Timetable</Link>
      </div>
      <ScheduleList timetable={timetable} />
    </>
  );
}

function FacultySuite({ timetable, appeals }: { timetable: any[], appeals: any[] }) {
  const pendingAppeals = appeals.filter(a => a.status !== "RESOLVED" && a.status !== "REJECTED");
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-bold text-white">Teaching Schedule (Today)</h2>
        <Link href="/dashboard/timetable" className="text-primary text-sm hover:underline">Manage Timetable</Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {timetable.length === 0 ? <p className="text-foreground/40 text-sm">No classes today.</p> : timetable.map((cls, i) => (
          <div key={i} className="bg-black/20 border border-white/5 p-4 rounded-2xl">
            <div className="flex justify-between items-start mb-2">
              <h4 className="font-semibold text-white">{cls.course?.courseName || cls.courseId}</h4>
              <span className={`text-[10px] px-2 py-0.5 rounded bg-primary/20 text-primary`}>{cls.classType}</span>
            </div>
            <p className="text-xs text-foreground/60">{cls.startTime} - {cls.endTime} - {cls.roomNumber}</p>
          </div>
        ))}
      </div>
      <div className="pt-4 border-t border-white/10">
        <h3 className="text-sm font-bold text-white mb-3">Pending Tasks</h3>
        <div className="space-y-3">
          {pendingAppeals.length === 0 ? <p className="text-foreground/40 text-sm">No pending tasks.</p> : (
            <div className="flex items-center justify-between text-xs p-3 bg-white/5 rounded-xl">
              <span className="text-foreground/80">{pendingAppeals.length} Open Appeals Require Review</span>
              <Link href="/dashboard/appeals" className="text-primary hover:underline">Resolve Now</Link>
            </div>
          )}
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
            <p className="text-sm font-bold text-white">Stable</p>
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
        <h3 className="text-sm font-bold text-white mb-4">Quick Links</h3>
        <div className="grid grid-cols-2 gap-3">
          <Link href="/dashboard/notices" className="p-3 text-xs bg-white/5 rounded-xl hover:bg-white/10 transition-colors text-foreground/80 text-left border border-white/5">Broadcast Notice</Link>
          <Link href="/dashboard/users" className="p-3 text-xs bg-white/5 rounded-xl hover:bg-white/10 transition-colors text-foreground/80 text-left border border-white/5">Manage Users</Link>
          <Link href="/dashboard/courses" className="p-3 text-xs bg-white/5 rounded-xl hover:bg-white/10 transition-colors text-foreground/80 text-left border border-white/5">Manage Courses</Link>
          <Link href="/dashboard/appeals" className="p-3 text-xs bg-primary/20 rounded-xl hover:bg-primary/30 transition-colors text-primary text-left border border-primary/20 font-medium">View Appeals</Link>
        </div>
      </div>
    </div>
  );
}

function ScheduleList({ timetable }: { timetable: any[] }) {
  const [currentTime, setCurrentTime] = useState<string>(new Date().toTimeString().slice(0, 5));

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date().toTimeString().slice(0, 5)), 60000);
    return () => clearInterval(interval);
  }, []);

  let activeIndex = -1;
  for(let i=0; i<timetable.length; i++) {
    if(timetable[i].startTime <= currentTime && currentTime <= timetable[i].endTime) activeIndex = i;
    else if(timetable[i].startTime > currentTime && activeIndex === -1) activeIndex = i;
  }

  return (
    <div className="space-y-4">
      {timetable.length === 0 ? <p className="text-foreground/40 text-sm">No classes scheduled today.</p> : timetable.map((item, i) => {
        const isActive = i === activeIndex;
        const isPast = item.endTime < currentTime;
        return (
          <div key={i} className={`flex items-stretch gap-4 p-4 rounded-2xl border transition-all ${
            isActive ? 'bg-primary/10 border-primary/30' : isPast ? 'opacity-50 bg-black/10 border-white/5' : 'bg-black/20 border-white/5'
          }`}>
            <div className="flex flex-col justify-center items-center w-24 border-r border-white/10 pr-4">
              <span className={`text-sm font-bold ${isActive ? 'text-primary' : 'text-white'}`}>{item.startTime}</span>
              {isPast && <span className="text-[10px] text-foreground/40 mt-1">Done</span>}
            </div>
            <div className="flex-1 py-1">
              <h4 className="font-semibold text-white mb-1">{item.course?.courseName || item.courseId}</h4>
              <div className="flex items-center gap-3 text-xs text-foreground/60">
                <span className="bg-white/10 px-2 py-0.5 rounded">{item.classType}</span>
                <span>{item.roomNumber}</span>
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
