"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { Mail, Phone, ExternalLink, Code2, Brain, Terminal } from "lucide-react";

// === SVG ICON COMPONENTS (Fallback for missing lucide-react brand icons) === //
const GithubIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.28 1.15-.28 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

const LinkedinIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect width="4" height="12" x="2" y="9" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

const TwitterIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
  </svg>
);

const InstagramIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);


// === TYPEWRITER COMPONENT === //
const Typewriter = ({ text, delay = 100 }: { text: string; delay?: number }) => {
  const [currentText, setCurrentText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setCurrentText((prevText) => prevText + text[currentIndex]);
        setCurrentIndex((prevIndex) => prevIndex + 1);
      }, delay);
      return () => clearTimeout(timeout);
    }
  }, [currentIndex, delay, text]);

  return <span>{currentText}<span className="inline-block w-1 h-8 ml-1 bg-primary animate-pulse">|</span></span>;
};

// === PARTICLE BACKGROUND COMPONENT === //
const ParticleCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let particles: Particle[] = [];

    class Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;

      constructor(width: number, height: number) {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.vx = (Math.random() - 0.5) * 0.5;
        this.vy = (Math.random() - 0.5) * 0.5;
        this.size = Math.random() * 2 + 0.5;
      }

      update(width: number, height: number) {
        this.x += this.vx;
        this.y += this.vy;
        if (this.x < 0 || this.x > width) this.vx *= -1;
        if (this.y < 0 || this.y > height) this.vy *= -1;
      }

      draw(ctx: CanvasRenderingContext2D) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(139, 92, 246, 0.4)";
        ctx.fill();
      }
    }

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      particles = Array.from({ length: 80 }, () => new Particle(canvas.width, canvas.height));
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 150) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(139, 92, 246, ${0.15 - dist / 1000})`;
            ctx.stroke();
          }
        }
      }

      particles.forEach(p => {
        p.update(canvas.width, canvas.height);
        p.draw(ctx);
      });
      animationFrameId = requestAnimationFrame(animate);
    };

    window.addEventListener("resize", resize);
    resize();
    animate();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0" />;
};

// === FLASHCARD COMPONENT (triggers every time it enters viewport) === //
const ScrollCard = ({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.95 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: false, amount: 0.2 }}
      transition={{ duration: 0.6, delay, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
};

export default function Home() {
  const [formStatus, setFormStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [formError, setFormError] = useState("");

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    const target = e.target as HTMLFormElement;
    const name = (target.elements.namedItem("name") as HTMLInputElement)?.value;
    const email = (target.elements.namedItem("email") as HTMLInputElement)?.value;
    const message = (target.elements.namedItem("message") as HTMLTextAreaElement)?.value;

    const mailtoUrl = `mailto:yashrajomar241@gmail.com?subject=CampusCore Inquiry from ${name}&body=${encodeURIComponent(message)}%0A%0AFrom: ${name} (${email})`;
    window.location.href = mailtoUrl;
    
    setFormStatus("sending");
    // Simulate internal success state too
    setTimeout(() => {
      setFormStatus("sent");
      setTimeout(() => setFormStatus("idle"), 5000);
    }, 1500);
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-background selection:bg-primary/30 selection:text-white">
      {/* Universe Particle Background */}
      <ParticleCanvas />

      {/* Dynamic Background Elements */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-[100px] animate-pulse pointer-events-none"></div>
      <div className="absolute bottom-10 right-20 w-96 h-96 bg-accent/20 rounded-full blur-[120px] animation-delay-2000 animate-pulse pointer-events-none"></div>

      {/* Navbar */}
      <header className="glass-panel sticky top-0 z-50 px-6 py-4 flex items-center justify-between mx-4 mt-4 rounded-2xl">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary to-accent flex items-center justify-center animate-float">
            <span className="text-white font-bold text-lg">C</span>
          </div>
          <span className="text-xl font-bold tracking-tight text-white animate-glow">
            CampusCore
          </span>
        </div>
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-foreground/80">
          <Link href="#features" className="hover:text-primary transition-colors">Features</Link>
          <Link href="#about" className="hover:text-primary transition-colors">About</Link>
          <Link href="#contact" className="hover:text-primary transition-colors">Contact</Link>
        </nav>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm font-medium hover:text-primary transition-colors">
            Sign In
          </Link>
          <Link href="/register" className="px-5 py-2 text-sm font-medium bg-primary hover:bg-primary-hover text-white rounded-full transition-all shadow-[0_0_15px_rgba(139,92,246,0.5)] hover:shadow-[0_0_25px_rgba(139,92,246,0.8)] hover:-translate-y-0.5">
            Get Started
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center px-4 text-center z-10 pt-20 pb-16">
        <ScrollCard>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/10 text-primary text-sm font-medium mb-8 backdrop-blur-md">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            <Typewriter text="Next-Gen Academic Management" delay={50} />
          </div>
        </ScrollCard>

        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight max-w-4xl mb-6 leading-tight text-white">
          Unify Your Campus Experience with <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">Precision</span>
        </h1>
        
        <p className="text-lg md:text-xl text-foreground/70 max-w-2xl mb-12">
          Seamlessly connect faculty, students, and parents. From attendance tracking to internal marks and exam schedules, everything in one beautiful platform.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          <Link href="/dashboard" className="px-8 py-4 text-white bg-primary hover:bg-primary-hover rounded-full font-semibold transition-all shadow-[0_0_20px_rgba(139,92,246,0.4)] hover:shadow-[0_0_30px_rgba(139,92,246,0.6)] hover:-translate-y-1 w-full sm:w-auto text-center">
            Access Dashboard
          </Link>
          <Link href="/learn-more" className="px-8 py-4 text-foreground hover:text-white glass-panel rounded-full font-semibold transition-all hover:bg-white/10 hover:-translate-y-1 w-full sm:w-auto border border-white/10 hover:border-white/20 text-center">
            View Features
          </Link>
        </div>
      </main>

      {/* ── Features Section ── */}
      <section id="features" className="max-w-6xl mx-auto w-full px-4 py-20 scroll-mt-24">
        <ScrollCard>
          <h2 className="text-3xl font-bold text-center mb-4 text-white">Core Features</h2>
          <p className="text-foreground/60 text-center max-w-xl mx-auto mb-12">Everything you need to manage academic operations, all in one unified platform.</p>
        </ScrollCard>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { title: "Real-time Attendance", desc: "Track and monitor student presence with per-lecture granularity. Automatic threshold alerts keep everyone informed.", icon: "📊" },
            { title: "Marks Management", desc: "Securely upload, appeal, and publish internal assessments with a structured Draft → Published → Final workflow.", icon: "📝" },
            { title: "Parent Portal", desc: "Keep guardians informed with performance alerts, attendance notifications, and faculty meeting requests.", icon: "👨‍👩‍👧" },
            { title: "Appeals System", desc: "Students can raise structured mark disputes during the review window with full audit trails.", icon: "⚖️" },
            { title: "Exam Scheduling", desc: "Official exam timetables and hall allocations accessible to everyone. Never miss an exam again.", icon: "📅" },
            { title: "Campus Notices", desc: "Targeted announcements to specific departments or the entire campus with urgency tagging.", icon: "📢" },
          ].map((feature, i) => (
            <ScrollCard key={i} delay={i * 0.1}>
              <div className="glass-panel p-8 rounded-3xl text-left group hover:-translate-y-2 transition-all duration-300 hover:shadow-[0_0_30px_rgba(139,92,246,0.2)] border border-white/5 hover:border-primary/30 h-full">
                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform text-2xl">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-3 text-white">{feature.title}</h3>
                <p className="text-foreground/70 text-sm leading-relaxed">{feature.desc}</p>
              </div>
            </ScrollCard>
          ))}
        </div>
      </section>

      {/* ── About Section ── */}
      <section id="about" className="max-w-5xl mx-auto w-full px-4 py-20 scroll-mt-24">
        <ScrollCard>
          <div className="glass-panel p-10 md:p-16 rounded-3xl border border-white/10 text-center relative overflow-hidden">
            {/* Inner Glow */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-3xl pointer-events-none"></div>

            <h2 className="text-3xl font-bold text-white mb-6">About CampusCore</h2>
            <p className="text-foreground/70 leading-relaxed max-w-3xl mx-auto mb-8">
              CampusCore is a unified web platform designed to centralize academic operations for colleges and universities. 
              It bridges the communication gap between administrators, faculty, students, and parents by providing a single 
              source of truth for attendance, internal marks, exam schedules, and campus announcements.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-10">
              {[
                { label: "User Roles", value: "6" },
                { label: "Core Modules", value: "7" },
                { label: "Uptime Goal", value: "99.9%" },
                { label: "Security", value: "AES-256" },
              ].map((stat, i) => (
                <div key={i} className="text-center">
                  <p className="text-3xl font-bold text-primary mb-1">{stat.value}</p>
                  <p className="text-sm text-foreground/60">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </ScrollCard>
      </section>

      {/* ── Contact Section ── */}
      <section id="contact" className="max-w-6xl mx-auto w-full px-4 py-20 scroll-mt-24 relative">
        <ScrollCard>
          <h2 className="text-3xl font-bold text-center mb-4 text-white">Get In Touch</h2>
          <p className="text-foreground/60 text-center max-w-xl mx-auto mb-16">Connect with the project developer or request an institutional demo.</p>
        </ScrollCard>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
          {/* Developer Card */}
          <div className="lg:col-span-2">
            <ScrollCard>
              <div className="glass-panel p-8 rounded-3xl border border-primary/20 bg-primary/5 shadow-2xl relative overflow-hidden group">
                {/* Profile Photo */}
                <div className="relative w-32 h-32 mx-auto mb-6">
                  <div className="absolute inset-0 bg-primary rounded-2xl rotate-6 group-hover:rotate-12 transition-transform duration-500"></div>
                  <motion.img 
                    src="/yashraj.jpg" 
                    alt="Yashraj Omar" 
                    className="relative w-full h-full object-cover rounded-2xl border-2 border-primary/50 grayscale hover:grayscale-0 transition-all duration-500"
                    
                  />
                </div>

                <div className="text-center">
                  <h3 className="text-2xl font-bold text-white mb-1">Yashraj Omar</h3>
                  <p className="text-primary text-sm font-medium mb-4 italic">Software Engineer · AI & Systems Developer</p>
                  <p className="text-foreground/70 text-sm mb-8 leading-relaxed">
                    Electrical Engineering @ <strong>IIT Ropar</strong>. Specialists in full-stack apps, ML pipelines, and high-performance algorithms.
                  </p>

                  <div className="flex flex-wrap justify-center gap-3">
                    <a href="mailto:yashrajomar241@gmail.com" className="p-2 bg-white/5 rounded-lg hover:bg-primary/20 hover:text-primary transition-all flex items-center gap-2 text-xs" title="Send Email">
                      <Mail size={16} /> yashrajomar241@gmail.com
                    </a>
                    <a href="tel:8382820104" className="p-2 bg-white/5 rounded-lg hover:bg-primary/20 hover:text-primary transition-all flex items-center gap-2 text-xs" title="Call Now">
                      <Phone size={16} /> +91 8382820104
                    </a>
                  </div>

                  <div className="flex justify-center gap-4 mt-8 border-t border-white/10 pt-6">
                    <a href="https://github.com/YashrajOmar" target="_blank" className="text-foreground/50 hover:text-primary transition-colors"><GithubIcon size={20} /></a>
                    <a href="https://www.linkedin.com/in/yashraj-omar-16310b28b/" target="_blank" className="text-foreground/50 hover:text-primary transition-colors"><LinkedinIcon size={20} /></a>
                    <a href="https://twitter.com/YashrajOmar" target="_blank" className="text-foreground/50 hover:text-primary transition-colors"><TwitterIcon size={20} /></a>
                    <a href="https://instagram.com/yashraj_omar" target="_blank" className="text-foreground/50 hover:text-primary transition-colors"><InstagramIcon size={20} /></a>
                    <Link href="https://leetcode.com/u/YRJ47/" target="_blank" className="text-foreground/50 hover:text-primary transition-colors"><Code2 size={20} /></Link>
                  </div>
                </div>
              </div>
            </ScrollCard>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-3">
            <ScrollCard delay={0.2}>
              <div className="glass-panel p-8 md:p-10 rounded-3xl border border-white/10 relative overflow-hidden">
                {formStatus === "sent" ? (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }} 
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-16"
                  >
                    <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6 text-green-400">
                      <ExternalLink size={32} />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">Message Received!</h3>
                    <p className="text-foreground/60">Yashraj will get back to you at your provided email shortly.</p>
                    <button onClick={() => setFormStatus("idle")} className="mt-8 text-primary hover:underline text-sm font-medium">Send another message</button>
                  </motion.div>
                ) : (
                  <form className="space-y-6" onSubmit={handleSendMessage}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground/80 block">Your Name</label>
                        <input type="text" name="name" placeholder="John Doe" required
                          className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-foreground/30 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground/80 block">Email Address</label>
                        <input type="email" name="email" placeholder="you@university.edu" required
                          className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-foreground/30 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground/80 block">Message</label>
                      <textarea rows={5} name="message" placeholder="Tell Yashraj what you're looking for..." required
                        className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-foreground/30 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all resize-none" />
                    </div>
                    <div className="flex items-center justify-between gap-4 pt-2">
                      <p className="text-[10px] text-foreground/40 max-w-xs">
                        By sending this message, you agree to being contacted regarding CampusCore.
                      </p>
                      <button 
                        type="submit" 
                        disabled={formStatus === "sending"}
                        className="px-8 py-3 bg-primary hover:bg-primary-hover text-white font-semibold rounded-xl transition-all shadow-[0_0_15px_rgba(139,92,246,0.3)] hover:shadow-[0_0_25px_rgba(139,92,246,0.5)] hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {formStatus === "sending" ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            Sending...
                          </>
                        ) : (
                          "Send Message"
                        )}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </ScrollCard>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 mt-10 py-8 px-6 text-center text-sm text-foreground/50 z-10">
        <p>&copy; 2026 CampusCore. All rights reserved. Designed & Built by Yashraj Omar.</p>
      </footer>
    </div>
  );
}
