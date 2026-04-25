import Link from "next/link";

export default function LearnMorePage() {
  const features = [
    {
      title: "Real-time Attendance Tracking",
      description: "Faculty can mark attendance per lecture with full edit history. Students receive instant notifications when their attendance drops below thresholds set by the administration.",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><polyline points="16 11 18 13 22 9"/></svg>
      ),
    },
    {
      title: "Internal Marks Management",
      description: "Structured Draft → Published → Review → Final workflow ensures transparency. Faculty upload marks, students review and appeal, and administration finalizes the process.",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
      ),
    },
    {
      title: "Appeals Portal",
      description: "Students can raise structured appeals during the review window. Faculty and HOD handle escalations with full audit trails and resolution timelines.",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
      ),
    },
    {
      title: "Exam Schedule & Hall Allocation",
      description: "Access official exam timetables and room assignments in one place. Never miss an exam or arrive at the wrong hall again.",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
      ),
    },
    {
      title: "Parent Portal",
      description: "Parents get secure access to their child's academic progress. Request meetings with faculty through the platform, screened by the department coordinator.",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
      ),
    },
    {
      title: "Campus Notices & Announcements",
      description: "Targeted notifications to students or departments. Urgent alerts are highlighted and never missed. Faculty and administration can publish announcements instantly.",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
      ),
    },
  ];

  const roles = [
    { name: "Admin", desc: "Manages system configuration, thresholds, schedules, and approvals." },
    { name: "HOD", desc: "Supervises academic activities and handles escalated appeals." },
    { name: "Faculty", desc: "Enters attendance, uploads internal marks, and responds to appeals." },
    { name: "Coordinator", desc: "Screens parent meeting requests within the department." },
    { name: "Student", desc: "Views marks, attendance, raises appeals, and requests support." },
    { name: "Parent", desc: "Monitors academic performance and requests faculty meetings." },
  ];

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-[100px] animate-pulse pointer-events-none"></div>
      <div className="absolute bottom-40 right-20 w-96 h-96 bg-accent/20 rounded-full blur-[120px] animate-pulse pointer-events-none"></div>

      {/* Back Nav */}
      <header className="glass-panel sticky top-0 z-50 px-6 py-4 flex items-center justify-between mx-4 mt-4 rounded-2xl animate-slide-up">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary to-accent flex items-center justify-center">
            <span className="text-white font-bold text-lg">C</span>
          </div>
          <span className="text-xl font-bold tracking-tight text-white">CampusCore</span>
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm font-medium hover:text-primary transition-colors">Sign In</Link>
          <Link href="/register" className="px-5 py-2 text-sm font-medium bg-primary hover:bg-primary-hover text-white rounded-full transition-all shadow-[0_0_15px_rgba(139,92,246,0.5)] hover:shadow-[0_0_25px_rgba(139,92,246,0.8)] hover:-translate-y-0.5">
            Get Started
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="text-center py-20 px-4 animate-slide-up delay-100">
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight max-w-3xl mx-auto mb-6">
          Everything Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">Campus Needs</span>
        </h1>
        <p className="text-lg text-foreground/70 max-w-2xl mx-auto">
          A unified platform connecting administration, faculty, students, and parents to streamline every aspect of academic management.
        </p>
      </section>

      {/* Features Grid */}
      <section className="max-w-6xl mx-auto px-4 pb-20 animate-slide-up delay-200">
        <h2 className="text-2xl font-bold text-white mb-8 text-center">Core Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <div key={i} className="glass-panel p-8 rounded-3xl text-left group hover:-translate-y-2 transition-all duration-300 hover:shadow-[0_0_30px_rgba(139,92,246,0.2)] border border-white/5 hover:border-primary/30">
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform text-primary">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold mb-3 text-white">{feature.title}</h3>
              <p className="text-foreground/70 text-sm leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* User Roles */}
      <section className="max-w-6xl mx-auto px-4 pb-20 animate-slide-up delay-300">
        <h2 className="text-2xl font-bold text-white mb-8 text-center">Built for Every Role</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {roles.map((role, i) => (
            <div key={i} className="bg-black/20 p-5 rounded-2xl border border-white/10 hover:border-primary/30 transition-colors">
              <h3 className="font-bold text-white mb-2">{role.name}</h3>
              <p className="text-sm text-foreground/70">{role.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="text-center py-16 px-4 mb-8">
        <div className="glass-panel max-w-3xl mx-auto p-12 rounded-3xl border border-primary/20">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Get Started?</h2>
          <p className="text-foreground/70 mb-8">Join CampusCore today and experience the future of academic management.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register" className="px-8 py-4 text-white bg-primary hover:bg-primary-hover rounded-full font-semibold transition-all shadow-[0_0_20px_rgba(139,92,246,0.4)] hover:shadow-[0_0_30px_rgba(139,92,246,0.6)] hover:-translate-y-1">
              Create Your Account
            </Link>
            <Link href="/login" className="px-8 py-4 text-foreground hover:text-white glass-panel rounded-full font-semibold transition-all hover:bg-white/10 hover:-translate-y-1 border border-white/10 hover:border-white/20">
              Sign In
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
