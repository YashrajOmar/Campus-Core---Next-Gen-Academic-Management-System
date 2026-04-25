"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [step, setStep] = useState(0); // 0: Form, 1: OTP
  const [otp, setOtp] = useState("");
  const [role, setRole] = useState("STUDENT");
  const [adminCode, setAdminCode] = useState("");
  const [error, setError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isResending, setIsResending] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailError("Please enter a valid email address.");
      return false;
    }
    // Check for institutional email domains (optional enforcement)
    const validDomains = [".edu", ".ac.in", ".edu.in", ".org", ".com"];
    const hasValidDomain = validDomains.some(domain => email.toLowerCase().endsWith(domain));
    if (!hasValidDomain) {
      setEmailError("Please use a valid institutional or professional email.");
      return false;
    }
    setEmailError("");
    return true;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const emailValid = validateEmail(email);
    if (!emailValid) {
      setError("Please check your email address. It must be a valid institutional or professional email.");
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      setIsLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setIsLoading(false);
      return;
    }

    // Privileged roles require an admin verification code
    const privilegedRoles = ["ADMIN", "HOD", "FACULTY", "COORDINATOR"];
    if (privilegedRoles.includes(role) && adminCode !== "CAMPUS2026") {
      setError("Invalid verification code for this role. Contact your administrator.");
      setIsLoading(false);
      return;
    }

    // Generate and send real OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(code);
    
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: code, name }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        setError(data.error || "Failed to send verification email. Please try again.");
        return;
      }

      setStep(1);
    } catch (err) {
      setError("Network error. Please check your internet connection.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (otp !== generatedOtp) {
      setError("Invalid verification code. Please check your email.");
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Registration failed.");
        setIsLoading(false);
        return;
      }

      // Auto sign-in after successful registration
      const privilegedRoles = ["ADMIN", "HOD", "FACULTY", "COORDINATOR"];
      if (privilegedRoles.includes(role)) {
        setSuccessMessage("Account created. Please wait for Admin approval before signing in.");
        setIsLoading(false);
        // Clear form
        setStep(0);
        setEmail("");
        setPassword("");
        setConfirmPassword("");
        setOtp("");
      } else {
        const signInRes = await signIn("credentials", {
          email,
          password,
          redirect: false,
        });

        if (signInRes?.error) {
          setError("Account created! But auto-login failed. Please sign in manually.");
          setIsLoading(false);
        } else {
          router.push("/dashboard");
          router.refresh();
        }
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (resendCooldown > 0 || isResending) return;
    
    setIsResending(true);
    setError("");
    setSuccessMessage("");
    
    const newCode = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(newCode);
    setOtp(""); // Clear previous OTP entry as requested
    
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: newCode, name }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        setError(data.error || "Failed to resend code.");
        return;
      }

      setSuccessMessage("New code sent to your email!");
      setResendCooldown(60); // 60 seconds cooldown
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setIsResending(false);
    }
  };

  const privilegedRoles = ["ADMIN", "HOD", "FACULTY", "COORDINATOR"];
  const showAdminCode = privilegedRoles.includes(role);

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden px-4 py-12">
      {/* Background Orbs */}
      <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-primary/20 rounded-full blur-[120px] animate-pulse pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-accent/20 rounded-full blur-[100px] animate-pulse pointer-events-none"></div>

      {/* Back Button */}
      <Link href="/" className="absolute top-8 left-8 flex items-center gap-2 text-foreground/70 hover:text-white transition-colors animate-slide-up">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m15 18-6-6 6-6"/>
        </svg>
        Back to Home
      </Link>

      {/* Register Card */}
      <div className="glass-panel w-full max-w-md p-8 md:p-10 rounded-[2rem] z-10 animate-slide-up delay-100 shadow-[0_0_40px_rgba(139,92,246,0.15)] transition-shadow duration-500 border border-white/10">
        
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-primary to-accent flex items-center justify-center mx-auto mb-6 shadow-lg shadow-primary/30">
            <span className="text-white font-bold text-3xl">C</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Create Account</h1>
          <p className="text-foreground/60 text-sm">Join the CampusCore platform</p>
        </div>

        {step === 0 ? (
          <form className="space-y-5" onSubmit={handleRegister}>
            {error && (
              <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/50 text-red-200 text-sm flex items-center justify-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                {error}
              </div>
            )}

            {/* Full Name */}
            <div className="space-y-2 group">
              <label className="text-sm font-medium text-foreground/80 group-focus-within:text-primary transition-colors block">Full Name</label>
              <input type="text" placeholder="John Doe" value={name} onChange={(e) => setName(e.target.value)}
                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-foreground/30 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all" required />
            </div>

            {/* Email */}
            <div className="space-y-2 group">
              <label className="text-sm font-medium text-foreground/80 group-focus-within:text-primary transition-colors block">Email Address</label>
              <input type="email" placeholder="you@university.edu" value={email} 
                onChange={(e) => { setEmail(e.target.value); if (emailError) validateEmail(e.target.value); }}
                onBlur={() => email && validateEmail(email)}
                className={`w-full bg-black/20 border rounded-xl px-4 py-3 text-white placeholder:text-foreground/30 focus:outline-none focus:ring-2 transition-all ${emailError ? "border-red-500/50 focus:ring-red-500/50" : "border-white/10 focus:ring-primary/50 focus:border-primary/50"}`} required />
              {emailError && <p className="text-xs text-red-400 mt-1">{emailError}</p>}
            </div>

            {/* Role */}
            <div className="space-y-2 group">
              <label className="text-sm font-medium text-foreground/80 group-focus-within:text-primary transition-colors block">Role</label>
              <select value={role} onChange={(e) => setRole(e.target.value)}
                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all appearance-none cursor-pointer">
                <option value="STUDENT" className="bg-[#1e1b4b]">Student</option>
                <option value="PARENT" className="bg-[#1e1b4b]">Parent</option>
                <option value="FACULTY" className="bg-[#1e1b4b]">Faculty</option>
                <option value="COORDINATOR" className="bg-[#1e1b4b]">Department Coordinator</option>
                <option value="HOD" className="bg-[#1e1b4b]">Head of Department (HOD)</option>
                <option value="ADMIN" className="bg-[#1e1b4b]">Administrator</option>
              </select>
            </div>

            {/* Admin Verification Code (only for privileged roles) */}
            {showAdminCode && (
              <div className="space-y-2 group animate-slide-up">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-orange-400 block">
                    🔒 Role Verification Code
                  </label>
                  <button type="button" onClick={() => alert("Faculty/Staff codes are provided by the Campus IT Admin during onboarding.")} 
                    className="text-[10px] text-primary hover:underline">Where to get code?</button>
                </div>
                <input type="text" placeholder="Enter code provided by admin" value={adminCode} onChange={(e) => setAdminCode(e.target.value)}
                  className="w-full bg-orange-500/10 border border-orange-500/30 rounded-xl px-4 py-3 text-white placeholder:text-foreground/30 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all" required />
                <p className="text-xs text-foreground/50 mt-1">Faculty, HOD, Coordinator, and Admin roles require a verification code from the system administrator.</p>
              </div>
            )}

            {/* Password with Show/Hide */}
            <div className="space-y-2 group">
              <label className="text-sm font-medium text-foreground/80 group-focus-within:text-primary transition-colors block">Password</label>
              <div className="relative">
                <input type={showPassword ? "text" : "password"} placeholder="Min. 6 characters" value={password} onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 pr-12 text-white placeholder:text-foreground/30 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all" required />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/50 hover:text-white transition-colors p-1">
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  )}
                </button>
              </div>
            </div>

            {/* Confirm Password with Show/Hide */}
            <div className="space-y-2 group">
              <label className="text-sm font-medium text-foreground/80 group-focus-within:text-primary transition-colors block">Confirm Password</label>
              <div className="relative">
                <input type={showConfirmPassword ? "text" : "password"} placeholder="Re-enter password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 pr-12 text-white placeholder:text-foreground/30 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all" required />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/50 hover:text-white transition-colors p-1">
                  {showConfirmPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  )}
                </button>
              </div>
            </div>

            <button type="submit" disabled={isLoading} className="w-full flex justify-center items-center bg-primary hover:bg-primary-hover text-white font-semibold py-3.5 rounded-xl transition-all shadow-[0_4px_15px_rgba(139,92,246,0.3)] hover:shadow-[0_6px_25px_rgba(139,92,246,0.5)] hover:-translate-y-0.5 mt-4 disabled:opacity-70 disabled:cursor-not-allowed">
              {isLoading ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              ) : "Next: Verify Email"}
            </button>
          </form>
        ) : (
          <form className="space-y-6 animate-slide-up" onSubmit={handleVerifyOTP}>
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
              </div>
              <h3 className="text-xl font-bold text-white">Email Verification</h3>
              <p className="text-foreground/60 text-sm mt-2">Enter the verification code sent to <br/><span className="text-primary">{email}</span></p>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/50 text-red-200 text-sm flex items-center justify-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                {error}
              </div>
            )}

            {successMessage && (
              <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/50 text-emerald-200 text-sm flex items-center justify-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                {successMessage}
              </div>
            )}

            <div className="space-y-2 group">
              <label className="text-sm font-medium text-foreground/80 group-focus-within:text-primary transition-colors block text-center">Verification Code</label>
              <input type="text" maxLength={6} placeholder="123456" value={otp} onChange={(e) => setOtp(e.target.value)}
                className="w-full bg-black/20 border border-white/10 rounded-2xl px-4 py-4 text-center text-2xl font-bold tracking-[0.5em] text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all" required />
              
              <div className="flex justify-center mt-4">
                <button 
                  type="button" 
                  onClick={handleResendOTP}
                  disabled={resendCooldown > 0 || isResending}
                  className="text-xs text-primary hover:text-primary-hover disabled:text-foreground/30 transition-colors flex items-center gap-1"
                >
                  {isResending ? (
                    <span className="w-3 h-3 border border-primary/30 border-t-primary rounded-full animate-spin"></span>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M3 21v-5h5"/></svg>
                  )}
                  {resendCooldown > 0 ? `Resend Code in ${resendCooldown}s` : "Didn't get the code? Resend"}
                </button>
              </div>
              
              <p className="text-[10px] text-foreground/40 text-center mt-2 italic">Verification code sent to your inbox.</p>
            </div>

            <button type="submit" disabled={isLoading} className="w-full flex justify-center items-center bg-primary hover:bg-primary-hover text-white font-semibold py-3.5 rounded-xl transition-all shadow-[0_4px_15px_rgba(139,92,246,0.3)] hover:shadow-[0_6px_25px_rgba(139,92,246,0.5)] hover:-translate-y-0.5 mt-8 disabled:opacity-70 disabled:cursor-not-allowed">
              {isLoading ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              ) : "Verify & Create Account"}
            </button>
            <button type="button" onClick={() => setStep(0)} className="w-full text-sm text-foreground/50 hover:text-white transition-colors">Back to details</button>
          </form>
        )}

        <div className="mt-6 text-center text-sm text-foreground/60">
          Already have an account? <Link href="/login" className="text-primary hover:underline">Sign In</Link>
        </div>
      </div>
    </div>
  );
}
